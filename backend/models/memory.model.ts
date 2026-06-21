import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVectorMemory extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  embedding: number[];
  sourceModule: 'nutrition' | 'workout' | 'mental_health' | 'sleep' | 'cycle' | 'reports' | 'chat' | 'system';
  metadata: Record<string, any>; // Flexible metadata for filtering (e.g. date ranges, reportId, severity)
  createdAt: Date;
  updatedAt: Date;
}

const VectorMemorySchema = new Schema<IVectorMemory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true
    },
    embedding: {
      type: [Number],
      required: true
    },
    sourceModule: {
      type: String,
      enum: ['nutrition', 'workout', 'mental_health', 'sleep', 'cycle', 'reports', 'chat', 'system'],
      required: true,
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// We need an index on userId because we will fetch all vectors for a given user 
// before running the in-memory cosine similarity engine.
VectorMemorySchema.index({ userId: 1, sourceModule: 1 });
VectorMemorySchema.index({ userId: 1, createdAt: -1 });

export const VectorMemory = mongoose.model<IVectorMemory>('VectorMemory', VectorMemorySchema);

export default VectorMemory;
