import { Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { taskService } from '../services/task.service';
import { AuthRequest, validateRequest, getPaginationParams, createPaginationResponse } from '../middleware/common.middleware';
import { parseISO, startOfDay } from 'date-fns';

// ============================================================================
// VALIDATION RULES
// ============================================================================

const taskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .isLength({ max: 200 })
    .withMessage('Title is required (max 200 characters)'),
  body('type')
    .isIn(['daily', 'workout', 'medicine', 'appointment', 'mental-health', 'nutrition', 'other'])
    .withMessage('Invalid task type'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('scheduledTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be HH:mm format'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Duration must be 1-480 minutes'),
  body('reminderMinutes')
    .optional()
    .isInt({ min: 0, max: 1440 })
    .withMessage('Reminder must be 0-1440 minutes'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description max 1000 characters')
];

const taskStatusValidation = [
  body('status')
    .isIn(['pending', 'completed', 'overdue', 'cancelled'])
    .withMessage('Status must be pending, completed, overdue, or cancelled'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes max 500 characters')
];

// ============================================================================
// TASK CONTROLLER
// ============================================================================

export const taskController = {
  /**
   * Get tasks
   */
  getTasks: [
    query('date')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    query('type')
      .optional()
      .isIn(['daily', 'workout', 'medicine', 'appointment', 'mental-health', 'nutrition', 'other'])
      .withMessage('Invalid task type'),
    query('status')
      .optional()
      .isIn(['pending', 'completed', 'overdue', 'cancelled'])
      .withMessage('Invalid status'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const result = await taskService.getTasks(
          req.user!.userId,
          {
            date: req.query.date ? parseISO(req.query.date as string) : undefined,
            type: req.query.type as string,
            status: req.query.status as string
          }
        );

        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Create task
   */
  createTask: [
    ...taskValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const task = await taskService.createTask(
          req.user!.userId,
          {
            ...req.body,
            date: req.body.date ? parseISO(req.body.date) : undefined
          }
        );

        res.status(201).json({
          success: true,
          data: task
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Update task status
   */
  updateTaskStatus: [
    ...taskStatusValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const task = await taskService.updateTaskStatus(
          req.params.taskId,
          req.user!.userId,
          req.body.status,
          req.body.notes
        );

        res.json({
          success: true,
          data: task
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Delete task
   */
  deleteTask: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const deleted = await taskService.deleteTask(
        req.params.taskId,
        req.user!.userId
      );

      res.json({
        success: true,
        data: { deleted }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get achievements
   */
  getAchievements: [
    query('category')
      .optional()
      .isIn(['nutrition', 'workout', 'mental-health', 'hormones', 'general', 'streak'])
      .withMessage('Invalid category'),
    query('isNew')
      .optional()
      .isBoolean()
      .withMessage('isNew must be boolean'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be 1-50'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { achievements, total, newCount } = await taskService.getAchievements(
          req.user!.userId,
          {
            category: req.query.category as string,
            isNew: req.query.isNew !== undefined ? req.query.isNew === 'true' : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
          }
        );

        res.json({
          success: true,
          data: achievements,
          pagination: {
            total,
            limit: parseInt(req.query.limit as string) || 20
          },
          newCount
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Mark achievement as viewed
   */
  markAchievementViewed: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await taskService.markAchievementViewed(
        req.params.achievementId,
        req.user!.userId
      );

      res.json({
        success: true,
        message: 'Achievement marked as viewed'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update subtask completion status
   */
  updateSubtaskStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.updateSubtaskStatus(
        req.params.taskId,
        req.user!.userId,
        req.params.subtaskId,
        req.body.completed
      );

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }
};
