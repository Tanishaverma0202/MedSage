// ============================================================================
// MEDSAGE HEALTH SCORE ENGINE v1.0
// Calculates a comprehensive health score (0-100) from user profile data.
// ============================================================================

export interface ProfileData {
  sleepPatterns: {
    averageHours: number;
    quality: string;
    bedtime: string;
    wakeTime: string;
  };
  mentalHealth: {
    stressLevel: string;
    anxietyLevel: string;
    moodStability: string;
    confidenceLevel: string;
    emotionalPatterns: {
      overthinking: boolean;
      motivationConsistency: string;
    };
  };
  nutrition: {
    dietType: string;
    dietQuality: number;
    mealPatterns: {
      breakfast: { eats: string; typicalFoods: string[] };
      lunch: { typicalFoods: string[] };
      dinner: { size: string; time: string };
      snacks: { frequency: string; type: string };
    };
    hydration: string;
    eatingBehavior: { emotionalEating: string; cravings: string[] };
  };
  fitness: {
    fitnessLevel: string;
    weeklyFrequency: string;
    preferredWorkoutType: string[];
    workoutDuration: string;
  };
  hormonal: {
    menstrualCycle: string;
    typicalFlowIntensity: string;
    hormoneIssues: string[];
  };
  lifestyle: {
    dailyEnergyLevels: string;
    stressPrevalence: string;
    chronicPain: boolean;
  };
  gender: string;
}

export interface SubScore {
  label: string;
  score: number;
  icon: string;    // icon key for UI
  color: string;   // tailwind color class
  insight: string; // one-line insight
}

export interface HealthScoreResult {
  overall: number;
  status: string;
  sleep: SubScore;
  mental: SubScore;
  hydration: SubScore;
  hormone: SubScore;
  activity: SubScore;
  nutrition: SubScore;
  insights: { title: string; message: string; category: string }[];
}

// --- Helper: clamp ---
const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(v)));

// --- Helper: bedtime hour extraction ---
const getBedtimeHour = (bedtime: string): number => {
  if (!bedtime) return 23;
  const parts = bedtime.split(':');
  return parseInt(parts[0]) || 23;
};

// ============================================================================
// 1. SLEEP SCORE
// ============================================================================
function calcSleepScore(p: ProfileData): SubScore {
  const hrs = p.sleepPatterns?.averageHours || 7;
  const bedtime = p.sleepPatterns?.bedtime || '23:00';
  const quality = p.sleepPatterns?.quality || 'Good';

  // A. Duration Score (60%)
  let durationScore: number;
  if (hrs === 8) durationScore = 100;
  else if (hrs === 7) durationScore = 85;
  else if (hrs === 6) durationScore = 70;
  else if (hrs < 6) durationScore = 40;
  else if (hrs > 9) durationScore = 70;
  else durationScore = 90; // 8-9 range

  // B. Timing Score (20%)
  const bh = getBedtimeHour(bedtime);
  let timingScore: number;
  if (bh <= 22) timingScore = 100;      // Before 10 PM
  else if (bh <= 24 || bh === 0) timingScore = 80; // 10-12
  else timingScore = 50;                // After 12

  // C. Consistency Score (20%) — use quality as proxy
  let consistencyScore: number;
  if (quality === 'Excellent' || quality === 'Good') consistencyScore = 100;
  else if (quality === 'Fair' || quality === 'Average') consistencyScore = 80;
  else consistencyScore = 60;

  const score = clamp(0.6 * durationScore + 0.2 * timingScore + 0.2 * consistencyScore);

  let insight = '';
  if (score >= 85) insight = 'Your sleep pattern is excellent. Keep it up!';
  else if (score >= 70) insight = 'Good sleep habits. Try going to bed before 10 PM.';
  else if (score >= 50) insight = 'Your sleep needs improvement. Aim for 7-8 hours.';
  else insight = 'Sleep is a critical concern. Prioritize a consistent bedtime.';

  return { label: 'Sleep', score, icon: 'moon', color: 'indigo', insight };
}

// ============================================================================
// 2. HYDRATION SCORE
// ============================================================================
function calcHydrationScore(p: ProfileData): SubScore {
  const hydration = p.nutrition?.hydration || '1-2L';
  const isHighActivity = ['4-5 days', '6+ days'].includes(p.fitness?.weeklyFrequency || '');

  let baseScore: number;
  switch (hydration) {
    case '2-3L': baseScore = 100; break;
    case '3L+': baseScore = 90; break;
    case '1-2L': baseScore = 75; break;
    case '<1L': baseScore = 40; break;
    default: baseScore = 75;
  }

  // Bonus adjustments
  if (isHighActivity) baseScore += 5;

  const score = clamp(baseScore);

  let insight = '';
  if (score >= 90) insight = 'Hydration is on point. Great discipline!';
  else if (score >= 70) insight = 'Aim for 2-3 liters daily for optimal hydration.';
  else insight = 'You are under-hydrating. This affects energy and focus.';

  return { label: 'Hydration', score, icon: 'droplet', color: 'blue', insight };
}

// ============================================================================
// 3. NUTRITION SCORE
// ============================================================================
function calcNutritionScore(p: ProfileData): SubScore {
  const nutrition = p.nutrition;
  const dietQuality = nutrition?.dietQuality || 5;

  // A. Meal Frequency Score (30%) — use breakfast habit as proxy
  let mealScore: number;
  const breakfastEats = nutrition?.mealPatterns?.breakfast?.eats || 'Sometimes';
  if (breakfastEats === 'Always') mealScore = 90;
  else if (breakfastEats === 'Sometimes') mealScore = 70;
  else mealScore = 50;

  // B. Protein Score (35%) — estimate from lunch foods
  const lunchFoods = nutrition?.mealPatterns?.lunch?.typicalFoods || [];
  const proteinFoods = ['Rice + Dal', 'Mixed'];
  const proteinCount = lunchFoods.filter(f => proteinFoods.includes(f)).length;
  let proteinScore: number;
  if (proteinCount >= 2) proteinScore = 100;
  else if (proteinCount === 1) proteinScore = 70;
  else proteinScore = 40;

  // C. Fiber Score (25%) — estimate from lunch foods
  const fiberFoods = ['Roti + Sabzi', 'Salad', 'Mixed'];
  const fiberCount = lunchFoods.filter(f => fiberFoods.includes(f)).length;
  let fiberScore: number;
  if (fiberCount >= 2) fiberScore = 100;
  else if (fiberCount === 1) fiberScore = 70;
  else fiberScore = 40;

  // D. Junk/Processed Food Penalty (10%)
  const hasJunk = lunchFoods.includes('Fast food');
  const cravings = nutrition?.eatingBehavior?.cravings || [];
  const hasEmotionalEating = cravings.includes('Emotional Eating') || cravings.includes('Late-night Snacks');
  let junkScore: number;
  if (hasJunk && hasEmotionalEating) junkScore = 40;
  else if (hasJunk || hasEmotionalEating) junkScore = 70;
  else junkScore = 100;

  // Also factor in dietQuality (1-10 scale) as an overall modifier
  const qualityModifier = (dietQuality / 10) * 20; // 0-20 point adjustment

  const rawScore = 0.3 * mealScore + 0.35 * proteinScore + 0.25 * fiberScore + 0.1 * junkScore;
  const score = clamp(rawScore * 0.8 + qualityModifier);

  let insight = '';
  if (score >= 85) insight = 'Excellent nutrition habits. Keep eating clean!';
  else if (score >= 65) insight = 'Good diet foundation. Add more protein and fiber.';
  else if (score >= 45) insight = 'Nutrition needs attention. Reduce processed foods.';
  else insight = 'Your diet is a key area for improvement.';

  return { label: 'Nutrition', score, icon: 'utensils', color: 'emerald', insight };
}

// ============================================================================
// 4. ACTIVITY SCORE
// ============================================================================
function calcActivityScore(p: ProfileData): SubScore {
  const fitness = p.fitness;

  // A. Frequency Score (40%)
  let freqScore: number;
  switch (fitness?.weeklyFrequency) {
    case '6+ days': freqScore = 100; break;
    case '4-5 days': freqScore = 90; break;
    case '2-3 days': freqScore = 70; break;
    case '0-1 days': freqScore = 40; break;
    default: freqScore = 60;
  }

  // B. Duration Score (30%)
  let durScore: number;
  switch (fitness?.workoutDuration) {
    case '40-60 min': durScore = 100; break;
    case '60+ min': durScore = 100; break;
    case '20-40 min': durScore = 80; break;
    case '<20 min': durScore = 60; break;
    default: durScore = 70;
  }

  // C. Activity Type Score (30%)
  const types = fitness?.preferredWorkoutType || [];
  const hasStrength = types.some(t => t.toLowerCase().includes('strength'));
  const hasCardio = types.some(t => t.toLowerCase().includes('cardio'));
  let typeScore: number;
  if (hasStrength && hasCardio) typeScore = 100;
  else if (hasStrength || hasCardio) typeScore = 80;
  else if (types.length > 0) typeScore = 70;
  else typeScore = 40;

  const score = clamp(0.4 * freqScore + 0.3 * durScore + 0.3 * typeScore);

  let insight = '';
  if (score >= 85) insight = 'Exceptional fitness routine. You are crushing it!';
  else if (score >= 65) insight = 'Good activity level. Add variety for balanced fitness.';
  else if (score >= 45) insight = 'Activity is below optimal. Try to workout 3+ days/week.';
  else insight = 'Sedentary lifestyle detected. Start with 20 min walks daily.';

  return { label: 'Activity', score, icon: 'activity', color: 'orange', insight };
}

// ============================================================================
// 5. MENTAL HEALTH SCORE
// ============================================================================
function calcMentalScore(p: ProfileData): SubScore {
  const mh = p.mentalHealth;

  const mapLevel = (level: string): number => {
    switch (level) {
      case 'Rarely': return 100;
      case 'Sometimes': return 70;
      case 'Often': return 40;
      default: return 70;
    }
  };

  // A. Stress Score (25%)
  const stressScore = mapLevel(mh?.stressLevel || 'Sometimes');

  // B. Anxiety Score (20%)
  const anxietyScore = mapLevel(mh?.anxietyLevel || 'Sometimes');

  // C. Mood Stability (20%)
  let moodScore: number;
  switch (mh?.moodStability) {
    case 'Stable': moodScore = 100; break;
    case 'Fluctuating': moodScore = 70; break;
    case 'Unstable': moodScore = 40; break;
    default: moodScore = 70;
  }

  // D. Confidence (15%)
  let confScore: number;
  switch (mh?.confidenceLevel) {
    case 'High': confScore = 100; break;
    case 'Medium': confScore = 75; break;
    case 'Low': confScore = 50; break;
    default: confScore = 75;
  }

  // E. Overthinking (10%)
  const overThinkScore = mh?.emotionalPatterns?.overthinking ? 60 : 100;

  // F. Motivation (10%)
  let motivScore: number;
  switch (mh?.emotionalPatterns?.motivationConsistency) {
    case 'High': motivScore = 100; break;
    case 'Medium': motivScore = 70; break;
    case 'Low': motivScore = 40; break;
    default: motivScore = 70;
  }

  const score = clamp(
    0.25 * stressScore + 0.20 * anxietyScore + 0.20 * moodScore +
    0.15 * confScore + 0.10 * overThinkScore + 0.10 * motivScore
  );

  let insight = '';
  if (score >= 85) insight = 'Strong mental resilience. Keep nurturing your wellbeing!';
  else if (score >= 65) insight = 'Moderate mental health. Consider journaling or meditation.';
  else if (score >= 45) insight = 'Elevated stress or anxiety. Please reach out for support.';
  else insight = 'Mental health needs priority attention. Talk to someone.';

  return { label: 'Mental', score, icon: 'brain', color: 'purple', insight };
}

// ============================================================================
// 6. HORMONE SCORE
// ============================================================================
function calcHormoneScore(p: ProfileData): SubScore {
  // For non-female users, return a neutral/high default
  if (p.gender !== 'female') {
    return { label: 'Hormones', score: 85, icon: 'heart', color: 'pink', insight: 'Hormonal tracking is optimized for female health cycles.' };
  }

  const hormonal = p.hormonal;

  // A. Regularity (40%)
  let regScore: number;
  const cycle = hormonal?.menstrualCycle || '';
  if (cycle === 'Regular' || cycle === '') regScore = 85; // default to slightly good
  else if (cycle === 'Slightly irregular') regScore = 70;
  else if (cycle === 'Irregular') regScore = 40;
  else regScore = 70;

  // B. Symptoms Severity (40%) — use flow intensity as proxy
  let symptomScore: number;
  switch (hormonal?.typicalFlowIntensity) {
    case 'light': symptomScore = 100; break;
    case 'moderate': symptomScore = 75; break;
    case 'heavy': symptomScore = 45; break;
    default: symptomScore = 75;
  }

  // Deduct for hormone issues
  const issueCount = hormonal?.hormoneIssues?.length || 0;
  if (issueCount >= 3) symptomScore = Math.max(30, symptomScore - 30);
  else if (issueCount >= 1) symptomScore = Math.max(40, symptomScore - 15);

  // C. Energy Stability (20%)
  let energyScore: number;
  switch (p.lifestyle?.dailyEnergyLevels) {
    case 'High': energyScore = 100; break;
    case 'Moderate': energyScore = 70; break;
    case 'Low': energyScore = 40; break;
    default: energyScore = 70;
  }

  const score = clamp(0.4 * regScore + 0.4 * symptomScore + 0.2 * energyScore);

  let insight = '';
  if (score >= 85) insight = 'Hormonal health is balanced. Great cycle management!';
  else if (score >= 65) insight = 'Moderate hormonal balance. Track symptoms for patterns.';
  else if (score >= 45) insight = 'Hormonal fluctuations detected. Consider consulting a specialist.';
  else insight = 'Hormonal health needs attention. Please see a healthcare provider.';

  return { label: 'Hormones', score, icon: 'heart', color: 'pink', insight };
}

// ============================================================================
// 7. FINAL HEALTH SCORE AGGREGATION
// ============================================================================
export function calculateHealthScore(profile: ProfileData): HealthScoreResult {
  const sleep = calcSleepScore(profile);
  const mental = calcMentalScore(profile);
  const hydration = calcHydrationScore(profile);
  const hormone = calcHormoneScore(profile);
  const activity = calcActivityScore(profile);
  const nutrition = calcNutritionScore(profile);

  const overall = clamp(
    0.20 * sleep.score +
    0.15 * mental.score +
    0.10 * hydration.score +
    0.15 * hormone.score +
    0.20 * activity.score +
    0.20 * nutrition.score
  );

  let status: string;
  if (overall >= 90) status = 'excellent';
  else if (overall >= 75) status = 'good';
  else if (overall >= 60) status = 'needs_improvement';
  else status = 'at_risk';

  // Generate top insights (lowest 3 sub-scores)
  const allScores = [sleep, mental, hydration, hormone, activity, nutrition];
  const sorted = [...allScores].sort((a, b) => a.score - b.score);
  const insights = sorted.slice(0, 3).map(s => ({
    title: s.label,
    message: s.insight,
    category: s.label.toLowerCase()
  }));

  return { overall, status, sleep, mental, hydration, hormone, activity, nutrition, insights };
}

// ============================================================================
// 8. SCORE INTERPRETATION HELPER
// ============================================================================
export function getScoreInterpretation(score: number): { label: string; emoji: string } {
  if (score >= 90) return { label: 'Excellent', emoji: '🌟' };
  if (score >= 75) return { label: 'Good', emoji: '💪' };
  if (score >= 60) return { label: 'Needs Improvement', emoji: '⚠️' };
  return { label: 'At Risk', emoji: '🚨' };
}
