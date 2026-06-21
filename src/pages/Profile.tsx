import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, User, Camera, Settings, Activity, Apple, Brain, LayoutDashboard, LogOut, ShieldAlert, KeyRound, BellRing, Smartphone, Eye, HeartPulse } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { apiCall, API_ENDPOINTS } from '@/api';

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

const SettingToggle = ({ label, description, isOn, onToggle, icon }: any) => (
  <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-100">
    <div className="flex items-center gap-4">
      <div className="p-2 bg-slate-100 rounded-xl text-slate-600">{icon}</div>
      <div>
        <h4 className="font-bold text-slate-800">{label}</h4>
        <p className="text-xs text-slate-500 font-medium">{description}</p>
      </div>
    </div>
    <button 
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOn ? 'bg-teal-500' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

export function Profile() {
  const navigate = useNavigate();
  const { user, setUser } = useAppContext();
  const [activeTab, setActiveTab] = useState('General');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Deeply nested state mirroring MongoDB Schema
  const [data, setData] = useState({
    fullName: user?.name || '', age: 25, gender: 'female', height: 165, weight: 65, bodyType: '',
    occupation: '', dailyRoutineType: '', medicalConditions: [] as string[], allergies: [] as string[], medications: [] as string[],
    goals: { primaryGoal: '', targetTimeline: '', problemAreas: [] as string[] },
    nutrition: {
      dietType: '', 
      dietQuality: 5,
      mealPatterns: { 
        breakfast: { eats: 'Sometimes', typicalFoods: [] as string[] }, 
        lunch: { typicalFoods: [] as string[] }, 
        dinner: { size: 'Moderate', time: '8 PM' }, 
        snacks: { frequency: 'Moderate', type: 'Mixed' } 
      },
      hydration: '1-2L', 
      eatingBehavior: { emotionalEating: 'Sometimes', cravings: [] as string[] }
    },
    fitness: {
      fitnessLevel: 'Beginner', weeklyFrequency: '2-3 days', preferredWorkoutType: [] as string[], workoutLocation: 'Home', workoutDuration: '20-40 min', equipmentAccess: [] as string[], limitations: { injuries: [] as string[], mobilityIssues: [] as string[] }
    },
    sleepPatterns: { averageHours: 7, quality: 'Good', bedtime: '22:00', wakeTime: '06:00' },
    mentalHealth: {
      stressLevel: 'Sometimes', anxietyLevel: 'Sometimes', moodStability: 'Stable', confidenceLevel: 'Medium',
      emotionalPatterns: { overthinking: false, motivationConsistency: 'Medium' }, socialBehavior: { type: 'Ambivert', talksAboutFeelings: 'Sometimes' }
    },
    lifestyle: { 
      screenTime: '2-4 hrs', 
      outdoorExposure: 'Few times a week', 
      substanceUse: { smoking: false, alcohol: false }, 
      dailyEnergyLevels: 'Moderate',
      dailyStepsGoal: 5000,
      stressPrevalence: 'medium',
      sleepConsistency: 7,
      chronicPain: false
    },
    behavior: { goalCommitment: 'Medium', consistencyLevel: 'Sometimes', preferredCoachingStyle: 'Flexible guidance', triggersForDropOff: [] as string[] },
    preferences: { workoutTime: 'Morning', dietStyle: 'Simple' },
    constraints: { timeAvailable: '30 min', budgetConstraints: 'Medium' },
    hormonal: { 
      lastPeriodDate: '', 
      cycleTrackingEnabled: false, 
      averageCycleLength: 28,
      averagePeriodLength: 5,
      typicalFlowIntensity: 'moderate',
      menstrualCycle: '', 
      hormoneIssues: [] as string[], 
      digestiveIssues: [] as string[], 
      skinHairConcerns: [] as string[] 
    }
  });

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailUpdates: true,
    weeklyReports: false,
    darkMode: false,
    publicProfile: false
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiCall(API_ENDPOINTS.USER.PROFILE);
        if (response.data && response.data.profile) {
          const fetchedProfile = response.data.profile;
          const fetchedUser = response.data.user;
          setData(prev => ({
            ...prev,
            fullName: fetchedUser?.fullName || prev.fullName,
            age: fetchedProfile.age || prev.age,
            gender: fetchedUser?.gender || prev.gender,
            height: fetchedProfile.height || prev.height,
            weight: fetchedProfile.weight || prev.weight,
            bodyType: fetchedProfile.bodyType || prev.bodyType,
            occupation: fetchedProfile.occupation || prev.occupation,
            dailyRoutineType: fetchedProfile.dailyRoutineType || prev.dailyRoutineType,
            goals: { ...prev.goals, ...fetchedProfile.goals },
            nutrition: { ...prev.nutrition, ...fetchedProfile.nutrition },
            fitness: { ...prev.fitness, ...fetchedProfile.fitness },
            sleepPatterns: { ...prev.sleepPatterns, ...fetchedProfile.sleepPatterns },
            mentalHealth: { ...prev.mentalHealth, ...fetchedProfile.mentalHealth },
            lifestyle: { ...prev.lifestyle, ...fetchedProfile.lifestyle },
            behavior: { ...prev.behavior, ...fetchedProfile.behavior },
            preferences: { ...prev.preferences, ...fetchedProfile.preferences },
            hormonal: { ...prev.hormonal, ...fetchedProfile.hormonal }
          }));
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const updateNested = (category: keyof typeof data, field: string, value: any) => {
    setData(prev => ({ ...prev, [category]: { ...(prev[category] as any), [field]: value } }));
  };
  const updateDeeplyNested = (category: keyof typeof data, subCategory: string, field: string, value: any) => {
    setData(prev => ({
      ...prev, [category]: { ...(prev[category] as any), [subCategory]: { ...(prev[category] as any)[subCategory], [field]: value } }
    }));
  };
  const toggleArr = (arr: string[], item: string) => arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Sanitizing numeric values to avoid NaN database CastErrors
      const sanitizedData = {
        ...data,
        age: Number(data.age) || 25,
        height: Number(data.height) || 165,
        weight: Number(data.weight) || 65
      };

      await apiCall(API_ENDPOINTS.USER.PROFILE, {
        method: 'PUT',
        body: JSON.stringify(sanitizedData),
      });
      if (user) setUser({ ...user, name: data.fullName });
      
      // Flash save feedback
      const btn = document.getElementById('saveBtn');
      if (btn) {
        btn.innerHTML = '<span class="flex items-center gap-2"><svg class="w-5 h-5 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Saved!</span>';
        setTimeout(() => { btn.innerHTML = '<span class="flex items-center gap-2"><svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>Save Changes</span>'; }, 2000);
      }
    } catch (error: any) {
      console.error(error);
      alert(`API Error: ${error.message || JSON.stringify(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if(confirm("Are you sure you want to log out?")) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };
  const handleDestructive = (action: string) => alert(`[Action Intercepted] To actually perform "${action}", this would bridge to the auth controller.`);

  const tabs = [
    { id: 'General', label: 'General', icon: <User className="w-5 h-5"/> },
    { id: 'Fitness', label: 'Fitness', icon: <Activity className="w-5 h-5"/> },
    { id: 'Nutrition', label: 'Nutrition',  icon: <Apple className="w-5 h-5"/> },
    { id: 'Mental', label: 'Mental Health', icon: <Brain className="w-5 h-5"/> },
    { id: 'Settings', label: 'Settings', icon: <Settings className="w-5 h-5"/> }
  ];

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-teal-500"></div><span className="font-bold text-teal-700">Loading Dashboard...</span></div></div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'General': return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Age</label>
              <input type="number" value={data.age} onChange={e => setData({...data, age: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Gender</label>
              <div className="flex gap-2">
                {['female', 'male', 'other'].map(g => (
                  <SelectablePill key={g} label={g.charAt(0).toUpperCase() + g.slice(1)} selected={data.gender === g} onClick={() => setData({...data, gender: g})} />
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Height (cm)</label>
              <input type="number" value={data.height} onChange={e => setData({...data, height: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Weight (kg)</label>
              <input type="number" value={data.weight} onChange={e => setData({...data, weight: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 font-medium" />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-slate-400" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Chronic Physical Pain</h4>
                <p className="text-[10px] text-slate-500 font-medium">Do you experience regular physical discomfort?</p>
              </div>
            </div>
            <button 
              onClick={() => updateNested('lifestyle', 'chronicPain', !data.lifestyle.chronicPain)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.lifestyle.chronicPain ? 'bg-rose-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.lifestyle.chronicPain ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <hr className="border-slate-100" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Occupation</label>
              <div className="flex flex-col gap-2">
                {['Student', 'Working', 'Other'].map(t => (
                  <SelectablePill key={t} label={t} selected={data.occupation === t} onClick={() => setData({...data, occupation: t})} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Daily Routine</label>
              <div className="flex flex-col gap-2">
                {['Sedentary', 'Moderately active', 'Highly active'].map(t => (
                  <SelectablePill key={t} label={t} selected={data.dailyRoutineType === t} onClick={() => setData({...data, dailyRoutineType: t})} />
                ))}
              </div>
            </div>
          </div>
          
          {data.gender === 'female' && (
            <div className="mt-4 p-5 bg-pink-50/50 rounded-3xl border border-pink-100 animate-in fade-in slide-in-from-top-1 space-y-6">
              <label className="block text-[10px] font-black text-pink-700 uppercase tracking-[2px] mb-1">Female Health Settings</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-pink-600 mb-2">Last Period Start</label>
                  <input 
                    type="date" 
                    value={data.hormonal?.lastPeriodDate ? new Date(data.hormonal.lastPeriodDate).toISOString().split('T')[0] : ''} 
                    onChange={e => updateNested('hormonal', 'lastPeriodDate', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-pink-200 focus:ring-2 focus:ring-pink-500 font-bold text-slate-700 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-pink-600 mb-2">Cycle Length: {data.hormonal?.averageCycleLength || 28} Days</label>
                  <input 
                    type="range" min="21" max="35" 
                    value={data.hormonal?.averageCycleLength || 28} 
                    onChange={e => updateNested('hormonal', 'averageCycleLength', parseInt(e.target.value))}
                    className="w-full accent-pink-600 cursor-pointer" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-pink-600 mb-2">Period Duration: {data.hormonal?.averagePeriodLength || 5} Days</label>
                  <input 
                    type="range" min="2" max="10" 
                    value={data.hormonal?.averagePeriodLength || 5} 
                    onChange={e => updateNested('hormonal', 'averagePeriodLength', parseInt(e.target.value))}
                    className="w-full accent-pink-600 cursor-pointer" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-pink-600 mb-2">Typical Flow</label>
                  <div className="flex gap-2">
                    {['light', 'moderate', 'heavy'].map(id => (
                      <button 
                        key={id} 
                        onClick={() => updateNested('hormonal', 'typicalFlowIntensity', id)}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-[10px] uppercase border transition-all ${data.hormonal?.typicalFlowIntensity === id ? 'bg-pink-500 text-white border-pink-500 shadow-md' : 'bg-white text-pink-700 border-pink-200 hover:bg-pink-100'}`}
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Predicted Period Dates */}
              {data.hormonal?.lastPeriodDate && (
                <div className="p-4 bg-white/80 rounded-2xl border border-pink-100 space-y-3">
                  <label className="block text-[10px] font-black text-pink-700 uppercase tracking-[2px]">Predicted Upcoming Periods</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(n => {
                      const lastDate = new Date(data.hormonal.lastPeriodDate);
                      const cycleLen = data.hormonal?.averageCycleLength || 28;
                      // Find the next N upcoming periods relative to today
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const daysSinceLast = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                      const cyclesPassed = Math.floor(daysSinceLast / cycleLen);
                      const nextCycleNum = cyclesPassed + n;
                      const predictedDate = new Date(lastDate);
                      predictedDate.setDate(lastDate.getDate() + nextCycleNum * cycleLen);
                      return (
                        <div key={n} className="text-center p-3 bg-pink-50 rounded-xl border border-pink-100">
                          <div className="text-[9px] font-black text-pink-400 uppercase tracking-widest mb-1">Cycle +{n}</div>
                          <div className="text-sm font-extrabold text-pink-700">
                            {predictedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-pink-400 font-bold">{predictedDate.getFullYear()}</div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-pink-400 font-medium italic text-center">Based on {data.hormonal?.averageCycleLength || 28}-day cycle. Stored until you update it.</p>
                </div>
              )}
            </div>
          )}
        </div>
      );

      case 'Fitness': return (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Primary Goal</label>
            <div className="flex flex-wrap gap-2">
              {['Weight Loss', 'Muscle Gain', 'Maintenance', 'Fat Loss + Toning', 'Improve Stamina', 'Improve Flexibility'].map(g => (
                <SelectablePill key={g} label={g} selected={data.goals.primaryGoal === g} onClick={() => updateNested('goals', 'primaryGoal', g)} />
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">Daily Step Goal: {data.lifestyle.dailyStepsGoal}</label>
            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100/50">
              <input 
                type="range" 
                min="1000" 
                max="20000" 
                step="1000"
                value={data.lifestyle.dailyStepsGoal} 
                onChange={e => updateNested('lifestyle', 'dailyStepsGoal', parseInt(e.target.value))}
                className="w-full h-1.5 bg-teal-200 rounded-lg appearance-none cursor-pointer accent-teal-600" 
              />
              <div className="flex justify-between text-[10px] font-bold text-teal-600 mt-2">
                <span>1,000</span>
                <span>10,000</span>
                <span>20,000</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Preferred Workouts</label>
            <div className="flex flex-wrap gap-2">
              {['Strength training', 'Cardio', 'Yoga', 'Pilates', 'Sports', 'Home workouts'].map(g => (
                <MultiSelectPill key={g} label={g} selected={data.fitness.preferredWorkoutType.includes(g)} onClick={() => updateNested('fitness', 'preferredWorkoutType', toggleArr(data.fitness.preferredWorkoutType, g))} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Fitness Level</label>
              {['Beginner', 'Intermediate', 'Advanced'].map(t => (
                 <SelectablePill key={t} label={t} selected={data.fitness.fitnessLevel === t} onClick={() => updateNested('fitness', 'fitnessLevel', t)} />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Workout Frequency</label>
              {['0-1 days', '2-3 days', '4-5 days', '6+ days'].map(t => (
                 <SelectablePill key={t} label={t} selected={data.fitness.weeklyFrequency === t} onClick={() => updateNested('fitness', 'weeklyFrequency', t)} />
              ))}
            </div>
          </div>
        </div>
      );

      case 'Nutrition': return (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Diet Type</label>
            <div className="flex flex-wrap gap-2">
              {['Vegetarian', 'Vegan', 'Eggetarian', 'Non-vegetarian', 'Jain diet'].map(d => (
                <SelectablePill key={d} label={d} selected={data.nutrition?.dietType === d} onClick={() => updateNested('nutrition', 'dietType', d)} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Overall Diet Quality: {data.nutrition.dietQuality}/10</label>
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={data.nutrition.dietQuality} 
                onChange={e => updateNested('nutrition', 'dietQuality', parseInt(e.target.value))}
                className="w-full accent-emerald-600" 
              />
              <div className="flex justify-between text-[10px] font-bold text-emerald-600 mt-1">
                <span>Processed</span>
                <span>Balanced</span>
                <span>Nutritious</span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Meal Patterns</label>
              <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-2">Breakfast Habits</label>
                   <div className="flex gap-2">
                     {['Always', 'Sometimes', 'Never'].map(h => (
                       <SelectablePill key={h} label={h} selected={data.nutrition?.mealPatterns?.breakfast?.eats === h} onClick={() => updateDeeplyNested('nutrition', 'mealPatterns', 'breakfast', {...(data.nutrition?.mealPatterns?.breakfast || {typicalFoods:[]}), eats: h})} />
                     ))}
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-2">Lunch Content</label>
                   <div className="flex flex-wrap gap-2">
                     {['Roti + Sabzi', 'Rice + Dal', 'Fast food', 'Mixed', 'Salad'].map(g => (
                       <MultiSelectPill key={g} label={g} selected={data.nutrition?.mealPatterns?.lunch?.typicalFoods?.includes(g) || false} onClick={() => updateDeeplyNested('nutrition', 'mealPatterns', 'lunch', {...(data.nutrition?.mealPatterns?.lunch || {typicalFoods:[]}), typicalFoods: toggleArr(data.nutrition?.mealPatterns?.lunch?.typicalFoods || [], g)})} />
                     ))}
                   </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Dinner Size</label>
                  <div className="flex gap-2">
                    {['Light', 'Moderate', 'Heavy'].map(d => (
                      <SelectablePill key={d} label={d} selected={data.nutrition?.mealPatterns?.dinner?.size === d} onClick={() => updateDeeplyNested('nutrition', 'mealPatterns', 'dinner', {...(data.nutrition?.mealPatterns?.dinner || {time:'8 PM'}), size: d})} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-200/50" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Snack Frequency</label>
                <div className="flex flex-col gap-2">
                  {['Rarely', 'Moderate', 'Frequent'].map(f => (
                    <SelectablePill key={f} label={f} selected={data.nutrition?.mealPatterns?.snacks?.frequency === f} onClick={() => updateDeeplyNested('nutrition', 'mealPatterns', 'snacks', {...(data.nutrition?.mealPatterns?.snacks || {type:'Mixed'}), frequency: f})} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Hydration</label>
                <div className="flex flex-col gap-2">
                  {['<1L', '1-2L', '2-3L', '3L+'].map(t => (
                    <SelectablePill key={t} label={t} selected={data.nutrition?.hydration === t} onClick={() => updateNested('nutrition', 'hydration', t)} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Cravings / Emotional Eating</label>
            <div className="flex flex-wrap gap-2">
              {['Sweets', 'Salty', 'Spicy', 'Emotional Eating', 'Late-night Snacks'].map(c => (
                <MultiSelectPill key={c} label={c} selected={data.nutrition?.eatingBehavior?.cravings?.includes(c) || false} onClick={() => updateDeeplyNested('nutrition', 'eatingBehavior', 'cravings', toggleArr(data.nutrition?.eatingBehavior?.cravings || [], c))} />
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium italic">* These insights help MedSage AI tailor your coaching triggers.</p>
          </div>
        </div>
      );

      case 'Mental': return (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">Stress Prevalence</label>
              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map(lvl => (
                  <button 
                    key={lvl}
                    onClick={() => updateNested('lifestyle', 'stressPrevalence', lvl)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${data.lifestyle.stressPrevalence === lvl ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-300'}`}
                  >
                    {lvl.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">Daily Steps Goal: {data.lifestyle.dailyStepsGoal} steps</label>
              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100/50">
                <input 
                  type="range" 
                  min="1000" 
                  max="20000" 
                  step="1000"
                  value={data.lifestyle.dailyStepsGoal} 
                  onChange={e => updateNested('lifestyle', 'dailyStepsGoal', parseInt(e.target.value))}
                  className="w-full accent-teal-600" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Stress Level</label>
              <div className="flex flex-col gap-2">
                 {['Rarely', 'Sometimes', 'Often'].map(t => (
                   <SelectablePill key={t} label={t} selected={data.mentalHealth.stressLevel === t} onClick={() => updateNested('mentalHealth', 'stressLevel', t)} />
                 ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Anxiety</label>
              <div className="flex flex-col gap-2">
                 {['Rarely', 'Sometimes', 'Often'].map(t => (
                   <SelectablePill key={t} label={t} selected={data.mentalHealth.anxietyLevel === t} onClick={() => updateNested('mentalHealth', 'anxietyLevel', t)} />
                 ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Sleep Average</label>
            <div className="flex flex-wrap gap-2">
              {['<5 hrs', '5-6 hrs', '6-7 hrs', '7-8 hrs', '8+ hrs'].map(d => (
                <SelectablePill key={d} label={d} selected={data.sleepPatterns.averageHours === parseInt(d) || (d==='<5 hrs' && data.sleepPatterns.averageHours===4) || (data.sleepPatterns.averageHours.toString() === d)} onClick={() => updateNested('sleepPatterns', 'averageHours', parseInt(d)||7)} />
              ))}
            </div>
          </div>
        </div>
      );

      case 'Settings': return (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
             <div className="p-4 bg-slate-50 border-b border-slate-100">
               <h3 className="font-bold text-slate-800 flex items-center gap-2"><Smartphone className="w-5 h-5"/> Application Settings</h3>
               <p className="text-xs text-slate-500 font-medium">Control your notifications, appearances, and preferences.</p>
             </div>
             <div className="p-4 space-y-2">
               <SettingToggle icon={<BellRing/>} label="Push Notifications" description="Allow MedSage to push AI reminders to your device." isOn={settings.pushNotifications} onToggle={() => setSettings({...settings, pushNotifications: !settings.pushNotifications})} />
               <SettingToggle icon={<Activity/>} label="Weekly Summary Reports" description="Email a deep dive analytics report every Sunday." isOn={settings.weeklyReports} onToggle={() => setSettings({...settings, weeklyReports: !settings.weeklyReports})} />
               <SettingToggle icon={<Eye/>} label="Public Profile" description="Allow your achievements to be visible to community." isOn={settings.publicProfile} onToggle={() => setSettings({...settings, publicProfile: !settings.publicProfile})} />
             </div>
          </div>

          <div className="bg-rose-50 rounded-3xl overflow-hidden shadow-sm border border-rose-100">
             <div className="p-4 bg-rose-100/50 border-b border-rose-200">
               <h3 className="font-bold text-rose-800 flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Danger Zone</h3>
               <p className="text-xs text-rose-600 font-medium">Destructive actions and account termination context.</p>
             </div>
             <div className="p-4 space-y-3">
                <button onClick={() => handleDestructive('Change Password')} className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-700 font-bold">
                  <span className="flex gap-3 items-center"><KeyRound className="w-5 h-5"/> Change Password</span>
                  <ArrowLeft className="w-4 h-4 rotate-180 opacity-50"/>
                </button>
                <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-700 font-bold">
                  <span className="flex gap-3 items-center"><LogOut className="w-5 h-5"/> Securely Log Out</span>
                  <ArrowLeft className="w-4 h-4 rotate-180 opacity-50"/>
                </button>
                <button onClick={() => handleDestructive('Delete Account')} className="w-full flex items-center justify-between p-4 bg-rose-600 rounded-xl hover:bg-rose-700 transition-all text-white font-bold shadow-lg shadow-rose-200 mt-6">
                  <span className="flex gap-3 items-center"><ShieldAlert className="w-5 h-5"/> Permanently Delete Account</span>
                </button>
             </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* Header Sticky Banner */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <button onClick={() => navigate('/app')} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors hidden sm:block">
               <ArrowLeft className="w-5 h-5 text-slate-700" />
             </button>
             <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Profile Dashboard</h1>
           </div>
           
           <button 
             id="saveBtn"
             disabled={isSaving}
             onClick={handleSave}
             className="px-6 py-2.5 bg-zinc-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
           >
             <Save className="w-4 h-4" />
             {isSaving ? 'Syncing...' : 'Save Changes'}
           </button>
        </div>
        
        {/* Horizontal Navigation Tabs */}
        <div className="w-full overflow-x-auto hide-scrollbar bg-white border-t border-slate-100">
           <div className="max-w-4xl mx-auto px-4 flex gap-1 min-w-max">
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center gap-2 px-5 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
               >
                 {tab.icon} {tab.label}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 flex flex-col md:flex-row gap-8">
        
        {/* Left Column - Mini Profile Card */}
        <div className="w-full md:w-[300px] flex-shrink-0">
          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center">
            <div className="relative group cursor-pointer mb-5">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-1 shadow-xl">
                <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center overflow-hidden">
                  <User className="w-12 h-12 text-teal-600/50" />
                </div>
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <Camera className="w-8 h-8 text-white"/>
              </div>
            </div>
            
            <input 
              type="text" 
              value={data.fullName} 
              onChange={e => setData({...data, fullName: e.target.value})} 
              className="text-xl font-extrabold text-slate-800 text-center bg-transparent border-b-2 border-dashed border-slate-300 hover:border-slate-400 focus:border-teal-500 outline-none w-full pb-1 transition-colors"
            />
            <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-wider">{data.goals?.primaryGoal || 'MedSage User'}</p>
            
            {data.gender === 'female' && data.hormonal?.cycleTrackingEnabled && (
                <div className="mt-6 w-full py-3 px-4 bg-pink-50 rounded-2xl flex items-center justify-between border border-pink-100">
                   <div className="flex items-center gap-2">
                     <HeartPulse className="w-5 h-5 text-pink-500"/>
                     <span className="text-sm font-bold text-pink-900">Cycle Tracker</span>
                   </div>
                   <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"/>
                </div>
            )}
          </div>
        </div>

        {/* Right Column - Deep Form Editor */}
        <div className="w-full flex-grow">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[500px]">
             <AnimatePresence mode="wait">
               <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 transition={{ duration: 0.2 }}
               >
                 {renderTabContent()}
               </motion.div>
             </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
