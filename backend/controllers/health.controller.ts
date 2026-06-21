import { Response } from 'express';
import { AuthRequest } from '../middleware/common.middleware';
import { healthService } from '../services/health.service';
import { aiService } from '../services/ai.service';
import { logger } from '../services/database.service';
import { SleepLog } from '../models/sleep.model';
import { parseISO, differenceInMinutes } from 'date-fns';

export const healthController = {
  /**
   * GET /api/v1/health/dashboard
   * Returns the complete home page data: health score, weekly trend, insights & alerts,
   * and module-level metrics — all aggregated from the database for the logged-in user.
   */
  getDashboardData: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      logger.info('=== GET DASHBOARD DATA ===', { userId });

      // Run health snapshot + AI report + monthly trend in parallel
      const [globalReport, monthlyTrend] = await Promise.all([
        healthService.generateGlobalReport(userId),
        healthService.getMonthlyTrendData(userId)
      ]);

      const snapshot = globalReport.snapshot;
      const targets = globalReport.targets || { calories: 2000, water: 2500, sleep: 8, steps: 5000, workoutFreq: 3 };

      // Build clean dashboard metrics for the UI
      // avgActualSleepScore stores duration in minutes — convert to hours for display
      const avgSleepMinutes = snapshot?.recentMentalHealth?.avgActualSleepScore ?? 0;
      const sleepHours = avgSleepMinutes > 0 ? (avgSleepMinutes / 60).toFixed(1) : null;
      const metrics = {
        sleep: sleepHours
          ? `${sleepHours}h / ${targets.sleep}h`
          : (snapshot?.recentMentalHealth?.avgSleepQuality
            ? `Quality: ${snapshot.recentMentalHealth.avgSleepQuality.toFixed(1)}/10`
            : null),
        activity: `${snapshot?.recentFitness?.count || 0} / ${targets.workoutFreq} sessions`,
        nutrition: snapshot?.recentNutrition?.avgCalories > 0
          ? `${Math.round(snapshot.recentNutrition.avgCalories)} / ${targets.calories} kcal`
          : `0 / ${targets.calories} kcal`,
        mental: snapshot?.recentMentalHealth?.avgMood
          ? `${getMoodLabel(snapshot.recentMentalHealth.avgMood)} (${snapshot.recentMentalHealth.avgMood.toFixed(1)}/10)`
          : 'N/A',
        hydration: `${Math.round(snapshot?.recentNutrition?.avgWater || 0)} / ${targets.water}ml`,
        hormones: snapshot?.cycleData
          ? `${snapshot.cycleData.phase} (Day ${snapshot.cycleData.day}/${snapshot.cycleData.cycleLength || 28})`
          : 'Not tracked',
        workouts: snapshot?.recentFitness?.count || 0
      };

      return res.json({
        success: true,
        data: {
          score: globalReport.score,
          status: globalReport.status,
          summary: globalReport.summary,
          insights: globalReport.insights || [],
          alerts: globalReport.alerts || [],
          weeklyTrend: monthlyTrend,
          metrics,
          profile: {
            name: snapshot?.profile?.name,
            goals: snapshot?.profile?.goals?.primaryGoal || 'General wellness'
          }
        }
      });
    } catch (error) {
      logger.error('Error in getDashboardData:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DASHBOARD_ERROR',
          message: 'Failed to load dashboard data',
          details: (error as Error).message
        }
      });
    }
  },

  /**
   * POST /api/v1/health/sleep
   * Log sleep data and calculate score
   */
  logSleep: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { bedTime, wakeTime, quality, dreams, date } = req.body;
      const logDate = parseISO(date);
      const dateStr = logDate.toISOString().split('T')[0];

      // Calculate duration in minutes using the actual log date
      const bed = parseISO(`${dateStr}T${bedTime}:00Z`);
      let wake = parseISO(`${dateStr}T${wakeTime}:00Z`);

      // If wake time is before bed time, it means they woke up the next day
      if (wake < bed) {
        const nextDay = new Date(logDate);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        wake = parseISO(`${nextDayStr}T${wakeTime}:00Z`);
      }

      const duration = differenceInMinutes(wake, bed);
      const sleepScore = healthService.calculateSleepScore(duration, quality, dreams);

      const sleepLog = await SleepLog.findOneAndUpdate(
        { userId, date: startOfDay(parseISO(date)) },
        {
          userId,
          date: startOfDay(parseISO(date)),
          bedTime,
          wakeTime,
          duration,
          quality,
          dreams,
          sleepScore
        },
        { upsert: true, new: true }
      );

      return res.json({
        success: true,
        data: sleepLog
      });
    } catch (error) {
      logger.error('Error in logSleep:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SLEEP_LOG_ERROR',
          message: 'Failed to log sleep data'
        }
      });
    }
  },

  /**
   * Diagnostic: Check AI Service Health & Connectivity
   */
  getAIStatus: async (req: AuthRequest, res: Response) => {
    try {
      const status = await aiService.checkHealth();
      return res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error in getAIStatus:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AI_STATUS_ERROR',
          message: 'Failed to fetch AI health status'
        }
      });
    }
  }
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getMoodLabel(avgMood: number): string {
  if (avgMood >= 8) return 'Excellent';
  if (avgMood >= 6) return 'Good';
  if (avgMood >= 4) return 'Neutral';
  if (avgMood >= 2) return 'Low';
  return 'Poor';
}
