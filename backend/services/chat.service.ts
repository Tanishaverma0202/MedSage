import { Types } from 'mongoose';
import {
  Conversation,
  IConversation,
  Message,
  IMessage,
  AIContextCache
} from '../models/chat.model';
import { BaseService, cacheService } from './database.service';
import { aiService } from './ai.service';
import { healthService } from './health.service';
import { UserProfile } from '../models/user.model';
import { startOfDay, subDays } from 'date-fns';

// ============================================================================
// CHAT SERVICE
// ============================================================================

export class ChatService extends BaseService {
  /**
   * Get user conversations
   */
  async getConversations(userId: string, filters: {
    limit?: number;
    offset?: number;
  }): Promise<{
    conversations: IConversation[];
    total: number;
  }> {
    try {
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;

      const [conversations, total] = await Promise.all([
        Conversation.find({
          userId: new Types.ObjectId(userId),
          isArchived: false
        })
          .sort({ lastMessageAt: -1 })
          .skip(offset)
          .limit(limit),
        Conversation.countDocuments({
          userId: new Types.ObjectId(userId),
          isArchived: false
        })
      ]);

      return { conversations, total };
    } catch (error) {
      this.handleError(error, 'getConversations');
    }
  }

  /**
   * Create new conversation
   */
  async createConversation(userId: string, data: {
    title?: string;
    focusArea?: 'nutrition' | 'workout' | 'mental-health' | 'hormones' | 'general';
    initialContext?: Record<string, any>;
  }): Promise<IConversation> {
    try {
      // Handle guest users or invalid ObjectIds
      let userObjectId;
      try {
        userObjectId = new Types.ObjectId(userId);
      } catch {
        // For guest users, use a default ObjectId
        userObjectId = new Types.ObjectId();
      }

      const conversation = await Conversation.create({
        userId: userObjectId,
        title: data.title || 'New Conversation',
        focusArea: data.focusArea || 'general',
        initialContext: data.initialContext || {},
        messageCount: 0,
        lastMessageAt: new Date(),
        isArchived: false,
        metadata: {
          totalTokens: 0,
          aiModel: 'llama3',
          sourcesAccessed: []
        }
      });

      // Create initial AI context cache
      await AIContextCache.create({
        userId: userObjectId,
        conversationId: conversation._id,
        contextSummary: '',
        keyFacts: [],
        userPreferences: {},
        healthInsights: {
          patterns: [],
          trends: {},
          recommendations: []
        }
      });

      this.logOperation('Conversation created', { userId, conversationId: conversation._id });

      return conversation;
    } catch (error) {
      this.handleError(error, 'createConversation');
    }
  }

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: string, userId: string): Promise<{
    conversation: IConversation | null;
    messages: IMessage[];
  }> {
    try {
      const [conversation, messages] = await Promise.all([
        Conversation.findOne({
          _id: new Types.ObjectId(conversationId),
          userId: new Types.ObjectId(userId)
        }),
        Message.find({
          conversationId: new Types.ObjectId(conversationId),
          userId: new Types.ObjectId(userId)
        }).sort({ timestamp: 1 })
      ]);

      return { conversation, messages };
    } catch (error) {
      this.handleError(error, 'getMessages');
    }
  }

  /**
   * Send message and get AI response
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    content: string,
    context?: any
  ): Promise<{ userMessage: any; assistantMessage: any; conversation: IConversation }> {
    try {
      // Handle guest users or invalid ObjectIds
      let userObjectId;
      try {
        userObjectId = new Types.ObjectId(userId);
      } catch {
        // For guest users, use a default ObjectId
        userObjectId = new Types.ObjectId();
      }

      let conversationObjectId;
      try {
        conversationObjectId = new Types.ObjectId(conversationId);
      } catch {
        throw new Error('Invalid conversation ID');
      }

      const conversation = await Conversation.findOne({
        _id: conversationObjectId
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Get recent messages for context
      const recentMessages = await Message.find({
        conversationId: conversationObjectId
      })
        .sort({ timestamp: -1 })
        .limit(10);

      // Get user context (health data summary)
      const userContext = await this.buildUserContext(userId);

      // Save user message
      const userMessage = await Message.create({
        conversationId: conversationObjectId,
        userId: userObjectId,
        role: 'user',
        content,
        timestamp: new Date(),
        metadata: {}
      });

      // Get AI response
      const aiResponse = await aiService.generateChatResponse({
        message: content,
        conversationHistory: recentMessages.reverse().map(m => ({
          role: m.role,
          content: m.content
        })),
        userContext,
        focusArea: context?.focusArea || conversation.focusArea
      });

      // Save AI message
      const assistantMessage = await Message.create({
        conversationId: conversationObjectId,
        userId: userObjectId,
        role: 'assistant',
        content: aiResponse.content,
        sources: aiResponse.sources,
        suggestedActions: aiResponse.suggestedActions,
        insights: aiResponse.insights,
        metadata: {
          aiModel: 'llama3',
          fallbackUsed: aiResponse.fallbackUsed
        },
        timestamp: new Date()
      });

      // Update conversation
      conversation.messageCount += 2;
      conversation.lastMessageAt = new Date();

      // If this is the first real message, generate a smart title
      if (conversation.messageCount <= 2 || conversation.title.includes('New ')) {
        try {
          const smartTitle = await aiService.generateConversationTitle(content);
          conversation.title = smartTitle;
        } catch (titleError) {
          this.logger.error('Failed to generate smart title during sendMessage', titleError);
        }
      }

      await conversation.save();

      // Update context cache
      await this.updateContextCache(conversationId, userId, content, aiResponse);

      return { userMessage, assistantMessage, conversation };
    } catch (error) {
      this.handleError(error, 'sendMessage');
      throw error;
    }
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string, userId: string): Promise<void> {
    try {
      await Conversation.findOneAndUpdate(
        {
          _id: new Types.ObjectId(conversationId),
          userId: new Types.ObjectId(userId)
        },
        { isArchived: true }
      );
    } catch (error) {
      this.handleError(error, 'archiveConversation');
    }
  }

  /**
   * Rename conversation
   */
  async renameConversation(conversationId: string, userId: string, title: string): Promise<void> {
    try {
      await Conversation.findOneAndUpdate(
        {
          _id: new Types.ObjectId(conversationId),
          userId: new Types.ObjectId(userId)
        },
        { title }
      );
    } catch (error) {
      this.handleError(error, 'renameConversation');
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    try {
      await Conversation.findOneAndDelete({
        _id: new Types.ObjectId(conversationId),
        userId: new Types.ObjectId(userId)
      });
      // Also delete messages
      await Message.deleteMany({
        conversationId: new Types.ObjectId(conversationId)
      });
    } catch (error) {
      this.handleError(error, 'deleteConversation');
    }
  }

  /**
   * Build user context for AI
   */
  private async buildUserContext(userId: string): Promise<Record<string, any>> {
    try {
      // Handle guest users or invalid ObjectIds
      let userObjectId;
      try {
        userObjectId = new Types.ObjectId(userId);
      } catch {
        // Return default context for guest users
        return {
          goals: ['general wellness'],
          activityLevel: 'moderate',
          dietaryPreferences: [],
          recentActivity: {
            workouts: 0,
            checkIns: 0
          },
          focusAreas: ['general wellness'],
          isGuest: true
        };
      }

      // Get real data from HealthService
      const snapshot = await healthService.getUnifiedHealthSnapshot(userId);

      return {
        goals: snapshot.profile?.goals || {},
        activityLevel: snapshot.profile?.activityLevel || 'moderate',
        dietaryPreferences: snapshot.profile?.dietaryPreferences || [],
        recentActivity: {
          meals: snapshot.recentNutrition.meals,
          workouts: snapshot.recentFitness.count,
          checkIns: snapshot.recentMentalHealth.recentNotes.length
        },
        healthSnapshot: {
          avgCalories: snapshot.recentNutrition.avgCalories,
          avgMood: snapshot.recentMentalHealth.avgMood,
          avgStress: snapshot.recentMentalHealth.avgStress,
          cyclePhase: snapshot.cycleData?.phase || 'unknown'
        },
        focusAreas: snapshot.profile?.goals?.primaryGoal ? [snapshot.profile.goals.primaryGoal] : ['general wellness'],
        isGuest: false
      };
    } catch (error) {
      this.logger.error('Failed to build user context:', error);
      return {
        goals: ['general wellness'],
        activityLevel: 'moderate',
        dietaryPreferences: [],
        recentActivity: {
          workouts: 0,
          checkIns: 0
        },
        focusAreas: ['general wellness'],
        isGuest: true,
        error: true
      };
    }
  }

  /**
   * Update AI context cache
   */
  private async updateContextCache(
    conversationId: string,
    userId: string,
    userMessage: string,
    aiResponse: any
  ): Promise<void> {
    try {
      const cache = await AIContextCache.findOne({ conversationId: new Types.ObjectId(conversationId) });

      if (cache) {
        // Update context summary (simplified)
        cache.contextSummary += `\nUser: ${userMessage.substring(0, 100)}\nAI: ${aiResponse.content.substring(0, 100)}`;
        cache.lastUpdated = new Date();

        // Extract key facts (simplified approach)
        if (userMessage.includes('goal') || userMessage.includes('want')) {
          cache.keyFacts.push(`User goal mentioned: ${userMessage.substring(0, 50)}...`);
        }

        await cache.save();
      }
    } catch (error) {
      this.logger.error('Failed to update context cache:', error);
    }
  }
}

export const chatService = new ChatService();
