import { Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { chatService } from '../services/chat.service';
import { AuthRequest, validateRequest } from '../middleware/common.middleware';

// ============================================================================
// VALIDATION RULES
// ============================================================================

const createConversationValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title max 100 characters'),
  body('focusArea')
    .optional()
    .isIn(['nutrition', 'workout', 'mental-health', 'hormones', 'general'])
    .withMessage('Invalid focus area'),
  body('initialContext')
    .optional()
    .isObject()
    .withMessage('Initial context must be an object')
];

const sendMessageValidation = [
  body('content')
    .trim()
    .notEmpty()
    .isLength({ max: 2000 })
    .withMessage('Message content is required (max 2000 characters)'),
  body('context.currentPage')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Current page cannot be empty'),
  body('context.focusArea')
    .optional()
    .isIn(['nutrition', 'workout', 'mental-health', 'hormones', 'general'])
    .withMessage('Invalid focus area')
];

// ============================================================================
// CHAT CONTROLLER
// ============================================================================

export const chatController = {
  /**
   * Get user conversations
   */
  getConversations: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be 1-50'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be positive'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { conversations, total } = await chatService.getConversations(
          req.user?.userId || 'guest-user',
          {
            limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
          }
        );

        res.json({
          success: true,
          data: conversations,
          pagination: {
            total,
            limit: parseInt(req.query.limit as string) || 20,
            offset: parseInt(req.query.offset as string) || 0
          }
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Create new conversation
   */
  createConversation: [
    ...createConversationValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const conversation = await chatService.createConversation(
          req.user?.userId || 'guest-user',
          req.body
        );

        res.status(201).json({
          success: true,
          data: conversation
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Get conversation messages
   */
  getMessages: [
    query('conversationId')
      .isMongoId()
      .withMessage('Valid conversation ID is required'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { conversation, messages } = await chatService.getMessages(
          req.query.conversationId as string,
          req.user?.userId || 'guest-user'
        );

        res.json({
          success: true,
          data: {
            conversation,
            messages
          }
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Send message
   */
  sendMessage: [
    ...sendMessageValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { userMessage, assistantMessage, conversation } = await chatService.sendMessage(
          req.params.conversationId,
          req.user?.userId || 'guest-user',
          req.body.content,
          req.body.context
        );

        res.json({
          success: true,
          data: {
            userMessage,
            assistantMessage,
            conversation
          }
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Archive conversation
   */
  archiveConversation: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await chatService.archiveConversation(
        req.params.conversationId,
        req.user?.userId || 'guest-user'
      );

      res.json({
        success: true,
        message: 'Conversation archived'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Rename conversation
   */
  renameConversation: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await chatService.renameConversation(
        req.params.conversationId,
        req.user?.userId || 'guest-user',
        req.body.title
      );

      res.json({
        success: true,
        message: 'Conversation renamed'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete conversation
   */
  deleteConversation: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await chatService.deleteConversation(
        req.params.conversationId,
        req.user?.userId || 'guest-user'
      );

      res.json({
        success: true,
        message: 'Conversation deleted'
      });
    } catch (error) {
      next(error);
    }
  }
};
