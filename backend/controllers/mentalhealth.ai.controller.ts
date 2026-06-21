import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { aiService } from '../services/ai.service';
import { AuthRequest, validateRequest } from '../middleware/common.middleware';

// ============================================================================
// VALIDATION RULES
// ============================================================================

const assessmentValidation = [
  body('type')
    .notEmpty()
    .withMessage('Assessment type is required'),
  body('action')
    .isIn(['start', 'next', 'complete'])
    .withMessage('Action must be start, next, or complete'),
  body('answers')
    .optional()
    .isArray()
    .withMessage('Answers must be an array')
];

// ============================================================================
// MENTAL HEALTH CONTROLLER
// ============================================================================

export const mentalHealthAiController = {
  /**
   * Handle AI-powered mental health assessments
   */
  assessment: [
    ...assessmentValidation,
    validateRequest,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { type, action, answers = [] } = req.body;
        
        let prompt: string;

        if (action === 'start') {
          prompt = `Start a ${type} assessment for the user. Ask the first question to understand their mental state or personality. Keep it short and empathetic.`;
          const result = await aiService.generateText(prompt);
          
          res.json({
            success: true,
            data: {
              question: result.text || 'How are you feeling today?'
            }
          });
        } else if (action === 'next') {
          const lastAnswer = answers[answers.length - 1] || '';
          prompt = `The user answered: "${lastAnswer}". Ask the next question for the ${type} assessment. Keep it short.`;
          const result = await aiService.generateText(prompt);
          
          res.json({
            success: true,
            data: {
              question: result.text || 'Can you tell me more?'
            }
          });
        } else if (action === 'complete') {
          prompt = `Based on these answers for a ${type} assessment: ${answers.join(' | ')}, provide a brief, empathetic hypothesis about the user's mental health/personality, along with 2 actionable insights.

Return ONLY a JSON object with this exact structure:
{
  "hypothesis": "A concise, compassionate interpretation of the user's current mental state",
  "recommendations": ["Actionable self-care or wellness suggestions"],
  "nextSteps": ["Clear next step or professional suggestion"],
  "tone": "empathetic"
}

Do not include markdown, explanation, or any other extra text.`;
          const result = await aiService.generateText(prompt, { format: 'json' });
          const parsed = (aiService as any).parseJSONResponse(result.text) || {};
          
          res.json({
            success: true,
            data: {
              result: parsed || { hypothesis: 'Thank you for sharing.', recommendations: ['Keep practicing self-compassion.'], nextSteps: ['Consider speaking to a trusted friend or mental health professional.'], tone: 'empathetic' }
            }
          });
        }
      } catch (error) {
        console.error('Error in mental health assessment:', error);
        // Return fallback response
        const { action } = req.body;
        if (action === 'start' || action === 'next') {
          res.json({
            success: true,
            data: {
              question: action === 'start' ? 'How are you feeling today?' : 'Can you tell me more?'
            }
          });
        } else {
          res.json({
            success: true,
            data: {
              result: 'Thank you for sharing your thoughts. Remember to be kind to yourself.'
            }
          });
        }
      }
    }
  ]
};
