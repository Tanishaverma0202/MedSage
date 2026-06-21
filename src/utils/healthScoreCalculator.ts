/**
 * MedSage Health Score Calculator
 * Comprehensive health scoring system based on user profile data
 */

export interface HealthProfileData {
  // Physical
  height?: number; // in cm
  weight?: number; // in kg
  age?: number;
  goalType?: 'healthy' | 'aggressive' | 'unrealistic';
  conditions?: string[];
  problemAreas?: string[];

  // Nutrition
  dietType?: string;
  mealRegularity?: 'regular' | 'irregular';
  hydration?: number; // glasses per day
  cravings?: string[];
  emotionalEating?: number; // 1-5 scale

  // Fitness
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  frequency?: string; // e.g., "3 days/week"
  timeAvailable?: number; // minutes per day
  workoutTypes?: string[];

  // Mental Health
  stressLevel?: number; // 1-5 scale
  moodStability?: 'very-stable' | 'somewhat-stable' | 'unstable';
  behaviorPatterns?: string[];
  personality?: string;

  // Sleep (assumed defaults if not collected)
  sleepDuration?: number; // hours
  sleepQuality?: 'good' | 'fair' | 'poor';

  // Lifestyle
  activityLevel?: 'Active' | 'Moderate' | 'Sedentary';
  screenTime?: number; // hours per day
  outdoorExposure?: 'high' | 'moderate' | 'low';
  substanceUse?: 'none' | 'occasional' | 'regular';
  energyLevels?: 'high' | 'moderate' | 'low';
}

export interface SubScores {
  physical: number;
  nutrition: number;
  fitness: number;
  mental: number;
  sleep: number;
  lifestyle: number;
}

export interface HealthScoreResult {
  totalScore: number;
  category: string;
  subScores: SubScores;
  insights: HealthInsight[];
  riskFlags: string[];
  fitnessPersona: string;
}

export interface HealthInsight {
  icon: string;
  title: string;
  description: string;
  color: string;
  category: 'physical' | 'nutrition' | 'fitness' | 'mental' | 'sleep' | 'lifestyle';
}

/**
 * Normalize value to 0-100 scale
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 100;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

/**
 * Calculate BMI Score
 * 18.5–24.9 → 100
 * 25–29.9 → 70
 * <18.5 or >30 → 40
 */
function calculateBMIScore(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  if (bmi >= 18.5 && bmi <= 24.9) return 100;
  if (bmi >= 25 && bmi <= 29.9) return 70;
  return 40;
}

/**
 * Calculate Physical Score (P)
 * P = 0.5*BMI + 0.3*GoalAlignment + 0.2*ConditionPenalty
 */
function calculatePhysicalScore(data: HealthProfileData): { score: number; insights: HealthInsight[] } {
  const insights: HealthInsight[] = [];
  let score = 0;

  // BMI Score (50% weight)
  let bmiScore = 70; // default
  if (data.height && data.weight) {
    bmiScore = calculateBMIScore(data.height, data.weight);
  }

  // Goal Alignment (30% weight)
  const goalScores: Record<string, number> = {
    'healthy': 100,
    'aggressive': 70,
    'unrealistic': 40
  };
  const goalScore = goalScores[data.goalType || 'healthy'] || 70;

  if (data.goalType === 'unrealistic') {
    insights.push({
      icon: '🎯',
      title: 'Goal Adjustment Needed',
      description: 'Consider setting more achievable goals for sustainable progress',
      color: 'orange',
      category: 'physical'
    });
  }

  // Condition Penalty (20% weight)
  let conditionScore = 100;
  const conditions = data.conditions || [];
  const chronicConditions = ['diabetes', 'heart disease', 'thyroid', 'pcos', 'hypertension'];
  const hasChronic = conditions.some(c => chronicConditions.some(cc => c.toLowerCase().includes(cc)));
  const hasMild = conditions.length > 0 && !hasChronic;

  if (hasChronic) conditionScore = 40;
  else if (hasMild) conditionScore = 70;

  if (hasChronic) {
    insights.push({
      icon: '🏥',
      title: 'Medical Conditions',
      description: 'Your plan will be tailored to accommodate your health conditions',
      color: 'blue',
      category: 'physical'
    });
  }

  // Calculate weighted score
  score = (0.5 * bmiScore) + (0.3 * goalScore) + (0.2 * conditionScore);

  return { score, insights };
}

/**
 * Calculate Nutrition Score (N)
 * N = 0.3*MealConsistency + 0.25*DietQuality + 0.2*Hydration + 0.15*Cravings + 0.1*EmotionalEating
 */
function calculateNutritionScore(data: HealthProfileData): { score: number; insights: HealthInsight[] } {
  const insights: HealthInsight[] = [];

  // Meal Consistency (30%)
  const mealConsistency = data.mealRegularity === 'regular' ? 100 : 50;

  // Diet Quality (25%)
  const qualityDiets = ['vegetarian', 'pescatarian', 'mediterranean', 'balanced'];
  const dietQuality = qualityDiets.includes(data.dietType || '') ? 100 : 70;

  // Hydration (20%)
  let hydrationScore = 40;
  if (data.hydration !== undefined) {
    if (data.hydration >= 8) hydrationScore = 100;
    else if (data.hydration >= 5) hydrationScore = 80;
    else if (data.hydration >= 3) hydrationScore = 60;
  }

  if (data.hydration !== undefined && data.hydration < 5) {
    insights.push({
      icon: '💧',
      title: 'Hydration Boost',
      description: `You're drinking ${data.hydration}L/day. Aim for 3L+ for optimal health`,
      color: 'blue',
      category: 'nutrition'
    });
  }

  // Cravings (15%) - reverse scoring
  const cravingScore = Math.max(0, 100 - ((data.cravings?.length || 0) * 15));

  // Emotional Eating (10%) - reverse scoring (1-5 scale)
  const emotionalScore = Math.max(0, 100 - ((data.emotionalEating || 1) * 15));

  if (data.emotionalEating && data.emotionalEating >= 4) {
    insights.push({
      icon: '🧠',
      title: 'Emotional Eating Pattern',
      description: 'Mindful eating practices can help build a healthier relationship with food',
      color: 'purple',
      category: 'nutrition'
    });
  }

  const score = (0.3 * mealConsistency) + (0.25 * dietQuality) + (0.2 * hydrationScore) +
                (0.15 * cravingScore) + (0.1 * emotionalScore);

  return { score, insights };
}

/**
 * Calculate Fitness Score (F)
 * F = 0.4*Frequency + 0.3*Duration + 0.2*Intensity + 0.1*Experience
 */
function calculateFitnessScore(data: HealthProfileData): { score: number; insights: HealthInsight[] } {
  const insights: HealthInsight[] = [];

  // Frequency (40%)
  let frequencyScore = 20;
  const freqMatch = data.frequency?.match(/(\d+)/);
  const freq = freqMatch ? parseInt(freqMatch[1]) : 0;
  if (freq >= 5) frequencyScore = 100;
  else if (freq >= 3) frequencyScore = 80;
  else if (freq >= 2) frequencyScore = 70;
  else if (freq >= 1) frequencyScore = 50;

  if (freq < 3) {
    insights.push({
      icon: '💪',
      title: 'Workout Frequency',
      description: `Current: ${freq} days/week. Aim for 3+ days for better results`,
      color: 'orange',
      category: 'fitness'
    });
  }

  // Duration (30%)
  let durationScore = 40;
  if (data.timeAvailable) {
    if (data.timeAvailable >= 60) durationScore = 100;
    else if (data.timeAvailable >= 45) durationScore = 85;
    else if (data.timeAvailable >= 30) durationScore = 70;
    else if (data.timeAvailable >= 15) durationScore = 55;
  }

  // Intensity (20%) - based on fitness level
  const intensityScores: Record<string, number> = {
    'advanced': 100,
    'intermediate': 75,
    'beginner': 50
  };
  const intensityScore = intensityScores[data.fitnessLevel || 'beginner'] || 50;

  // Experience (10%)
  const experienceScore = data.fitnessLevel === 'advanced' ? 100 :
                          data.fitnessLevel === 'intermediate' ? 70 : 40;

  if (data.fitnessLevel === 'beginner') {
    insights.push({
      icon: '🌟',
      title: 'Beginner Friendly',
      description: 'Your plan will start with foundational exercises to build confidence',
      color: 'teal',
      category: 'fitness'
    });
  }

  const score = (0.4 * frequencyScore) + (0.3 * durationScore) + (0.2 * intensityScore) + (0.1 * experienceScore);

  return { score, insights };
}

/**
 * Calculate Mental Health Score (M)
 * M = 0.3*Stress + 0.25*Anxiety + 0.2*Confidence + 0.15*Motivation + 0.1*EmotionalStability
 * Reverse scoring for stress/anxiety
 */
function calculateMentalScore(data: HealthProfileData): { score: number; insights: HealthInsight[] } {
  const insights: HealthInsight[] = [];

  // Stress (30%) - reverse scoring (1-5 scale, higher is worse)
  const stressScore = Math.max(0, 100 - ((data.stressLevel || 1) * 18));

  if (data.stressLevel && data.stressLevel >= 4) {
    insights.push({
      icon: '🧘',
      title: 'High Stress Detected',
      description: 'Stress management techniques will be integrated into your wellness plan',
      color: 'emerald',
      category: 'mental'
    });
  }

  // Anxiety (25%) - from behavior patterns
  const hasAnxiety = data.behaviorPatterns?.includes('Anxiety') || false;
  const anxietyScore = hasAnxiety ? 40 : 90;

  if (hasAnxiety) {
    insights.push({
      icon: '🌿',
      title: 'Anxiety Support',
      description: 'Gentle exercises and mindfulness practices will help manage anxiety',
      color: 'green',
      category: 'mental'
    });
  }

  // Confidence (20%) - inverse of burnout/overthinking
  const confidencePenalties = (data.behaviorPatterns?.filter(p =>
    ['Overthinking', 'Perfectionism', 'Burnout'].includes(p)
  ).length || 0) * 15;
  const confidenceScore = Math.max(20, 100 - confidencePenalties);

  // Motivation (15%)
  const motivationScore = data.behaviorPatterns?.includes('Motivation Issues') ? 50 : 85;

  if (data.behaviorPatterns?.includes('Motivation Issues')) {
    insights.push({
      icon: '⚡',
      title: 'Motivation Boost',
      description: 'Short, achievable workouts with gamification to build momentum',
      color: 'yellow',
      category: 'mental'
    });
  }

  // Emotional Stability (10%)
  const stabilityScores: Record<string, number> = {
    'very-stable': 100,
    'somewhat-stable': 70,
    'unstable': 40
  };
  const stabilityScore = stabilityScores[data.moodStability || 'somewhat-stable'] || 70;

  if (data.moodStability === 'unstable') {
    insights.push({
      icon: '🎯',
      title: 'Emotional Balance',
      description: 'Mood-tracking and adaptive workouts based on how you feel',
      color: 'pink',
      category: 'mental'
    });
  }

  const score = (0.3 * stressScore) + (0.25 * anxietyScore) + (0.2 * confidenceScore) +
                (0.15 * motivationScore) + (0.1 * stabilityScore);

  return { score, insights };
}

/**
 * Calculate Sleep Score (S)
 * S = 0.6*Duration + 0.4*Quality
 */
function calculateSleepScore(data: HealthProfileData): { score: number; insights: HealthInsight[] } {
  const insights: HealthInsight[] = [];

  // Duration (60%)
  let durationScore = 40;
  const sleepDuration = data.sleepDuration || 7;
  if (sleepDuration >= 7 && sleepDuration <= 9) durationScore = 100;
  else if (sleepDuration >= 6) durationScore = 70;
  else if (sleepDuration >= 5) durationScore = 50;

  // Quality (40%)
  const qualityScores: Record<string, number> = {
    'good': 100,
    'fair': 70,
    'poor': 40
  };
  const qualityScore = qualityScores[data.sleepQuality || 'fair'] || 70;

  if (sleepDuration < 6 || data.sleepQuality === 'poor') {
    insights.push({
      icon: '😴',
      title: 'Sleep Improvement',
      description: 'Better sleep = better results. Consider a sleep hygiene routine',
      color: 'indigo',
      category: 'sleep'
    });
  }

  const score = (0.6 * durationScore) + (0.4 * qualityScore);

  return { score, insights };
}

/**
 * Calculate Lifestyle Score (L)
 * L = 0.3*ActivityLevel + 0.25*ScreenTime + 0.2*OutdoorExposure + 0.15*SubstanceUse + 0.1*EnergyLevels
 */
function calculateLifestyleScore(data: HealthProfileData): { score: number; insights: HealthInsight[] } {
  const insights: HealthInsight[] = [];

  // Activity Level (30%)
  const activityScores: Record<string, number> = {
    'Active': 100,
    'Moderate': 70,
    'Sedentary': 40
  };
  const activityScore = activityScores[data.activityLevel || 'Moderate'] || 70;

  if (data.activityLevel === 'Sedentary') {
    insights.push({
      icon: '🚶',
      title: 'Movement Goal',
      description: 'Start with 10-minute walks and gradually increase daily movement',
      color: 'teal',
      category: 'lifestyle'
    });
  }

  // Screen Time (25%) - reverse scoring
  const screenHours = data.screenTime || 6;
  const screenScore = screenHours <= 4 ? 100 : screenHours <= 6 ? 70 : 40;

  // Outdoor Exposure (20%)
  const outdoorScores: Record<string, number> = {
    'high': 100,
    'moderate': 70,
    'low': 40
  };
  const outdoorScore = outdoorScores[data.outdoorExposure || 'moderate'] || 70;

  if (data.outdoorExposure === 'low') {
    insights.push({
      icon: '🌳',
      title: 'Fresh Air Boost',
      description: 'Try outdoor workouts for vitamin D and mood improvement',
      color: 'green',
      category: 'lifestyle'
    });
  }

  // Substance Use (15%)
  const substanceScores: Record<string, number> = {
    'none': 100,
    'occasional': 70,
    'regular': 30
  };
  const substanceScore = substanceScores[data.substanceUse || 'none'] || 100;

  // Energy Levels (10%)
  const energyScores: Record<string, number> = {
    'high': 100,
    'moderate': 70,
    'low': 40
  };
  const energyScore = energyScores[data.energyLevels || 'moderate'] || 70;

  if (data.energyLevels === 'low' || data.behaviorPatterns?.includes('Burnout')) {
    insights.push({
      icon: '🔋',
      title: 'Energy Recovery',
      description: 'Focus on restorative activities before intensive workouts',
      color: 'cyan',
      category: 'lifestyle'
    });
  }

  const score = (0.3 * activityScore) + (0.25 * screenScore) + (0.2 * outdoorScore) +
                (0.15 * substanceScore) + (0.1 * energyScore);

  return { score, insights };
}

/**
 * Derive Fitness Persona from sub-scores
 */
function deriveFitnessPersona(subScores: SubScores): string {
  const { fitness: f, mental: m, physical: p, nutrition: n } = subScores;

  if (f >= 80 && m < 60) return 'Physically capable but needs consistency';
  if (f < 60 && m >= 80) return 'Mentally ready, needs structured workout plan';
  if (p >= 80 && n < 60) return 'Good foundation, nutrition needs attention';
  if (f >= 80 && m >= 80 && n >= 80) return 'Well-rounded athlete';
  if (f < 60 && m < 60) return 'Holistic wellness approach needed';
  if (n >= 80 && f < 60) return 'Eats well, needs to move more';

  return 'Balanced approach with gradual progression';
}

/**
 * Identify risk flags from sub-scores
 */
function identifyRiskFlags(subScores: SubScores): string[] {
  const flags: string[] = [];

  if (subScores.sleep < 50) flags.push('sleep-deficit');
  if (subScores.nutrition < 50) flags.push('nutrition-imbalance');
  if (subScores.mental < 50) flags.push('burnout-risk');
  if (subScores.fitness < 40) flags.push('sedentary-lifestyle');
  if (subScores.physical < 50) flags.push('physical-health-concern');

  return flags;
}

/**
 * Get score category
 */
function getScoreCategory(score: number): string {
  if (score >= 85) return 'Optimal Health';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Moderate Risk';
  return 'High Risk';
}

/**
 * Main Health Score Calculation
 * Health Score = 0.15*P + 0.20*N + 0.20*F + 0.20*M + 0.10*S + 0.15*L
 */
export function calculateHealthScore(data: HealthProfileData): HealthScoreResult {
  // Calculate all sub-scores
  const physical = calculatePhysicalScore(data);
  const nutrition = calculateNutritionScore(data);
  const fitness = calculateFitnessScore(data);
  const mental = calculateMentalScore(data);
  const sleep = calculateSleepScore(data);
  const lifestyle = calculateLifestyleScore(data);

  const subScores: SubScores = {
    physical: Math.round(physical.score),
    nutrition: Math.round(nutrition.score),
    fitness: Math.round(fitness.score),
    mental: Math.round(mental.score),
    sleep: Math.round(sleep.score),
    lifestyle: Math.round(lifestyle.score)
  };

  // Calculate final weighted score
  const totalScore = Math.round(
    (0.15 * subScores.physical) +
    (0.20 * subScores.nutrition) +
    (0.20 * subScores.fitness) +
    (0.20 * subScores.mental) +
    (0.10 * subScores.sleep) +
    (0.15 * subScores.lifestyle)
  );

  // Collect all insights
  const allInsights = [
    ...physical.insights,
    ...nutrition.insights,
    ...fitness.insights,
    ...mental.insights,
    ...sleep.insights,
    ...lifestyle.insights
  ];

  // Ensure at least one positive insight if score is good
  if (totalScore >= 75 && allInsights.length === 0) {
    allInsights.push({
      icon: '🌟',
      title: 'Great Health Foundation',
      description: 'Your profile shows strong healthy habits across all dimensions!',
      color: 'emerald',
      category: 'physical'
    });
  }

  return {
    totalScore: Math.max(30, Math.min(98, totalScore)),
    category: getScoreCategory(totalScore),
    subScores,
    insights: allInsights.slice(0, 6), // Limit to top 6 insights
    riskFlags: identifyRiskFlags(subScores),
    fitnessPersona: deriveFitnessPersona(subScores)
  };
}

export default calculateHealthScore;
