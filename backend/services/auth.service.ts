import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User, IUser, RefreshToken, IUserProfile, UserProfile } from '../models/user.model';
import { OTP } from '../models/otp.model';
import { BaseService, cacheService } from './database.service';
import { ApiError } from '../utils/errors';
import { emailService } from './email.service';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// ============================================================================
// AUTH SERVICE
// ============================================================================

export class AuthService extends BaseService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  private readonly REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  /**
   * Generate 6-digit OTP
   */
  private generateOTP(): string {
    if (process.env.NODE_ENV === 'development') {
      return '123456';
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP verification email
   */
  async sendEmailVerification(email: string): Promise<void> {
    try {
      // Check if user exists
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      if (user.isEmailVerified) {
        throw new ApiError(400, 'Email already verified');
      }

      // Generate OTP
      const otp = this.generateOTP();

      // Invalidate any existing OTPs for this email
      await OTP.updateMany(
        { email: email.toLowerCase(), isUsed: false },
        { isUsed: true }
      );

      // Save new OTP
      await OTP.create({
        email: email.toLowerCase(),
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });

      // Send email
      await emailService.sendOTPEmail(email, otp);

      this.logOperation('OTP sent', { email });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      this.handleError(error, 'sendEmailVerification');
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(email: string, otp: string): Promise<{ user: IUser; tokens: AuthTokens }> {
    try {
      console.log(`🔑 AUTH_SERVICE: Verifying OTP for ${email}: ${otp}`);
      
      const otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        otp,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });

      if (!otpRecord) {
        // Detailed logging for debugging
        const anyRecord = await OTP.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 });
        if (!anyRecord) {
          console.warn(`❌ AUTH_SERVICE: No record found for email ${email}`);
        } else if (anyRecord.otp !== otp) {
          console.warn(`❌ AUTH_SERVICE: OTP mismatch. Expected ${anyRecord.otp}, got ${otp}`);
        } else if (anyRecord.isUsed) {
          console.warn(`❌ AUTH_SERVICE: OTP already used`);
        } else if (anyRecord.expiresAt <= new Date()) {
          console.warn(`❌ AUTH_SERVICE: OTP expired at ${anyRecord.expiresAt}`);
        }
        
        throw new ApiError(400, 'Invalid or expired OTP');
      }

      console.log(`✅ AUTH_SERVICE: OTP verified for ${email}`);

      // Mark OTP as used
      otpRecord.isUsed = true;
      await otpRecord.save();

      // Verify user email
      const user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { isEmailVerified: true, emailVerifiedAt: new Date() },
        { new: true }
      );

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      this.logOperation('Email verified', { userId: user._id, email });

      return { user, tokens };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      this.handleError(error, 'verifyEmail');
    }
  }

  /**
   * Send Password Reset OTP
   */
  async sendPasswordResetOTP(email: string): Promise<void> {
    try {
      // Check if user exists
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Generate OTP
      const otp = this.generateOTP();

      // Invalidate any existing OTPs for this email
      await OTP.updateMany(
        { email: email.toLowerCase(), isUsed: false },
        { isUsed: true }
      );

      // Save new OTP
      await OTP.create({
        email: email.toLowerCase(),
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });

      // Send email
      await emailService.sendPasswordResetEmail(email, otp);

      this.logOperation('Password reset OTP sent', { email });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      this.handleError(error, 'sendPasswordResetOTP');
    }
  }

  /**
   * Verify reset OTP and update password
   */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    try {
      console.log(`🔑 AUTH_SERVICE: Verifying Password Reset OTP for ${email}: ${otp}`);
      
      const otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        otp,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });

      if (!otpRecord) {
        throw new ApiError(400, 'Invalid or expired OTP');
      }

      console.log(`✅ AUTH_SERVICE: Password reset OTP verified for ${email}`);

      // Mark OTP as used
      otpRecord.isUsed = true;
      await otpRecord.save();

      // Get user and update password
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Update password
      user.password = newPassword;
      // In case they reset password, let's also verify their email if it wasn't already
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
      }
      await user.save();

      // Revoke all refresh tokens for security
      await RefreshToken.updateMany(
        { userId: user._id },
        { isRevoked: true }
      );

      this.logOperation('Password reset successful', { userId: user._id, email });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      this.handleError(error, 'resetPassword');
    }
  }

  /**
   * Register a new user
   */
  async register(userData: {
    email: string;
    password: string;
    fullName: string;
    dateOfBirth?: Date;
    gender?: string;
    previousGuestId?: string;
    dietQuality?: number;
    dailyStepsGoal?: number;
    stressPrevalence?: 'low' | 'medium' | 'high';
    sleepConsistency?: number;
    chronicPain?: boolean;
  }): Promise<{ user: IUser; tokens: AuthTokens }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
      if (existingUser) {
        throw new ApiError(409, 'Email already registered');
      }

      // Create user
      const user = await User.create({
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender
      });

      // Migrate data if previousGuestId provided
      if (userData.previousGuestId) {
        const { nutritionService } = require('./nutrition.service');
        const { workoutService } = require('./workout.service');
        await nutritionService.migrateUserData(userData.previousGuestId, user._id.toString());
        await workoutService.migrateUserData(userData.previousGuestId, user._id.toString());
      }

      // Create default profile with baseline metrics
      await UserProfile.create({
        userId: user._id,
        activityLevel: 'moderate',
        nutrition: {
          dietQuality: userData.dietQuality || 5
        },
        lifestyle: {
          dailyStepsGoal: userData.dailyStepsGoal || 5000,
          stressPrevalence: userData.stressPrevalence || 'medium',
          sleepConsistency: userData.sleepConsistency || 7,
          chronicPain: !!userData.chronicPain
        },
        sleepPatterns: {
          averageHours: 7,
          quality: 'good',
          bedtime: '22:00',
          wakeTime: '07:00'
        }
      });

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // NOTE: OTP email verification enabled
      try {
        await this.sendEmailVerification(user.email);
      } catch (error) {
        console.error('❌ EMAIL FAILED', error);
      }

      this.logOperation('User registered', { userId: user._id, email: user.email });

      return { user, tokens };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      this.handleError(error, 'register');
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ user: IUser; tokens: AuthTokens }> {
    try {
      // Find user with password
      const userCount = await User.countDocuments();
      this.logger.info('📊 AUTH_DEBUG: Total users in collection:', { count: userCount });
      
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        this.logger.info('👤 AUTH_LOGIN: User not found for email:', { email: email.toLowerCase() });
        throw new ApiError(401, 'Invalid credentials');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        this.logger.info('🔑 AUTH_LOGIN: Password invalid for user:', { email: email.toLowerCase() });
        throw new ApiError(401, 'Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new ApiError(403, 'Account has been deactivated');
      }

      // Check if email is verified
      // NOTE: Email verification enabled - users must verify before logging in
      if (!user.isEmailVerified) {
        throw new ApiError(401, 'Please verify your email before logging in');
      }

      // Update last login
      await User.updateOne(
        { _id: user._id },
        { lastLoginAt: new Date() }
      );

      // Generate tokens
      const tokens = await this.generateTokens(user);

      this.logOperation('User logged in', { userId: user._id });

      return { user, tokens };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      this.handleError(error, 'login');
    }
  }

  /**
   * OAuth Login/Registration
   */
  async oauthLogin(email: string, fullName: string, previousGuestId?: string): Promise<{ user: IUser; tokens: AuthTokens }> {
    try {
      let user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        // Create user with a random unguessable password
        const randomPassword = Math.random().toString(36).slice(-10) + 'A1!'; 
        user = await User.create({
          email: email.toLowerCase(),
          password: randomPassword,
          fullName: fullName,
          isEmailVerified: true
        });

        // Migrate data if previousGuestId provided
        if (previousGuestId) {
          const { nutritionService } = require('./nutrition.service');
          const { workoutService } = require('./workout.service');
          await nutritionService.migrateUserData(previousGuestId, user._id.toString());
          await workoutService.migrateUserData(previousGuestId, user._id.toString());
        }

        // Create default profile for new user
        await UserProfile.create({
          userId: user._id,
          activityLevel: 'moderate',
          sleepPatterns: {
            averageHours: 7,
            quality: 'good',
            bedtime: '22:00',
            wakeTime: '07:00'
          }
        });
        
        this.logOperation('User registered via OAuth', { userId: user._id, email: user.email });
      } else {
        // Check if user is active
        if (!user.isActive) {
          throw new ApiError(403, 'Account has been deactivated');
        }
        
        // If they had an account but email wasn't verified, verify it now since Google did it
        if (!user.isEmailVerified) {
          user.isEmailVerified = true;
          await user.save();
        }
      }

      // Update last login
      await User.updateOne(
        { _id: user._id },
        { lastLoginAt: new Date() }
      );

      // Generate tokens
      const tokens = await this.generateTokens(user);

      this.logOperation('User logged in via OAuth', { userId: user._id });

      return { user, tokens };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      this.handleError(error, 'oauthLogin');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as UserPayload;

      // Check if token exists in database and is not revoked
      const storedToken = await RefreshToken.findOne({
        token: refreshToken,
        userId: new Types.ObjectId(decoded.userId),
        isRevoked: false,
        expiresAt: { $gt: new Date() }
      });

      if (!storedToken) {
        throw new ApiError(401, 'Invalid or expired refresh token');
      }

      // Get user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new ApiError(401, 'User not found or inactive');
      }

      // Revoke old refresh token
      storedToken.isRevoked = true;
      await storedToken.save();

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      this.logOperation('Token refreshed', { userId: user._id });

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, 'Invalid refresh token');
      }
      if (error instanceof ApiError) throw error;
      this.handleError(error, 'refreshToken');
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    try {
      if (refreshToken) {
        // Revoke specific token
        await RefreshToken.findOneAndUpdate(
          { token: refreshToken, userId: new Types.ObjectId(userId) },
          { isRevoked: true }
        );
      } else {
        // Revoke all user tokens
        await RefreshToken.updateMany(
          { userId: new Types.ObjectId(userId) },
          { isRevoked: true }
        );
      }

      // Clear user cache
      await cacheService.delete(`user:${userId}`);

      this.logOperation('User logged out', { userId });
    } catch (error) {
      this.handleError(error, 'logout');
    }
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): UserPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as UserPayload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token expired');
      }
      throw new ApiError(401, 'Invalid token');
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string): Promise<IUser> {
    try {
      const cacheKey = `user:${userId}`;
      let user = await cacheService.get<IUser>(cacheKey);

      if (!user) {
        user = await User.findById(userId);
        if (!user) {
          throw new ApiError(404, 'User not found');
        }
        await cacheService.set(cacheKey, user, 300);
      }

      return user;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      this.handleError(error, 'getCurrentUser');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: IUser): Promise<AuthTokens> {
    const payload: UserPayload = {
      userId: user._id.toString(),
      email: user.email
    };

    // Generate access token
    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });

    // Generate refresh token
    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY
    });

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY_MS);
    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minutes in seconds
    };
  }
}

// ============================================================================
// USER SERVICE
// ============================================================================

export class UserService extends BaseService {
  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<{ user: IUser; profile: IUserProfile | null }> {
    try {
      const [user, profile] = await Promise.all([
        User.findById(userId),
        UserProfile.findOne({ userId: new Types.ObjectId(userId) })
      ]);

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      return { user, profile };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      this.handleError(error, 'getProfile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: Partial<IUserProfile> & Partial<Pick<IUser, 'fullName' | 'dateOfBirth' | 'gender'>>
  ): Promise<{ user: IUser; profile: IUserProfile }> {
    try {
      this.logOperation('Updating Profile Payload:', { userId, keys: Object.keys(updateData) });
      const { fullName, dateOfBirth, gender, ...profileData } = updateData;

      let updatedUser: IUser | null = null;
      
      const userUpdates: any = {};
      if (fullName && fullName.trim().length >= 2) userUpdates.fullName = fullName;
      if (dateOfBirth) userUpdates.dateOfBirth = dateOfBirth;
      if (gender) userUpdates.gender = gender;

      if (Object.keys(userUpdates).length > 0) {
        updatedUser = await User.findByIdAndUpdate(
          userId,
          { $set: userUpdates },
          { new: true, runValidators: false }
        );
      } else {
        updatedUser = await User.findById(userId);
      }

      // Update or create profile
      const updatedProfile = await UserProfile.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          $set: profileData
        },
        { new: true, upsert: true, runValidators: false }
      );

      // Clear cache
      await cacheService.delete(`user:${userId}`);

      this.logOperation('Profile updated', { userId });

      return { user: updatedUser as IUser, profile: updatedProfile as IUserProfile };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      this.handleError(error, 'updateProfile');
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Verify current password
      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        throw new ApiError(400, 'Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Revoke all refresh tokens
      await RefreshToken.updateMany(
        { userId: new Types.ObjectId(userId) },
        { isRevoked: true }
      );

      this.logOperation('Password changed', { userId });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      this.handleError(error, 'changePassword');
    }
  }

  /**
   * Deactivate account
   */
  async deactivateAccount(userId: string, password: string): Promise<void> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Verify password
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        throw new ApiError(400, 'Password is incorrect');
      }

      // Deactivate account
      user.isActive = false;
      await user.save();

      // Revoke all tokens
      await RefreshToken.updateMany(
        { userId: new Types.ObjectId(userId) },
        { isRevoked: true }
      );

      // Clear cache
      await cacheService.delete(`user:${userId}`);

      this.logOperation('Account deactivated', { userId });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      this.handleError(error, 'deactivateAccount');
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const authService = new AuthService();
export const userService = new UserService();
