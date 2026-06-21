import { Types } from 'mongoose';
import {
  MentalHealthCheckIn,
  IMentalHealthCheckIn,
  MeditationSession,
  MeditationLibrary,
  JournalEntry
} from '../models/mental-health.model';
import { MenstrualCycle } from '../models/hormone.model';
import { MentalHealthAssessment } from '../models/assessment.model';
import { UserProfile } from '../models/user.model';
import { BaseService, cacheService } from './database.service';
import { aiService } from './ai.service';
import { vectorService } from './vector.service';
import { startOfDay, endOfDay, subDays, format, differenceInDays } from 'date-fns';

// ============================================================================
// MENTAL HEALTH SERVICE
// ============================================================================

export class MentalHealthService extends BaseService {
  /**
   * Get daily check-in
   */
  async getDailyCheckIn(userId: string, date: Date): Promise<IMentalHealthCheckIn | null> {
    try {
      const start = startOfDay(date);
      const end = endOfDay(date);

      const checkIn = await MentalHealthCheckIn.findOne({
        userId: new Types.ObjectId(userId),
        date: { $gte: start, $lte: end }
      });

      return checkIn;
    } catch (error) {
      this.handleError(error, 'getDailyCheckIn');
    }
  }

  /**
   * Create or update check-in
   */
  async createCheckIn(userId: string, data: {
    date?: Date;
    mood: 'terrible' | 'bad' | 'neutral' | 'good' | 'excellent';
    moodScore: number;
    stressLevel?: number;
    anxietyLevel?: number;
    energyLevel?: number;
    sleepQuality?: number;
    focusLevel?: number;
    notes?: string;
    triggers?: string[];
    copingStrategies?: string[];
  }): Promise<IMentalHealthCheckIn> {
    try {
      const date = data.date ? startOfDay(data.date) : startOfDay(new Date());

      // Get Hormonal Context
      let hormonalCorrelation = '';
      try {
        const lastCycle = await MenstrualCycle.findOne({ 
          userId: new Types.ObjectId(userId),
          cycleEndDate: { $exists: false }
        });
        
        if (lastCycle) {
          const cycleDay = differenceInDays(startOfDay(new Date()), startOfDay(lastCycle.cycleStartDate)) + 1;
          const phase = this.calculateHormonePhase(lastCycle);
          hormonalCorrelation = await aiService.generateHormonePersonalityCorrelation({
            phase,
            mood: data.mood,
            stressLevel: data.stressLevel || 0,
            cycleDay
          });
        }
      } catch (err) {
        this.logger.error('Failed to get hormonal context for mental health:', err);
      }

      // Get AI analysis
      // Get AI analysis with RAG context
      const aiAnalysis = await aiService.analyzeMentalHealth({
        mood: data.mood,
        moodScore: data.moodScore,
        stressLevel: data.stressLevel || 0,
        anxietyLevel: data.anxietyLevel || 0,
        notes: data.notes
      }, {
        injectRAG: true,
        userId: userId,
        ragModule: 'mental_health',
        ragLimit: 5
      });

      if (aiAnalysis && hormonalCorrelation) {
        aiAnalysis.summary = `${aiAnalysis.summary} ${hormonalCorrelation}`;
      }

      // Upsert check-in
      const checkIn = await MentalHealthCheckIn.findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          date: { $gte: date, $lt: endOfDay(date) }
        },
        {
          $set: {
            userId: new Types.ObjectId(userId),
            date,
            ...data,
            aiAnalysis
          }
        },
        { new: true, upsert: true }
      );

      // Clear cache
      await cacheService.deletePattern(`mental-health:${userId}:*`);

      // Store in AI Memory
      await vectorService.storeMemory(
        userId,
        `Mental health check-in: Mood is ${data.mood} (Score: ${data.moodScore}/10). Stress: ${data.stressLevel || 'N/A'}. Notes: ${data.notes || 'None'}. Analysis sentiment: ${aiAnalysis?.sentiment || 'N/A'}.`,
        'mental_health',
        { checkInId: checkIn._id }
      );

      this.logOperation('Check-in created', { userId, checkInId: checkIn._id });

      return checkIn;
    } catch (error) {
      this.handleError(error, 'createCheckIn');
    }
  }

  /**
   * Get mental health statistics
   */
  async getMentalHealthStats(userId: string, period: 'week' | 'month' | '3months' = 'month'): Promise<{
    averageMoodScore: number;
    averageStressLevel: number;
    averageAnxietyLevel: number;
    averageEnergyLevel: number;
    checkInStreak: number;
    moodTrends: Array<{ date: string; moodScore: number; stressLevel: number }>;
    correlations: {
      sleepVsMood: number;
      exerciseVsMood: number;
    };
    aiInsights: {
      summary: string;
      patterns: string[];
      recommendations: string[];
    };
  }> {
    try {
      const cacheKey = cacheService.generateKey('mental-health-stats', userId, period);
      let stats = await cacheService.get<any>(cacheKey);

      if (!stats) {
        const daysMap = { week: 7, month: 30, '3months': 90 };
        const days = daysMap[period];
        const startDate = subDays(new Date(), days);

        const checkIns = await MentalHealthCheckIn.find({
          userId: new Types.ObjectId(userId),
          date: { $gte: startDate }
        }).sort({ date: 1 });

        if (checkIns.length === 0) {
          return {
            averageMoodScore: 0,
            averageStressLevel: 0,
            averageAnxietyLevel: 0,
            averageEnergyLevel: 0,
            checkInStreak: 0,
            moodTrends: [],
            correlations: { sleepVsMood: 0, exerciseVsMood: 0 },
            aiInsights: {
              summary: 'Start tracking your mood daily to see insights.',
              patterns: [],
              recommendations: ['Try daily check-ins to build awareness']
            }
          };
        }

        // Calculate averages
        const avgMoodScore = checkIns.reduce((sum, c) => sum + c.moodScore, 0) / checkIns.length;
        const avgStress = checkIns.reduce((sum, c) => sum + (c.stressLevel || 0), 0) / checkIns.length;
        const avgAnxiety = checkIns.reduce((sum, c) => sum + (c.anxietyLevel || 0), 0) / checkIns.length;
        const avgEnergy = checkIns.reduce((sum, c) => sum + (c.energyLevel || 0), 0) / checkIns.length;

        // Calculate streak
        const streak = this.calculateStreak(checkIns);

        // Build trends
        const moodTrends = checkIns.map(c => ({
          date: format(c.date, 'yyyy-MM-dd'),
          moodScore: c.moodScore,
          stressLevel: c.stressLevel || 0
        }));

        // Calculate correlations
        const sleepVsMood = this.calculateCorrelation(
          checkIns.map(c => c.sleepQuality || 5),
          checkIns.map(c => c.moodScore)
        );

        // Aggregate AI insights
        const allPatterns = checkIns.flatMap(c => c.aiAnalysis?.riskFlags || []);
        const allRecommendations = checkIns.flatMap(c => c.aiAnalysis?.recommendations || []);

        // Count pattern frequency
        const patternCounts = allPatterns.reduce((acc, p) => {
          acc[p] = (acc[p] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topPatterns = Object.entries(patternCounts)
          .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
          .slice(0, 5)
          .map(([p]) => p);

        stats = {
          averageMoodScore: Math.round(avgMoodScore * 10) / 10,
          averageStressLevel: Math.round(avgStress * 10) / 10,
          averageAnxietyLevel: Math.round(avgAnxiety * 10) / 10,
          averageEnergyLevel: Math.round(avgEnergy * 10) / 10,
          checkInStreak: streak,
          moodTrends,
          correlations: {
            sleepVsMood,
            exerciseVsMood: 0 // Would need workout data
          },
          aiInsights: {
            summary: `Your average mood is ${avgMoodScore >= 7 ? 'positive' : avgMoodScore >= 4 ? 'neutral' : 'concerning'}. Keep tracking to see patterns.`,
            patterns: topPatterns,
            recommendations: [...new Set(allRecommendations)].slice(0, 5)
          }
        };

        await cacheService.set(cacheKey, stats, 300);
      }

      return stats;
    } catch (error) {
      this.handleError(error, 'getMentalHealthStats');
    }
  }

  /**
   * Get meditation library
   */
  async getMeditationLibrary(filters: {
    category?: string;
    duration?: 'short' | 'medium' | 'long';
    difficulty?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      const query: any = {};

      if (filters.category) query.category = filters.category;
      if (filters.difficulty) query.difficulty = filters.difficulty;

      if (filters.duration) {
        const ranges = { short: { $lte: 5 }, medium: { $gt: 5, $lte: 15 }, long: { $gt: 15 } };
        query.duration = ranges[filters.duration];
      }

      const meditations = await MeditationLibrary.find(query)
        .sort({ averageRating: -1 })
        .limit(filters.limit || 20);

      return meditations;
    } catch (error) {
      this.handleError(error, 'getMeditationLibrary');
    }
  }

  /**
   * Log meditation session
   */
  async logMeditationSession(userId: string, data: {
    meditationId: string;
    title: string;
    category: string;
    duration: number;
    rating?: number;
    notes?: string;
    moodBefore?: string;
    moodAfter?: string;
  }): Promise<any> {
    try {
      const session = await MeditationSession.create({
        userId: new Types.ObjectId(userId),
        ...data,
        completedAt: new Date()
      });

      // Update meditation play count
      await MeditationLibrary.findByIdAndUpdate(
        data.meditationId,
        { $inc: { playCount: 1 } }
      );

      this.logOperation('Meditation session logged', { userId, sessionId: session._id });

      return session;
    } catch (error) {
      this.handleError(error, 'logMeditationSession');
    }
  }

  /**
   * Create journal entry
   */
  async createJournalEntry(userId: string, data: {
    title?: string;
    content: string;
    mood?: string;
    tags?: string[];
  }): Promise<any> {
    try {
      // Get AI insights for the entry
      const aiInsights = await this.analyzeJournalEntry(data.content);

      const entry = await JournalEntry.create({
        userId: new Types.ObjectId(userId),
        date: new Date(),
        ...data,
        aiInsights
      });

      this.logOperation('Journal entry created', { userId, entryId: entry._id });

      return entry;
    } catch (error) {
      this.handleError(error, 'createJournalEntry');
    }
  }

  /**
   * Get journal entries
   */
  async getJournalEntries(userId: string, filters: {
    startDate?: Date;
    endDate?: Date;
    tags?: string[];
    isFavorite?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: any[]; total: number }> {
    try {
      const query: any = { userId: new Types.ObjectId(userId) };

      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) query.date.$gte = filters.startDate;
        if (filters.endDate) query.date.$lte = filters.endDate;
      }

      if (filters.tags?.length) query.tags = { $in: filters.tags };
      if (filters.isFavorite !== undefined) query.isFavorite = filters.isFavorite;

      const limit = filters.limit || 20;
      const offset = filters.offset || 0;

      const [entries, total] = await Promise.all([
        JournalEntry.find(query)
          .sort({ date: -1 })
          .skip(offset)
          .limit(limit),
        JournalEntry.countDocuments(query)
      ]);

      return { entries, total };
    } catch (error) {
      this.handleError(error, 'getJournalEntries');
    }
  }

  /**
   * Analyze journal entry with AI
   */
  private async analyzeJournalEntry(content: string): Promise<{
    summary: string;
    patterns: string[];
    suggestions: string[];
    cognitiveDistortions?: string[];
  } | null> {
    try {
      if (!content || content.length < 10) return null;
      return await aiService.analyzeJournalEntryDeep(content);
    } catch (error) {
      this.logger.error('Failed to analyze journal entry:', error);
      return null;
    }
  }

  /**
   * Submit and process an assessment
   */
  async submitAssessment(userId: string, data: {
    assessmentType: 'phq9' | 'gad7' | 'mmpi2' | 'dass21' | 'bdi' | 'anxiety' | 'personality' | 'stress' | 'focus' | 'bigfive' | 'mbti' | 'disc' | 'enneagram' | 'strengths';
    responses: Array<{
      questionId: string;
      questionText: string;
      selectedOption: string;
      points: number;
    }>;
  }): Promise<any> {
    try {
      let totalScore = data.responses.reduce((sum, r) => sum + r.points, 0);
      let subScores: any = {};

      // Specialized Clinical Scoring
      if (data.assessmentType === 'dass21') {
        const depression = data.responses.filter(r => r.questionId.startsWith('dass_d')).reduce((s, r) => s + r.points, 0) * 2;
        const anxiety = data.responses.filter(r => r.questionId.startsWith('dass_a')).reduce((s, r) => s + r.points, 0) * 2;
        const stress = data.responses.filter(r => r.questionId.startsWith('dass_s')).reduce((s, r) => s + r.points, 0) * 2;
        subScores = { depression, anxiety, stress };
        totalScore = depression + anxiety + stress; // Overall negative emotional state
      } else if (data.assessmentType === 'mmpi2') {
        // Simplified Clinical Scales for MMPI-2
        // In real clinical practice, this is 567 T/F questions mapped to 10+ scales
        subScores = {
          hypochondriasis: data.responses.filter(r => r.questionId.includes('_hs')).reduce((s, r) => s + r.points, 0),
          depression: data.responses.filter(r => r.questionId.includes('_d')).reduce((s, r) => s + r.points, 0),
          hysteria: data.responses.filter(r => r.questionId.includes('_hy')).reduce((s, r) => s + r.points, 0),
          psychopathicDeviate: data.responses.filter(r => r.questionId.includes('_pd')).reduce((s, r) => s + r.points, 0),
          paranoia: data.responses.filter(r => r.questionId.includes('_pa')).reduce((s, r) => s + r.points, 0),
          schizophrenia: data.responses.filter(r => r.questionId.includes('_sc')).reduce((s, r) => s + r.points, 0),
          hypomania: data.responses.filter(r => r.questionId.includes('_ma')).reduce((s, r) => s + r.points, 0)
        };
      }

      // Build personalization context from the user profile and recent mental health history
      const userProfile = await UserProfile.findOne({ userId: new Types.ObjectId(userId) }).lean();
      const recentCheckIns = await MentalHealthCheckIn.find({
        userId: new Types.ObjectId(userId)
      }).sort({ date: -1 }).limit(5).lean();

      const profileContextParts: string[] = [];
      if (userProfile?.mentalHealth) {
        profileContextParts.push(`User mental health background: ${JSON.stringify(userProfile.mentalHealth)}`);
      }
      if (userProfile?.lifestyle) {
        profileContextParts.push(`Lifestyle and wellness context: ${JSON.stringify(userProfile.lifestyle)}`);
      }
      if (userProfile?.behavior) {
        profileContextParts.push(`Behavioral preferences: ${JSON.stringify(userProfile.behavior)}`);
      }
      const recentNotes = recentCheckIns.map(checkIn => `On ${checkIn.date.toISOString().split('T')[0]}, mood ${checkIn.mood} (${checkIn.moodScore}/10), stress ${checkIn.stressLevel || 'N/A'}, anxiety ${checkIn.anxietyLevel || 'N/A'}.`).join(' ');
      if (recentNotes) {
        profileContextParts.push(`Recent mental health history: ${recentNotes}`);
      }

      const aiInterpretation = await aiService.generateAssessmentInsights({
        assessmentType: data.assessmentType,
        score: totalScore,
        subScores: subScores,
        responses: data.responses.map(r => ({
          question: r.questionText,
          answer: r.selectedOption,
          score: r.points
        })),
        userContext: profileContextParts.join(' ')
      });

      const assessment = await MentalHealthAssessment.create({
        userId: new Types.ObjectId(userId),
        assessmentType: data.assessmentType,
        responses: data.responses,
        totalScore,
        subScores,
        aiInterpretation,
        date: new Date()
      });

      this.logOperation('Assessment submitted', { userId, assessmentId: assessment._id, type: data.assessmentType });
      
      // Clear cache
      await cacheService.deletePattern(`mental-health:${userId}:*`);

      return assessment;
    } catch (error) {
      this.handleError(error, 'submitAssessment');
    }
  }

  /**
   * Get assessment history
   */
  async getAssessmentHistory(userId: string, type?: string): Promise<any[]> {
    try {
      const query: any = { userId: new Types.ObjectId(userId) };
      if (type) query.assessmentType = type;

      const history = await MentalHealthAssessment.find(query)
        .sort({ date: -1 })
        .limit(20);

      return history;
    } catch (error) {
      this.handleError(error, 'getAssessmentHistory');
    }
  }

  /**
   * Helper: Calculate hormone phase (simple implementation for internal use)
   */
  private calculateHormonePhase(cycle: any): string {
    if (!cycle) return 'unknown';
    const day = differenceInDays(startOfDay(new Date()), startOfDay(cycle.cycleStartDate)) + 1;
    if (day <= 5) return 'menstrual';
    if (day <= 13) return 'follicular';
    if (day <= 16) return 'ovulatory';
    return 'luteal';
  }

  /**
   * Calculate check-in streak
   */
  private calculateStreak(checkIns: IMentalHealthCheckIn[]): number {
    if (checkIns.length === 0) return 0;

    const sorted = [...checkIns].sort((a, b) => b.date.getTime() - a.date.getTime());
    let streak = 1;
    let currentDate = startOfDay(sorted[0].date);

    for (let i = 1; i < sorted.length; i++) {
      const prevDate = startOfDay(sorted[i].date);
      const diffDays = differenceInDays(currentDate, prevDate);

      if (diffDays === 1) {
        streak++;
        currentDate = prevDate;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calculate correlation between two arrays
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;

    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.slice(0, n).reduce((sum, yi, i) => sum + yi * y[i], 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100) / 100;
  }
}

export const mentalHealthService = new MentalHealthService();
