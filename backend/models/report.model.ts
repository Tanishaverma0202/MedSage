import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReport extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  filename: string;
  mimeType: string;
  fileData?: string; // Base64 encoded or path to storage
  analysis: {
    summary: string;
    metrics: Array<{ name: string; value: string; status: 'Normal' | 'Low' | 'High' }>;
    alerts: Array<{ detail: string; severity: 'Low' | 'Moderate' | 'High' }>;
    trends: string;
    strengths: string[];
    concerns: string[];
    recommendations: {
      diet: string[];
      workout: string[];
      lifestyle: string[];
      mentalWellness: string[];
    };
  };
  status: 'pending' | 'completed' | 'failed';
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    filename: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    fileData: {
      type: String,
      select: false // Only fetch when needed (large data)
    },
    analysis: {
      summary: String,
      metrics: [{ name: String, value: String, status: String }],
      alerts: [{ detail: String, severity: String }],
      trends: String,
      strengths: [String],
      concerns: [String],
      recommendations: {
        diet: [String],
        workout: [String],
        lifestyle: [String],
        mentalWellness: [String]
      }
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    analyzedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

ReportSchema.index({ userId: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);

export default Report;
