import { Types } from 'mongoose';
import {
  MenstrualCycle,
  IMenstrualCycle,
  HormoneProfile,
  HormoneCorrelation
} from '../models/hormone.model';
import { UserProfile } from '../models/user.model';
import { BaseService, cacheService } from './database.service';
import { aiService } from './ai.service';
import { startOfDay, addDays, differenceInDays } from 'date-fns';

// ============================================================================
// HORMONE SERVICE
// ============================================================================

export class HormoneService extends BaseService {
  /**
   * Get current cycle data
   */
  async getCurrentCycle(userId: string): Promise<{
    currentCycle: IMenstrualCycle | null;
    cycleHistory: IMenstrualCycle[];
    predictions: {
      nextPeriodDate: Date;
      ovulationDate: Date;
      fertileWindow: { start: Date; end: Date };
    } | null;
    hormoneProfile: any;
  }> {
    try {
      const [currentCycle, cycleHistory, profile] = await Promise.all([
        MenstrualCycle.findOne({
          userId: new Types.ObjectId(userId),
          cycleEndDate: { $exists: false }
        }).sort({ cycleStartDate: -1 }),
        MenstrualCycle.find({ userId: new Types.ObjectId(userId) })
          .sort({ cycleStartDate: -1 })
          .limit(12),
        UserProfile.findOne({ userId: new Types.ObjectId(userId) })
      ]);

      // Generate predictions if we have cycle history
      let predictions = null;

      // SEEDING LOGIC: If no current cycle exists but a lastPeriodDate is in profile, seed the first cycle
      if (!currentCycle && profile?.hormonal?.lastPeriodDate) {
        try {
          const seededCycle = await MenstrualCycle.create({
            userId: new Types.ObjectId(userId),
            cycleStartDate: profile.hormonal.lastPeriodDate,
            flowIntensity: profile.hormonal.typicalFlowIntensity || 'moderate',
            periodLength: profile.hormonal.averagePeriodLength || 5,
            cycleLength: profile.hormonal.averageCycleLength || 28,
            events: [{
              type: 'period-start',
              date: profile.hormonal.lastPeriodDate,
              details: { flowIntensity: profile.hormonal.typicalFlowIntensity || 'moderate' }
            }]
          });
          
          return {
            currentCycle: seededCycle,
            cycleHistory: [seededCycle],
            predictions: await this.generatePredictions(userId, [seededCycle]),
            hormoneProfile: profile
          };
        } catch (seedError) {
          this.logger.error('Failed to seed initial cycle:', seedError);
        }
      }

      if (cycleHistory.length >= 2) {
        predictions = await this.generatePredictions(userId, cycleHistory);
      }

      return {
        currentCycle,
        cycleHistory,
        predictions,
        hormoneProfile: profile
      };
    } catch (error) {
      this.handleError(error, 'getCurrentCycle');
    }
  }

  /**
   * Log cycle event
   */
  async logCycleEvent(userId: string, data: {
    type: 'period-start' | 'period-end' | 'symptom' | 'mood' | 'energy' | 'spotting';
    date: Date;
    details?: {
      flowIntensity?: 'light' | 'moderate' | 'heavy';
      symptomType?: string;
      severity?: 'mild' | 'moderate' | 'severe';
      notes?: string;
    };
  }): Promise<IMenstrualCycle> {
    try {
      const date = startOfDay(data.date);

      if (data.type === 'period-start') {
        let cycle = await MenstrualCycle.findOne({
          userId: new Types.ObjectId(userId),
          cycleStartDate: date
        });

        if (cycle) {
          cycle.flowIntensity = data.details?.flowIntensity || 'moderate';
          const hasEvent = cycle.events.some(e => e.type === 'period-start' && startOfDay(e.date).getTime() === date.getTime());
          if (!hasEvent) {
            cycle.events.push({
              type: data.type,
              date,
              details: data.details || {}
            });
          }
          await cycle.save();
        } else {
          cycle = await MenstrualCycle.create({
            userId: new Types.ObjectId(userId),
            cycleStartDate: date,
            flowIntensity: data.details?.flowIntensity || 'moderate',
            symptoms: [],
            events: [{
              type: data.type,
              date,
              details: data.details || {}
            }]
          });
        }

        // Re-align all cycles for this user chronologically
        const cycles = await MenstrualCycle.find({ userId: new Types.ObjectId(userId) }).sort({ cycleStartDate: 1 });
        for (let i = 0; i < cycles.length; i++) {
          const curr = cycles[i];
          const next = cycles[i + 1];
          if (next) {
            curr.cycleEndDate = next.cycleStartDate;
            curr.cycleLength = differenceInDays(next.cycleStartDate, curr.cycleStartDate);
          } else {
            curr.cycleEndDate = undefined;
            curr.cycleLength = undefined;
          }
          await curr.save();
        }

        // SYNC: Update main UserProfile lastPeriodDate to the start date of the latest cycle
        if (cycles.length > 0) {
          const latestCycle = cycles[cycles.length - 1];
          try {
            await UserProfile.findOneAndUpdate(
              { userId: new Types.ObjectId(userId) },
              { $set: { 'hormonal.lastPeriodDate': latestCycle.cycleStartDate } }
            );
          } catch (syncError) {
            this.logger.error('Failed to sync UserProfile lastPeriodDate:', syncError);
          }
        }

        await this.updateHormoneProfile(userId);

        // Clear cache
        await cacheService.deletePattern(`hormone:${userId}:*`);

        this.logOperation('Cycle started / aligned', { userId, cycleId: cycle._id });
        return cycle;
      }

      // For other event types, add to current cycle
      let cycle = await MenstrualCycle.findOne({
        userId: new Types.ObjectId(userId),
        cycleEndDate: { $exists: false }
      });

      if (!cycle) {
        // Auto-start a cycle if none exists
        cycle = await MenstrualCycle.create({
          userId: new Types.ObjectId(userId),
          cycleStartDate: date,
          flowIntensity: 'moderate',
          symptoms: [],
          events: []
        });
      }

      // Add event
      cycle!.events.push({
        type: data.type,
        date,
        details: data.details || {}
      });

      // Add symptom if applicable
      if (data.type === 'symptom' && data.details?.symptomType) {
        cycle!.symptoms.push({
          date,
          type: data.details.symptomType,
          severity: data.details.severity || 'moderate',
          notes: data.details.notes
        });
      }

      // Handle period end
      if (data.type === 'period-end') {
        cycle!.cycleEndDate = date;
        cycle!.periodLength = differenceInDays(date, cycle!.cycleStartDate);
      }

      await cycle!.save();

      // Clear cache
      await cacheService.deletePattern(`hormone:${userId}:*`);

      this.logOperation('Cycle event logged', { userId, cycleId: cycle!._id, type: data.type });

      return cycle!;
    } catch (error) {
      this.handleError(error, 'logCycleEvent');
    }
  }

  /**
   * Log multiple symptoms at once
   */
  async logSymptomsBatch(userId: string, data: { date: Date, symptoms: { name: string, severity: string }[] }): Promise<IMenstrualCycle | null> {
    try {
      const date = startOfDay(new Date(data.date));
      const userObjectId = new Types.ObjectId(userId);

      // Find the cycle that covers this date
      let cycle = await MenstrualCycle.findOne({
        userId: userObjectId,
        cycleStartDate: { $lte: date },
        $or: [
          { cycleEndDate: { $gte: date } },
          { cycleEndDate: { $exists: false } }
        ]
      });

      if (!cycle) {
        // Fallback to current cycle or autostart
        cycle = await MenstrualCycle.findOne({
          userId: userObjectId,
          cycleEndDate: { $exists: false }
        });
      }

      if (!cycle) return null;

      // Filter out existing symptoms for this date
      cycle.symptoms = cycle.symptoms.filter(s => 
        startOfDay(new Date(s.date)).getTime() !== date.getTime()
      );

      // Add new batch
      data.symptoms.forEach(s => {
        cycle!.symptoms.push({
          date,
          type: s.name,
          severity: s.severity as any,
          notes: ''
        });

        // Also add to events
        cycle!.events.push({
          type: 'symptom',
          date,
          details: {
            symptomType: s.name,
            severity: s.severity as any
          }
        });
      });

      await cycle.save();

      // Clear cache
      await cacheService.deletePattern(`hormone:${userId}:*`);
      this.logOperation('Symptoms batch logged', { userId, cycleId: cycle._id, count: data.symptoms.length });

      return cycle;
    } catch (error) {
      this.handleError(error, 'logSymptomsBatch');
    }
  }

  /**
   * Unlog last period start (Undo)
   */
  async unlogLastCycle(userId: string): Promise<IMenstrualCycle | null> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      
      const lastCycle = await MenstrualCycle.findOne({ userId: userObjectId })
        .sort({ cycleStartDate: -1 });

      if (!lastCycle) return null;

      await MenstrualCycle.findByIdAndDelete(lastCycle._id);

      const cycles = await MenstrualCycle.find({ userId: userObjectId }).sort({ cycleStartDate: 1 });
      for (let i = 0; i < cycles.length; i++) {
        const curr = cycles[i];
        const next = cycles[i + 1];
        if (next) {
          curr.cycleEndDate = next.cycleStartDate;
          curr.cycleLength = differenceInDays(next.cycleStartDate, curr.cycleStartDate);
        } else {
          curr.cycleEndDate = undefined;
          curr.cycleLength = undefined;
        }
        await curr.save();
      }

      if (cycles.length > 0) {
        const latestCycle = cycles[cycles.length - 1];
        await UserProfile.findOneAndUpdate(
          { userId: userObjectId },
          { $set: { 'hormonal.lastPeriodDate': latestCycle.cycleStartDate } }
        );

        await this.updateHormoneProfile(userId);
        this.logOperation('Cycle unlogged/realigned', { userId, latestCycleId: latestCycle._id });
        return latestCycle;
      } else {
        await UserProfile.findOneAndUpdate(
          { userId: userObjectId },
          { $unset: { 'hormonal.lastPeriodDate': "" } }
        );
        await this.updateHormoneProfile(userId);
        return null;
      }
    } catch (error) {
      this.handleError(error, 'unlogLastCycle');
    }
  }

  /**
   * Get hormone insights
   */
  async getHormoneInsights(userId: string): Promise<{
    currentPhase: string;
    phaseDescription: string;
    recommendedActivities: string[];
    nutritionTips: string[];
    exerciseRecommendations: string[];
    moodExpectations: string;
    correlations: any;
  }> {
    try {
      // Handle guest users or invalid ObjectIds
      let userObjectId;
      try {
        userObjectId = new Types.ObjectId(userId);
      } catch {
        // Return default insights for guest users
        return this.getDefaultInsights();
      }

      const [cycle, profile, user] = await Promise.all([
        MenstrualCycle.findOne({
          userId: userObjectId,
          cycleEndDate: { $exists: false }
        }),
        HormoneProfile.findOne({ userId: userObjectId }),
        UserProfile.findOne({ userId: userObjectId })
      ]);

      const phase = this.calculatePhase(cycle);
      const cycleDay = cycle ? differenceInDays(startOfDay(new Date()), startOfDay(cycle.cycleStartDate)) + 1 : 1;
      
      // Get recent symptoms (last 3 days)
      const recentSymptoms = cycle?.symptoms
        ?.filter(s => differenceInDays(new Date(), new Date(s.date)) <= 3)
        ?.map(s => s.type) || [];

      // CALL AI FOR DEEP INSIGHTS
      const aiInsights = await aiService.generateHormoneInsights({
        phase,
        cycleDay,
        avgCycleLength: user?.hormonal?.averageCycleLength || 28,
        avgPeriodLength: user?.hormonal?.averagePeriodLength || 5,
        recentSymptoms,
        hormoneIssues: user?.hormonal?.hormoneIssues || []
      });

      return {
        currentPhase: phase,
        phaseDescription: aiInsights.phaseDescription,
        recommendedActivities: aiInsights.recommendedActivities,
        nutritionTips: aiInsights.nutritionTips,
        exerciseRecommendations: aiInsights.exerciseRecommendations,
        moodExpectations: aiInsights.moodExpectations,
        correlations: {
          withMentalHealth: profile?.aiInsights?.patterns || [],
          withNutrition: [],
          withWorkouts: [],
          alert: aiInsights.aiAlert
        }
      };
    } catch (error) {
      this.handleError(error, 'getHormoneInsights');
      // Return default insights on error
      return this.getDefaultInsights();
    }
  }

  private getDefaultInsights() {
    return {
      currentPhase: 'unknown',
      phaseDescription: 'Track your cycle to get personalized insights based on your hormonal patterns.',
      recommendedActivities: ['Light exercise', 'Stress management', 'Healthy sleep routine'],
      nutritionTips: ['Balanced meals', 'Stay hydrated', 'Include fruits and vegetables'],
      exerciseRecommendations: ['Walking', 'Yoga', 'Swimming'],
      moodExpectations: 'Everyone\'s cycle is unique. Track your patterns to understand your body better.',
      correlations: {
        withMentalHealth: [],
        withNutrition: [],
        withWorkouts: []
      }
    };
  }

  /**
   * Update hormone profile
   */
  async updateHormoneProfile(userId: string, updates?: {
    averageCycleLength?: number;
    averagePeriodLength?: number;
    typicalFlowIntensity?: string;
    commonSymptoms?: string[];
    pmsSymptoms?: string[];
    cycleIrregularity?: string;
    birthControlMethod?: string;
  }): Promise<any> {
    try {
      // Calculate averages from history
      const cycles = await MenstrualCycle.find({
        userId: new Types.ObjectId(userId),
        cycleLength: { $exists: true }
      }).sort({ cycleStartDate: -1 }).limit(6);

      const avgCycleLength = cycles.length
        ? Math.round(cycles.reduce((sum, c) => sum + (c.cycleLength || 0), 0) / cycles.length)
        : 28;

      const avgPeriodLength = cycles.length
        ? Math.round(cycles.reduce((sum, c) => sum + (c.periodLength || 0), 0) / cycles.length)
        : 5;

      // Collect common symptoms
      const allSymptoms = cycles.flatMap(c => c.symptoms.map(s => s.type));
      const symptomCounts = allSymptoms.reduce((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commonSymptoms = Object.entries(symptomCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([s]) => s);

      const profile = await HormoneProfile.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          $set: {
            averageCycleLength: updates?.averageCycleLength || avgCycleLength,
            averagePeriodLength: updates?.averagePeriodLength || avgPeriodLength,
            typicalFlowIntensity: updates?.typicalFlowIntensity || 'moderate',
            commonSymptoms: updates?.commonSymptoms || commonSymptoms,
            pmsSymptoms: updates?.pmsSymptoms || [],
            cycleIrregularity: updates?.cycleIrregularity || 'regular',
            birthControlMethod: updates?.birthControlMethod,
            lastUpdated: new Date()
          }
        },
        { new: true, upsert: true }
      );

      return profile;
    } catch (error) {
      this.handleError(error, 'updateHormoneProfile');
    }
  }

  /**
   * Generate cycle predictions
   */
  private async generatePredictions(
    userId: string,
    cycleHistory: IMenstrualCycle[]
  ): Promise<{
    nextPeriodDate: Date;
    ovulationDate: Date;
    fertileWindow: { start: Date; end: Date };
  }> {
    try {
      const predictions = await aiService.generateCyclePredictions(
        cycleHistory.map(c => ({
          cycleStartDate: c.cycleStartDate,
          cycleLength: c.cycleLength,
          periodLength: c.periodLength
        }))
      );

      // Store predictions on current cycle
      const currentCycle = cycleHistory.find(c => !c.cycleEndDate);
      if (currentCycle) {
        currentCycle.aiPredictions = predictions;
        await currentCycle.save();
      }

      return predictions;
    } catch (error) {
      this.logger.error('Failed to generate predictions:', error);

      // Fallback: simple calculation based on average cycle length
      const avgCycleLength = 28;
      const lastCycle = cycleHistory[0];
      const nextPeriod = addDays(lastCycle.cycleStartDate, avgCycleLength);

      return {
        nextPeriodDate: nextPeriod,
        ovulationDate: addDays(nextPeriod, -14),
        fertileWindow: {
          start: addDays(nextPeriod, -16),
          end: addDays(nextPeriod, -12)
        }
      };
    }
  }

  /**
   * Calculate current cycle phase
   */
  private calculatePhase(cycle: IMenstrualCycle | null): string {
    if (!cycle) return 'unknown';

    const daysSinceStart = differenceInDays(new Date(), cycle.cycleStartDate);
    const cycleLength = 28; // Default, could use user's average

    if (daysSinceStart <= (cycle.periodLength || 5)) {
      return 'menstruation';
    } else if (daysSinceStart <= 13) {
      return 'follicular';
    } else if (daysSinceStart <= 16) {
      return 'ovulation';
    } else {
      return 'luteal';
    }
  }

  private getPhaseDescription(phase: string): string {
    const descriptions: Record<string, string> = {
      menstruation: 'Your period is here. Energy may be lower, so prioritize rest and gentle movement.',
      follicular: 'Post-period energy rising. Good time for new challenges and social activities.',
      ovulation: 'Peak energy and fertility. Great for intense workouts and important tasks.',
      luteal: 'Pre-menstrual phase. Energy decreasing, focus on self-care and routine.',
      unknown: 'Track your cycle to get personalized insights.'
    };
    return descriptions[phase] || descriptions.unknown;
  }

  private getRecommendedActivities(phase: string): string[] {
    const activities: Record<string, string[]> = {
      menstruation: ['Gentle yoga', 'Reading', 'Warm baths', 'Early bedtime'],
      follicular: ['Try new workouts', 'Social outings', 'Creative projects', 'Networking'],
      ovulation: ['High-intensity workouts', 'Important meetings', 'Date nights', 'Group activities'],
      luteal: ['Meal prep', 'Organizing', 'Self-care routines', 'Light cardio'],
      unknown: ['Track your cycle for personalized recommendations']
    };
    return activities[phase] || activities.unknown;
  }

  private getNutritionTips(phase: string): string[] {
    const tips: Record<string, string[]> = {
      menstruation: ['Iron-rich foods', 'Warm foods and drinks', 'Dark chocolate', 'Hydration focus'],
      follicular: ['Fresh vegetables', 'Lean proteins', 'Light meals', 'Green smoothies'],
      ovulation: ['Anti-inflammatory foods', 'Healthy fats', 'Fermented foods', 'Antioxidants'],
      luteal: ['Complex carbs', 'Magnesium-rich foods', 'Small frequent meals', 'Reduce caffeine'],
      unknown: ['Maintain balanced nutrition throughout your cycle']
    };
    return tips[phase] || tips.unknown;
  }

  private getExerciseRecommendations(phase: string): string[] {
    const exercises: Record<string, string[]> = {
      menstruation: ['Gentle yoga', 'Walking', 'Light stretching', 'Rest days'],
      follicular: ['Running', 'Dance cardio', 'Strength training', 'Trying new classes'],
      ovulation: ['HIIT', 'Heavy lifting', 'Competitive sports', 'Long runs'],
      luteal: ['Pilates', 'Moderate cardio', 'Bodyweight exercises', 'Active recovery'],
      unknown: ['Listen to your body and adjust intensity accordingly']
    };
    return exercises[phase] || exercises.unknown;
  }

  private getMoodExpectations(phase: string): string {
    const expectations: Record<string, string> = {
      menstruation: 'You may feel more introspective and need extra self-compassion.',
      follicular: 'Rising estrogen often brings improved mood and motivation.',
      ovulation: 'Peak confidence and social energy. Great time for connections.',
      luteal: 'Progesterone may bring mood shifts. Practice patience with yourself.',
      unknown: 'Track your cycle to understand your unique patterns.'
    };
    return expectations[phase] || expectations.unknown;
  }
}

export const hormoneService = new HormoneService();
