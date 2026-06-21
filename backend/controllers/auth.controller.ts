import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import axios from 'axios';
import { authService, userService } from '../services/auth.service';
import { AuthRequest, validateRequest, ApiError } from '../middleware/common.middleware';
import { User } from '../models/user.model';

// ============================================================================
// VALIDATION RULES
// ============================================================================

const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required').trim(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('dietQuality').optional().isNumeric().isInt({ min: 1, max: 10 }).withMessage('Diet quality must be between 1-10'),
  body('stressPrevalence').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid stress prevalence level'),
  body('dailyStepsGoal').optional().isNumeric().isInt({ min: 0 }).withMessage('Daily steps goal must be a positive number'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .trim()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const refreshValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required').trim(),
];

const resetPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required').trim(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
];

// ============================================================================
// AUTH CONTROLLER
// ============================================================================

export const authController = {
  /**
   * Register new user
   */
  register: [
    ...registerValidation,
    validateRequest,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        console.log('📥 CONTROLLER: register called with body:', req.body);
        const { previousGuestId, ...userData } = req.body;
        const { user, tokens } = await authService.register({ ...userData, previousGuestId });
        console.log('✅ CONTROLLER: register success');

        res.status(201).json({
          success: true,
          data: {
            user,
            ...tokens
          }
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Login user
   */
  login: [
    ...loginValidation,
    validateRequest,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        console.log('🌐 AUTH_CONTROLLER: login request received for:', req.body.email);
        const { email, password, previousGuestId } = req.body;
        const { user, tokens } = await authService.login(email, password);

        // Migrate data on login if previousGuestId provided
        if (previousGuestId) {
          const { nutritionService } = await import('../services/nutrition.service');
          const { workoutService } = await import('../services/workout.service');
          await nutritionService.migrateUserData(previousGuestId, user._id.toString());
          await workoutService.migrateUserData(previousGuestId, user._id.toString());
        }

        res.json({
          success: true,
          data: {
            user,
            ...tokens
          }
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Refresh access token
   */
  refresh: [
    ...refreshValidation,
    validateRequest,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { refreshToken } = req.body;
        const tokens = await authService.refreshToken(refreshToken);

        res.json({
          success: true,
          data: tokens
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Logout user
   */
  logout: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      await authService.logout(req.user!.userId, refreshToken);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current user
   */
  me: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getCurrentUser(req.user!.userId);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Google OAuth - Initiate authentication
   */
  googleAuth: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { previousGuestId } = req.query;
      
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID || ''}&` +
        `redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/google/callback')}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('email profile')}&` +
        `access_type=offline&` +
        `state=${previousGuestId || ''}&` +
        `prompt=consent`;
      
      res.redirect(googleAuthUrl);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Google OAuth - Handle callback
   */
  googleCallback: async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.redirect('/login?error=google_auth_empty_code');
      }

      // Exchange code for Google tokens
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code as string,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/google/callback',
        grant_type: 'authorization_code'
      });

      const { access_token } = tokenResponse.data;

      // Fetch user profile from Google
      const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const profile = profileResponse.data;
      if (!profile || !profile.email) {
        return res.redirect('/login?error=google_auth_no_email');
      }

      // Automatically login or register user via OAuth
      const previousGuestId = state as string;
      const { user, tokens } = await authService.oauthLogin(profile.email, profile.name || 'Google User', previousGuestId);

      // Redirect to frontend auth success page with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = new URL('/auth/success', frontendUrl);
      
      redirectUrl.searchParams.append('token', tokens.accessToken);
      redirectUrl.searchParams.append('refreshToken', tokens.refreshToken);
      
      // Pass safe subset of the user for frontend
      const userSummary = {
        _id: user._id,
        id: user._id, 
        email: user.email,
        fullName: user.fullName,
        role: (user as any).role || 'user'
      };
      redirectUrl.searchParams.append('user', JSON.stringify(userSummary));

      res.redirect(redirectUrl.toString());
    } catch (error: any) {
      console.error('Google callback error:', error.response?.data || error.message);
      res.redirect('/login?error=google_auth_failed');
    }
  },

  /**
   * Send email verification
   */
  sendEmailVerification: [
  body('email').isEmail(),
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await authService.sendEmailVerification(email);

      res.json({
        success: true,
        message: 'OTP sent successfully'
      });
    } catch (error) {
      next(error);
    }
  }
],
  /**
   * Verify email with OTP
   */
  verifyEmail: [
  body('email').isEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp } = req.body;

      const result = await authService.verifyEmail(email, otp);

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }],

  /**
   * Request password reset (forgot password)
   */
  forgotPassword: [
    ...forgotPasswordValidation,
    validateRequest,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email } = req.body;
        await authService.sendPasswordResetOTP(email);

        res.json({
          success: true,
          message: 'Password reset OTP sent successfully'
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Reset password using OTP
   */
  resetPassword: [
    ...resetPasswordValidation,
    validateRequest,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, otp, newPassword } = req.body;
        await authService.resetPassword(email, otp, newPassword);

        res.json({
          success: true,
          message: 'Password reset successfully. You can now login with your new password.'
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Change password
   */
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must be at least 8 characters with uppercase, lowercase, and number'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { currentPassword, newPassword } = req.body;
        await userService.changePassword(req.user!.userId, currentPassword, newPassword);

        res.json({
          success: true,
          message: 'Password changed successfully'
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Deactivate account
   */
  deactivateAccount: [
    body('password')
      .notEmpty()
      .withMessage('Password is required for confirmation'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { password } = req.body;
        await userService.deactivateAccount(req.user!.userId, password);

        res.json({
          success: true,
          message: 'Account deactivated successfully'
        });
      } catch (error) {
        next(error);
      }
    }
  ]
};

// ============================================================================
// USER CONTROLLER
// ============================================================================

export const userController = {
  /**
   * Get user profile
   */
  getProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user, profile } = await userService.getProfile(req.user!.userId);

      res.json({
        success: true,
        data: { user, profile }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update user profile
   */
  updateProfile: [
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { user, profile } = await userService.updateProfile(
          req.user!.userId,
          req.body
        );

        res.json({
          success: true,
          data: { user, profile }
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Change password
   */
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must be at least 8 characters with uppercase, lowercase, and number'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { currentPassword, newPassword } = req.body;
        await userService.changePassword(req.user!.userId, currentPassword, newPassword);

        res.json({
          success: true,
          message: 'Password changed successfully'
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Deactivate account
   */
  deactivateAccount: [
    body('password')
      .notEmpty()
      .withMessage('Password is required for confirmation'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { password } = req.body;
        await userService.deactivateAccount(req.user!.userId, password);

        res.json({
          success: true,
          message: 'Account deactivated successfully'
        });
      } catch (error) {
        next(error);
      }
    }
  ]
};
