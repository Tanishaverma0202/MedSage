import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================================================
// CHAT CONVERSATION SCHEMA
// ============================================================================

export interface IConversation extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  focusArea?: 'nutrition' | 'workout' | 'mental-health' | 'hormones' | 'general';
  initialContext?: Record<string, any>;
  messageCount: number;
  lastMessageAt: Date;
  isArchived: boolean;
  metadata: {
    totalTokens: number;
    aiModel: string;
    sourcesAccessed: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
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
      default: 'New Conversation'
    },
    focusArea: {
      type: String,
      enum: ['nutrition', 'workout', 'mental-health', 'hormones', 'general'],
      index: true
    },
    initialContext: {
      type: Schema.Types.Mixed
    },
    messageCount: {
      type: Number,
      default: 0
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    metadata: {
      totalTokens: { type: Number, default: 0 },
      aiModel: { type: String },
      sourcesAccessed: [{ type: String }]
    }
  },
  {
    timestamps: true
  }
);

ConversationSchema.index({ userId: 1, lastMessageAt: -1 });
ConversationSchema.index({ userId: 1, isArchived: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

// ============================================================================
// CHAT MESSAGE SCHEMA
// ============================================================================

export interface IMessageSource {
  type: 'user-data' | 'medical-knowledge' | 'general' | 'workout-db' | 'food-db';
  reference: string;
  confidence: number;
  data?: Record<string, any>;
}

export interface ISuggestedAction {
  type: 'log-workout' | 'log-meal' | 'log-mood' | 'view-report' | 'start-meditation' | 'schedule-task';
  label: string;
  payload: Record<string, any>;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: IMessageSource[];
  suggestedActions?: ISuggestedAction[];
  insights?: {
    patterns?: string[];
    recommendations?: string[];
    alerts?: string[];
    correlations?: Record<string, any>;
  };
  metadata: {
    tokens?: number;
    processingTime?: number;
    aiModel?: string;
    fallbackUsed?: boolean;
  };
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSourceSchema = new Schema<IMessageSource>({
  type: {
    type: String,
    enum: ['user-data', 'medical-knowledge', 'general', 'workout-db', 'food-db'],
    required: true
  },
  reference: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1 },
  data: { type: Schema.Types.Mixed }
});

const SuggestedActionSchema = new Schema<ISuggestedAction>({
  type: {
    type: String,
    enum: ['log-workout', 'log-meal', 'log-mood', 'view-report', 'start-meditation', 'schedule-task'],
    required: true
  },
  label: { type: String, required: true },
  payload: { type: Schema.Types.Mixed }
});

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000
    },
    sources: [MessageSourceSchema],
    suggestedActions: [SuggestedActionSchema],
    insights: {
      patterns: [{ type: String }],
      recommendations: [{ type: String }],
      alerts: [{ type: String }],
      correlations: { type: Schema.Types.Mixed }
    },
    metadata: {
      tokens: { type: Number },
      processingTime: { type: Number },
      aiModel: { type: String },
      fallbackUsed: { type: Boolean, default: false }
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

MessageSchema.index({ conversationId: 1, timestamp: 1 });
MessageSchema.index({ userId: 1, role: 1 });
MessageSchema.index({ content: 'text' });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

// ============================================================================
// AI CONTEXT CACHE SCHEMA (for conversation memory)
// ============================================================================

export interface IAIContextCache extends Document {
  userId: Types.ObjectId;
  conversationId: Types.ObjectId;
  contextSummary: string;
  keyFacts: string[];
  userPreferences: Record<string, any>;
  healthInsights: {
    patterns: string[];
    trends: Record<string, any>;
    recommendations: string[];
  };
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIContextCacheSchema = new Schema<IAIContextCache>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      unique: true
    },
    contextSummary: {
      type: String
    },
    keyFacts: [{
      type: String
    }],
    userPreferences: {
      type: Schema.Types.Mixed
    },
    healthInsights: {
      patterns: [{ type: String }],
      trends: { type: Schema.Types.Mixed },
      recommendations: [{ type: String }]
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

AIContextCacheSchema.index({ userId: 1, lastUpdated: -1 });

export const AIContextCache = mongoose.model<IAIContextCache>('AIContextCache', AIContextCacheSchema);

export default {
  Conversation,
  Message,
  AIContextCache
};
