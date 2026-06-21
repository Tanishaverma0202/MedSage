import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// ============================================================================
// USER SCHEMA
// ============================================================================

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  fullName: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },
    avatar: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
UserSchema.index({ isActive: 1, createdAt: -1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);

// ============================================================================
// USER PROFILE SCHEMA
// ============================================================================

export interface IUserProfile extends Document {
  userId: Types.ObjectId;
  age?: number;
  height?: number; // cm
  weight?: number; // kg
  bodyType?: string;
  occupation?: string;
  dailyRoutineType?: string;

  goals: {
    primaryGoal?: string;
    targetTimeline?: string;
    problemAreas: string[];
  };

  medicalConditions: string[];
  allergies: string[];
  medications: string[];

  nutrition: {
    dietType?: string;
    customDishes?: Array<{ title: string; items: string; calories: number }>;
    mealPatterns: {
      breakfast: { eats?: string; typicalFoods: string[] };
      lunch: { typicalFoods: string[] };
      dinner: { size?: string; time?: string };
      snacks: { frequency?: string; type?: string };
    };
    preferredIndianDishes: string[];
    hydration?: string;
    dietQuality?: number; // 1-10
    eatingBehavior: {
      emotionalEating?: string;
      cravings: string[];
    };
  };

  fitness: {
    fitnessLevel?: string;
    weeklyFrequency?: string;
    preferredWorkoutType: string[];
    workoutLocation?: string;
    workoutDuration?: string;
    equipmentAccess: string[];
    limitations: {
      injuries: string[];
      mobilityIssues: string[];
    };
  };

  sleepPatterns: {
    averageHours: number;
    quality: string;
    bedtime: string; // HH:mm
    wakeTime: string; // HH:mm
  };

  mentalHealth: {
    stressLevel?: string;
    anxietyLevel?: string;
    moodStability?: string;
    confidenceLevel?: string;
    emotionalPatterns: {
      overthinking?: boolean;
      motivationConsistency?: string;
    };
    socialBehavior: {
      type?: string;
      talksAboutFeelings?: string;
    };
  };

  lifestyle: {
    screenTime?: string;
    outdoorExposure?: string;
    dailyStepsGoal?: number;
    stressPrevalence?: 'low' | 'medium' | 'high';
    sleepConsistency?: number; // 1-10
    chronicPain?: boolean;
    substanceUse: {
      smoking?: boolean;
      alcohol?: boolean;
    };
    dailyEnergyLevels?: string;
  };

  behavior: {
    goalCommitment?: string;
    consistencyLevel?: string;
    preferredCoachingStyle?: string;
    triggersForDropOff: string[];
  };

  preferences: {
    workoutTime?: string;
    dietStyle?: string;
  };

  constraints: {
    timeAvailable?: string;
    budgetConstraints?: string;
  };

  hormonal?: {
    cycleTrackingEnabled?: boolean;
    menstrualCycle?: string;
    lastPeriodDate?: Date;
    averagePeriodLength?: number;
    averageCycleLength?: number;
    typicalFlowIntensity?: string;
    hormoneIssues: string[];
    digestiveIssues: string[];
    skinHairConcerns: string[];
  };

  // Legacy fields below
  activityLevel?: string;
  dietaryPreferences?: string[];
  workoutPreferences?: any;
  notificationSettings?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    reminderTime: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    age: { type: Number },
    height: { type: Number, min: 50, max: 300 },
    weight: { type: Number, min: 20, max: 500 },
    bodyType: { type: String },
    occupation: { type: String },
    dailyRoutineType: { type: String },

    goals: {
      primaryGoal: { type: String },
      targetTimeline: { type: String },
      problemAreas: [{ type: String }]
    },

    medicalConditions: [{ type: String }],
    allergies: [{ type: String }],
    medications: [{ type: String }],

    nutrition: {
      dietType: { type: String },
      customDishes: [{
        title: { type: String },
        items: { type: String },
        calories: { type: Number }
      }],
      mealPatterns: {
        breakfast: { eats: { type: String }, typicalFoods: [{ type: String }] },
        lunch: { typicalFoods: [{ type: String }] },
        dinner: { size: { type: String }, time: { type: String } },
        snacks: { frequency: { type: String }, type: { type: String } }
      },
      preferredIndianDishes: [{ type: String }],
      hydration: { type: String },
      dietQuality: { type: Number, min: 1, max: 10, default: 5 },
      eatingBehavior: {
        emotionalEating: { type: String },
        cravings: [{ type: String }]
      }
    },

    fitness: {
      fitnessLevel: { type: String },
      weeklyFrequency: { type: String },
      preferredWorkoutType: [{ type: String }],
      workoutLocation: { type: String },
      workoutDuration: { type: String },
      equipmentAccess: [{ type: String }],
      limitations: {
        injuries: [{ type: String }],
        mobilityIssues: [{ type: String }]
      }
    },

    sleepPatterns: {
      averageHours: { type: Number, min: 0, max: 24, default: 7 },
      quality: { type: String, default: 'good' },
      bedtime: { type: String, default: '22:00' },
      wakeTime: { type: String, default: '06:00' }
    },

    mentalHealth: {
      stressLevel: { type: String },
      anxietyLevel: { type: String },
      moodStability: { type: String },
      confidenceLevel: { type: String },
      emotionalPatterns: {
        overthinking: { type: Boolean },
        motivationConsistency: { type: String }
      },
      socialBehavior: {
        type: { type: String },
        talksAboutFeelings: { type: String }
      }
    },

    lifestyle: {
      screenTime: { type: String },
      outdoorExposure: { type: String },
      dailyStepsGoal: { type: Number, default: 5000 },
      stressPrevalence: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      sleepConsistency: { type: Number, min: 1, max: 10, default: 7 },
      chronicPain: { type: Boolean, default: false },
      substanceUse: {
        smoking: { type: Boolean },
        alcohol: { type: Boolean }
      },
      dailyEnergyLevels: { type: String }
    },

    behavior: {
      goalCommitment: { type: String },
      consistencyLevel: { type: String },
      preferredCoachingStyle: { type: String },
      triggersForDropOff: [{ type: String }]
    },

    preferences: {
      workoutTime: { type: String },
      dietStyle: { type: String }
    },

    constraints: {
      timeAvailable: { type: String },
      budgetConstraints: { type: String }
    },

    hormonal: {
      cycleTrackingEnabled: { type: Boolean, default: false },
      menstrualCycle: { type: String },
      lastPeriodDate: { type: Date },
      averagePeriodLength: { type: Number, default: 5 },
      averageCycleLength: { type: Number, default: 28 },
      typicalFlowIntensity: { type: String, default: 'moderate', enum: ['light', 'moderate', 'heavy'] },
      hormoneIssues: [{ type: String }],
      digestiveIssues: [{ type: String }],
      skinHairConcerns: [{ type: String }]
    },

    // Legacy fields
    activityLevel: { type: String, default: 'moderate' },
    dietaryPreferences: [{ type: String }],
    workoutPreferences: {
      preferredTypes: [{ type: String }],
      availableEquipment: [{ type: String }],
      fitnessLevel: { type: String },
      workoutDuration: { type: Number },
      workoutFrequency: { type: Number }
    },
    notificationSettings: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      reminderTime: { type: String, default: '09:00' }
    }
  },
  {
    timestamps: true
  }
);

// Indexes - userId unique index is already created by unique: true on the field
export const UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);

// ============================================================================
// REFRESH TOKEN SCHEMA
// ============================================================================

export interface IRefreshToken extends Document {
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isRevoked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Auto-delete expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);

export default {
  User,
  UserProfile,
  RefreshToken
};
