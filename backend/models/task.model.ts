import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================================================
// TASK SCHEMA
// ============================================================================

export interface ITask extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description?: string;
  type: 'daily' | 'workout' | 'medicine' | 'appointment' | 'mental-health' | 'nutrition' | 'other';
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  date: Date;
  scheduledTime?: string; // HH:mm
  duration?: number; // minutes
  reminderMinutes?: number;
  reminderSent?: boolean;
  completedAt?: Date;
  notes?: string;
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    endDate?: Date;
  };
  parentTaskId?: Types.ObjectId; // for recurring task instances
  subtasks?: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  source: 'user' | 'ai-suggested' | 'system';
  relatedData?: {
    workoutId?: Types.ObjectId;
    mealId?: Types.ObjectId;
    meditationId?: Types.ObjectId;
    cycleEventId?: Types.ObjectId;
  };
  aiReasoning?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      maxlength: 1000
    },
    type: {
      type: String,
      enum: ['daily', 'workout', 'medicine', 'appointment', 'mental-health', 'nutrition', 'other'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'overdue', 'cancelled'],
      default: 'pending',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    scheduledTime: {
      type: String,
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    duration: {
      type: Number,
      min: 1,
      max: 480
    },
    reminderMinutes: {
      type: Number,
      default: 15,
      min: 0,
      max: 1440
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    },
    notes: {
      type: String
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurrencePattern: {
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      daysOfWeek: [{ type: Number, min: 0, max: 6 }],
      dayOfMonth: { type: Number, min: 1, max: 31 },
      endDate: { type: Date }
    },
    parentTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task'
    },
    subtasks: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        completed: { type: Boolean, default: false }
      }
    ],
    source: {
      type: String,
      enum: ['user', 'ai-suggested', 'system'],
      default: 'user'
    },
    relatedData: {
      workoutId: { type: Schema.Types.ObjectId, ref: 'Workout' },
      mealId: { type: Schema.Types.ObjectId, ref: 'Meal' },
      meditationId: { type: Schema.Types.ObjectId, ref: 'MeditationLibrary' },
      cycleEventId: { type: Schema.Types.ObjectId, ref: 'MenstrualCycle' }
    },
    aiReasoning: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes
TaskSchema.index({ userId: 1, date: -1, status: 1 });
TaskSchema.index({ userId: 1, status: 1, type: 1 });
TaskSchema.index({ userId: 1, date: 1, scheduledTime: 1 });
TaskSchema.index({ status: 1, reminderSent: 1, date: 1 }); // for reminder processing

export const Task = mongoose.model<ITask>('Task', TaskSchema);

// ============================================================================
// ACHIEVEMENT/BADGE SCHEMA
// ============================================================================

export interface IAchievement extends Document {
  userId: Types.ObjectId;
  type: string;
  title: string;
  description: string;
  icon: string;
  category: 'nutrition' | 'workout' | 'mental-health' | 'hormones' | 'general' | 'streak';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt: Date;
  criteria: {
    metric: string;
    threshold: number;
    timeFrame?: string;
  };
  isNewBadge: boolean;
  viewedAt?: Date;
  sharedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['nutrition', 'workout', 'mental-health', 'hormones', 'general', 'streak'],
      required: true,
      index: true
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      required: true
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    criteria: {
      metric: { type: String },
      threshold: { type: Number },
      timeFrame: { type: String }
    },
    isNewBadge: {
      type: Boolean,
      default: true
    },
    viewedAt: {
      type: Date
    },
    sharedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

AchievementSchema.index({ userId: 1, earnedAt: -1 });
AchievementSchema.index({ userId: 1, category: 1 });
AchievementSchema.index({ userId: 1, isNewBadge: 1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema);

// ============================================================================
// NOTIFICATION SCHEMA
// ============================================================================

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'task-reminder' | 'achievement' | 'ai-insight' | 'goal-progress' | 'cycle-reminder' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'unread' | 'read' | 'archived';
  actionLink?: string;
  actionPayload?: Record<string, any>;
  scheduledAt?: Date;
  sentAt?: Date;
  readAt?: Date;
  relatedData?: {
    taskId?: Types.ObjectId;
    achievementId?: Types.ObjectId;
    cycleId?: Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['task-reminder', 'achievement', 'ai-insight', 'goal-progress', 'cycle-reminder', 'system'],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['unread', 'read', 'archived'],
      default: 'unread',
      index: true
    },
    actionLink: {
      type: String
    },
    actionPayload: {
      type: Schema.Types.Mixed
    },
    scheduledAt: {
      type: Date,
      index: true
    },
    sentAt: {
      type: Date
    },
    readAt: {
      type: Date
    },
    relatedData: {
      taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
      achievementId: { type: Schema.Types.ObjectId, ref: 'Achievement' },
      cycleId: { type: Schema.Types.ObjectId, ref: 'MenstrualCycle' }
    }
  },
  {
    timestamps: true
  }
);

NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ scheduledAt: 1, status: 1 }); // for scheduled notification processing

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

export default {
  Task,
  Achievement,
  Notification
};
