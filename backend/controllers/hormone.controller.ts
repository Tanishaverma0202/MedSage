import { Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { hormoneService } from '../services/hormone.service';
import { AuthRequest, validateRequest } from '../middleware/common.middleware';
import { parseISO } from 'date-fns';

// ============================================================================
// VALIDATION RULES
// ============================================================================

const cycleEventValidation = [
  body('type')
    .isIn(['period-start', 'period-end', 'symptom', 'mood', 'energy', 'spotting', 'ovulation-pain'])
    .withMessage('Invalid event type'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('details.flowIntensity')
    .optional()
    .isIn(['light', 'moderate', 'heavy'])
    .withMessage('Flow intensity must be light, moderate, or heavy'),
  body('details.symptomType')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Symptom type cannot be empty'),
  body('details.severity')
    .optional()
    .isIn(['mild', 'moderate', 'severe'])
    .withMessage('Severity must be mild, moderate, or severe')
];

const profileValidation = [
  body('averageCycleLength')
    .optional()
    .isInt({ min: 21, max: 35 })
    .withMessage('Cycle length must be 21-35 days'),
  body('averagePeriodLength')
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage('Period length must be 2-10 days'),
  body('typicalFlowIntensity')
    .optional()
    .isIn(['light', 'moderate', 'heavy'])
    .withMessage('Flow intensity must be light, moderate, or heavy'),
  body('cycleIrregularity')
    .optional()
    .isIn(['regular', 'somewhat-irregular', 'irregular'])
    .withMessage('Invalid cycle regularity value')
];

// ============================================================================
// HORMONE CONTROLLER
// ============================================================================

export const hormoneController = {
  /**
   * Get current cycle data
   */
  getCurrentCycle: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await hormoneService.getCurrentCycle(req.user?.userId || 'guest-user');

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Log cycle event
   */
  logCycleEvent: [
    ...cycleEventValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const cycle = await hormoneService.logCycleEvent(
          req.user?.userId || 'guest-user',
          {
            type: req.body.type,
            date: parseISO(req.body.date),
            details: req.body.details
          }
        );

        res.status(201).json({
          success: true,
          data: cycle
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Get hormone insights
   */
  getHormoneInsights: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const insights = await hormoneService.getHormoneInsights(req.user?.userId || 'guest-user');

      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Log symptoms batch
   */
  logSymptomsBatch: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const cycle = await hormoneService.logSymptomsBatch(
        req.user?.userId || 'guest-user',
        req.body
      );

      res.json({
        success: true,
        message: 'Symptoms logged successfully',
        data: cycle
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Unlog last cycle (Undo)
   */
  unlogLastCycle: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const cycle = await hormoneService.unlogLastCycle(req.user?.userId || 'guest-user');

      res.json({
        success: true,
        message: 'Cycle unlogged successfully',
        data: cycle
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update hormone profile
   */
  updateHormoneProfile: [
    ...profileValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const profile = await hormoneService.updateHormoneProfile(
          req.user?.userId || 'guest-user',
          req.body
        );

        res.json({
          success: true,
          data: profile
        });
      } catch (error) {
        next(error);
      }
    }
  ]
};
