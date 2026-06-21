import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, User, Target, Apple, Brain, Settings, Sparkles, Activity } from 'lucide-react';
import { apiCall, API_ENDPOINTS } from '../../api';
import { cn } from '@/lib/utils';

// UI Helpers
const SelectablePill = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
  <button type="button" onClick={onClick} className={`px-4 py-2 text-[13px] rounded-xl transition-all font-bold ${selected ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} whitespace-nowrap`}>
    {label}
  </button>
);

const MultiSelectPill = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
  <button type="button" onClick={onClick} className={`px-4 py-2 text-[13px] rounded-xl transition-all font-bold border-2 ${selected ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'} whitespace-nowrap`}>
    {label}
  </button>
);

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 7;
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const userJson = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!token || !userJson) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userJson);
    if (!user.isEmailVerified) {
      // If not verified, kick back to OTP page
      navigate(`/verify-otp?email=${encodeURIComponent(user.email)}`);
    }
  }, [navigate]);

  // Deeply nested state mirroring MongoDB Schema
  const [data, setData] = useState({
    fullName: '', age: 25, gender: 'female', height: 165, weight: 65, bodyType: '',
    occupation: '', dailyRoutineType: '', medicalConditions: [] as string[], allergies: [] as string[], medications: [] as string[],
    chronicPain: false,
    goals: { primaryGoal: '', targetTimeline: '', problemAreas: [] as string[] },
    nutrition: {
      dietType: '',
      dietQuality: 5,
      mealPatterns: {
        breakfast: { eats: 'Sometimes', typicalFoods: [] as string[] },
        lunch: { typicalFoods: [] as string[] },
        dinner: { size: 'Moderate', time: '20:00' },
        snacks: { frequency: 'Moderate', type: 'Mixed' }
      },
      hydration: '1-2L',
      preferredIndianDishes: [] as string[],
      eatingBehavior: { emotionalEating: 'Sometimes', cravings: [] as string[] }
    },
    fitness: {
      fitnessLevel: 'Beginner', weeklyFrequency: '2-3 days', preferredWorkoutType: [] as string[],
      workoutLocation: 'Home', workoutDuration: '20-40 min', equipmentAccess: [] as string[],
      limitations: { injuries: [] as string[], mobilityIssues: [] as string[] }
    },
    sleepPatterns: { averageHours: 7, quality: 'Good', bedtime: '22:00', wakeTime: '06:00' },
    mentalHealth: {
      stressLevel: 'Sometimes', anxietyLevel: 'Sometimes', moodStability: 'Stable', confidenceLevel: 'Medium',
      emotionalPatterns: { overthinking: false, motivationConsistency: 'Medium' },
      socialBehavior: { type: 'Ambivert', talksAboutFeelings: 'Sometimes' }
    },
    lifestyle: {
      screenTime: '2-4 hrs', outdoorExposure: 'Few times a week',
      dailyStepsGoal: 5000,
      stressPrevalence: 'medium',
      sleepConsistency: 7,
      substanceUse: { smoking: false, alcohol: false }, dailyEnergyLevels: 'Moderate'
    },
    behavior: {
      goalCommitment: 'Medium', consistencyLevel: 'Sometimes', preferredCoachingStyle: 'Flexible guidance', triggersForDropOff: [] as string[]
    },
    preferences: { workoutTime: 'Morning', dietStyle: 'Simple' },
    constraints: { timeAvailable: '30 min', budgetConstraints: 'Medium' },
    hormonal: { 
      cycleTrackingEnabled: false, 
      lastPeriodDate: '', 
      averagePeriodLength: 5, 
      averageCycleLength: 28, 
      typicalFlowIntensity: 'moderate',
      hormoneIssues: [] as string[], 
      digestiveIssues: [] as string[], 
      skinHairConcerns: [] as string[] 
    }
  });

  const updateNested = (category: keyof typeof data, field: string, value: any) => {
    setData(prev => ({ ...prev, [category]: { ...(prev[category] as any), [field]: value } }));
  };

  const updateDeeplyNested = (category: keyof typeof data, subCategory: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as any),
        [subCategory]: {
          ...(prev[category] as any)[subCategory],
          [field]: value
        }
      }
    }));
  };

  const toggleArr = (arr: string[], item: string) => arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const response = await apiCall(API_ENDPOINTS.USER.PROFILE, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (response.success) {
        navigate('/app');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save profile. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI rendering blocks
  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">1. General Profile</h2>
        <p className="text-slate-500 text-sm font-medium">Basic identity and health context</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
          <input type="text" value={data.fullName} onChange={e => setData({ ...data, fullName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none font-medium" placeholder="Your name" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Age: {data.age}</label>
            <input type="range" min="18" max="80" value={data.age} onChange={e => setData({ ...data, age: parseInt(e.target.value) })} className="w-full accent-teal-600" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Gender</label>
            <div className="flex gap-2">
              {['female', 'male', 'other'].map(g => (
                <SelectablePill key={g} label={g.charAt(0).toUpperCase() + g.slice(1)} selected={data.gender === g} onClick={() => setData({ ...data, gender: g })} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Height (cm)</label>
            <input type="number" value={data.height} onChange={e => setData({ ...data, height: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none font-medium" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Weight (kg)</label>
            <input type="number" value={data.weight} onChange={e => setData({ ...data, weight: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none font-medium" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Body Type</label>
          <div className="flex flex-wrap gap-2">
            {['Ectomorph', 'Mesomorph', 'Endomorph', 'Unsure'].map(t => (
              <SelectablePill key={t} label={t} selected={data.bodyType === t} onClick={() => setData({ ...data, bodyType: t })} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <input
            type="checkbox"
            id="chronicPain"
            checked={data.chronicPain}
            onChange={(e) => setData({...data, chronicPain: e.target.checked})}
            className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
          />
          <label htmlFor="chronicPain" className="text-sm font-bold text-slate-700">
            I experience chronic physical pain
          </label>
        </div>

        <hr className="border-slate-100" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Occupation</label>
            <div className="flex flex-col gap-2">
              {['Student', 'Desk Job', 'Active Job', 'Manual Labor'].map(t => (
                <SelectablePill key={t} label={t} selected={data.occupation === t} onClick={() => setData({ ...data, occupation: t })} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Daily Routine</label>
            <div className="flex flex-col gap-2">
              {['Sedentary', 'Moderately active', 'Highly active'].map(t => (
                <SelectablePill key={t} label={t} selected={data.dailyRoutineType === t} onClick={() => setData({ ...data, dailyRoutineType: t })} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepHealthContext = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">2. Health Profile</h2>
        <p className="text-slate-500 text-sm font-medium">Medical background & constraints</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Medical Conditions (Select Multiple)</label>
          <div className="flex flex-wrap gap-2">
            {['Diabetes', 'Hypertension', 'Thyroid', 'PCOS/PCOD', 'None'].map(g => (
              <MultiSelectPill key={g} label={g} selected={data.medicalConditions.includes(g)} onClick={() => setData({ ...data, medicalConditions: toggleArr(data.medicalConditions, g) })} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Existing Allergies</label>
          <div className="flex flex-wrap gap-2">
            {['Peanuts', 'Dairy', 'Gluten', 'Dust', 'None'].map(g => (
              <MultiSelectPill key={g} label={g} selected={data.allergies.includes(g)} onClick={() => setData({ ...data, allergies: toggleArr(data.allergies, g) })} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Current Medications</label>
          <div className="flex flex-wrap gap-2">
            {['Vitamins', 'Blood Pressure', 'Insulin', 'Acne Meds', 'None'].map(g => (
              <MultiSelectPill key={g} label={g} selected={data.medications.includes(g)} onClick={() => setData({ ...data, medications: toggleArr(data.medications, g) })} />
            ))}
          </div>
        </div>

        <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100/50 space-y-4">
           <label className="block text-xs font-bold text-teal-800 uppercase tracking-wider">Mobility/Injury Constraints</label>
           <div className="flex flex-wrap gap-2">
             {['Knee Pain', 'Lower Back', 'Neck/Shoulder', 'None'].map(g => (
               <MultiSelectPill key={g} label={g} selected={data.fitness.limitations.injuries.includes(g)} onClick={() => updateDeeplyNested('fitness', 'limitations', 'injuries', toggleArr(data.fitness.limitations.injuries, g))} />
             ))}
           </div>
        </div>
      </div>
    </div>
  );

  const renderStepPreferences = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">6. Personal Preferences</h2>
        <p className="text-slate-500 text-sm font-medium">How should MedSAGE coach you?</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Coaching Style</label>
          <div className="grid grid-cols-1 gap-2">
            {[
              { l: 'Strict Discipline', d: 'Direct, focused on targets' },
              { l: 'Flexible Guidance', d: 'Balanced and instructional' },
              { l: 'Motivational Support', d: 'Encouraging and soft tone' }
            ].map(item => (
              <button 
                key={item.l}
                onClick={() => updateNested('behavior', 'preferredCoachingStyle', item.l)}
                className={cn("p-4 rounded-2xl border-2 text-left transition-all", 
                  data.behavior.preferredCoachingStyle === item.l ? "border-teal-500 bg-teal-50" : "border-slate-100 bg-white hover:border-slate-300"
                )}
              >
                <div className="text-sm font-bold text-slate-800">{item.l}</div>
                <div className="text-[11px] text-slate-500 font-medium">{item.d}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Time per Day</label>
             <div className="flex flex-col gap-2">
               {['<15 min', '30 min', '1 hr', '1.5 hr+'].map(t => (
                 <SelectablePill key={t} label={t} selected={data.constraints.timeAvailable === t} onClick={() => updateNested('constraints', 'timeAvailable', t)} />
               ))}
             </div>
           </div>
           <div>
             <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Budget Level</label>
             <div className="flex flex-col gap-2">
               {['Low', 'Medium', 'Premium'].map(t => (
                 <SelectablePill key={t} label={t} selected={data.constraints.budgetConstraints === t} onClick={() => updateNested('constraints', 'budgetConstraints', t)} />
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">2. Goals & Fitness</h2>
        <p className="text-slate-500 text-sm font-medium">What are we aiming for?</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Primary Goal</label>
          <div className="grid grid-cols-2 gap-2">
            {['Weight Loss', 'Muscle Gain', 'Maintenance', 'Fat Loss + Toning', 'Improve Stamina', 'Improve Flexibility'].map(g => (
              <SelectablePill key={g} label={g} selected={data.goals.primaryGoal === g} onClick={() => updateNested('goals', 'primaryGoal', g)} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Timeline</label>
          <div className="flex flex-wrap gap-2">
            {['1 month', '3 months', '6 months', 'Long-term'].map(g => (
              <SelectablePill key={g} label={g} selected={data.goals.targetTimeline === g} onClick={() => updateNested('goals', 'targetTimeline', g)} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Problem Areas (Select Multiple)</label>
          <div className="flex flex-wrap gap-2">
            {['Belly fat', 'Arms', 'Thighs', 'Back', 'Overall'].map(g => (
              <MultiSelectPill key={g} label={g} selected={data.goals.problemAreas.includes(g)} onClick={() => updateNested('goals', 'problemAreas', toggleArr(data.goals.problemAreas, g))} />
            ))}
          </div>
        </div>

        <hr className="border-slate-200" />

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Fitness Level & Frequency</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              {['Beginner', 'Intermediate', 'Advanced'].map(t => (
                <SelectablePill key={t} label={t} selected={data.fitness.fitnessLevel === t} onClick={() => updateNested('fitness', 'fitnessLevel', t)} />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {['0-1 days', '2-3 days', '4-5 days', '6+ days'].map(t => (
                <SelectablePill key={t} label={t} selected={data.fitness.weeklyFrequency === t} onClick={() => updateNested('fitness', 'weeklyFrequency', t)} />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Workout Type (Select Multiple)</label>
          <div className="flex flex-wrap gap-2">
            {['Strength training', 'Cardio', 'Yoga', 'Pilates', 'Sports', 'Home workouts'].map(g => (
              <MultiSelectPill key={g} label={g} selected={data.fitness.preferredWorkoutType.includes(g)} onClick={() => updateNested('fitness', 'preferredWorkoutType', toggleArr(data.fitness.preferredWorkoutType, g))} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">3. Nutrition & Diet</h2>
        <p className="text-slate-500 text-sm font-medium">Fueling your body</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Diet Type</label>
          <div className="flex flex-wrap gap-2">
            {['Vegetarian', 'Vegan', 'Eggetarian', 'Non-vegetarian', 'Jain diet'].map(d => (
              <SelectablePill key={d} label={d} selected={data.nutrition.dietType === d} onClick={() => updateNested('nutrition', 'dietType', d)} />
            ))}
          </div>
        </div>

        <div className="space-y-3 p-4 bg-teal-50/50 rounded-2xl border border-teal-100/50">
          <label className="block text-xs font-bold text-teal-900 uppercase tracking-wider">
            Overall Diet Quality: {data.nutrition.dietQuality}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={data.nutrition.dietQuality}
            onChange={(e) => updateNested('nutrition', 'dietQuality', parseInt(e.target.value))}
            className="w-full accent-teal-600"
          />
          <div className="flex justify-between text-[10px] font-bold text-teal-600 uppercase">
            <span>Processed</span>
            <span>Balanced</span>
            <span>Nutritious</span>
          </div>
        </div>

        <div className="p-4 bg-white/60 rounded-2xl border border-slate-200 space-y-4">
          <label className="block text-sm font-extrabold text-slate-800 uppercase tracking-wider">Meal Patterns</label>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Breakfast</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['Always', 'Sometimes', 'Never'].map(d => (
                <SelectablePill key={d} label={d} selected={data.nutrition.mealPatterns.breakfast.eats === d} onClick={() => updateDeeplyNested('nutrition', 'mealPatterns', 'breakfast', { ...data.nutrition.mealPatterns.breakfast, eats: d })} />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Lunch Style (Select Multiple)</label>
            <div className="flex flex-wrap gap-2">
              {['Roti + Sabzi', 'Rice + Dal', 'Fast food', 'Mixed'].map(g => (
                <MultiSelectPill key={g} label={g} selected={data.nutrition.mealPatterns.lunch.typicalFoods.includes(g)} onClick={() => updateDeeplyNested('nutrition', 'mealPatterns', 'lunch', { ...data.nutrition.mealPatterns.lunch, typicalFoods: toggleArr(data.nutrition.mealPatterns.lunch.typicalFoods, g) })} />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Dinner Size</label>
            <div className="flex gap-2">
              {['Light', 'Moderate', 'Heavy'].map(d => (
                <SelectablePill key={d} label={d} selected={data.nutrition.mealPatterns.dinner.size === d} onClick={() => updateDeeplyNested('nutrition', 'mealPatterns', 'dinner', { ...data.nutrition.mealPatterns.dinner, size: d })} />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Preferred Regional/Indian Dishes (Select Multiple)</label>
          <div className="flex flex-wrap gap-2">
            {['Poha', 'Aloo Paratha', 'Idli Sambar', 'Upma', 'Dal Tadka', 'Palak Paneer', 'Rajma Chawal', 'Paneer Bhurji', 'Dosa', 'Khichdi'].map(g => (
              <MultiSelectPill key={g} label={g} selected={data.nutrition.preferredIndianDishes.includes(g)} onClick={() => updateNested('nutrition', 'preferredIndianDishes', toggleArr(data.nutrition.preferredIndianDishes, g))} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Water Intake</label>
            <div className="flex flex-col gap-2">
              {['<1L', '1-2L', '2-3L', '3L+'].map(t => (
                <SelectablePill key={t} label={t} selected={data.nutrition.hydration === t} onClick={() => updateNested('nutrition', 'hydration', t)} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Snacks Frequency</label>
            <div className="flex flex-col gap-2">
              {['Rare', 'Moderate', 'Frequent'].map(t => (
                <SelectablePill key={t} label={t} selected={data.nutrition.mealPatterns.snacks.frequency === t} onClick={() => updateDeeplyNested('nutrition', 'mealPatterns', 'snacks', { ...data.nutrition.mealPatterns.snacks, frequency: t })} />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Cravings (Select Multiple)</label>
          <div className="flex flex-wrap gap-2">
            {['Sugar', 'Salty', 'Fried', 'None'].map(g => (
              <MultiSelectPill key={g} label={g} selected={data.nutrition.eatingBehavior.cravings.includes(g)} onClick={() => updateNested('nutrition', 'eatingBehavior', { ...data.nutrition.eatingBehavior, cravings: toggleArr(data.nutrition.eatingBehavior.cravings, g) })} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">4. Mental & Lifestyle</h2>
        <p className="text-slate-500 text-sm font-medium">Inside out wellness check</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Stress Frequency</label>
          <div className="grid grid-cols-3 gap-2">
            {['low', 'medium', 'high'].map(t => (
              <SelectablePill key={t} label={t.toUpperCase()} selected={data.lifestyle.stressPrevalence === t} onClick={() => updateNested('lifestyle', 'stressPrevalence', t)} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Consistency: {data.lifestyle.sleepConsistency}/10</label>
          <p className="text-[10px] text-slate-500 -mt-2">How regular is your sleep schedule?</p>
          <input
            type="range"
            min="1"
            max="10"
            value={data.lifestyle.sleepConsistency}
            onChange={(e) => updateNested('lifestyle', 'sleepConsistency', parseInt(e.target.value))}
            className="w-full accent-teal-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mood Stability</label>
          <div className="flex flex-wrap gap-2">
            {['Stable', 'Fluctuating', 'Unstable'].map(d => (
              <SelectablePill key={d} label={d} selected={data.mentalHealth.moodStability === d} onClick={() => updateNested('mentalHealth', 'moodStability', d)} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Average Sleep Duration</label>
          <div className="flex flex-wrap gap-2">
            {['<5 hrs', '5-6 hrs', '6-7 hrs', '7-8 hrs', '8+ hrs'].map(d => (
              <SelectablePill key={d} label={d} selected={data.sleepPatterns.averageHours === parseInt(d) || (d === '<5 hrs' && data.sleepPatterns.averageHours === 4) || (data.sleepPatterns.averageHours.toString() === d)} onClick={() => updateNested('sleepPatterns', 'averageHours', parseInt(d) || 7)} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Screen Time</label>
            <div className="flex flex-col gap-2">
              {['<2 hrs', '2-4 hrs', '4-6 hrs', '6+ hrs'].map(t => (
                <SelectablePill key={t} label={t} selected={data.lifestyle.screenTime === t} onClick={() => updateNested('lifestyle', 'screenTime', t)} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Outdoor Exposure</label>
            <div className="flex flex-col gap-2">
              {['Daily', 'Few times a week', 'Rare'].map(t => (
                <SelectablePill key={t} label={t} selected={data.lifestyle.outdoorExposure === t} onClick={() => updateNested('lifestyle', 'outdoorExposure', t)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">5. Preferences & Hormonal</h2>
        <p className="text-slate-500 text-sm font-medium">Fine tuning for your AI generated plans</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Preferred Coaching Style</label>
          <div className="flex flex-col gap-2">
            {['Strict discipline', 'Flexible guidance', 'Motivational support'].map(d => (
              <SelectablePill key={d} label={d} selected={data.behavior.preferredCoachingStyle === d} onClick={() => updateNested('behavior', 'preferredCoachingStyle', d)} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Triggers for Drop-off (Multi)</label>
          <div className="flex flex-wrap gap-2">
            {['Lack of time', 'Low motivation', 'No results', 'Stress'].map(g => (
              <MultiSelectPill key={g} label={g} selected={data.behavior.triggersForDropOff.includes(g)} onClick={() => updateNested('behavior', 'triggersForDropOff', toggleArr(data.behavior.triggersForDropOff, g))} />
            ))}
          </div>
        </div>

        <div className="space-y-4 p-4 bg-teal-50/50 rounded-2xl border border-teal-100/50">
          <label className="block text-xs font-bold text-teal-900 uppercase tracking-wider">
            Daily Step Goal: {data.lifestyle.dailyStepsGoal}
          </label>
          <input
            type="range"
            min="1000"
            max="20000"
            step="1000"
            value={data.lifestyle.dailyStepsGoal}
            onChange={(e) => updateNested('lifestyle', 'dailyStepsGoal', parseInt(e.target.value))}
            className="w-full accent-teal-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Workout Time</label>
            <div className="flex flex-col gap-2">
              {['Morning', 'Afternoon', 'Evening'].map(t => (
                <SelectablePill key={t} label={t} selected={data.preferences.workoutTime === t} onClick={() => updateNested('preferences', 'workoutTime', t)} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Diet Style</label>
            <div className="flex flex-col gap-2">
              {['Simple', 'Variety', 'High-protein', 'Traditional'].map(t => (
                <SelectablePill key={t} label={t} selected={data.preferences.dietStyle === t} onClick={() => updateNested('preferences', 'dietStyle', t)} />
              ))}
            </div>
          </div>
        </div>

        {data.gender === 'female' && (
          <div className="p-5 bg-pink-50/80 rounded-3xl border border-pink-200 mt-4 space-y-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={data.hormonal.cycleTrackingEnabled} onChange={e => updateNested('hormonal', 'cycleTrackingEnabled', e.target.checked)} className="w-5 h-5 accent-pink-500 rounded text-pink-500 border-pink-300 focus:ring-pink-500" />
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-pink-900 tracking-wider uppercase">Enable Cycle Tracking?</span>
                <span className="text-[10px] font-bold text-pink-600 uppercase">Synchronize AI Insights with your Biology</span>
              </div>
            </label>
            
            {data.hormonal.cycleTrackingEnabled && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-6 pt-2 overflow-hidden"
              >
                <div>
                  <label className="block text-xs font-bold text-pink-800 uppercase tracking-wider mb-2">When did your last period start?</label>
                  <input 
                    type="date" 
                    value={data.hormonal.lastPeriodDate}
                    onChange={e => updateNested('hormonal', 'lastPeriodDate', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-pink-200 focus:ring-2 focus:ring-pink-500 outline-none font-bold text-pink-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-pink-800 uppercase tracking-wider mb-2">Average Period Duration: {data.hormonal.averagePeriodLength} Days</label>
                  <input 
                    type="range" min="2" max="10" 
                    value={data.hormonal.averagePeriodLength} 
                    onChange={e => updateNested('hormonal', 'averagePeriodLength', parseInt(e.target.value))} 
                    className="w-full accent-pink-600 cursor-pointer" 
                  />
                  <div className="flex justify-between text-[10px] font-extrabold text-pink-400 uppercase mt-1 px-1">
                    <span>2 Days</span>
                    <span>10 Days</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-pink-800 uppercase tracking-wider mb-3">Typical Flow Intensity</label>
                  <div className="flex gap-2">
                    {['light', 'moderate', 'heavy'].map(id => (
                      <button 
                        type="button" 
                        key={id} 
                        onClick={() => updateNested('hormonal', 'typicalFlowIntensity', id)}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-tighter border transition-all ${data.hormonal.typicalFlowIntensity === id ? 'bg-pink-500 text-white border-pink-500 shadow-md ring-2 ring-pink-100 ring-offset-2' : 'bg-white text-pink-700 border-pink-200 hover:bg-pink-100'}`}
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-pink-100" />

                <div>
                  <label className="block text-xs font-bold text-pink-800 uppercase tracking-wider mb-2">Any typical issues? (Multi)</label>
                  <div className="flex flex-wrap gap-2">
                    {['Cramps', 'Bloating', 'Acne', 'Mood Swings', 'Fatigue'].map(g => (
                      <button type="button" key={g} onClick={() => updateNested('hormonal', 'hormoneIssues', toggleArr(data.hormonal.hormoneIssues, g))} className={`px-4 py-2 text-[11px] rounded-xl font-bold border transition-all ${data.hormonal.hormoneIssues.includes(g) ? 'bg-pink-100 text-pink-700 border-pink-400 shadow-sm' : 'bg-white text-pink-400 border-pink-100 hover:border-pink-300'}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-y-auto bg-gradient-to-br from-slate-50 to-teal-50 py-12">
      <div className="absolute top-20 left-20 w-96 h-96 bg-teal-300/10 rounded-full mix-blend-multiply filter blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-300/10 rounded-full mix-blend-multiply filter blur-3xl" />

      <div className="max-w-xl mx-auto px-6 relative z-10">

        {/* Progress header */}
        <div className="mb-8">
          <div className="flex justify-between mb-3 px-2">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className={`h-2 w-full mx-1 rounded-full ${step >= i ? 'bg-teal-500' : 'bg-slate-200'}`} />
            ))}
          </div>
          <div className="text-center">
            <span className="text-xs font-extrabold text-teal-600 uppercase tracking-wider">Step {step} of {totalSteps}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] p-6 md:p-10">

          <AnimatePresence mode="wait">
            {step === 1 && <motion.div key="1" exit={{ opacity: 0, x: -20 }}>{renderStep1()}</motion.div>}
            {step === 2 && <motion.div key="2" exit={{ opacity: 0, x: -20 }}>{renderStepHealthContext()}</motion.div>}
            {step === 3 && <motion.div key="3" exit={{ opacity: 0, x: -20 }}>{renderStep2()}</motion.div>}
            {step === 4 && <motion.div key="4" exit={{ opacity: 0, x: -20 }}>{renderStep3()}</motion.div>}
            {step === 5 && <motion.div key="5" exit={{ opacity: 0, x: -20 }}>{renderStep4()}</motion.div>}
            {step === 6 && <motion.div key="6" exit={{ opacity: 0, x: -20 }}>{renderStepPreferences()}</motion.div>}
            {step === 7 && <motion.div key="7" exit={{ opacity: 0, x: -20 }}>{renderStep5()}</motion.div>}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-4 mt-10">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-extrabold uppercase tracking-wider text-sm rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}

            <button type="button" disabled={isSubmitting} onClick={() => step < totalSteps ? setStep(step + 1) : handleComplete()} className={`flex-[2] py-4 font-extrabold uppercase tracking-wider text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-teal-400 text-teal-100 cursor-wait' : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:shadow-xl hover:scale-[1.02]'}`}>
              {step < totalSteps ? (
                <>Next <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>{isSubmitting ? 'Saving...' : 'Complete Profile'} <Sparkles className="w-4 h-4" /></>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
