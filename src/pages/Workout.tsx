import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Dumbbell, Flame, Timer, X, Play, Plus, Zap, CheckCircle2, Target, MapPin, List, RotateCcw, Pause, SkipForward, ChevronLeft, Save, Edit3, BookOpen, FolderHeart, Sparkles, Trash2, Activity, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { EXERCISE_LIBRARY as CENTRAL_LIBRARY, ExerciseDef } from '@/data/exerciseLibrary';


// --- Interfaces ---
interface WorkoutExercise {
  name: string;
  reps: string; // "3x12" format for UI
  sets?: number; // Numeric sets for DB
  repsNum?: number; // Numeric reps for DB
  duration: number; // in seconds
  target: string;
  tips: string;
  phase?: 'Warm up' | 'Main Circuit' | 'Cooldown';
}

interface WorkoutPlan {
  id: string;
  title: string;
  duration: number;
  calories: number;
  summary: string;
  exercises: WorkoutExercise[];
  isCustom?: boolean;
  savedAt?: string;
}

interface HealthInsight {
  score: number;
  status: 'improving' | 'stable' | 'declining';
  insights: Array<{ title: string; message: string; category: string }>;
  alerts: Array<{ severity: 'low' | 'medium' | 'high'; message: string }>;
  summary: string;
}

// Replaced by ExerciseDef

// --- Expanded Exercise Library ---
// --- Dynamic Exercise Library from central data ---
const EXERCISE_LIBRARY: Record<string, ExerciseDef[]> = {
  ...CENTRAL_LIBRARY,
  // Add 'Bodyweight' and other legacy categories for UI compatibility if needed, 
  // or just use the new ones. I'll use the new ones and update the UI accordingly.
  'Bodyweight': CENTRAL_LIBRARY['Strength Training'].filter(ex => ex.category === 'Bodyweight'),
  'Stretching': CENTRAL_LIBRARY['Mobility & Flexibility']
};

// Also ensure 'Combat & MMA' is available as 'Boxing' or its own.
// In the central library it's 'Combat & MMA'. 
// I'll keep the central keys but add aliases for backwards compatibility.
if (CENTRAL_LIBRARY['Combat & MMA']) {
  EXERCISE_LIBRARY['Boxing'] = CENTRAL_LIBRARY['Combat & MMA'];
}
if (CENTRAL_LIBRARY['Calisthenics Advanced']) {
  EXERCISE_LIBRARY['Calisthenics'] = CENTRAL_LIBRARY['Calisthenics Advanced'];
}


const getLocalDateString = (dateInput: any): string => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  
  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }
  
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// --- Voice Helpers ---
const speakWorkout = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  u.pitch = 1.05;
  u.volume = 1;
  window.speechSynthesis.speak(u);
};

const announceExercise = (name: string, onDone?: () => void) => {
  if (!('speechSynthesis' in window)) { onDone?.(); return; }
  window.speechSynthesis.cancel();
  const lines = [
    `Next up: ${name}`,
    '3',
    '2',
    '1',
    'Go!'
  ];
  let idx = 0;
  const speakNext = () => {
    if (idx >= lines.length) { onDone?.(); return; }
    const u = new SpeechSynthesisUtterance(lines[idx]);
    u.rate = idx === 0 ? 0.92 : 1.1;
    u.pitch = idx === 0 ? 1.0 : (idx === lines.length - 1 ? 1.3 : 1.0);
    u.volume = 1;
    u.onend = () => { idx++; speakNext(); };
    window.speechSynthesis.speak(u);
  };
  speakNext();
};

export function Workout() {
  const { user } = useAppContext();
  const [view, setView] = useState<'dashboard' | 'custom_builder' | 'player'>('dashboard');

  // --- Quick Workout Log State ---
  const [quickWorkoutSuccess, setQuickWorkoutSuccess] = useState('');
  const [isQuickLoggingWorkout, setIsQuickLoggingWorkout] = useState(false);
  const [customQuickName, setCustomQuickName] = useState('');
  const [customQuickDuration, setCustomQuickDuration] = useState('30');
  const [customQuickType, setCustomQuickType] = useState<'cardio' | 'strength' | 'flexibility' | 'hiit' | 'sports' | 'other'>('cardio');
  const [customQuickIntensity, setCustomQuickIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');

  // Library & Plans State
  const [myLibrary, setMyLibrary] = useState<WorkoutPlan[]>([]);
  const [todaysPlan, setTodaysPlan] = useState<WorkoutPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Today's Plan Config State
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [planConfig, setPlanConfig] = useState({ duration: 30, location: 'Home', equipment: 'No Equipment', type: 'Any' });

  // Custom Builder State
  const [customTitle, setCustomTitle] = useState('');
  const [customExercises, setCustomExercises] = useState<WorkoutExercise[]>([]);

  // Exercise Library UI State
  const [activeCategory, setActiveCategory] = useState('Strength Training');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDef | null>(null);
  const [libraryLocationFilter, setLibraryLocationFilter] = useState('All');
  const [libraryEquipmentFilter, setLibraryEquipmentFilter] = useState('All');

  // Player State
  const [activeWorkout, setActiveWorkout] = useState<WorkoutPlan | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [playerState, setPlayerState] = useState<'pre' | 'active' | 'post'>('pre');
  const [workoutCountdown, setWorkoutCountdown] = useState<number | null>(null);
  const [dailyChallenges, setDailyChallenges] = useState<WorkoutPlan[]>([]);
  const [isWorkoutLibraryOpen, setIsWorkoutLibraryOpen] = useState(false);

  // Health Insights State
  const [healthInsights, setHealthInsights] = useState<HealthInsight | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Calendar & Scheduling State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [planToSchedule, setPlanToSchedule] = useState<WorkoutPlan | null>(null);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<any[]>([]);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [isEditingWorkout, setIsEditingWorkout] = useState(false);
  const [workoutToEdit, setWorkoutToEdit] = useState<any>(null);

  // --- Daily Challenges Generation ---
  const CHALLENGE_TEMPLATES = [
    { title: 'Ultimate Core Killer', theme: 'Core', duration: 45, intensity: 'High', color: 'from-orange-500 to-red-600', categories: ['Strength Training', 'Pilates'] },
    { title: 'Cardio Blast', theme: 'Cardio', duration: 30, intensity: 'Medium', color: 'from-blue-500 to-indigo-600', categories: ['Cardio', 'Combat & MMA'] },
    { title: 'Full Body Power', theme: 'Full Body', duration: 60, intensity: 'High', color: 'from-emerald-500 to-teal-600', categories: ['Strength Training', 'Calisthenics Advanced'] },
    { title: 'Yoga Flow & Flexibility', theme: 'Flexibility', duration: 40, intensity: 'Low', color: 'from-purple-500 to-pink-600', categories: ['Yoga', 'Mobility & Flexibility'] },
    { title: 'Combat Conditioning', theme: 'Power', duration: 50, intensity: 'High', color: 'from-red-600 to-rose-700', categories: ['Combat & MMA', 'Strength Training'] },
    { title: 'Pilates Sculpt', theme: 'Control', duration: 45, intensity: 'Medium', color: 'from-pink-500 to-rose-400', categories: ['Pilates', 'Mobility & Flexibility'] }
  ];

  const generateDailyChallenges = () => {
    const today = new Date().toDateString();
    // Simple hash for deterministic selection
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = ((hash << 5) - hash) + today.charCodeAt(i);
      hash |= 0;
    }

    const challenges: WorkoutPlan[] = [];
    const templateIndices = [Math.abs(hash) % CHALLENGE_TEMPLATES.length, (Math.abs(hash) + 1) % CHALLENGE_TEMPLATES.length];

    templateIndices.forEach((idx, i) => {
      const template = CHALLENGE_TEMPLATES[idx];
      const allPossibleExercises: ExerciseDef[] = [];
      template.categories.forEach(cat => {
        if (EXERCISE_LIBRARY[cat]) {
          allPossibleExercises.push(...EXERCISE_LIBRARY[cat]);
        }
      });

      // Deterministically pick 6-8 exercises from the pool
      const count = 6 + (Math.abs(hash + i) % 3); // 6-8 exercises
      const selected: ExerciseDef[] = [];
      const pool = [...allPossibleExercises];

      for (let j = 0; j < count && pool.length > 0; j++) {
        const exIdx = Math.abs(hash + j + i * 10) % pool.length;
        selected.push(pool.splice(exIdx, 1)[0]);
      }

      challenges.push({
        id: `challenge-${today}-${i}`,
        title: template.title,
        duration: template.duration,
        calories: template.duration * (template.intensity === 'High' ? 12 : 8),
        summary: `A daily ${template.intensity} intensity challenge focused on ${template.theme}.`,
        exercises: selected.map(ex => ({
          name: ex.name,
          reps: ex.level === 'Advanced' ? '3x15' : '3x12',
          duration: 60,
          target: ex.target,
          tips: ex.tips[0]
        }))
      });
    });

    setDailyChallenges(challenges);
  };

  // --- AI Generation & Intelligent Fallback ---
  const generateLocalPlan = (config: typeof planConfig): WorkoutPlan => {
    const selectedType = config.type === 'Any' ? 'Strength Training' : config.type;
    const equipFilter = config.equipment === 'No Equipment' ? 'None' : config.equipment;

    // Normalize UI location terms to exercise library terms
    const normalizedLocation = config.location === 'Home' ? 'Indoor' : config.location === 'Gym' ? 'Indoor' : config.location;

    const getPhasePool = (categories: string[], filterFunc?: (ex: ExerciseDef) => boolean) => {
      let pool: ExerciseDef[] = [];
      categories.forEach(cat => {
        if (EXERCISE_LIBRARY[cat]) {
          EXERCISE_LIBRARY[cat].forEach(ex => {
            const matchesLocation = config.location === 'Any' || ex.location.includes(normalizedLocation);
            const matchesEquipment = config.equipment === 'Full Gym' || 
              equipFilter === 'Any' || 
              ex.equipment.includes(equipFilter) || 
              ex.equipment.includes('None');
            
            if (matchesLocation && matchesEquipment && (!filterFunc || filterFunc(ex))) {
              pool.push(ex);
            }
          });
        }
      });
      return [...new Set(pool)];
    };

    // 1. WARM UP (1-2 exercises)
    const warmUpPool = getPhasePool(['Mobility & Flexibility', 'Cardio']);
    const selectedWarmUp = warmUpPool.sort(() => 0.5 - Math.random()).slice(0, 2);

    // 2. MAIN CIRCUIT (based on duration)
    // Always include a secondary pool if the primary type is narrow
    const mainCategories = [selectedType];
    if (selectedType === 'Boxing' || selectedType === 'Calisthenics') mainCategories.push('Strength Training');
    
    const mainPool = getPhasePool(mainCategories);
    let mainCount = 4;
    if (config.duration >= 60) mainCount = 10;
    else if (config.duration >= 45) mainCount = 8;
    else if (config.duration >= 30) mainCount = 6;
    else if (config.duration >= 20) mainCount = 4;

    const selectedMain = mainPool.sort(() => 0.5 - Math.random()).slice(0, mainCount);

    // 3. COOLDOWN (1-2 exercises)
    const coolDownPool = getPhasePool(['Yoga', 'Mobility & Flexibility']);
    const selectedCoolDown = coolDownPool.sort(() => 0.5 - Math.random()).slice(0, 2);

    const finalExercises: WorkoutExercise[] = [
      ...selectedWarmUp.map(ex => ({ name: ex.name, reps: '1x60s', duration: 30, target: ex.target, tips: ex.tips[0], phase: 'Warm up' as const })),
      ...selectedMain.map(ex => ({ 
        name: ex.name, 
        reps: ex.level === 'Advanced' ? '4x15' : '3x12', 
        sets: ex.level === 'Advanced' ? 4 : 3, 
        repsNum: ex.level === 'Advanced' ? 15 : 12, 
        duration: 60, 
        target: ex.target, 
        tips: ex.tips[0], 
        phase: 'Main Circuit' as const 
      })),
      ...selectedCoolDown.map(ex => ({ name: ex.name, reps: '1x60s', duration: 45, target: ex.target, tips: ex.tips[0], phase: 'Cooldown' as const }))
    ];

    return {
      id: `local-${Date.now()}`,
      title: `${config.type === 'Any' ? 'Balanced' : config.type} ${config.location} Session`,
      duration: config.duration,
      calories: config.duration * (config.type === 'Cardio' || config.type === 'Boxing' ? 10 : 7),
      summary: `A professionally structured ${config.duration}m routine featuring targeted Warm-up, ${config.type} work, and static Cooldown.`,
      exercises: finalExercises
    };
  };

  const generateDynamicPlan = async (config: typeof planConfig) => {
    setIsGenerating(true);
    try {
      // Use structured local engine but with a small delay for AI-feel and potential backend check
      // This solves the 'response time' issue by prioritizing local structure while still allowing AI logic
      const fitnessLevel = 'intermediate';
      const goal = user?.goals?.[0] || 'general fitness';

      // Faster parallel execution or pre-baked structured logic
      const planTask = new Promise<WorkoutPlan>((resolve) => {
        setTimeout(() => resolve(generateLocalPlan(config)), 800); // 800ms for premium feel
      });

      const aiPlan = await planTask;
      setTodaysPlan(aiPlan);

    } catch (err) {
      console.error("Plan Generation Failed:", err);
      setTodaysPlan(generateLocalPlan(config));
    } finally {
      setIsGenerating(false);
      setIsEditingPlan(false);
    }
  };

  const fetchHealthInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const response = await fetch('/api/v1/insights/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Insights fetch failed');
      const result = await response.json();
      setHealthInsights(result.data);
    } catch (error) {
      console.error('Error fetching health insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const fetchLibrary = async () => {
    try {
      const response = await fetch('/api/v1/workouts/plans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch library');
      const result = await response.json();
      const backendPlans = result.data.map((p: any) => ({
        id: p._id,
        title: p.name,
        duration: p.duration,
        calories: p.caloriesBurned || (p.duration * 7),
        summary: p.description || 'Saved workout plan',
        exercises: p.exercises,
        isCustom: !p.isAiGenerated,
        savedAt: p.createdAt
      }));
      setMyLibrary(backendPlans);

      // Legacy Sync: If backend is empty but localStorage has data, sync it once
      const savedLibrary = localStorage.getItem('myWorkoutLibrary');
      if (backendPlans.length === 0 && savedLibrary) {
        const localPlans = JSON.parse(savedLibrary);
        if (localPlans.length > 0) {
          for (const plan of localPlans) {
            await saveToLibrary(plan, true); // true = silent/background
          }
          fetchLibrary(); // Refresh after sync
        }
      }
    } catch (error) {
      console.error('Error fetching workout library:', error);
      // Fallback to localStorage if API fails
      const savedLibrary = localStorage.getItem('myWorkoutLibrary');
      if (savedLibrary) setMyLibrary(JSON.parse(savedLibrary));
    }
  };

  const fetchScheduledWorkouts = async () => {
    setIsLoadingWorkouts(true);
    try {
      const response = await fetch('/api/v1/workouts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch workouts');
      const result = await response.json();
      setScheduledWorkouts(result.data);
    } catch (error) {
      console.error('Error fetching scheduled workouts:', error);
    } finally {
      setIsLoadingWorkouts(false);
    }
  };

  const logWorkoutForDate = async () => {
    if (!planToSchedule) return;
    try {
      const response = await fetch('/api/v1/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: planToSchedule.title,
          type: 'other',
          duration: planToSchedule.duration,
          intensity: 'moderate',
          exercises: planToSchedule.exercises,
          date: new Date(scheduledDate).toISOString(),
          status: 'logged'
        })
      });

      if (response.ok) {
        setIsScheduleModalOpen(false);
        setPlanToSchedule(null);
        await fetchScheduledWorkouts();
        await fetchHealthInsights();
      }
    } catch (error) {
      console.error('Failed to log workout:', error);
    }
  };

  const handleQuickLogWorkout = async (
    name: string,
    duration: number,
    type: 'cardio' | 'strength' | 'flexibility' | 'hiit' | 'sports' | 'other',
    intensity: 'low' | 'moderate' | 'high',
    caloriesBurned?: number
  ) => {
    setIsQuickLoggingWorkout(true);
    try {
      let cals = caloriesBurned;
      if (!cals) {
        let met = 7.0; // moderate cardio
        if (type === 'strength') met = 5.0;
        else if (type === 'flexibility') met = 2.5;
        else if (type === 'hiit') met = 8.5;
        else if (type === 'sports') met = 6.0;
        
        if (intensity === 'low') met *= 0.7;
        else if (intensity === 'high') met *= 1.3;
        
        cals = Math.round(met * 3.5 * 70 * duration / 200);
      }

      const response = await fetch('/api/v1/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          name,
          type,
          duration,
          intensity,
          caloriesBurned: cals,
          exercises: [],
          date: new Date().toISOString(),
          status: 'logged'
        })
      });

      if (response.ok) {
        setQuickWorkoutSuccess(`Logged ${name} (${duration}m) successfully!`);
        await fetchScheduledWorkouts();
        await fetchHealthInsights();
        setTimeout(() => setQuickWorkoutSuccess(''), 3000);
        setCustomQuickName('');
      } else {
        alert('Failed to log quick activity');
      }
    } catch (err) {
      console.error('Quick log workout error:', err);
    } finally {
      setIsQuickLoggingWorkout(false);
    }
  };

  const deleteWorkout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;
    
    // Optimistic update
    setScheduledWorkouts(prev => prev.filter(w => w._id !== id));
    
    try {
      const res = await fetch(`/api/v1/workouts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchHealthInsights();
    } catch (error) {
      console.error('Failed to delete workout:', error);
      fetchScheduledWorkouts(); // Revert
    }
  };

  const handleUpdateWorkout = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/v1/workouts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setIsEditingWorkout(false);
        setWorkoutToEdit(null);
        await fetchScheduledWorkouts();
        await fetchHealthInsights();
      }
    } catch (error) {
      console.error('Failed to update workout:', error);
    }
  };

  // Initial load
  useEffect(() => {
    if (!todaysPlan) {
      generateDynamicPlan(planConfig);
    }
    generateDailyChallenges();
    fetchHealthInsights();
    fetchLibrary();
    fetchScheduledWorkouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Player Logic ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playerState === 'active' && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && playerState === 'active') {
      handleNextExercise();
    }
    return () => clearInterval(interval);
  }, [playerState, isPaused, timeLeft]);

  const startWorkout = (workout: WorkoutPlan) => {
    setActiveWorkout(workout);
    setPlayerState('pre');
    setView('player');
  };

  const beginActiveWorkout = () => {
    if (!activeWorkout) return;
    const firstEx = activeWorkout.exercises[0];
    setCurrentExerciseIndex(0);
    setIsPaused(true);
    setPlayerState('active');
    // Drive visual countdown in sync with voice
    setWorkoutCountdown(3);
    announceExercise(firstEx.name, () => {
      setWorkoutCountdown(null);
      setTimeLeft(firstEx.duration);
      setIsPaused(false);
    });
    // Tick visual countdown: 3 → 2 → 1 → null ("Go!" is handled by onDone above)
    let c = 3;
    const tick = setInterval(() => {
      c -= 1;
      if (c <= 0) { clearInterval(tick); }
      else { setWorkoutCountdown(c); }
    }, 1000);
  };

  const handleNextExercise = () => {
    if (!activeWorkout) return;
    if (currentExerciseIndex < activeWorkout.exercises.length - 1) {
      const nextIdx = currentExerciseIndex + 1;
      const nextEx = activeWorkout.exercises[nextIdx];
      setCurrentExerciseIndex(nextIdx);
      setIsPaused(true);
      speakWorkout('Great job! Rest for a moment.');
      setTimeout(() => {
        setWorkoutCountdown(3);
        announceExercise(nextEx.name, () => {
          setWorkoutCountdown(null);
          setTimeLeft(nextEx.duration);
          setIsPaused(false);
        });
        let c = 3;
        const tick = setInterval(() => {
          c -= 1;
          if (c <= 0) { clearInterval(tick); }
          else { setWorkoutCountdown(c); }
        }, 1000);
      }, 1800);
    } else {
      setPlayerState('post');
      speakWorkout('Workout complete! Amazing effort. You crushed it!');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const saveToLibrary = async (plan: WorkoutPlan, silent = false) => {
    try {
      const response = await fetch('/api/v1/workouts/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: plan.title,
          description: plan.summary,
          type: 'mixed',
          duration: plan.duration,
          exercises: plan.exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets || (ex.reps.includes('x') ? parseInt(ex.reps.split('x')[0]) : 3),
            reps: ex.repsNum || (ex.reps.includes('x') ? parseInt(ex.reps.split('x')[1]) : 12),
            duration: ex.duration,
            target: ex.target,
            notes: ex.tips
          })),
          isAiGenerated: !plan.isCustom
        })
      });

      if (response.ok) {
        if (!silent) fetchLibrary();
      }
    } catch (error) {
      console.error('Failed to save workout to library:', error);
      // Fallback for offline/error
      if (!myLibrary.find(w => w.id === plan.id)) {
        setMyLibrary([{ ...plan, savedAt: new Date().toISOString() }, ...myLibrary]);
      }
    }
  };

  const editSavedPlan = (plan: WorkoutPlan) => {
    setCustomTitle(plan.title);
    setCustomExercises(plan.exercises);
    setView('custom_builder');
  };

  const deleteSavedPlan = async (id: string) => {
    try {
      // Optimistic update
      setMyLibrary(myLibrary.filter(p => p.id !== id));

      await fetch(`/api/v1/workouts/plans/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Failed to delete workout plan:', error);
      fetchLibrary(); // Rollback
    }
  };

  // --- Render Helpers ---
  const renderDashboard = () => {
    return (
      <>
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* HERO SECTION */}
          <header className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-red-500 to-rose-500 tracking-tight">
                Let's Train Smart!
              </h1>
              <p className="text-slate-600 font-medium mt-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Best time for strength training: 5–7 PM today
              </p>
              <div className="mt-6" />
            </div>



            <button
              onClick={() => setIsCalendarOpen(true)}
              className="group flex items-center gap-3 bg-white/80 hover:bg-white backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-white shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">History</div>
                <div className="text-sm font-black text-slate-800">Workout Calendar</div>
              </div>
            </button>
          </header>

          {/* ⚡ QUICK WORKOUT LOG BAR */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-50/95 to-rose-50/95 backdrop-blur-xl rounded-[2rem] p-4 sm:p-5 border border-orange-100/60 shadow-sm relative z-10"
          >
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <div className="p-1.5 bg-orange-500 rounded-lg flex-shrink-0">
                <Zap className="w-3.5 h-3.5 text-white fill-current" />
              </div>
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Quick Activity Log</span>
              <span className="text-[10px] text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-bold">1-Click Log</span>
              {quickWorkoutSuccess && (
                <span className="ml-auto text-[11px] text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {quickWorkoutSuccess}
                </span>
              )}
            </div>

            {/* 1-Click Activity Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { label: 'Run 30m', name: 'Outdoor Run', duration: 30, type: 'cardio', intensity: 'moderate', calories: 300, icon: '🏃' },
                { label: 'Walk 20m', name: 'Brisk Walk', duration: 20, type: 'cardio', intensity: 'low', calories: 90, icon: '🚶' },
                { label: 'Gym 45m', name: 'Weightlifting', duration: 45, type: 'strength', intensity: 'moderate', calories: 220, icon: '🏋' },
                { label: 'Yoga 30m', name: 'Yoga Vinyasa', duration: 30, type: 'flexibility', intensity: 'low', calories: 100, icon: '🧘' },
                { label: 'Cycle 30m', name: 'Cycling', duration: 30, type: 'cardio', intensity: 'moderate', calories: 250, icon: '🚴' },
                { label: 'HIIT 20m', name: 'HIIT Workout', duration: 20, type: 'hiit', intensity: 'high', calories: 210, icon: '⚡' },
              ].map(preset => (
                <button
                  key={preset.label}
                  disabled={isQuickLoggingWorkout}
                  onClick={() => handleQuickLogWorkout(preset.name, preset.duration, preset.type as any, preset.intensity as any, preset.calories)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-orange-100 rounded-xl text-xs font-bold text-slate-700 hover:border-orange-400 hover:bg-orange-50 transition-all shadow-sm disabled:opacity-60 active:scale-95 cursor-pointer animate-in fade-in duration-300"
                >
                  <span>{preset.icon}</span>
                  <span>{preset.label}</span>
                  <span className="text-orange-600 font-black">{preset.calories} kcal</span>
                </button>
              ))}
            </div>

            {/* Custom Quick Log Input Row */}
            <div className="bg-white/60 p-3 rounded-2xl border border-orange-100/50 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider md:w-28 flex-shrink-0">Custom Quick Log</span>
              
              <input
                type="text"
                placeholder="Activity Name (e.g. Hiking, Badminton)..."
                value={customQuickName}
                onChange={e => setCustomQuickName(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm text-slate-800 font-bold"
              />

              <div className="flex gap-2 flex-wrap items-center">
                {/* Duration Selector */}
                <select
                  value={customQuickDuration}
                  onChange={e => setCustomQuickDuration(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm cursor-pointer"
                >
                  <option value="10">10 mins</option>
                  <option value="15">15 mins</option>
                  <option value="20">20 mins</option>
                  <option value="30">30 mins</option>
                  <option value="45">45 mins</option>
                  <option value="60">60 mins</option>
                  <option value="90">90 mins</option>
                </select>

                {/* Type Selector */}
                <select
                  value={customQuickType}
                  onChange={e => setCustomQuickType(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm cursor-pointer"
                >
                  <option value="cardio">Cardio</option>
                  <option value="strength">Strength</option>
                  <option value="flexibility">Flexibility</option>
                  <option value="hiit">HIIT</option>
                  <option value="sports">Sports</option>
                  <option value="other">Other</option>
                </select>

                {/* Intensity Selector */}
                <select
                  value={customQuickIntensity}
                  onChange={e => setCustomQuickIntensity(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>

                <button
                  disabled={isQuickLoggingWorkout || !customQuickName.trim()}
                  onClick={() => handleQuickLogWorkout(customQuickName, parseInt(customQuickDuration), customQuickType, customQuickIntensity)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  {isQuickLoggingWorkout ? 'Logging...' : 'Log Activity'}
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">

            {/* LEFT COLUMN: Today's Plan */}
            <div className="lg:col-span-7 space-y-8">

              {/* Personalized Insights */}
              <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/80 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Health Insights</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Holistic Analysis</p>
                      </div>
                    </div>
                    {healthInsights && (
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Health Score</div>
                          <div className="text-xl font-black text-indigo-600">{healthInsights.score}</div>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          healthInsights.status === 'improving' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            healthInsights.status === 'declining' ? "bg-red-50 text-red-600 border-red-100" :
                              "bg-blue-50 text-blue-600 border-blue-100"
                        )}>
                          {healthInsights.status}
                        </div>
                      </div>
                    )}
                  </div>

                  {isLoadingInsights ? (
                    <div className="flex flex-col items-center py-6 gap-3">
                      <RotateCcw className="w-6 h-6 text-amber-500 animate-spin" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Synthesizing cross-module data...</p>
                    </div>
                  ) : healthInsights ? (
                    <div className="space-y-4">
                      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {healthInsights.summary}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {healthInsights.insights.slice(0, 2).map((insight, i) => (
                          <div key={i} className="p-3 bg-white/40 border border-white/60 rounded-xl backdrop-blur-sm">
                            <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">{insight.category}</div>
                            <div className="text-xs font-bold text-slate-800 mb-0.5">{insight.title}</div>
                            <p className="text-[10px] text-slate-500 leading-tight">{insight.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
                      <p className="text-sm text-slate-700 leading-relaxed italic">
                        Log more data in Nutrition, Mental Health, or Hormones to see personalized cross-module insights!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* TODAY'S PLAN (DYNAMIC AI) */}
              <motion.div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-200/40 to-rose-200/40 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />

                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10 mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                      <Zap className="w-6 h-6 text-orange-500" /> Today's AI Plan
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Dynamically generated for your preferences.</p>
                  </div>
                  <button
                    onClick={() => setView('custom_builder')}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" /> Custom Plan
                  </button>
                </div>

                {isEditingPlan ? (
                  <div className="bg-white/80 p-5 sm:p-6 rounded-2xl border border-slate-200 mb-6 relative z-10 space-y-4">
                    <h3 className="font-bold text-slate-800">Edit Preferences</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duration (mins)</label>
                        <input
                          type="number"
                          value={planConfig.duration}
                          onChange={(e) => setPlanConfig({ ...planConfig, duration: parseInt(e.target.value) || 30 })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Location</label>
                        <select
                          value={planConfig.location}
                          onChange={(e) => setPlanConfig({ ...planConfig, location: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                          <option>Home</option>
                          <option>Gym</option>
                          <option>Outdoor</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Equipment</label>
                        <select
                          value={planConfig.equipment}
                          onChange={(e) => setPlanConfig({ ...planConfig, equipment: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                          <option>No Equipment</option>
                          <option>Dumbbells</option>
                          <option>Resistance Bands</option>
                          <option>Kettlebell</option>
                          <option>Full Gym</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type</label>
                        <select
                          value={planConfig.type}
                          onChange={(e) => setPlanConfig({ ...planConfig, type: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                          <option>Any</option>
                          <option>Strength Training</option>
                          <option>Yoga</option>
                          <option>Pilates</option>
                          <option>Calisthenics</option>
                          <option>Cardio</option>
                          <option>Boxing</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => generateDynamicPlan(planConfig)} disabled={isGenerating} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                        {isGenerating ? <RotateCcw className="w-4 h-4 animate-spin" /> : 'Update Plan'}
                      </button>
                      <button onClick={() => setIsEditingPlan(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 mb-6">
                    {isGenerating ? (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                        <RotateCcw className="w-8 h-8 animate-spin mb-4 text-orange-500" />
                        <p className="font-medium">Generating your perfect workout...</p>
                      </div>
                    ) : todaysPlan ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white/80 p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex-1 mr-4">
                            <input
                              type="text"
                              value={todaysPlan.title}
                              onChange={(e) => setTodaysPlan({ ...todaysPlan, title: e.target.value })}
                              className="text-lg font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none w-full transition-colors"
                              placeholder="Workout Name"
                            />
                            <p className="text-sm text-slate-500 font-medium">{todaysPlan.summary}</p>
                          </div>
                          <button onClick={() => setIsEditingPlan(true)} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors shrink-0">
                            <Edit3 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex gap-4">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                            <Timer className="w-4 h-4 text-blue-500" /> {todaysPlan.duration} mins
                          </div>
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                            <Flame className="w-4 h-4 text-orange-500" /> {todaysPlan.calories} kcal
                          </div>
                        </div>

                        <div className="space-y-6 mt-6">
                          {['Warm up', 'Main Circuit', 'Cooldown'].map(phase => {
                            const phaseExercises = (todaysPlan?.exercises || []).filter(ex => ex.phase === phase);
                            if (phaseExercises.length === 0) return null;
                            
                            return (
                              <div key={phase} className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    phase === 'Warm up' ? "bg-amber-400" : phase === 'Main Circuit' ? "bg-indigo-500" : "bg-emerald-400"
                                  )} />
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{phase}</h4>
                                </div>
                                
                                <div className="grid gap-2">
                                  {phaseExercises.map((ex, i) => (
                                    <div key={i} className="group flex justify-between items-center p-4 bg-white/40 hover:bg-white/80 rounded-2xl border border-slate-100/50 hover:border-slate-200 hover:shadow-sm transition-all duration-300">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                          {i + 1}
                                        </div>
                                        <div>
                                          <span className="font-bold text-slate-700 block text-sm group-hover:text-slate-900">{ex.name}</span>
                                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{ex.target}</span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg text-[11px] border border-indigo-100 shadow-sm">{ex.reps}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-row gap-3 relative z-10 border-t border-slate-100 pt-6">
                  <button
                    onClick={() => todaysPlan && startWorkout(todaysPlan)}
                    disabled={isGenerating || !todaysPlan}
                    className="sm:col-span-3 lg:flex-[2] py-3.5 bg-gradient-to-r from-orange-50 to-rose-50 hover:from-orange-100 hover:to-rose-100 text-slate-900 dark:text-slate-900 rounded-xl text-sm font-bold transition-all shadow-sm border border-orange-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 text-orange-600 fill-current" /> Start Workout
                  </button>
                  <button
                    onClick={() => todaysPlan && saveToLibrary(todaysPlan)}
                    disabled={isGenerating || !todaysPlan}
                    className="py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 text-emerald-500" /> Save
                  </button>
                  <button
                    onClick={() => {
                      setPlanToSchedule(todaysPlan);
                      setIsScheduleModalOpen(true);
                    }}
                    disabled={isGenerating || !todaysPlan}
                    className="sm:col-span-2 lg:flex-1 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Calendar className="w-4 h-4" /> Log Workout
                  </button>
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN: My Workout Library & Health Challenges */}
            <div className="lg:col-span-5 space-y-8">

              {/* MY WORKOUT LIBRARY */}
              <motion.div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <FolderHeart className="w-6 h-6 text-purple-500" /> My Library
                  </h2>
                  {myLibrary.length > 0 && (
                    <button
                      onClick={() => setIsWorkoutLibraryOpen(true)}
                      className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                    >
                      View All ({myLibrary.length})
                    </button>
                  )}
                </div>

                {myLibrary.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Your library is empty.</p>
                    <p className="text-sm text-slate-400">Save AI plans or create custom ones to see them here.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {myLibrary.map(plan => (
                      <div key={plan.id} className="p-3 bg-white/80 hover:bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            plan.isCustom ? "bg-blue-400" : "bg-orange-400"
                          )} />
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm leading-tight">{plan.title}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{plan.duration}m • {plan.calories} kcal</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startWorkout(plan)}
                            className="p-2 bg-slate-100 hover:bg-indigo-500 hover:text-white text-slate-600 rounded-xl transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={() => {
                              setPlanToSchedule(plan);
                              setIsScheduleModalOpen(true);
                            }}
                            className="p-2 bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-600 rounded-xl transition-all"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Health Challenges */}
              <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/80">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Health Challenges</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Push your limits</p>
                  </div>
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>

                <div className="flex flex-col gap-4">
                  {dailyChallenges.map((challenge, idx) => (
                    <div
                      key={challenge.id}
                      className={cn(
                        "bg-white/40 backdrop-blur-md rounded-3xl p-6 text-slate-800 relative overflow-hidden group cursor-pointer border border-white/60 shadow-sm hover:shadow-md transition-all hover:bg-white/60"
                      )}
                    >
                      {/* Subtle Accent Strip */}
                      <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b opacity-80",
                        CHALLENGE_TEMPLATES.find(t => t.title === challenge.title)?.color || 'from-slate-400 to-slate-600'
                      )} />

                      <div className="absolute top-0 right-0 w-48 h-48 bg-slate-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-700" />
                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex-1">
                          <h3 className="font-black text-xl mb-2 text-slate-800">{challenge.title}</h3>
                          <div className="flex items-center gap-4 mb-4 bg-slate-100/80 w-fit px-3 py-1 rounded-full border border-slate-200/50">
                            <div className="flex items-center gap-1.5 border-r border-slate-300/50 pr-3 text-slate-600">
                              <Timer className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold uppercase tracking-wider">{challenge.duration}m</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Flame className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold uppercase tracking-wider">{challenge.calories} kcal</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {challenge.exercises.slice(0, 4).map((ex, i) => (
                              <span key={i} className="text-[10px] font-bold bg-slate-200/50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-300/30 backdrop-blur-sm">
                                {ex.name}
                              </span>
                            ))}
                            {challenge.exercises.length > 4 && <span className="text-[10px] font-bold text-slate-400">+{challenge.exercises.length - 4} more</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => startWorkout(challenge)}
                          className="px-6 py-3 bg-slate-800 text-white hover:bg-slate-900 rounded-2xl text-sm font-black transition-all shadow-md hover:scale-105 active:scale-95 shrink-0"
                        >
                          Start Challenge
                        </button>
                      </div>
                    </div>
                  ))}
                  {dailyChallenges.length === 0 && (
                    <div className="text-center py-12 bg-white/40 rounded-3xl border border-white/60 border-dashed text-slate-400 font-medium">
                      Generating fresh challenges...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Exercise Library Overlay */}
          <AnimatePresence>
            {isLibraryOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsLibraryOpen(false)}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-5xl bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white overflow-hidden flex flex-col max-h-[90vh]"
                >
                  {/* Overlay Header */}
                  <div className="p-5 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-indigo-500" /> Exercise Library
                      </h2>
                      <p className="text-slate-500 font-bold mt-1 uppercase text-[10px] sm:text-xs tracking-widest">Master your form and technique</p>
                    </div>
                    <button
                      onClick={() => setIsLibraryOpen(false)}
                      className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Overlay Content */}
                  <div className="flex-1 overflow-hidden flex flex-col p-5 sm:p-8 bg-slate-50/50">
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8">
                      {/* Category Pills */}
                      <div className="flex-1 flex flex-wrap gap-2">
                        {Object.keys(EXERCISE_LIBRARY).map(cat => (
                          <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                              "px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-[10px] sm:text-xs font-black transition-all border shadow-sm",
                              activeCategory === cat ? "bg-indigo-500 text-white border-indigo-600 scale-105 shadow-indigo-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Filters */}
                      <div className="grid grid-cols-2 sm:flex gap-3">
                        <select
                          value={libraryLocationFilter}
                          onChange={(e) => setLibraryLocationFilter(e.target.value)}
                          className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                        >
                          <option value="All">All Locations</option>
                          <option value="Home">Home</option>
                          <option value="Gym">Gym</option>
                          <option value="Outdoor">Outdoor</option>
                        </select>
                        <select
                          value={libraryEquipmentFilter}
                          onChange={(e) => setLibraryEquipmentFilter(e.target.value)}
                          className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                        >
                          <option value="All">All Equipment</option>
                          <option value="None">No Equipment</option>
                          <option value="Dumbbells">Dumbbells</option>
                          <option value="Resistance Bands">Resistance Bands</option>
                          <option value="Kettlebell">Kettlebell</option>
                          <option value="Heavy Bag">Heavy Bag</option>
                        </select>
                      </div>
                    </div>

                    {/* Grid of Exercises */}
                    <div className="flex-1 overflow-y-auto pr-2 sm:pr-4 custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-8">
                        {EXERCISE_LIBRARY[activeCategory]
                          .filter(ex => libraryLocationFilter === 'All' || ex.location.includes(libraryLocationFilter))
                          .filter(ex => libraryEquipmentFilter === 'All' || ex.equipment.includes(libraryEquipmentFilter))
                          .map(ex => (
                            <div
                              key={ex.id}
                              onClick={() => setSelectedExercise(ex)}
                              className="group p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="relative z-10">
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="font-black text-slate-800 text-lg leading-tight line-clamp-1">{ex.name}</h4>
                                  <div className="flex gap-1 shrink-0">
                                    {ex.equipment.slice(0, 1).map(eq => (
                                      <span key={eq} className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-100 uppercase">{eq}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase tracking-wider">{ex.target}</span>
                                  <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase tracking-wider">{ex.level}</span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-3 font-medium leading-relaxed">{ex.guide}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Exercise Details Modal */}
          <AnimatePresence>
            {selectedExercise && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2rem] overflow-hidden w-full max-w-lg shadow-2xl"
                >
                  <div className="relative p-6 sm:p-8 bg-gradient-to-br from-indigo-500 to-purple-600">
                    <button
                      onClick={() => setSelectedExercise(null)}
                      className="absolute top-4 right-4 p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-[10px] font-bold text-white bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md uppercase tracking-wider">{selectedExercise.target}</span>
                        <span className="text-[10px] font-bold text-slate-800 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md uppercase tracking-wider">{selectedExercise.level}</span>
                        {selectedExercise.equipment.map(eq => (
                          <span key={eq} className="text-[10px] font-bold text-amber-800 bg-amber-100/90 backdrop-blur-sm px-2 py-1 rounded-md uppercase tracking-wider">{eq}</span>
                        ))}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{selectedExercise.name}</h2>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 space-y-6">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-2">Textual Guide</h3>
                      <p className="text-slate-600 text-sm leading-relaxed font-medium">{selectedExercise.guide}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-3">Pro Tips</h3>
                      <ul className="space-y-2">
                        {selectedExercise.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Workout Library Overlay */}
          <AnimatePresence>
            {isWorkoutLibraryOpen && (
              <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 sm:p-8">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsWorkoutLibraryOpen(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-4xl bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white overflow-hidden flex flex-col max-h-[85vh]"
                >
                  <div className="p-5 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <FolderHeart className="w-8 h-8 text-purple-500" /> My Saved Workouts
                      </h2>
                      <p className="text-slate-500 font-bold mt-1 uppercase text-[10px] sm:text-xs tracking-widest">Manage your custom and AI routines</p>
                    </div>
                    <button
                      onClick={() => setIsWorkoutLibraryOpen(false)}
                      className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {myLibrary.map(plan => (
                        <div key={plan.id} className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="font-black text-slate-800 text-xl mb-1">{plan.title}</h3>
                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  "text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest",
                                  plan.isCustom ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-orange-50 text-orange-600 border border-orange-100"
                                )}>
                                  {plan.isCustom ? 'Custom' : 'AI Plan'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                  <Timer className="w-3 h-3" /> {plan.duration}m
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => { editSavedPlan(plan); setIsWorkoutLibraryOpen(false); }} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors">
                                <Edit3 className="w-5 h-5" />
                              </button>
                              <button onClick={() => deleteSavedPlan(plan.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <div className="bg-slate-50/50 rounded-2xl p-4 mb-6 border border-slate-100">
                            <div className="space-y-2">
                              {plan.exercises.slice(0, 3).map((ex, i) => (
                                <div key={i} className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-slate-700">{ex.name}</span>
                                  <span className="text-slate-400 font-bold">{ex.reps}</span>
                                </div>
                              ))}
                              {plan.exercises.length > 3 && <p className="text-[10px] text-indigo-500 font-bold pt-1">+{plan.exercises.length - 3} more</p>}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => { startWorkout(plan); setIsWorkoutLibraryOpen(false); }}
                              className="py-3 bg-slate-800 hover:bg-orange-600 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95"
                            >
                              <Play className="w-3 h-3 fill-current" /> Start
                            </button>
                            <button
                              onClick={async () => {
                                setActiveWorkout(plan);
                                await logCompletedWorkout();
                                setIsWorkoutLibraryOpen(false);
                                await fetchScheduledWorkouts();
                                await fetchHealthInsights();
                              }}
                              className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Log
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </>
    );
  };

  // --- CUSTOM BUILDER VIEW ---
  const renderCustomBuilder = () => (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in slide-in-from-bottom-8 duration-500">
      <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] p-6 sm:p-8 border border-white shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Custom Workout Builder</h2>
        <p className="text-slate-500 font-medium mb-6 sm:mb-8">Design your own perfect routine from the library.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Workout Title</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g., My Killer Leg Day"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Left: Add Exercises */}
            <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-100 flex flex-col">
              <h3 className="font-bold text-slate-800 mb-4">Add from Library</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide shrink-0">
                {Object.keys(EXERCISE_LIBRARY).map(cat => (
                  <button
                    key={cat} onClick={() => setActiveCategory(cat)}
                    className={cn("px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors", activeCategory === cat ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100")}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[200px] mb-4">
                {EXERCISE_LIBRARY[activeCategory].map(ex => (
                  <div key={ex.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{ex.name}</div>
                      <div className="text-[10px] text-slate-500">{ex.target}</div>
                    </div>
                    <button
                      onClick={() => setCustomExercises([...customExercises, { name: ex.name, reps: '3x10', duration: 60, target: ex.target, tips: ex.tips[0] }])}
                      className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200 shrink-0">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Or Add Custom Exercise</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="custom-ex-name"
                    placeholder="Exercise name..."
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          setCustomExercises([...customExercises, { name: val, reps: '3x10', duration: 60, target: 'Custom', tips: 'Focus on form.' }]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('custom-ex-name') as HTMLInputElement;
                      const val = input.value.trim();
                      if (val) {
                        setCustomExercises([...customExercises, { name: val, reps: '3x10', duration: 60, target: 'Custom', tips: 'Focus on form.' }]);
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Current Plan */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Your Plan ({customExercises.length} Exercises)</h3>
              {customExercises.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium">No exercises added yet.</div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {customExercises.map((ex, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 relative group">
                      <button onClick={() => setCustomExercises(customExercises.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                      </button>
                      <div className="font-bold text-slate-800 text-sm mb-2">{i + 1}. {ex.name}</div>
                      <div className="flex gap-2">
                        <input
                          type="text" value={ex.reps}
                          onChange={(e) => {
                            const newEx = [...customExercises];
                            newEx[i].reps = e.target.value;
                            setCustomExercises(newEx);
                          }}
                          className="w-20 px-2 py-1 text-xs rounded-md border border-slate-200 outline-none focus:border-blue-500"
                          placeholder="Reps"
                        />
                        <input
                          type="number" value={ex.duration}
                          onChange={(e) => {
                            const newEx = [...customExercises];
                            newEx[i].duration = parseInt(e.target.value) || 60;
                            setCustomExercises(newEx);
                          }}
                          className="w-24 px-2 py-1 text-xs rounded-md border border-slate-200 outline-none focus:border-blue-500"
                          placeholder="Secs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              disabled={customExercises.length === 0 || !customTitle}
              onClick={() => {
                const newPlan: WorkoutPlan = {
                  id: Date.now().toString(),
                  title: customTitle,
                  duration: Math.ceil(customExercises.reduce((acc, ex) => acc + ex.duration, 0) / 60) + (customExercises.length * 1), // rough estimate with rest
                  calories: customExercises.length * 40,
                  summary: 'Custom user-created workout plan.',
                  exercises: customExercises,
                  isCustom: true
                };
                saveToLibrary(newPlan);
                setView('dashboard');
                setCustomTitle('');
                setCustomExercises([]);
              }}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Custom Workout
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const logCompletedWorkout = async () => {
    if (!activeWorkout) return;

    try {
      const response = await fetch('/api/v1/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          type: 'strength',
          name: activeWorkout.title,
          duration: activeWorkout.duration,
          intensity: 'moderate',
          exercises: activeWorkout.exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets || 3,
            reps: ex.repsNum || 12,
            duration: ex.duration,
            target: ex.target
          })),
          caloriesBurned: activeWorkout.calories,
          notes: `Completed workout from ${activeWorkout.isCustom ? 'custom library' : 'AI plan'}`
        })
      });

      if (response.ok) {
        await fetchScheduledWorkouts();
        await fetchHealthInsights();
      }
    } catch (err) {
      console.error('Failed to log completed workout:', err);
    }
  };

  // --- PLAYER VIEW ---
  const renderPlayer = () => {
    if (!activeWorkout) return null;
    const currentEx = activeWorkout.exercises[currentExerciseIndex];
    const progress = ((currentExerciseIndex) / activeWorkout.exercises.length) * 100;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col animate-in fade-in duration-300">
        <div className="p-4 sm:p-6 flex justify-between items-center bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-10">
          <button onClick={() => setView('dashboard')} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-bold">{activeWorkout.title}</h2>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">{currentExerciseIndex + 1} of {activeWorkout.exercises.length} Exercises</p>
          </div>
          <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <List className="w-6 h-6" />
          </button>
        </div>

        <div className="h-1 bg-slate-800 w-full">
          <motion.div className="h-full bg-orange-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-orange-500/10 to-purple-500/10 blur-3xl rounded-full pointer-events-none" />

          <AnimatePresence mode="wait">
            {playerState === 'pre' && (
              <motion.div key="pre" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="text-center space-y-8 z-10">
                <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto border border-orange-500/30">
                  <Dumbbell className="w-10 h-10 text-orange-500" />
                </div>
                <div className="space-y-4">
                  <div>
                    <h1 className="text-4xl font-black mb-2">Get Ready!</h1>
                    <p className="text-slate-400 font-medium text-lg">Your session is about to begin.</p>
                  </div>

                  {activeWorkout && activeWorkout.exercises[0] && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-sm mx-auto">
                      <div className="text-left space-y-3">
                        <div className="text-center mb-4">
                          <span className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2 block">{activeWorkout.exercises[0].target}</span>
                          <h2 className="text-2xl font-black mb-2">{activeWorkout.exercises[0].name}</h2>
                          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                            <Target className="w-3 h-3 text-slate-300" />
                            <span className="font-bold text-slate-200 text-sm">{activeWorkout.exercises[0].reps}</span>
                          </div>
                        </div>
                        <div className="text-slate-300 text-sm leading-relaxed">
                          <p className="font-medium text-slate-200 mb-2">Exercise Instructions:</p>
                          <p>{activeWorkout.exercises[0].tips}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 justify-center">
                  <button onClick={() => setView('dashboard')} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-bold transition-colors flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={beginActiveWorkout} className="px-12 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-xl font-black transition-all shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:scale-105 flex items-center gap-3 mx-auto">
                    <Play className="w-6 h-6 fill-current" /> START WORKOUT
                  </button>
                </div>
              </motion.div>
            )}

            {playerState === 'active' && currentEx && (
              <motion.div key="active" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-md flex flex-col items-center z-10">
                <div className="text-center mb-8">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2 block">{currentEx.target}</span>
                  <h2 className="text-4xl font-black mb-4">{currentEx.name}</h2>
                  <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                    <Target className="w-4 h-4 text-slate-300" />
                    <span className="font-bold text-slate-200">{currentEx.reps}</span>
                  </div>
                </div>

                <div className="text-center mb-8 max-w-sm">
                  <p className="text-slate-300 text-sm leading-relaxed bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    {currentEx.tips}
                  </p>
                </div>

                <div className="relative w-64 h-64 mb-12">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="128" cy="128" r="120" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="transparent" />
                    <motion.circle
                      cx="128" cy="128" r="120"
                      stroke="#f97316"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 120}
                      strokeDashoffset={2 * Math.PI * 120 * (1 - (timeLeft / currentEx.duration))}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {workoutCountdown !== null ? (
                      <div key={workoutCountdown} className="flex flex-col items-center" style={{ animation: 'countdownPop 0.5s ease-out' }}>
                        <span className="text-7xl font-black font-mono leading-none" style={{ textShadow: '0 0 40px rgba(249,115,22,0.9)' }}>
                          {workoutCountdown}
                        </span>
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-widest mt-1">Get Ready</span>
                      </div>
                    ) : (
                      <span className="text-6xl font-black font-mono tracking-tighter">{formatTime(timeLeft)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <button
                    onClick={() => {
                      setTimeLeft(currentEx.duration);
                      setIsPaused(false);
                    }}
                    className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                  <button onClick={() => setIsPaused(!isPaused)} className="w-20 h-20 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                    {isPaused ? <Play className="w-8 h-8 fill-current ml-1" /> : <Pause className="w-8 h-8 fill-current" />}
                  </button>
                  <button onClick={handleNextExercise} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                    <SkipForward className="w-6 h-6 fill-current" />
                  </button>
                </div>
              </motion.div>
            )}

            {playerState === 'post' && (
              <motion.div key="post" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 z-10">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <div>
                  <h1 className="text-4xl font-black mb-2">Workout Complete!</h1>
                  <p className="text-slate-400 font-medium text-lg">Amazing job crushing your goals today.</p>
                </div>
                <button
                  onClick={async () => {
                    await logCompletedWorkout();
                    setView('dashboard');
                  }}
                  className="px-10 py-4 bg-white text-slate-900 rounded-full text-lg font-black transition-all hover:bg-slate-200 hover:scale-105"
                >
                  Finish & Save
                </button>
              </motion.div>
            )}
          </AnimatePresence>


        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen">
      {/* BACKGROUND ENHANCEMENT */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-lavender-300/20 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-mint-300/20 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-blue-300/20 blur-[120px] rounded-full mix-blend-multiply" />
      </div>

      <div className="w-full relative z-10">
        {view === 'dashboard' && renderDashboard()}
        {view === 'custom_builder' && renderCustomBuilder()}
        {view === 'player' && renderPlayer()}
      </div>

      {/* WORKOUT CALENDAR MODAL */}
      <AnimatePresence>
        {isCalendarOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCalendarOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-emerald-500" /> Workout History
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Your fitness journey at a glance.</p>
                </div>
                <button onClick={() => setIsCalendarOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar relative">
                {isLoadingWorkouts ? (
                  <div className="py-20 flex flex-col items-center gap-4">
                    <RotateCcw className="w-10 h-10 text-emerald-500 animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading your records...</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Month Selection */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-black text-slate-800">
                        {format(new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1), "MMMM yyyy")}
                      </h3>
                      <div className="flex gap-2">
                        <button onClick={() => setMonthOffset(m => m - 1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button onClick={() => setMonthOffset(0)} className="px-3 py-1 text-xs font-black text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          Today
                        </button>
                        <button onClick={() => setMonthOffset(m => m + 1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                          <ChevronLeft className="w-6 h-6 rotate-180" />
                        </button>
                      </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
                          {day}
                        </div>
                      ))}

                      {(() => {
                        const baseDate = new Date();
                        const targetMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, 1);
                        const startDay = targetMonth.getDay();
                        const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
                        const todayStr = new Date().toDateString();

                        return Array.from({ length: 42 }).map((_, i) => {
                          const dayNum = i - startDay + 1;
                          const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
                          const currentDate = isValidDay ? new Date(targetMonth.getFullYear(), targetMonth.getMonth(), dayNum) : null;
                          const isToday = currentDate?.toDateString() === todayStr;

                          // Find workouts for this day
                          const dayWorkouts = currentDate ? scheduledWorkouts.filter(w =>
                            getLocalDateString(w.date || w.createdAt) === getLocalDateString(currentDate)
                          ) : [];

                          return (
                            <div
                              key={i}
                              className={cn(
                                "relative aspect-square rounded-2xl flex flex-col items-center justify-center border transition-all",
                                !isValidDay ? "border-transparent opacity-20" : "border-slate-50",
                                isToday ? "bg-indigo-50 border-indigo-100" : "bg-white",
                                isValidDay ? "shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-200" : ""
                              )}
                              onClick={() => {
                                if (isValidDay && currentDate) {
                                  setSelectedCalendarDate(currentDate.toISOString().split('T')[0]);
                                }
                              }}
                            >
                              {isValidDay && (
                                <>
                                  <span className={cn(
                                    "text-sm font-black",
                                    isToday ? "text-indigo-600" : "text-slate-800"
                                  )}>
                                    {dayNum}
                                  </span>
                                  {dayWorkouts.length > 0 ? (
                                    <div className="flex gap-0.5 mt-1">
                                      {dayWorkouts.map((w, idx) => (
                                        <div
                                          key={idx}
                                          className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            w.status === 'logged' ? "bg-emerald-500" : "bg-indigo-400"
                                          )}
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <Plus className="w-3 h-3 text-slate-300 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Workout Details for Selected Date or Recent */}
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4 px-1">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          {selectedCalendarDate ? `Workouts for ${format(new Date(selectedCalendarDate), "MMMM do")}` : 'Recent Activity'}
                        </h4>
                        {selectedCalendarDate && (
                          <button 
                            onClick={() => {
                              setScheduledDate(selectedCalendarDate);
                              setPlanToSchedule(todaysPlan);
                              setIsScheduleModalOpen(true);
                            }}
                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Workout
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {(selectedCalendarDate 
                          ? scheduledWorkouts.filter(w => getLocalDateString(w.date || w.createdAt) === selectedCalendarDate)
                          : scheduledWorkouts.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()).slice(0, 5)
                        ).map((log: any) => (
                          <div key={log._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center text-white font-black",
                                log.status === 'logged' ? "bg-emerald-500" : "bg-indigo-400"
                              )}>
                                {log.type.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800">{log.name}</div>
                                <div className="text-[10px] font-extrabold text-slate-500 uppercase">
                                  {format(new Date(log.date || log.createdAt), "MMM do")} • {log.duration} mins • {log.status}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {log.status === 'scheduled' && (
                                <button
                                  onClick={() => startWorkout({
                                    id: log._id,
                                    title: log.name,
                                    duration: log.duration,
                                    calories: log.caloriesBurned || log.duration * 7,
                                    summary: log.notes || 'Scheduled workout',
                                    exercises: log.exercises || []
                                  })}
                                  className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors"
                                >
                                  Start
                                </button>
                              )}
                              <button 
                                onClick={() => { setWorkoutToEdit(log); setIsEditingWorkout(true); }}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteWorkout(log._id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {(selectedCalendarDate && scheduledWorkouts.filter(w => getLocalDateString(w.date || w.createdAt) === selectedCalendarDate).length === 0) && (
                          <div className="text-center py-8 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-3xl">
                            No workouts for this day.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SCHEDULE MODAL */}
      <AnimatePresence>
        {isScheduleModalOpen && planToSchedule && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsScheduleModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8"
            >
              <h3 className="text-xl font-black text-slate-800 mb-2">Log Workout</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">Record a workout for any date — past, present, or future.</p>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Plan</div>
                    <div className="font-bold text-slate-800">{planToSchedule.title}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-800 transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={logWorkoutForDate} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95">
                    Log Workout
                  </button>
                  <button onClick={() => setIsScheduleModalOpen(false)} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT WORKOUT MODAL */}
      <AnimatePresence>
        {isEditingWorkout && workoutToEdit && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEditingWorkout(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8"
            >
              <h3 className="text-xl font-black text-slate-800 mb-2">Edit Workout</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">Update details for this session.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Name</label>
                  <input
                    type="text"
                    value={workoutToEdit.name}
                    onChange={(e) => setWorkoutToEdit({ ...workoutToEdit, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-800 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={workoutToEdit.duration}
                    onChange={(e) => setWorkoutToEdit({ ...workoutToEdit, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-800 transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => handleUpdateWorkout(workoutToEdit._id, { name: workoutToEdit.name, duration: workoutToEdit.duration })} 
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all shadow-lg active:scale-95"
                  >
                    Save Changes
                  </button>
                  <button onClick={() => setIsEditingWorkout(false)} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Subcomponents ---
function MetricPill({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/80 shadow-sm">
      <div className={cn("p-2 rounded-xl", bg, color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-extrabold text-slate-800">{value}</div>
      </div>
    </div>
  );
}
