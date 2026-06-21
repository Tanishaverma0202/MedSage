import { Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { mentalHealthService } from '../services/mental-health.service';
import { AuthRequest, validateRequest } from '../middleware/common.middleware';
import { parseISO } from 'date-fns';

// ============================================================================
// VALIDATION RULES
// ============================================================================

const checkInValidation = [
  body('mood')
    .isIn(['terrible', 'bad', 'neutral', 'good', 'excellent'])
    .withMessage('Mood must be terrible, bad, neutral, good, or excellent'),
  body('moodScore')
    .isInt({ min: 1, max: 10 })
    .withMessage('Mood score must be 1-10'),
  body('stressLevel')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Stress level must be 0-10'),
  body('anxietyLevel')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Anxiety level must be 0-10'),
  body('energyLevel')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Energy level must be 0-10'),
  body('sleepQuality')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Sleep quality must be 0-10'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes max 2000 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

const meditationValidation = [
  body('meditationId')
    .isMongoId()
    .withMessage('Valid meditation ID is required'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required'),
  body('category')
    .isIn(['anxiety', 'sleep', 'focus', 'stress', 'general', 'breathing'])
    .withMessage('Invalid category'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be positive'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be 1-5')
];

const journalValidation = [
  body('content')
    .trim()
    .notEmpty()
    .isLength({ max: 10000 })
    .withMessage('Content is required (max 10000 characters)'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title max 200 characters'),
  body('mood')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Mood cannot be empty'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

const assessmentValidation = [
  body('assessmentType')
    .isIn(['phq9', 'gad7', 'mmpi2', 'dass21', 'bdi', 'anxiety', 'personality', 'stress', 'focus', 'bigfive', 'mbti', 'disc', 'enneagram', 'strengths'])
    .withMessage('Invalid assessment type. Must be one of: phq9, gad7, mmpi2, dass21, bdi, anxiety, personality, stress, focus, bigfive, mbti, disc, enneagram, strengths'),
  body('responses')
    .isArray({ min: 1 })
    .withMessage('Responses must be a non-empty array'),
  body('responses.*.questionId')
    .notEmpty()
    .withMessage('Question ID is required for each response'),
  body('responses.*.questionText')
    .notEmpty()
    .withMessage('Question text is required for each response'),
  body('responses.*.selectedOption')
    .notEmpty()
    .withMessage('Selected option is required for each response'),
  body('responses.*.points')
    .isInt({ min: 0 })
    .withMessage('Points must be a non-negative integer')
];

// ============================================================================
// MENTAL HEALTH CONTROLLER
// ============================================================================

export const mentalHealthController = {
  /**
   * Get daily check-in
   */
  getDailyCheckIn: [
    query('date')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const date = req.query.date ? parseISO(req.query.date as string) : new Date();
        const checkIn = await mentalHealthService.getDailyCheckIn(req.user!.userId, date);

        res.json({
          success: true,
          data: checkIn
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Create check-in
   */
  createCheckIn: [
    ...checkInValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const checkIn = await mentalHealthService.createCheckIn(
          req.user!.userId,
          {
            ...req.body,
            date: req.body.date ? parseISO(req.body.date) : undefined
          }
        );

        res.status(201).json({
          success: true,
          data: checkIn
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Get mental health statistics
   */
  getMentalHealthStats: [
    query('period')
      .optional()
      .isIn(['week', 'month', '3months'])
      .withMessage('Period must be week, month, or 3months'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const stats = await mentalHealthService.getMentalHealthStats(
          req.user!.userId,
          (req.query.period as 'week' | 'month' | '3months') || 'month'
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
   * Get meditation library
   */
  getMeditationLibrary: [
    query('category')
      .optional()
      .isIn(['anxiety', 'sleep', 'focus', 'stress', 'general', 'breathing'])
      .withMessage('Invalid category'),
    query('duration')
      .optional()
      .isIn(['short', 'medium', 'long'])
      .withMessage('Duration must be short, medium, or long'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be 1-50'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const meditations = await mentalHealthService.getMeditationLibrary({
          category: req.query.category as string,
          duration: req.query.duration as 'short' | 'medium' | 'long',
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
        });

        res.json({
          success: true,
          data: meditations
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Log meditation session
   */
  logMeditationSession: [
    ...meditationValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const session = await mentalHealthService.logMeditationSession(
          req.user!.userId,
          req.body
        );

        res.status(201).json({
          success: true,
          data: session
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Create journal entry
   */
  createJournalEntry: [
    ...journalValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const entry = await mentalHealthService.createJournalEntry(
          req.user!.userId,
          req.body
        );

        res.status(201).json({
          success: true,
          data: entry
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Get journal entries
   */
  getJournalEntries: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date'),
    query('tags')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Tags cannot be empty'),
    query('isFavorite')
      .optional()
      .isBoolean()
      .withMessage('isFavorite must be boolean'),
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
        const { entries, total } = await mentalHealthService.getJournalEntries(
          req.user!.userId,
          {
            startDate: req.query.startDate ? parseISO(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? parseISO(req.query.endDate as string) : undefined,
            tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
            isFavorite: req.query.isFavorite !== undefined ? req.query.isFavorite === 'true' : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
          }
        );

        res.json({
          success: true,
          data: entries,
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
   * Submit assessment
   */
  submitAssessment: [
    ...assessmentValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const assessment = await mentalHealthService.submitAssessment(
          req.user!.userId,
          req.body
        );

        res.status(201).json({
          success: true,
          data: assessment
        });
      } catch (error) {
        next(error);
      }
    }
  ],

  /**
   * Get assessment history
   */
  getAssessmentHistory: [
    query('type')
      .optional()
      .isIn(['phq9', 'gad7', 'mmpi2', 'dass21', 'bdi', 'anxiety', 'personality', 'stress', 'focus', 'bigfive', 'mbti', 'disc', 'enneagram', 'strengths'])
      .withMessage('Invalid assessment type'),
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const history = await mentalHealthService.getAssessmentHistory(
          req.user!.userId,
          req.query.type as string
        );

        res.json({
          success: true,
          data: history
        });
      } catch (error) {
        next(error);
      }
    }
  ]
};
