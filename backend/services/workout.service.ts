import { Types } from 'mongoose';
import { Workout, IWorkout, WorkoutPlan, IWorkoutPlan, ExerciseDatabase } from '../models/workout.model';
import { UserProfile } from '../models/user.model';
import { BaseService, cacheService } from './database.service';
import { aiService } from './ai.service';
import { healthService } from './health.service';
import { vectorService } from './vector.service';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

// ============================================================================
// WORKOUT SERVICE
// ============================================================================

export class WorkoutService extends BaseService {
  /**
   * Get workouts with filters
   */
  async getWorkouts(userId: string, filters: {
    startDate?: Date;
    endDate?: Date;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    workouts: IWorkout[];
    pagination: { total: number; limit: number; offset: number };
  }> {
    try {
      const query: any = { userId: new Types.ObjectId(userId) };

      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) query.date.$gte = filters.startDate;
        if (filters.endDate) query.date.$lte = filters.endDate;
      }

      if (filters.type) {
        query.type = filters.type;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      const limit = filters.limit || 20;
      const offset = filters.offset || 0;

      const [workouts, total] = await Promise.all([
        Workout.find(query)
          .sort({ date: -1 })
          .skip(offset)
          .limit(limit),
        Workout.countDocuments(query)
      ]);

      return {
        workouts,
        pagination: { total, limit, offset }
      };
    } catch (error) {
      this.handleError(error, 'getWorkouts');
    }
  }

  /**
   * Create a workout
   */
  async createWorkout(userId: string, data: {
    type: 'cardio' | 'strength' | 'flexibility' | 'hiit' | 'sports' | 'other';
    name: string;
    duration: number;
    caloriesBurned?: number;
    intensity: 'low' | 'moderate' | 'high';
    exercises: Array<{
      name: string;
      sets?: number;
      reps?: number;
      weight?: number;
      duration?: number;
      restTime?: number;
    }>;
    notes?: string;
    date?: Date;
    status?: 'scheduled' | 'logged';
  }): Promise<IWorkout> {
    try {
      // Calculate calories if not provided
      let caloriesBurned = data.caloriesBurned;
      if (!caloriesBurned) {
        caloriesBurned = this.estimateCaloriesBurned(
          data.type,
          data.duration,
          data.intensity
        );
      }

      const workout = await Workout.create({
        userId: new Types.ObjectId(userId),
        ...data,
        caloriesBurned,
        date: data.date || new Date(),
        status: data.status || 'logged'
      });

      // Clear cache
      await cacheService.deletePattern(`workout:${userId}:*`);
      await healthService.invalidateDashboardCache(userId);

      // Store in AI Memory
      await vectorService.storeMemory(
        userId,
        `Performed a ${data.duration}-minute ${data.intensity} intensity ${data.type} workout burning ~${caloriesBurned} calories. Exercises included: ${data.exercises.map(e => e.name).join(', ')}. Notes: ${data.notes || 'None'}.`,
        'workout'
      );

      this.logOperation('Workout created', { userId, workoutId: workout._id });

      return workout;
    } catch (error) {
      this.handleError(error, 'createWorkout');
    }
  }

  /**
   * Update a workout
   */
  async updateWorkout(userId: string, workoutId: string, data: Partial<{
    type: 'cardio' | 'strength' | 'flexibility' | 'hiit' | 'sports' | 'other';
    name: string;
    duration: number;
    caloriesBurned?: number;
    intensity: 'low' | 'moderate' | 'high';
    exercises: Array<{
      name: string;
      sets?: number;
      reps?: number;
      weight?: number;
      duration?: number;
      restTime?: number;
    }>;
    notes?: string;
    date: Date;
    status: 'scheduled' | 'logged';
  }>): Promise<IWorkout> {
    try {
      // Recalculate calories if duration or intensity changed and calories not provided
      if ((data.duration || data.intensity || data.type) && !data.caloriesBurned) {
        const currentWorkout = await Workout.findOne({ _id: new Types.ObjectId(workoutId), userId: new Types.ObjectId(userId) });
        if (currentWorkout) {
          data.caloriesBurned = this.estimateCaloriesBurned(
            data.type || currentWorkout.type,
            data.duration || currentWorkout.duration,
            data.intensity || currentWorkout.intensity
          );
        }
      }

      const workout = await Workout.findOneAndUpdate(
        { _id: new Types.ObjectId(workoutId), userId: new Types.ObjectId(userId) },
        { $set: data },
        { new: true }
      );

      if (!workout) {
        throw new Error('Workout not found');
      }

      // Clear cache
      await cacheService.deletePattern(`workout:${userId}:*`);
      await cacheService.deletePattern(`workout-stats:${userId}:*`);
      await healthService.invalidateDashboardCache(userId);

      this.logOperation('Workout updated', { userId, workoutId });

      return workout;
    } catch (error) {
      this.handleError(error, 'updateWorkout');
    }
  }

  /**
   * Delete a workout
   */
  async deleteWorkout(userId: string, workoutId: string): Promise<boolean> {
    try {
      const result = await Workout.deleteOne({
        _id: new Types.ObjectId(workoutId),
        userId: new Types.ObjectId(userId)
      });

      if (result.deletedCount > 0) {
        // Clear cache
        await cacheService.deletePattern(`workout:${userId}:*`);
        await cacheService.deletePattern(`workout-stats:${userId}:*`);
        await healthService.invalidateDashboardCache(userId);
        this.logOperation('Workout deleted', { userId, workoutId });
        return true;
      }

      return false;
    } catch (error) {
      this.handleError(error, 'deleteWorkout');
    }
  }

  /**
   * Get workout statistics
   */
  async getWorkoutStats(userId: string, period: 'week' | 'month' = 'month'): Promise<{
    totalWorkouts: number;
    totalDuration: number;
    totalCaloriesBurned: number;
    averageIntensity: string;
    weeklyStreak: number;
    byType: Record<string, number>;
    trends: Array<{ date: string; duration: number; calories: number }>;
  }> {
    try {
      const cacheKey = cacheService.generateKey('workout-stats', userId, period);
      let stats = await cacheService.get<any>(cacheKey);

      if (!stats) {
        const days = period === 'week' ? 7 : 30;
        const startDate = subDays(new Date(), days);

        const workouts = await Workout.find({
          userId: new Types.ObjectId(userId),
          date: { $gte: startDate }
        });

        const byType: Record<string, number> = {};
        const trends: Array<{ date: string; duration: number; calories: number }> = [];
        const dailyTotals: Record<string, { duration: number; calories: number }> = {};

        workouts.forEach(workout => {
          // Count by type
          byType[workout.type] = (byType[workout.type] || 0) + 1;

          // Daily totals for trends
          const dateKey = format(workout.date, 'yyyy-MM-dd');
          if (!dailyTotals[dateKey]) {
            dailyTotals[dateKey] = { duration: 0, calories: 0 };
          }
          dailyTotals[dateKey].duration += workout.duration;
          dailyTotals[dateKey].calories += workout.caloriesBurned || 0;
        });

        // Convert daily totals to trends array
        Object.entries(dailyTotals).forEach(([date, data]) => {
          trends.push({ date, duration: data.duration, calories: data.calories });
        });
        trends.sort((a, b) => a.date.localeCompare(b.date));

        // Calculate streak
        const weeklyStreak = this.calculateStreak(workouts);

        // Calculate average intensity
        const intensityMap: Record<string, number> = { low: 1, moderate: 2, high: 3 };
        const avgIntensity = workouts.length
          ? workouts.reduce((sum, w) => sum + (intensityMap[w.intensity] || 2), 0) / workouts.length
          : 2;
        const intensityLabel = avgIntensity < 1.5 ? 'low' : avgIntensity < 2.5 ? 'moderate' : 'high';

        stats = {
          totalWorkouts: workouts.length,
          totalDuration: workouts.reduce((sum, w) => sum + w.duration, 0),
          totalCaloriesBurned: workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0),
          averageIntensity: intensityLabel,
          weeklyStreak,
          byType,
          trends
        };

        await cacheService.set(cacheKey, stats, 300);
      }

      return stats;
    } catch (error) {
      this.handleError(error, 'getWorkoutStats');
    }
  }

  /**
   * Get AI workout recommendations
   */
  async getRecommendedWorkouts(userId: string, params: {
    fitnessLevel?: string;
    availableTime?: number;
    goal?: string;
    type?: string;
    equipment?: string[];
    isDaily?: boolean;
  }): Promise<any[]> {
    try {
      const profile = await UserProfile.findOne({ userId: new Types.ObjectId(userId) });

      // Get recent workouts for context
      const recentWorkouts = await Workout.find({
        userId: new Types.ObjectId(userId)
      }).sort({ date: -1 }).limit(5);

      const recommendations = await aiService.generateWorkoutRecommendations({
        fitnessLevel: params.fitnessLevel || profile?.workoutPreferences?.fitnessLevel || 'intermediate',
        availableTime: params.availableTime || profile?.workoutPreferences?.workoutDuration || 30,
        goals: profile?.goals?.primaryGoal ? [profile.goals.primaryGoal] : ['general fitness'],
        equipment: params.equipment || profile?.workoutPreferences?.availableEquipment || ['none'],
        type: params.type || 'Any',
        isDaily: params.isDaily,
        recentWorkouts: recentWorkouts.map(w => ({
          type: w.type,
          duration: w.duration,
          intensity: w.intensity
        }))
      }, {
        injectRAG: true,
        userId: userId,
        ragModule: 'reports', // prioritize cross-referencing health constraints!
        ragLimit: 5
      });

      return recommendations;
    } catch (error) {
      this.logger.error('Failed to get workout recommendations:', error);
      // Return fallback recommendations when AI fails
      return [
        {
          name: 'Quick HIIT Blast',
          type: 'hiit',
          duration: params.availableTime || 30,
          intensity: 'moderate',
          exercises: [
            { name: 'Jumping Jacks', sets: 3, reps: 20 },
            { name: 'Push-ups', sets: 3, reps: 10 },
            { name: 'Squats', sets: 3, reps: 15 },
            { name: 'Plank', sets: 3, reps: 30 }
          ],
          estimatedCaloriesBurn: (params.availableTime || 30) * 8,
          aiReasoning: 'A fast-paced routine to boost metabolism and build strength with no equipment needed.'
        },
        {
          name: 'Strength Foundation',
          type: 'strength',
          duration: params.availableTime || 30,
          intensity: 'moderate',
          exercises: [
            { name: 'Bodyweight Squats', sets: 4, reps: 12 },
            { name: 'Lunges', sets: 3, reps: 10 },
            { name: 'Push-ups', sets: 3, reps: 8 },
            { name: 'Glute Bridges', sets: 3, reps: 15 }
          ],
          estimatedCaloriesBurn: (params.availableTime || 30) * 6,
          aiReasoning: 'Build foundational strength with basic bodyweight movements.'
        },
        {
          name: 'Cardio Burn',
          type: 'cardio',
          duration: params.availableTime || 30,
          intensity: 'high',
          exercises: [
            { name: 'High Knees', sets: 4, reps: 30 },
            { name: 'Butt Kicks', sets: 4, reps: 30 },
            { name: 'Mountain Climbers', sets: 3, reps: 20 },
            { name: 'Burpees', sets: 3, reps: 8 }
          ],
          estimatedCaloriesBurn: (params.availableTime || 30) * 10,
          aiReasoning: 'Maximize calorie burn with high-intensity cardio movements.'
        }
      ];
    }
  }

  /**
   * Get all workout plans for a user
   */
  async getWorkoutPlans(userId: string): Promise<IWorkoutPlan[]> {
    try {
      const plans = await WorkoutPlan.find({
        userId: new Types.ObjectId(userId),
        isActive: true
      }).sort({ createdAt: -1 });
      return plans;
    } catch (error) {
      this.handleError(error, 'getWorkoutPlans');
    }
  }

  /**
   * Create workout plan
   */
  async createWorkoutPlan(userId: string, planData: {
    name: string;
    description?: string;
    type: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
    frequency?: number;
    exercises: any[];
    schedule?: any[];
    isAiGenerated?: boolean;
  }): Promise<any> {
    try {
      const plan = await WorkoutPlan.create({
        userId: new Types.ObjectId(userId),
        ...planData,
        type: planData.type || 'mixed',
        difficulty: planData.difficulty || 'intermediate',
        frequency: planData.frequency || 3,
        schedule: planData.schedule || [],
        isAiGenerated: planData.isAiGenerated || false
      });

      this.logOperation('Workout plan created', { userId, planId: plan._id });

      return plan;
    } catch (error) {
      this.handleError(error, 'createWorkoutPlan');
    }
  }

  /**
   * Delete workout plan
   */
  async deleteWorkoutPlan(userId: string, planId: string): Promise<boolean> {
    try {
      const result = await WorkoutPlan.deleteOne({
        _id: new Types.ObjectId(planId),
        userId: new Types.ObjectId(userId)
      });
      return result.deletedCount > 0;
    } catch (error) {
      this.handleError(error, 'deleteWorkoutPlan');
    }
  }

  /**
   * Get exercise database
   */
  async getExerciseDatabase(filters: {
    category?: string;
    muscleGroups?: string[];
    difficulty?: string;
    equipment?: string[];
    search?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      const query: any = {};

      if (filters.category) query.category = filters.category;
      if (filters.difficulty) query.difficulty = filters.difficulty;
      if (filters.muscleGroups?.length) query.muscleGroups = { $in: filters.muscleGroups };
      if (filters.equipment?.length) query.equipment = { $in: filters.equipment };
      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      const exercises = await ExerciseDatabase.find(query)
        .limit(filters.limit || 50)
        .sort({ name: 1 });

      return exercises;
    } catch (error) {
      this.handleError(error, 'getExerciseDatabase');
    }
  }

  /**
   * Estimate calories burned
   */
  private estimateCaloriesBurned(
    type: string,
    duration: number,
    intensity: string
  ): number {
    // MET values (Metabolic Equivalent of Task)
    const metValues: Record<string, Record<string, number>> = {
      cardio: { low: 4, moderate: 7, high: 10 },
      strength: { low: 3, moderate: 5, high: 8 },
      flexibility: { low: 2, moderate: 3, high: 4 },
      hiit: { low: 6, moderate: 9, high: 12 },
      sports: { low: 4, moderate: 6, high: 9 },
      other: { low: 3, moderate: 5, high: 7 }
    };

    const met = metValues[type]?.[intensity] || 5;
    // Formula: Calories = MET * weight(kg) * time(hours)
    // Assuming average weight of 70kg
    return Math.round(met * 70 * (duration / 60));
  }

  /**
   * Migrate workout data from guest to registered user
   */
  async migrateUserData(fromUserId: string, toUserId: string): Promise<{
    workoutsMigrated: number;
    plansMigrated: number;
  }> {
    try {
      if (!fromUserId || !toUserId || fromUserId === toUserId) {
        return { workoutsMigrated: 0, plansMigrated: 0 };
      }

      const fromId = new Types.ObjectId(fromUserId);
      const toId = new Types.ObjectId(toUserId);

      // Migrate Workouts
      const workoutResult = await Workout.updateMany(
        { userId: fromId },
        { $set: { userId: toId } }
      );

      // Migrate WorkoutPlans
      const planResult = await WorkoutPlan.updateMany(
        { userId: fromId },
        { $set: { userId: toId } }
      );

      // Clear caches
      await cacheService.deletePattern(`workout:${toUserId}:*`);
      await cacheService.deletePattern(`workout-stats:${toUserId}:*`);

      this.logOperation('Workout data migrated', {
        fromUserId,
        toUserId,
        workouts: workoutResult.modifiedCount,
        plans: planResult.modifiedCount
      });

      return {
        workoutsMigrated: workoutResult.modifiedCount,
        plansMigrated: planResult.modifiedCount
      };
    } catch (error) {
      this.handleError(error, 'migrateUserData');
    }
  }

  /**
   * Calculate workout streak
   */
  private calculateStreak(workouts: IWorkout[]): number {
    if (workouts.length === 0) return 0;

    // Sort by date descending
    const sorted = [...workouts].sort((a, b) => b.date.getTime() - a.date.getTime());

    let streak = 1;
    let currentDate = startOfDay(sorted[0].date);

    for (let i = 1; i < sorted.length; i++) {
      const prevDate = startOfDay(sorted[i].date);
      const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 7) { // Weekly streak
        streak++;
        currentDate = prevDate;
      } else if (diffDays < 7) {
        // Same week, continue
        currentDate = prevDate;
      } else {
        break;
      }
    }

    return streak;
  }
}

export const workoutService = new WorkoutService();
