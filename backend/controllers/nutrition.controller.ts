import { Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { nutritionService } from '../services/nutrition.service';
import { AuthRequest, validateRequest, ApiError } from '../middleware/common.middleware';
import { parseISO } from 'date-fns';

// ============================================================================
// VALIDATION RULES
// ============================================================================

const mealValidation = [
  body('type')
    .isIn(['breakfast', 'lunch', 'dinner', 'snack'])
    .withMessage('Meal type must be breakfast, lunch, dinner, or snack'),
  body('status')
    .optional()
    .isIn(['logged', 'scheduled'])
    .withMessage('Status must be logged or scheduled'),
  body('foods')
    .isArray({ min: 1 })
    .withMessage('At least one food item is required'),
  body('foods.*.name')
    .trim()
    .notEmpty()
    .withMessage('Food name is required'),
  body('foods.*.quantity')
    .isFloat({ min: 0 })
    .withMessage('Quantity must be a positive number'),
  body('foods.*.unit')
    .trim()
    .notEmpty()
    .withMessage('Unit is required'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

const waterValidation = [
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('action')
    .optional()
    .isIn(['add', 'set'])
    .withMessage('Action must be add or set'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

const dateQueryValidation = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

// ============================================================================
// NUTRITION CONTROLLER
// ============================================================================

export const nutritionController = {
  /**
   * Get daily nutrition log
   */
  getDailyLog: [
    ...dateQueryValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        let date: Date;
        if (req.query.date && typeof req.query.date === 'string') {
          // If only date provided (YYYY-MM-DD), parse safely
          date = parseISO(req.query.date);
        } else {
          date = new Date();
        }
        const log = await nutritionService.getDailyLog(req.user!.userId, date);

        res.json({
          success: true,
          data: log
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Add a meal
   */
  addMeal: [
    ...mealValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const meal = await nutritionService.addMeal(req.user!.userId, {
          ...req.body,
          date: req.body.date ? parseISO(req.body.date) : undefined
        });

        res.status(201).json({
          success: true,
          data: meal
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Update a meal's status
   */
  updateMealStatus: [
    body('status')
      .isIn(['logged', 'scheduled'])
      .withMessage('Status must be logged or scheduled'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const meal = await nutritionService.updateMealStatus(
          req.user!.userId,
          req.params.id,
          req.body.status
        );

        if (!meal) {
          throw new ApiError(404, 'Meal not found');
        }

        res.json({
          success: true,
          data: meal
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Update full meal content
   */
  updateMeal: [
    body('type')
      .optional()
      .isIn(['breakfast', 'lunch', 'dinner', 'snack'])
      .withMessage('Invalid meal type'),
    body('status')
      .optional()
      .isIn(['logged', 'scheduled'])
      .withMessage('Status must be logged or scheduled'),
    body('foods')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Foods must be an array with at least one item'),
    body('foods.*.name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Food name is required'),
    body('foods.*.quantity')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Quantity must be positive'),
    body('foods.*.unit')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Unit is required'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const meal = await nutritionService.updateMeal(
          req.user!.userId,
          req.params.id,
          {
            type: req.body.type,
            status: req.body.status,
            foods: req.body.foods,
            notes: req.body.notes
          }
        );

        if (!meal) {
          throw new ApiError(404, 'Meal not found');
        }

        res.json({
          success: true,
          data: meal
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Update water intake
   */
  updateWater: [
    ...waterValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const result = await nutritionService.updateWater(req.user!.userId, {
          ...req.body,
          date: req.body.date ? (typeof req.body.date === 'string' ? parseISO(req.body.date) : new Date(req.body.date)) : undefined
        });

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
   * Get food suggestions
   */
  getFoodSuggestions: [
    query('mealType')
      .isIn(['breakfast', 'lunch', 'dinner', 'snack'])
      .withMessage('Meal type is required'),
    query('calorieTarget')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Calorie target must be positive'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const suggestions = await nutritionService.getFoodSuggestions(
          req.user!.userId,
          {
            mealType: req.query.mealType as string,
            calorieTarget: req.query.calorieTarget ? parseFloat(req.query.calorieTarget as string) : undefined
          }
        );

        res.json({
          success: true,
          data: suggestions
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Get nutrition statistics
   */
  getNutritionStats: [
    query('period')
      .optional()
      .isIn(['week', 'month'])
      .withMessage('Period must be week or month'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const stats = await nutritionService.getNutritionStats(
          req.user!.userId,
          (req.query.period as 'week' | 'month') || 'week'
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
   * Get total meal history
   */
  getMealHistory: [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { limit, offset } = req.query as any;
        const result = await nutritionService.getMealHistory(req.user!.userId, limit, offset);
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        next(error);
      }
    }
  ]
};
