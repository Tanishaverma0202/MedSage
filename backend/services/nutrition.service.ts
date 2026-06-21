import { Types } from 'mongoose';
import { Meal, IMeal, WaterIntake, INutritionGoals, NutritionGoals } from '../models/nutrition.model';
import { UserProfile } from '../models/user.model';
import { BaseService, cacheService } from './database.service';
import { aiService } from './ai.service';
import { vectorService } from './vector.service';
import { ApiError } from '../utils/errors';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

// ============================================================================
// NUTRITION SERVICE
// ============================================================================

export class NutritionService extends BaseService {
  /**
   * Migrate data from guest/previous account to new account
   */
  async migrateUserData(fromUserId: string, toUserId: string): Promise<void> {
    try {
      this.logOperation('Migrating nutrition data', { fromUserId, toUserId });

      // Only migrate if IDs are different and valid
      if (fromUserId === toUserId) return;

      const fromId = new Types.ObjectId(fromUserId);
      const toId = new Types.ObjectId(toUserId);

      // Update Meals
      const mealResult = await Meal.updateMany(
        { userId: fromId },
        { $set: { userId: toId } }
      );

      // Update Water Intake
      const waterResult = await WaterIntake.updateMany(
        { userId: fromId },
        { $set: { userId: toId } }
      );

      // Update Nutrition Goals
      const goalsResult = await NutritionGoals.updateMany(
        { userId: fromId },
        { $set: { userId: toId } }
      );

      this.logOperation('Migration complete', {
        mealsMigrated: mealResult.modifiedCount,
        waterMigrated: waterResult.modifiedCount,
        goalsMigrated: goalsResult.modifiedCount
      });

      // Clear cache for both users
      await cacheService.deletePattern(`nutrition:${fromUserId}:*`);
      await cacheService.deletePattern(`nutrition:${toUserId}:*`);
    } catch (error) {
      this.logger.error('Data migration failed:', error);
      // Don't throw - migration failure shouldn't block login
    }
  }

  /**
   * Get daily nutrition log
   */
  async getDailyLog(userId: string, date: Date): Promise<{
    date: Date;
    meals: IMeal[];
    dailyTotals: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      fiber: number;
    };
    generated?: boolean;
    water: {
      consumed: number;
      target: number;
    };
    goals: INutritionGoals | null;
  }> {
    try {
      const utcDateStr = new Date(date).toISOString().split('T')[0];
      const cacheKey = cacheService.generateKey('nutrition', userId, utcDateStr);
      let data = await cacheService.get<any>(cacheKey);

      if (!data) {
        const start = startOfDay(new Date(date));
        const end = endOfDay(start);

        const [meals, waterLog, goals] = await Promise.all([
          Meal.find({
            userId: new Types.ObjectId(userId),
            date: { $gte: start, $lte: end }
          }).sort({ timestamp: 1 }),
          WaterIntake.findOne({
            userId: new Types.ObjectId(userId),
            date: { $gte: start, $lte: end }
          }),
          NutritionGoals.findOne({ userId: new Types.ObjectId(userId) })
        ]);

        let generated = false;

        // If some meals are missing, add rotating recommendations based on Indian diet
        const existingTypes = new Set(meals.map(m => m.type.toLowerCase()));
        const missingMeal = !existingTypes.has('breakfast') || !existingTypes.has('lunch') || !existingTypes.has('snack') || !existingTypes.has('dinner');

        if (missingMeal) {
          const userProfile = await UserProfile.findOne({ userId: new Types.ObjectId(userId) });
          // Simple deterministic seed based on date
          const seed = date.getDate() + date.getMonth() + date.getFullYear();

          const indianBreakfasts = [
            { name: "Poha with Peanuts", calories: 250, protein: 6, carbs: 40, fats: 8, fiber: 3 },
            { name: "Aloo Paratha with Curd", calories: 320, protein: 9, carbs: 45, fats: 12, fiber: 4 },
            { name: "Idli Sambar", calories: 280, protein: 8, carbs: 48, fats: 4, fiber: 5 },
            { name: "Upma", calories: 240, protein: 5, carbs: 36, fats: 8, fiber: 4 }
          ];

          const indianLunches = [
            { name: "Dal Tadka with Brown Rice", calories: 350, protein: 14, carbs: 60, fats: 6, fiber: 10 },
            { name: "Roti with Palak Paneer", calories: 400, protein: 18, carbs: 45, fats: 18, fiber: 8 },
            { name: "Rajma Chawal", calories: 380, protein: 15, carbs: 65, fats: 5, fiber: 12 },
            { name: "Mixed Veg Sabzi with 2 Rotis", calories: 320, protein: 10, carbs: 50, fats: 10, fiber: 9 }
          ];

          const indianSnacks = [
            { name: "Roasted Makhana", calories: 120, protein: 3, carbs: 20, fats: 4, fiber: 2 },
            { name: "Sprout Chaat", calories: 150, protein: 8, carbs: 25, fats: 2, fiber: 6 },
            { name: "Masala Chai with Marie Biscuit", calories: 140, protein: 3, carbs: 22, fats: 4, fiber: 1 },
            { name: "Fruit Bowl", calories: 110, protein: 1, carbs: 28, fats: 0, fiber: 5 }
          ];

          const indianDinners = [
            { name: "Moong Dal with 2 Rotis", calories: 300, protein: 12, carbs: 45, fats: 8, fiber: 7 },
            { name: "Khichdi with Ghee", calories: 320, protein: 10, carbs: 55, fats: 7, fiber: 6 },
            { name: "Paneer Bhurji with Roti", calories: 340, protein: 16, carbs: 35, fats: 15, fiber: 5 },
            { name: "Veg Pulao with Raita", calories: 290, protein: 8, carbs: 48, fats: 6, fiber: 4 }
          ];

          const b = indianBreakfasts[seed % indianBreakfasts.length];
          const l = indianLunches[(seed + 1) % indianLunches.length];
          const s = indianSnacks[(seed + 2) % indianSnacks.length];
          const d = indianDinners[(seed + 3) % indianDinners.length];

          const createGeneratedMeal = (m: any, type: string) => ({
            _id: new Types.ObjectId(),
            userId: new Types.ObjectId(userId),
            date,
            type,
            status: 'generated',
            foods: [{ name: m.name, quantity: 1, unit: 'serving', calories: m.calories, protein: m.protein, carbs: m.carbs, fats: m.fats, fiber: m.fiber, aiCalculated: true }],
            totalCalories: m.calories,
            totalProtein: m.protein,
            totalCarbs: m.carbs,
            totalFats: m.fats,
            totalFiber: m.fiber,
            timestamp: new Date()
          });

          if (!existingTypes.has('breakfast')) meals.push(createGeneratedMeal(b, 'breakfast') as any);
          if (!existingTypes.has('lunch')) meals.push(createGeneratedMeal(l, 'lunch') as any);
          if (!existingTypes.has('snack')) meals.push(createGeneratedMeal(s, 'snack') as any);
          if (!existingTypes.has('dinner')) meals.push(createGeneratedMeal(d, 'dinner') as any);

          generated = true;
        }

        const loggedMeals = meals.filter(m => m.status === 'logged');
        const dailyTotals = loggedMeals.reduce((acc, meal) => ({
          calories: Math.round((acc.calories + meal.totalCalories) * 100) / 100,
          protein: Math.round((acc.protein + meal.totalProtein) * 100) / 100,
          carbs: Math.round((acc.carbs + meal.totalCarbs) * 100) / 100,
          fats: Math.round((acc.fats + meal.totalFats) * 100) / 100,
          fiber: Math.round((acc.fiber + meal.totalFiber) * 100) / 100
        }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });

        data = {
          date,
          meals,
          dailyTotals,
          generated,
          water: {
            consumed: waterLog?.consumed || 0,
            target: waterLog?.target || 2500
          },
          goals: goals || null
        };

        await cacheService.set(cacheKey, data, 300);
      }

      return data;
    } catch (error) {
      this.handleError(error, 'getDailyLog');
    }
  }

  /**
   * Add a meal
   */
  async addMeal(userId: string, mealData: {
    date?: Date;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    status?: 'scheduled' | 'logged';
    foods: Array<{
      name: string;
      quantity: number;
      unit: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fats?: number;
      fiber?: number;
    }>;
    notes?: string;
  }): Promise<IMeal> {
    try {
      // Calculate nutrition for foods without values using AI
      const foodsWithNutrition = await Promise.all(
        mealData.foods.map(async (food) => {
          if (food.calories && food.protein !== undefined) {
            return { ...food, aiCalculated: false };
          }

          // Use AI to estimate nutrition, passing user's provided calories if they exist
          const estimated = await this.estimateFoodNutrition(food.name, food.quantity, food.unit, food.calories);
          return {
            ...food,
            calories: Math.round((food.calories || estimated.calories) * 100) / 100,
            protein: Math.round((food.protein !== undefined ? food.protein : estimated.protein) * 100) / 100,
            carbs: Math.round((food.carbs !== undefined ? food.carbs : estimated.carbs) * 100) / 100,
            fats: Math.round((food.fats !== undefined ? food.fats : estimated.fats) * 100) / 100,
            fiber: Math.round((food.fiber !== undefined ? food.fiber : estimated.fiber) * 100) / 100,
            aiCalculated: true
          };
        })
      );

      const mealDate = mealData.date ? new Date(mealData.date) : new Date();
      mealDate.setUTCHours(0, 0, 0, 0);

      const meal = await Meal.create({
        userId: new Types.ObjectId(userId),
        date: mealDate,
        type: mealData.type,
        status: mealData.status || 'logged',
        foods: foodsWithNutrition,
        notes: mealData.notes,
        timestamp: new Date()
      });

      // Clear cache
      await cacheService.deletePattern(`nutrition:${userId}:*`);

      // Store in AI Memory
      const foodSummary = mealData.foods.map(f => `${f.quantity} ${f.unit} of ${f.name}`).join(', ');
      await vectorService.storeMemory(
        userId,
        `Logged a ${mealData.type} meal: ${foodSummary}. Notes: ${mealData.notes || 'None'}.`,
        'nutrition',
        { mealId: meal._id }
      );

      this.logOperation('Meal added', { userId, mealId: meal._id });

      return meal;
    } catch (error) {
      this.handleError(error, 'addMeal');
    }
  }

  /**
   * Update meal status 
   */
  async updateMealStatus(userId: string, mealId: string, status: 'logged' | 'scheduled'): Promise<IMeal | null> {
    try {
      const meal = await Meal.findOneAndUpdate(
        { _id: new Types.ObjectId(mealId), userId: new Types.ObjectId(userId) },
        { status },
        { new: true }
      );
      if (meal) {
        await cacheService.deletePattern(`nutrition:${userId}:*`);
      }
      return meal;
    } catch (error) {
      this.handleError(error, 'updateMealStatus');
    }
  }

  /**
   * Update full meal content
   */
  async updateMeal(userId: string, mealId: string, mealData: {
    type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    status?: 'logged' | 'scheduled';
    foods?: Array<{
      name: string;
      quantity: number;
      unit: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fats?: number;
      fiber?: number;
    }>;
    notes?: string;
  }): Promise<IMeal | null> {
    try {
      // Calculate nutrition for foods without values using AI
      let foodsWithNutrition = mealData.foods;
      if (mealData.foods) {
        foodsWithNutrition = await Promise.all(
          mealData.foods.map(async (food) => {
            if (food.calories && food.protein !== undefined) {
              return { ...food, aiCalculated: false };
            }

            // Use AI to estimate nutrition, passing user's provided calories if they exist
            const estimated = await this.estimateFoodNutrition(food.name, food.quantity, food.unit, food.calories);
            return {
              ...food,
              calories: Math.round((food.calories || estimated.calories) * 100) / 100,
              protein: Math.round((food.protein !== undefined ? food.protein : estimated.protein) * 100) / 100,
              carbs: Math.round((food.carbs !== undefined ? food.carbs : estimated.carbs) * 100) / 100,
              fats: Math.round((food.fats !== undefined ? food.fats : estimated.fats) * 100) / 100,
              fiber: Math.round((food.fiber !== undefined ? food.fiber : estimated.fiber) * 100) / 100,
              aiCalculated: true
            };
          })
        );
      }

      const updateData: any = {};
      if (mealData.type) updateData.type = mealData.type;
      if (mealData.status) updateData.status = mealData.status;
      if (foodsWithNutrition) {
        updateData.foods = foodsWithNutrition;
        updateData.totalCalories = Math.round(foodsWithNutrition.reduce((sum, food) => sum + (food.calories || 0), 0) * 100) / 100;
        updateData.totalProtein = Math.round(foodsWithNutrition.reduce((sum, food) => sum + (food.protein || 0), 0) * 100) / 100;
        updateData.totalCarbs = Math.round(foodsWithNutrition.reduce((sum, food) => sum + (food.carbs || 0), 0) * 100) / 100;
        updateData.totalFats = Math.round(foodsWithNutrition.reduce((sum, food) => sum + (food.fats || 0), 0) * 100) / 100;
        updateData.totalFiber = Math.round(foodsWithNutrition.reduce((sum, food) => sum + (food.fiber || 0), 0) * 100) / 100;
      }
      if (mealData.notes !== undefined) updateData.notes = mealData.notes;

      const meal = await Meal.findOneAndUpdate(
        { _id: new Types.ObjectId(mealId), userId: new Types.ObjectId(userId) },
        { $set: updateData },
        { new: true }
      );

      if (meal) {
        await cacheService.deletePattern(`nutrition:${userId}:*`);
      }

      this.logOperation('Meal updated', { userId, mealId });
      return meal;
    } catch (error) {
      this.handleError(error, 'updateMeal');
    }
  }

  /**
   * Update water intake
   */
  async updateWater(userId: string, data: {
    date?: Date;
    amount: number;
    action: 'add' | 'set';
  }): Promise<{ consumed: number; target: number; percentage: number }> {
    try {
      const date = startOfDay(new Date(data.date ? data.date : new Date()));

      let updateQuery: any = {};
      if (data.action === 'set') {
        updateQuery = { $set: { consumed: data.amount }, $push: { entries: { amount: data.amount, timestamp: new Date() } } };
      } else {
        updateQuery = { $inc: { consumed: data.amount }, $push: { entries: { amount: data.amount, timestamp: new Date() } } };
      }

      const waterLog = await WaterIntake.findOneAndUpdate(
        { userId: new Types.ObjectId(userId), date },
        updateQuery,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Clear cache
      await cacheService.deletePattern(`nutrition:${userId}:*`);

      return {
        consumed: Math.round((waterLog.consumed || 0) * 100) / 100,
        target: waterLog.target,
        percentage: Math.round(((waterLog.consumed || 0) / waterLog.target) * 100)
      };
    } catch (error) {
      this.handleError(error, 'updateWater');
    }
  }

  /**
   * Get food suggestions from AI
   */
  async getFoodSuggestions(userId: string, params: {
    mealType: string;
    calorieTarget?: number;
  }): Promise<any[]> {
    try {
      const profile = await UserProfile.findOne({ userId: new Types.ObjectId(userId) });

      const suggestions = await aiService.generateNutritionRecommendations({
        goals: profile?.goals?.primaryGoal ? [profile.goals.primaryGoal] : [],
        dietaryRestrictions: profile?.dietaryPreferences || [],
        recentMeals: [],
        calorieTarget: params.calorieTarget || 500,
        mealType: params.mealType
      }, {
        injectRAG: true,
        userId: userId,
        ragModule: 'reports',
        ragLimit: 5
      });

      return suggestions;
    } catch (error) {
      this.logger.error('Failed to get food suggestions:', error);
      return [];
    }
  }

  /**
   * Get meal history for a user over a period
   */
  async getMealHistory(userId: string, limit: number = 50, offset: number = 0): Promise<{
    meals: IMeal[];
    total: number;
  }> {
    try {
      const query = { userId: new Types.ObjectId(userId) };
      const [meals, total] = await Promise.all([
        Meal.find(query)
          .sort({ date: -1, timestamp: -1 })
          .skip(offset)
          .limit(limit),
        Meal.countDocuments(query)
      ]);
      return { meals, total };
    } catch (error) {
      this.handleError(error, 'getMealHistory');
    }
  }

  /**
   * Get nutrition statistics
   */
  async getNutritionStats(userId: string, period: 'week' | 'month' = 'week'): Promise<{
    averageDailyCalories: number;
    macroSplit: { protein: number; carbs: number; fats: number };
    calorieTrend: Array<{ date: string; calories: number; target: number }>;
    waterAverage: number;
    adherence: number;
  }> {
    try {
      const days = period === 'week' ? 7 : 30;
      const startDate = subDays(new Date(), days);

      const meals = await Meal.find({
        userId: new Types.ObjectId(userId),
        date: { $gte: startDate }
      });

      const waterLogs = await WaterIntake.find({
        userId: new Types.ObjectId(userId),
        date: { $gte: startDate }
      });

      // Calculate daily totals
      const dailyTotals: Record<string, { calories: number; target: number }> = {};

      meals.forEach(meal => {
        const dateKey = format(meal.date, 'yyyy-MM-dd');
        if (!dailyTotals[dateKey]) {
          dailyTotals[dateKey] = { calories: 0, target: 2000 };
        }
        dailyTotals[dateKey].calories += meal.totalCalories;
      });

      const calorieTrend = Object.entries(dailyTotals).map(([date, data]) => ({
        date,
        calories: data.calories,
        target: data.target
      }));

      const totalCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);
      const totalProtein = meals.reduce((sum, m) => sum + m.totalProtein, 0);
      const totalCarbs = meals.reduce((sum, m) => sum + m.totalCarbs, 0);
      const totalFats = meals.reduce((sum, m) => sum + m.totalFats, 0);
      const totalMacros = totalProtein + totalCarbs + totalFats;

      return {
        averageDailyCalories: Math.round(totalCalories / days),
        macroSplit: {
          protein: totalMacros ? Math.round((totalProtein / totalMacros) * 100) : 0,
          carbs: totalMacros ? Math.round((totalCarbs / totalMacros) * 100) : 0,
          fats: totalMacros ? Math.round((totalFats / totalMacros) * 100) : 0
        },
        calorieTrend,
        waterAverage: waterLogs.length
          ? Math.round(waterLogs.reduce((sum, w) => sum + w.consumed, 0) / waterLogs.length)
          : 0,
        adherence: 0.85 // Placeholder - calculate based on goals
      };
    } catch (error) {
      this.handleError(error, 'getNutritionStats');
    }
  }

  /**
   * Estimate food nutrition using AI
   */
  private async estimateFoodNutrition(
    name: string,
    quantity: number,
    unit: string,
    knownCalories?: number
  ): Promise<{ calories: number; protein: number; carbs: number; fats: number; fiber: number }> {
    try {
      // Direct call to AIService to segregate the macros dynamically
      const macros = await aiService.segregateFoodMacros(name, quantity, unit, knownCalories);
      return macros;
    } catch (error) {
      this.logger.error('Fallback macro estimation failed:', error);
      return { calories: knownCalories || 100, protein: 5, carbs: 15, fats: 3, fiber: 2 };
    }
  }
}

export const nutritionService = new NutritionService();
