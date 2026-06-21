import { Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { workoutService } from '../services/workout.service';
import { aiService } from '../services/ai.service';
import { UserProfile } from '../models/user.model';
import { AuthRequest, validateRequest, ApiError, getPaginationParams, createPaginationResponse } from '../middleware/common.middleware';
import { parseISO } from 'date-fns';

// ============================================================================
// VALIDATION RULES
// ============================================================================

const workoutValidation = [
  body('type')
    .isIn(['cardio', 'strength', 'flexibility', 'hiit', 'sports', 'other'])
    .withMessage('Workout type is required'),
  body('name')
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('Workout name is required (max 100 chars)'),
  body('duration')
    .isInt({ min: 1, max: 600 })
    .withMessage('Duration must be 1-600 minutes'),
  body('intensity')
    .isIn(['low', 'moderate', 'high'])
    .withMessage('Intensity must be low, moderate, or high'),
  body('exercises')
    .isArray()
    .withMessage('Exercises must be an array'),
  body('caloriesBurned')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Calories must be positive'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes max 500 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('status')
    .optional()
    .isIn(['logged', 'scheduled'])
    .withMessage('Status must be logged or scheduled')
];

const workoutPlanValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Plan name is required'),
  body('type')
    .optional()
    .isIn(['cardio', 'strength', 'flexibility', 'hiit', 'sports', 'mixed'])
    .withMessage('Invalid plan type'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty'),
  body('duration')
    .isInt({ min: 1, max: 300 })
    .withMessage('Duration must be 1-300 minutes'),
  body('frequency')
    .optional()
    .isInt({ min: 1, max: 7 })
    .withMessage('Frequency must be 1-7 days per week'),
  body('exercises')
    .isArray({ min: 1 })
    .withMessage('At least one exercise is required')
];

// ============================================================================
// WORKOUT CONTROLLER
// ============================================================================

export const workoutController = {
  /**
   * Get workouts
   */
  getWorkouts: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date'),
    query('type')
      .optional()
      .isIn(['cardio', 'strength', 'flexibility', 'hiit', 'sports', 'other'])
      .withMessage('Invalid workout type'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be 1-100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be positive'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { page, limit, skip } = getPaginationParams(req);
        const { workouts, pagination } = await workoutService.getWorkouts(
          req.user?.userId || 'guest-user',
          {
            startDate: req.query.startDate ? parseISO(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? parseISO(req.query.endDate as string) : undefined,
            type: req.query.type as string,
            status: req.query.status as string,
            limit,
            offset: skip
          }
        );

        res.json({
          success: true,
          data: workouts,
          pagination: createPaginationResponse(workouts, pagination.total, page, limit).pagination
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Create workout
   */
  createWorkout: [
    ...workoutValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const workout = await workoutService.createWorkout(
          req.user?.userId || 'guest-user',
          {
            type: req.body.type,
            name: req.body.name,
            duration: req.body.duration,
            intensity: req.body.intensity,
            exercises: req.body.exercises,
            caloriesBurned: req.body.caloriesBurned,
            notes: req.body.notes,
            date: req.body.date ? parseISO(req.body.date) : new Date(),
            status: req.body.status || 'logged'
          }
        );

        res.status(201).json({
          success: true,
          data: workout
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Update a workout
   */
  updateWorkout: [
    ...workoutValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const workout = await workoutService.updateWorkout(
          req.user?.userId || 'guest-user',
          req.params.id,
          {
            ...req.body,
            date: req.body.date ? parseISO(req.body.date) : undefined
          }
        );

        res.json({
          success: true,
          data: workout
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Delete a workout
   */
  deleteWorkout: [
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const deleted = await workoutService.deleteWorkout(
          req.user?.userId || 'guest-user',
          req.params.id
        );

        res.json({
          success: true,
          data: { deleted }
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Get workout statistics
   */
  getWorkoutStats: [
    query('period')
      .optional()
      .isIn(['week', 'month'])
      .withMessage('Period must be week or month'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const stats = await workoutService.getWorkoutStats(
          req.user?.userId || 'guest-user',
          (req.query.period as 'week' | 'month') || 'month'
        );

        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Get recommended workouts
   */
  getRecommendedWorkouts: [
    query('fitnessLevel')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Invalid fitness level'),
    query('availableTime')
      .optional()
      .isInt({ min: 5, max: 300 })
      .withMessage('Available time must be 5-300 minutes'),
    query('goal')
      .optional()
      .isString()
      .withMessage('Invalid goal'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const recommendations = await workoutService.getRecommendedWorkouts(
          req.user?.userId || 'guest-user',
          {
            fitnessLevel: req.query.fitnessLevel as string,
            availableTime: req.query.availableTime ? parseInt(req.query.availableTime as string) : undefined,
            goal: req.query.goal as string,
            equipment: req.query.equipment ? (req.query.equipment as string).split(',') : undefined,
            isDaily: req.query.daily === 'true'
          }
        );

        res.json({
          success: true,
          data: recommendations
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Create workout plan
   */
  createWorkoutPlan: [
    ...workoutPlanValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.userId) {
          res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          });
          return;
        }
        const plan = await workoutService.createWorkoutPlan(req.user.userId, req.body);

        res.status(201).json({
          success: true,
          data: plan
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Get workout plans
   */
  getWorkoutPlans: [
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.userId) {
          res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          });
          return;
        }
        const plans = await workoutService.getWorkoutPlans(req.user.userId);

        res.json({
          success: true,
          data: plans
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Delete workout plan
   */
  deleteWorkoutPlan: [
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.userId) {
          res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          });
          return;
        }
        const deleted = await workoutService.deleteWorkoutPlan(
          req.user.userId,
          req.params.id
        );

        res.json({
          success: true,
          data: { deleted }
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Get exercise database
   */
  getExerciseDatabase: [
    query('category')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Category cannot be empty'),
    query('muscleGroups')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Muscle groups cannot be empty'),
    query('difficulty')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Invalid difficulty'),
    query('search')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Search term cannot be empty'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be 1-100'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const exercises = await workoutService.getExerciseDatabase({
          category: req.query.category as string,
          muscleGroups: req.query.muscleGroups ? (req.query.muscleGroups as string).split(',') : undefined,
          difficulty: req.query.difficulty as string,
          search: req.query.search as string,
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
        });

        res.json({
          success: true,
          data: exercises
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Generate custom workout from AI based on specific prompt
   */
  generateCustomWorkout: [
    body('prompt').notEmpty().withMessage('Prompt is required'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { prompt } = req.body;
        const profile = await UserProfile.findOne({ userId: req.user?.userId });

        const workout = await aiService.generateCustomWorkout(prompt, profile);

        res.json({
          success: true,
          data: workout
        });
      } catch (error) {
        next(error);
      }
    }
  ]
};
