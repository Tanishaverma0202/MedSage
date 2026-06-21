import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISleepLog extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  bedTime: string; // HH:mm
  wakeTime: string; // HH:mm
  duration: number; // minutes
  quality: number; // 1-10
  dreams: boolean;
  sleepScore: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

const SleepLogSchema = new Schema<ISleepLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    bedTime: {
      type: String,
      required: true
    },
    wakeTime: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    quality: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    dreams: {
      type: Boolean,
      default: false
    },
    sleepScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true
  }
);

SleepLogSchema.index({ userId: 1, date: -1 });

export const SleepLog = mongoose.model<ISleepLog>('SleepLog', SleepLogSchema);

export default SleepLog;
