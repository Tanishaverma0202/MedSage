import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================================================
// MENTAL HEALTH CHECK-IN SCHEMA
// ============================================================================

export interface IMentalHealthCheckIn extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  mood: 'terrible' | 'bad' | 'neutral' | 'good' | 'excellent';
  moodScore: number; // 1-10
  stressLevel: number; // 0-10
  anxietyLevel: number; // 0-10
  energyLevel: number; // 0-10
  sleepQuality: number; // 0-10
  focusLevel: number; // 0-10
  notes?: string;
  triggers?: string[];
  copingStrategies?: string[];
  aiAnalysis?: {
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    recommendations: string[];
    riskFlags: string[];
  };
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MentalHealthCheckInSchema = new Schema<IMentalHealthCheckIn>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    mood: {
      type: String,
      enum: ['terrible', 'bad', 'neutral', 'good', 'excellent'],
      required: true
    },
    moodScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    stressLevel: {
      type: Number,
      min: 0,
      max: 10
    },
    anxietyLevel: {
      type: Number,
      min: 0,
      max: 10
    },
    energyLevel: {
      type: Number,
      min: 0,
      max: 10
    },
    sleepQuality: {
      type: Number,
      min: 0,
      max: 10
    },
    focusLevel: {
      type: Number,
      min: 0,
      max: 10
    },
    notes: {
      type: String,
      maxlength: 2000
    },
    triggers: [{
      type: String
    }],
    copingStrategies: [{
      type: String
    }],
    aiAnalysis: {
      summary: { type: String },
      sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
      recommendations: [{ type: String }],
      riskFlags: [{ type: String }]
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes
MentalHealthCheckInSchema.index({ userId: 1, date: -1 });
MentalHealthCheckInSchema.index({ userId: 1, moodScore: 1 });

export const MentalHealthCheckIn = mongoose.model<IMentalHealthCheckIn>('MentalHealthCheckIn', MentalHealthCheckInSchema);

// ============================================================================
// MEDITATION SESSION SCHEMA
// ============================================================================

export interface IMeditationSession extends Document {
  userId: Types.ObjectId;
  meditationId: Types.ObjectId;
  title: string;
  category: 'anxiety' | 'sleep' | 'focus' | 'stress' | 'general' | 'breathing';
  duration: number; // minutes
  completedAt: Date;
  rating?: number; // 1-5
  notes?: string;
  moodBefore?: string;
  moodAfter?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MeditationSessionSchema = new Schema<IMeditationSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    meditationId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['anxiety', 'sleep', 'focus', 'stress', 'general', 'breathing'],
      required: true,
      index: true
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    },
    completedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: {
      type: String
    },
    moodBefore: {
      type: String
    },
    moodAfter: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

MeditationSessionSchema.index({ userId: 1, completedAt: -1 });
MeditationSessionSchema.index({ userId: 1, category: 1 });

export const MeditationSession = mongoose.model<IMeditationSession>('MeditationSession', MeditationSessionSchema);

// ============================================================================
// MEDITATION LIBRARY SCHEMA
// ============================================================================

export interface IMeditationLibrary extends Document {
  title: string;
  description: string;
  category: 'anxiety' | 'sleep' | 'focus' | 'stress' | 'general' | 'breathing';
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  audioUrl: string;
  transcript?: string;
  coverImage?: string;
  instructor?: string;
  tags: string[];
  playCount: number;
  averageRating: number;
  ratingCount: number;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MeditationLibrarySchema = new Schema<IMeditationLibrary>(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['anxiety', 'sleep', 'focus', 'stress', 'general', 'breathing'],
      required: true,
      index: true
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    audioUrl: {
      type: String,
      required: true
    },
    transcript: {
      type: String
    },
    coverImage: {
      type: String
    },
    instructor: {
      type: String
    },
    tags: [{
      type: String
    }],
    playCount: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    isPremium: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

MeditationLibrarySchema.index({ category: 1, difficulty: 1 });
MeditationLibrarySchema.index({ tags: 1 });
MeditationLibrarySchema.index({ duration: 1 });

export const MeditationLibrary = mongoose.model<IMeditationLibrary>('MeditationLibrary', MeditationLibrarySchema);

// ============================================================================
// JOURNAL ENTRY SCHEMA
// ============================================================================

export interface IJournalEntry extends Document {
  userId: Types.ObjectId;
  date: Date;
  title?: string;
  content: string;
  mood?: string;
  tags?: string[];
  aiInsights?: {
    summary: string;
    patterns: string[];
    suggestions: string[];
  };
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    title: {
      type: String
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000
    },
    mood: {
      type: String
    },
    tags: [{
      type: String
    }],
    aiInsights: {
      summary: { type: String },
      patterns: [{ type: String }],
      suggestions: [{ type: String }]
    },
    isFavorite: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

JournalEntrySchema.index({ userId: 1, date: -1 });
JournalEntrySchema.index({ userId: 1, tags: 1 });
JournalEntrySchema.index({ content: 'text', title: 'text' });

export const JournalEntry = mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);

export default {
  MentalHealthCheckIn,
  MeditationSession,
  MeditationLibrary,
  JournalEntry
};
