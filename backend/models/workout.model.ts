import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================================================
// WORKOUT LOG SCHEMA
// ============================================================================

export interface IExercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number; // kg
  duration?: number; // minutes
  distance?: number; // km
  restTime?: number; // seconds
  notes?: string;
  muscleGroups?: string[];
}

export interface IWorkout extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: 'cardio' | 'strength' | 'flexibility' | 'hiit' | 'sports' | 'other';
  name: string;
  duration: number; // minutes
  caloriesBurned?: number;
  intensity: 'low' | 'moderate' | 'high';
  exercises: IExercise[];
  notes?: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  equipment?: string[];
  aiRecommended: boolean;
  status: 'logged' | 'scheduled';
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new Schema<IExercise>({
  name: { type: String, required: true },
  sets: { type: Number, min: 0 },
  reps: { type: Number, min: 0 },
  weight: { type: Number, min: 0 },
  duration: { type: Number, min: 0 },
  distance: { type: Number, min: 0 },
  restTime: { type: Number, min: 0 },
  notes: { type: String },
  muscleGroups: [{ type: String }]
});

const WorkoutSchema = new Schema<IWorkout>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['cardio', 'strength', 'flexibility', 'hiit', 'sports', 'other'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 600
    },
    caloriesBurned: {
      type: Number,
      min: 0
    },
    intensity: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      required: true
    },
    exercises: [ExerciseSchema],
    notes: {
      type: String
    },
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    location: {
      type: String
    },
    equipment: [{ type: String }],
    aiRecommended: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['logged', 'scheduled'],
      default: 'logged'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
WorkoutSchema.index({ userId: 1, date: -1 });
WorkoutSchema.index({ userId: 1, type: 1 });
WorkoutSchema.index({ userId: 1, date: -1, type: 1 });

export const Workout = mongoose.model<IWorkout>('Workout', WorkoutSchema);

// ============================================================================
// WORKOUT PLAN/ROUTINE SCHEMA
// ============================================================================

export interface IWorkoutPlan extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'hiit' | 'sports' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  frequency: number; // days per week
  exercises: IExercise[];
  schedule: {
    day: number; // 0-6 (Sunday-Saturday)
    workout: string;
  }[];
  isAiGenerated: boolean;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutPlanSchema = new Schema<IWorkoutPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    type: {
      type: String,
      enum: ['cardio', 'strength', 'flexibility', 'hiit', 'sports', 'mixed'],
      required: true
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: 5,
      max: 300
    },
    frequency: {
      type: Number,
      required: true,
      min: 1,
      max: 7
    },
    exercises: [ExerciseSchema],
    schedule: [{
      day: { type: Number, min: 0, max: 6 },
      workout: { type: String }
    }],
    isAiGenerated: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

WorkoutPlanSchema.index({ userId: 1, isActive: 1 });

export const WorkoutPlan = mongoose.model<IWorkoutPlan>('WorkoutPlan', WorkoutPlanSchema);

// ============================================================================
// EXERCISE DATABASE SCHEMA
// ============================================================================

export interface IExerciseDatabase extends Document {
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'cardio' | 'strength' | 'flexibility' | 'plyometric';
  instructions: string[];
  tips?: string[];
  commonMistakes?: string[];
  videoUrl?: string;
  imageUrl?: string;
  caloriesPerMinute: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseDatabaseSchema = new Schema<IExerciseDatabase>(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    muscleGroups: [{
      type: String
    }],
    equipment: [{
      type: String
    }],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    type: {
      type: String,
      enum: ['cardio', 'strength', 'flexibility', 'plyometric']
    },
    instructions: [{
      type: String
    }],
    tips: [{
      type: String
    }],
    commonMistakes: [{
      type: String
    }],
    videoUrl: {
      type: String
    },
    imageUrl: {
      type: String
    },
    caloriesPerMinute: {
      type: Number,
      default: 0
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

ExerciseDatabaseSchema.index({ name: 'text', category: 'text' });
ExerciseDatabaseSchema.index({ muscleGroups: 1 });
ExerciseDatabaseSchema.index({ difficulty: 1, type: 1 });

export const ExerciseDatabase = mongoose.model<IExerciseDatabase>('ExerciseDatabase', ExerciseDatabaseSchema);

export default {
  Workout,
  WorkoutPlan,
  ExerciseDatabase
};
