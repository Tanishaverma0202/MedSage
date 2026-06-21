import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { healthService } from '../services/health.service';
import { AuthRequest } from '../middleware/common.middleware';
import { logger, connectDB } from '../services/database.service';
import { UserProfile } from '../models/user.model';
import { Types } from 'mongoose';

/**
 * AI Insights Controller
 * Generates personalized health insights based on user profile and health data
 */
export const insightsController = {
  /**
   * Test AI service without authentication (for debugging)
   */
  testAI: async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      
      logger.info('Testing AI service directly...');
      const result = await aiService.generateText(prompt || 'Hello! Respond with "AI working correctly"', {
        temperature: 0.7,
        maxTokens: 100
      });
      
      res.json({
        success: true,
        data: {
          text: result.text,
          provider: result.provider,
          fallbackUsed: result.fallbackUsed,
          processingTime: result.processingTime,
          retries: result.retries
        }
      });
    } catch (error) {
      logger.error('AI service test failed:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Generate personalized health insights for the user
   */
  generateInsights: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      
      logger.info('=== GENERATE GLOBAL INSIGHTS (AI) ===', { userId });
      
      // Get core summary using HealthService
      const globalReport = await healthService.generateGlobalReport(userId || 'guest-user');
      
      res.json({
        success: true,
        data: globalReport
      });
    } catch (error) {
      logger.error('Error in generateInsights:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INSIGHTS_ERROR',
          message: 'Failed to generate health insights',
          details: (error as Error).message
        }
      });
    }
  }
};
