import mongoose, { Schema, Document, Types } from 'mongoose';

export type DiscussionCategory = 'nutrition' | 'workout' | 'mental-health' | 'hormones' | 'sleep' | 'general';

export interface IReply {
  _id: Types.ObjectId;
  anonAlias: string;
  content: string;
  likes: number;
  createdAt: Date;
}

export interface IDiscussion extends Document {
  _id: Types.ObjectId;
  anonAlias: string;         // auto-generated alias like "Anonymous Panda"
  category: DiscussionCategory;
  title: string;
  content: string;
  likes: number;
  likedBy: string[];         // array of userId strings (hashed) to prevent double-like
  replies: IReply[];
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema<IReply>(
  {
    anonAlias: { type: String, required: true },
    content: { type: String, required: true, maxlength: 2000 },
    likes: { type: Number, default: 0 }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const DiscussionSchema = new Schema<IDiscussion>(
  {
    anonAlias: { type: String, required: true },
    category: {
      type: String,
      enum: ['nutrition', 'workout', 'mental-health', 'hormones', 'sleep', 'general'],
      default: 'general',
      index: true
    },
    title: { type: String, required: true, maxlength: 300 },
    content: { type: String, required: true, maxlength: 5000 },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }],
    replies: [ReplySchema]
  },
  { timestamps: true }
);

DiscussionSchema.index({ createdAt: -1 });
DiscussionSchema.index({ category: 1, createdAt: -1 });

export const Discussion = mongoose.model<IDiscussion>('Discussion', DiscussionSchema);
export default Discussion;
