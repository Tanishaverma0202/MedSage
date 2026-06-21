import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { aiService } from '../services/ai.service';
import { AuthRequest, validateRequest } from '../middleware/common.middleware';
import { UserProfile } from '../models/user.model';

// ============================================================================
// VALIDATION RULES
// ============================================================================

const recipeValidation = [
  body('input')
    .notEmpty()
    .withMessage('Input is required')
    .isLength({ max: 500 })
    .withMessage('Input max 500 characters')
];

const analyzeImageValidation = [
  body('fileData')
    .notEmpty()
    .withMessage('File data is required'),
  body('mimeType')
    .notEmpty()
    .withMessage('MIME type is required')
];

// ============================================================================
// NUTRITION AI CONTROLLER
// ============================================================================

export const nutritionAiController = {
  /**
   * Generate recipe from user input
   */
  generateRecipe: [
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { input } = req.body;

        if (!input || !input.trim()) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Input is required'
            }
          });
        }

        // Fetch user profile for context
        const profile = await UserProfile.findOne({ userId: req.user?.userId });

        const suggestions = await aiService.generateNutritionSuggestionsFromInput(input, profile);

        res.json({
          success: true,
          data: {
            suggestions: suggestions || []
          }
        });
      } catch (error) {
        console.error('Error generating recipe suggestions:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'AI_GENERATION_FAILED',
            message: 'MedSage AI is currently unable to generate those recipes. Please try again with different keywords.'
          }
        });
      }
    }
  ],

  /**
   * Analyze food image and extract meal info
   */
  analyzeImage: [
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { fileData, mimeType } = req.body;

        if (!fileData || !mimeType) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'File data and MIME type are required'
            }
          });
        }

        const profile = await UserProfile.findOne({ userId: req.user?.userId });

        // Inject learned dishes if any
        let learnedContext = '';
        if (profile?.nutrition?.customDishes && profile.nutrition.customDishes.length > 0) {
          learnedContext = " IMPORTANT: The user previously uploaded and identified these specific dishes. If the image looks exactly like one of these, you MUST output this exact name and calories. Known Dishes: " +
            profile.nutrition.customDishes.map(d => `"${d.title}" (${d.calories || 0} kcal)`).join(', ') + ". ";
        }

        const prompt = `Analyze this food image.${learnedContext}Provide a short title for the main dish, a comma-separated list of additional visible ingredients/items, and estimated macronutrients (protein, carbs, fats, fiber in grams). You MUST respond with ONLY a JSON object in this exact format, no other text: { "title": "Dish Name", "items": "item1, item2", "calories": 350, "protein": 20, "carbs": 40, "fats": 15, "fiber": 5 }`;

        console.log('📸 Analyzing food image with AI...');
        const result = await aiService.generateText(prompt, {
          imageData: fileData,
          mimeType: mimeType,
          format: 'json'
        });

        console.log('📸 Raw AI image analysis result:', result?.text?.substring(0, 300));

        // Try to parse JSON from the response
        let data = { title: '', items: '', calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 };
        
        if (result?.text) {
          try {
            // Try direct parse first
            const parsed = JSON.parse(result.text.trim());
            data = {
              title: parsed.title || '',
              items: parsed.items || '',
              calories: parsed.calories || 0,
              protein: parsed.protein || 0,
              carbs: parsed.carbs || 0,
              fats: parsed.fats || 0,
              fiber: parsed.fiber || 0
            };
          } catch (directParseErr) {
            // Fallback: regex match
            const match = result.text.match(/\{[\s\S]*\}/);
            if (match) {
              try {
                const parsed = JSON.parse(match[0]);
                data = {
                  title: parsed.title || '',
                  items: parsed.items || '',
                  calories: parsed.calories || 0,
                  protein: parsed.protein || 0,
                  carbs: parsed.carbs || 0,
                  fats: parsed.fats || 0,
                  fiber: parsed.fiber || 0
                };
              } catch (e) {
                console.error('❌ Error parsing AI image response (regex fallback):', e);
              }
            }
          }
        }

        console.log('📸 Parsed image analysis data:', data);

        res.json({
          success: true,
          data: data
        });
      } catch (error) {
        console.error('❌ Error analyzing food image:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'AI_ANALYSIS_FAILED',
            message: 'Failed to analyze the food image. The AI vision model may be busy. Please try again or enter the meal details manually.'
          }
        });
      }
    }
  ],

  /**
   * Get full recipe details (ingredients + steps) for a specific meal
   */
  getRecipeDetails: [
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { mealName, description } = req.body;

        if (!mealName) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Meal name is required'
            }
          });
        }

        console.log(`🍳 Requesting recipe details for: "${mealName}"`);
        const details = await aiService.generateRecipeDetails(mealName, description || '');
        console.log(`✅ Recipe details retrieved: ${details.ingredients.length} ingredients, ${details.recipeSteps.length} steps`);

        res.json({
          success: true,
          data: details
        });
      } catch (error) {
        console.error('Error generating recipe details:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to generate recipe details'
        });
      }
    }
  ],

  /**
   * Estimate total calories for a given meal and its items
   */
  estimateCalories: [
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { mealName, items } = req.body;

        if (!mealName) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Meal name is required'
            }
          });
        }

        const { calories, protein, carbs, fats, fiber } = await aiService.segregateFoodMacros(mealName, 1, 'serving');

        res.json({
          success: true,
          data: {
            calories,
            protein,
            carbs,
            fats,
            fiber
          }
        });
      } catch (error) {
        console.error('Error estimating calories:', error);
        res.status(500).json({
          success: false,
          message: 'AI estimation service is currently busy. Please try again in 30 seconds or enter macros manually.'
        });
      }
    }
  ],

  /**
   * Save a corrected/custom dish to User profile for future AI recognition
   */
  learnDish: [
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const { title, items, calories } = req.body;

        if (!title) {
          return res.status(400).json({ success: false, error: 'Title is required to learn dish' });
        }

        // Find user profile
        let profile = await UserProfile.findOne({ userId: req.user?.userId });
        if (!profile) {
          // Can't learn without a profile
          return res.status(404).json({ success: false, error: 'Profile not found' });
        }

        // Initialize if not present
        if (!profile.nutrition.customDishes) {
          profile.nutrition.customDishes = [];
        }

        // Check if it already exists to avoid duplicates
        const exists = profile.nutrition.customDishes.find(d => d.title.toLowerCase() === title.toLowerCase());

        if (!exists) {
          profile.nutrition.customDishes.push({
            title,
            items: items || '',
            calories: calories || 0
          });

          // Keep only the last 50 learned dishes to prevent prompt blowup
          if (profile.nutrition.customDishes.length > 50) {
            profile.nutrition.customDishes.shift();
          }

          await profile.save();
        }

        res.json({ success: true, message: 'Dish learned successfully' });
      } catch (error) {
        console.error('Error learning dish:', error);
        res.status(500).json({ success: false, error: 'Failed to learn dish' });
      }
    }
  ]
};
