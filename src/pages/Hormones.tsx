import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplet, Calendar, Activity, AlertCircle, Zap, ArrowRight, Info, RefreshCw, CheckCircle2, Plus, Save, List, Check, Brain, Apple, Dumbbell, Briefcase, TrendingUp, TrendingDown, Clock, Battery, Smile, ChevronRight, ChevronLeft, MoreVertical, X, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { apiCall, API_ENDPOINTS } from '@/api';

interface AIInsightData {
  status: "Optimal" | "Normal" | "Irregular" | "Attention Needed";
  analysis: string;
  warnings: string[];
  actionableSteps: string[];
  insights: {
    energy: string;
    nutrition: string;
    mood: string;
    productivity: string;
  };
  planner: {
    workout: string;
    diet: string;
    focus: string;
  };
  recommendations: {
    good: string;
    caution: string;
    alert: string;
  };
}

type Severity = 'Mild' | 'Moderate' | 'Severe';
interface LoggedSymptom {
  name: string;
  severity: Severity;
}

const SYMPTOM_EMOJIS: Record<string, string> = {
  'Bloating': '🎈',
  'Fatigue': '🥱',
  'Cravings': '🍫',
  'Food Cravings': '🍫',
  'Headache': '🤕',
  'Mood Swings': '🎭',
  'Mood Changes': '🎭',
  'Insomnia': '👀',
  'Anxiety': '😰',
  'Back Pain': '💥',
  'Nausea': '🤢',
  'Cramping': '⚡',
  'Acne': '🔴',
  'Tender Breasts': '🌸',
  'Low Libido': '💔',
  'Irritability': '😠',
  'Muscle Weakness': '🥀',
  'Sleep Issues': '🛌',
  'Brain Fog': '🌫️',
  'Low Energy': '🪫',
  'Stress': '😫'
};

const getSymptomChipStyle = (severity?: Severity) => {
  switch (severity) {
    case 'Mild':
      return 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400';
    case 'Moderate':
      return 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400';
    case 'Severe':
      return 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 hover:border-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.12)]';
    default:
      return 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700';
  }
};

// Helper: returns YYYY-MM-DD in local time (avoids UTC off-by-one-day bug)
const toLocalDateString = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Helper: parse a YYYY-MM-DD string as a local-time date (not UTC)
const parseLocalDate = (dateStr: string): Date => {
  const [yyyy, mm, dd] = dateStr.split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
};

export function Hormones() {
  const { user } = useAppContext();
  const isFemale = user?.gender === 'female';

  const [insights, setInsights] = useState<AIInsightData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logDate, setLogDate] = useState(toLocalDateString(new Date()));
  const [selectedSymptoms, setSelectedSymptoms] = useState<LoggedSymptom[]>([]);
  const [energyLevel, setEnergyLevel] = useState(70);
  const [moodLevel, setMoodLevel] = useState(80);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [logError, setLogError] = useState<string | null>(null);

  const [fullProfile, setFullProfile] = useState<any>(null);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [cycleHistory, setCycleHistory] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const cycleLength = fullProfile?.hormonal?.averageCycleLength || 28;
  const periodLength = fullProfile?.hormonal?.averagePeriodLength || 5;

  const [showLogModal, setShowLogModal] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [selectedLogDate, setSelectedLogDate] = useState<Date>(new Date());
  const [selectedLogDateStr, setSelectedLogDateStr] = useState<string>(toLocalDateString(new Date()));
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [daySymptoms, setDaySymptoms] = useState<LoggedSymptom[]>([]);

  const fetchDashboardData = async () => {
    try {
      setProfileLoading(true);
      // Fetch both profile and active cycle
      const [profileRes, cycleRes] = await Promise.all([
        apiCall(API_ENDPOINTS.USER.PROFILE),
        apiCall(API_ENDPOINTS.HORMONES.CYCLE)
      ]);

      if (profileRes.data?.profile) {
        setFullProfile(profileRes.data.profile);
      }

      if (cycleRes.data?.currentCycle) {
        setActiveCycle(cycleRes.data.currentCycle);
        const startDate = new Date(cycleRes.data.currentCycle.cycleStartDate);
        const todayDate = new Date();
        const diffTime = (todayDate.getTime() - startDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setCurrentDay(diffDays > 0 ? ((diffDays - 1) % cycleLength) + 1 : 1);

        // Populate today's symptoms if already logged in the active cycle
        const todayStr = new Date().toDateString();
        const todaySymptoms = cycleRes.data.currentCycle.symptoms?.filter((s: any) => 
          new Date(s.date).toDateString() === todayStr
        ) || [];
        
        setSelectedSymptoms(todaySymptoms.map((s: any) => ({
          name: s.type,
          severity: (s.severity.charAt(0).toUpperCase() + s.severity.slice(1)) as Severity
        })));
      } else if (profileRes.data?.profile?.hormonal?.lastPeriodDate) {
        // Fallback to profile date if no active cycle found
        const lastDate = new Date(profileRes.data.profile.hormonal.lastPeriodDate);
        const todayDate = new Date();
        const diffTime = (todayDate.getTime() - lastDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setCurrentDay(diffDays > 0 ? ((diffDays - 1) % cycleLength) + 1 : 1);
      }

      if (cycleRes.data?.cycleHistory) {
        setCycleHistory(cycleRes.data.cycleHistory);
      }
    } catch (err) {
      console.error("Failed to sync dashboard data:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogPeriod = async (intensity: string) => {
    setLogError(null);
    try {
      setLogLoading(true);
      // Use YYYY-MM-DD format as required by the API contract
      const dateStr = selectedLogDateStr;
      const response = await fetch('/api/v1/hormones/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          type: 'period-start',
          date: dateStr,
          details: { flowIntensity: intensity.toLowerCase() }
        })
      });

      if (response.ok) {
        setShowLogModal(false);
        setLogError(null);
        // Refresh everything
        await fetchDashboardData();
        await fetchInsights();
      } else {
        const errData = await response.json().catch(() => ({}));
        const msg = errData?.error?.message || errData?.message || `Server error (${response.status})`;
        setLogError(msg);
        console.error("Failed to log period:", msg);
      }
    } catch (error) {
      console.error("Failed to log period:", error);
      setLogError("Network error. Please check your connection.");
    } finally {
      setLogLoading(false);
    }
  };

  const handleSaveSymptoms = async () => {
    try {
      setLogLoading(true);
      const response = await fetch('/api/v1/hormones/symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          date: logDate,
          symptoms: selectedSymptoms.map(s => ({
            name: s.name,
            severity: s.severity.toLowerCase()
          }))
        })
      });

      if (response.ok) {
        await fetchDashboardData();
        await fetchInsights();
      }
    } catch (error) {
      console.error("Failed to save symptoms:", error);
    } finally {
      setLogLoading(false);
    }
  };

  const handleUnlogPeriod = async () => {
    try {
      setLogLoading(true);
      const response = await fetch('/api/v1/hormones/last-cycle', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        // Refresh everything
        await fetchDashboardData();
        await fetchInsights();
      }
    } catch (error) {
      console.error("Failed to unlog period:", error);
    } finally {
      setLogLoading(false);
    }
  };
  
  // Calculate next period date
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  const daysUntilNextPeriod = cycleLength - currentDay;
  const nextPeriodDate = new Date(today);
  nextPeriodDate.setDate(today.getDate() + daysUntilNextPeriod);
  const nextPeriodFormatted = nextPeriodDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  const cycleStartDate = activeCycle 
    ? new Date(activeCycle.cycleStartDate)
    : (() => {
        const d = new Date(today);
        d.setDate(today.getDate() - (currentDay - 1));
        return d;
      })();
  
  // Month navigation state for Smart Phase Visual
  const [monthOffset, setMonthOffset] = useState(0);
  const displayDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const currentMonthName = displayDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();

  const phaseInfo = isFemale ? (
    currentDay <= periodLength ? { phase: 'Menstrual', desc: 'Your body is shedding the uterine lining. Energy might be low. Focus on rest, hydration, and light stretching.', color: 'rose' } :
    currentDay <= Math.floor(cycleLength * 0.43) ? { phase: 'Follicular', desc: 'Estrogen is rising. You might feel a boost in energy and creativity. Great time to start new projects and push harder in workouts.', color: 'blue' } :
    currentDay <= Math.floor(cycleLength * 0.6) ? { phase: 'Ovulation', desc: 'Estrogen peaks and an egg is released. You likely have peak energy and mood. Capitalize on high-intensity training and social events.', color: 'emerald' } :
    { phase: 'Luteal', desc: 'Progesterone rises. You might feel more relaxed or experience PMS symptoms later in the phase. Prioritize strength training and self-care.', color: 'purple' }
  ) : {
    phase: 'Morning Peak', desc: 'Testosterone levels are typically highest in the morning. This is the optimal time for heavy lifting, focused work, and demanding cognitive tasks.', color: 'blue'
  };

  const getHormoneTrend = (hormone: 'estrogen' | 'progesterone' | 'testosterone') => {
    if (!isFemale) return { status: 'Stable', icon: <ArrowRight className="w-5 h-5 text-slate-400" /> };
    
    if (hormone === 'estrogen') {
      if (currentDay <= periodLength) return { status: 'Low / Rising', icon: <TrendingUp className="w-5 h-5 text-emerald-500" /> };
      if (currentDay <= Math.floor(cycleLength * 0.46)) return { status: 'Rising Fast', icon: <TrendingUp className="w-5 h-5 text-emerald-500" /> };
      if (currentDay <= Math.floor(cycleLength * 0.54)) return { status: 'PEAK', icon: <Zap className="w-5 h-5 text-yellow-500" /> };
      return { status: 'Falling', icon: <TrendingDown className="w-5 h-5 text-rose-500" /> };
    }
    if (hormone === 'progesterone') {
      if (currentDay <= Math.floor(cycleLength * 0.5)) return { status: 'Baseline', icon: <ArrowRight className="w-5 h-5 text-slate-400" /> };
      if (currentDay <= Math.floor(cycleLength * 0.78)) return { status: 'Rising', icon: <TrendingUp className="w-5 h-5 text-emerald-500" /> };
      return { status: 'Falling', icon: <TrendingDown className="w-5 h-5 text-rose-500" /> };
    }
    return { status: 'Stable', icon: <ArrowRight className="w-5 h-5 text-slate-400" /> };
  };

  const getDynamicHistory = () => {
    const formatOptions = { month: 'short', day: 'numeric' } as const;

    // --- Build history items from REAL backend data ---
    if (cycleHistory && cycleHistory.length > 0) {
      // Sort newest-first
      const sorted = [...cycleHistory].sort((a, b) =>
        new Date(b.cycleStartDate).getTime() - new Date(a.cycleStartDate).getTime()
      );

      return sorted.slice(0, 6).map((c: any) => {
        // Parse dates as LOCAL time to avoid UTC off-by-one errors
        const start = parseLocalDate(
          typeof c.cycleStartDate === 'string'
            ? c.cycleStartDate.split('T')[0]
            : toLocalDateString(new Date(c.cycleStartDate))
        );
        const hasEnd = !!(c.cycleEndDate);
        const isCurrent = !hasEnd;

        let rangeStr = '';
        let displayLength = c.cycleLength;

        if (isCurrent) {
          // Active cycle — show start to today
          const todayFmt = new Date().toLocaleDateString('default', formatOptions);
          const estEnd = new Date(start);
          estEnd.setDate(start.getDate() + (cycleLength - 1));
          rangeStr = `${start.toLocaleDateString('default', formatOptions)} – Present (Est. ends ${estEnd.toLocaleDateString('default', formatOptions)})`;
          // Calculate days so far
          const msPerDay = 1000 * 60 * 60 * 24;
          displayLength = Math.floor((new Date().setHours(0,0,0,0) - start.setHours(0,0,0,0)) / msPerDay) + 1;
        } else {
          // Completed cycle — cycleEndDate is the START of the NEXT cycle, so last day = cycleEndDate - 1
          const endRaw = parseLocalDate(
            typeof c.cycleEndDate === 'string'
              ? c.cycleEndDate.split('T')[0]
              : toLocalDateString(new Date(c.cycleEndDate))
          );
          const lastDay = new Date(endRaw);
          lastDay.setDate(endRaw.getDate() - 1);
          rangeStr = `${start.toLocaleDateString('default', formatOptions)} – ${lastDay.toLocaleDateString('default', formatOptions)}`;
          displayLength = c.cycleLength || Math.round(
            (endRaw.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        // Build symptoms string from real data
        const uniqueSymptomNames: string[] = Array.from(
          new Set((c.symptoms || []).map((s: any) =>
            (s.type || s.name || '').charAt(0).toUpperCase() + (s.type || s.name || '').slice(1)
          ))
        ).filter(Boolean).slice(0, 4) as string[];
        const symptomsStr = uniqueSymptomNames.length > 0
          ? uniqueSymptomNames.join(', ')
          : 'None logged';

        return {
          month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
          startDateStr: rangeStr,
          length: displayLength,
          symptoms: symptomsStr,
          isCurrent,
          isPredicted: false
        };
      });
    }

    // --- No real history: show placeholder predicted cycles ---
    const anchorDate = fullProfile?.hormonal?.lastPeriodDate
      ? parseLocalDate(fullProfile.hormonal.lastPeriodDate.split('T')[0])
      : new Date();

    return Array.from({ length: 3 }, (_, i) => {
      const start = new Date(anchorDate);
      start.setDate(anchorDate.getDate() - i * cycleLength);
      const end = new Date(start);
      end.setDate(start.getDate() + cycleLength - 1);
      const isCurrent = i === 0;
      const rangeStr = isCurrent
        ? `${start.toLocaleDateString('default', formatOptions)} – Present (Est. ends ${end.toLocaleDateString('default', formatOptions)})`
        : `${start.toLocaleDateString('default', formatOptions)} – ${end.toLocaleDateString('default', formatOptions)} (Estimated)`;

      return {
        month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
        startDateStr: rangeStr,
        length: cycleLength,
        symptoms: 'No data — log your symptoms',
        isCurrent,
        isPredicted: !isCurrent
      };
    });
  };

  const commonSymptoms = isFemale 
    ? (phaseInfo.phase === 'Luteal' 
      ? ['Bloating', 'Fatigue', 'Cravings', 'Headache', 'Mood Swings', 'Insomnia', 'Anxiety', 'Back Pain', 'Nausea']
      : ['Cramping', 'Fatigue', 'Acne', 'Tender Breasts', 'Headache', 'Bloating', 'Mood Changes', 'Food Cravings'])
    : ['Fatigue', 'Low Libido', 'Irritability', 'Muscle Weakness', 'Sleep Issues', 'Brain Fog', 'Low Energy', 'Stress'];

  const handleToggleSymptom = (symptomName: string, severity: Severity = 'Moderate') => {
    setSelectedSymptoms(prev => {
      const exists = prev.find(s => s.name === symptomName);
      if (exists) {
        if (exists.severity === severity) {
          return prev.filter(s => s.name !== symptomName); // Remove if clicking same severity
        }
        return prev.map(s => s.name === symptomName ? { ...s, severity } : s); // Update severity
      }
      return [...prev, { name: symptomName, severity }]; // Add new
    });
  };

  const handleCycleSymptom = (symptomName: string) => {
    setSelectedSymptoms(prev => {
      const exists = prev.find(s => s.name === symptomName);
      if (!exists) {
        return [...prev, { name: symptomName, severity: 'Mild' }];
      } else if (exists.severity === 'Mild') {
        return prev.map(s => s.name === symptomName ? { ...s, severity: 'Moderate' } : s);
      } else if (exists.severity === 'Moderate') {
        return prev.map(s => s.name === symptomName ? { ...s, severity: 'Severe' } : s);
      } else {
        return prev.filter(s => s.name !== symptomName);
      }
    });
  };

  const fetchInsights = async () => {
    setIsAnalyzing(true);
    try {
      // Call backend API with AI service (Ollama)
      const response = await fetch('/api/v1/hormones/insights', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Transform backend response to AIInsightData format
      if (result.data) {
        setInsights({
          status: result.data.status || "Normal",
          analysis: result.data.analysis || "Your current state aligns well with expected patterns.",
          warnings: result.data.warnings || [],
          actionableSteps: result.data.recommendations || ["Maintain consistent sleep schedule.", "Incorporate light stretching."],
          insights: {
            energy: result.data.insights?.energy || "Best time for light workouts or active recovery.",
            nutrition: result.data.insights?.nutrition || "Increase magnesium intake to help with potential fatigue.",
            mood: result.data.insights?.mood || "You may experience higher emotional sensitivity today.",
            productivity: result.data.insights?.productivity || "Focus on routine tasks; avoid high cognitive load if feeling fatigued."
          },
          planner: {
            workout: result.data.planner?.workout || "Light yoga or walking",
            diet: result.data.planner?.diet || "Iron and magnesium-rich foods",
            focus: result.data.planner?.focus || "Reflection and low-stress tasks"
          },
          recommendations: {
            good: result.data.recommendations?.good || "Increase water intake",
            caution: result.data.recommendations?.caution || "Avoid HIIT workouts today",
            alert: result.data.recommendations?.alert || "Ensure 8 hours of sleep tonight"
          }
        });
      } else {
        throw new Error('No insights received');
      }
    } catch (error: any) {
      console.error("Error fetching AI insights:", error?.message || error?.toString() || error);
      // Fallback to default insights
      const phaseFallbacks: Record<string, any> = {
        Menstrual: {
          energy: "Rest and recover. Low intensity movement only.",
          nutrition: "Focus on iron-rich foods and warm liquids.",
          mood: "May feel introspective or low energy.",
          productivity: "Ideal for planning and reflection.",
          good: "Herbal teas & meditation", caution: "High intensity training", alert: "Cramping reported"
        },
        Follicular: {
          energy: "Strength building. Scale up intensity.",
          nutrition: "Complex carbs and probiotic foods.",
          mood: "Rising confidence and creativity.",
          productivity: "Start new projects now.",
          good: "High-fiber diet", caution: "Excess caffeine", alert: "Skin may be sensitive"
        },
        Ovulation: {
          energy: "Peak performance! High intensity HIIT.",
          nutrition: "Light, fresh foods and hydration.",
          mood: "Social, outgoing, and communicative.",
          productivity: "Presentations and meetings.",
          good: "Social interactions", caution: "Skipping meals", alert: "High libido"
        },
        Luteal: {
          energy: "Steady state cardio or yoga.",
          nutrition: "Magnesium and healthy fats.",
          mood: "Nurturing but potentially moody.",
          productivity: "Task completion and organization.",
          good: "Dark chocolate (magnesium)", caution: "Processed sugar", alert: "Bloating reported"
        }
      };

      const fallback = phaseFallbacks[phaseInfo.phase] || phaseFallbacks.Follicular;

      setInsights({
        status: "Normal",
        analysis: `You are in your ${phaseInfo.phase} phase. ${phaseInfo.desc}`,
        warnings: ["No significant issues detected."],
        actionableSteps: ["Stay consistent with your hydration.", "Maintain your current routine."],
        insights: {
          energy: fallback.energy,
          nutrition: fallback.nutrition,
          mood: fallback.mood,
          productivity: fallback.productivity
        },
        planner: {
          workout: phaseInfo.phase === 'Ovulation' ? "HIIT Training" : "Steady Recovery",
          diet: fallback.nutrition,
          focus: fallback.productivity
        },
        recommendations: {
          good: fallback.good,
          caution: fallback.caution,
          alert: fallback.alert
        }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFemale, user?.age]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 relative min-h-screen">
      {/* Background Gradient Wash */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-indigo-50/60 via-purple-50/60 to-pink-50/60" />

      {/* Header */}
      <header className="relative z-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-pink-600 to-rose-500 tracking-tight">
          {isFemale ? "Cycle Intelligence Dashboard" : "Hormonal Intelligence"}
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Predictive, adaptive, and personalized hormonal guidance.</p>
      </header>

      {/* HERO: Dynamic Cycle Status Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full rounded-[2rem] p-5 sm:p-8 bg-gradient-to-r from-purple-100/80 via-pink-100/80 to-emerald-50/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(236,72,153,0.15)] overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex flex-wrap items-center gap-3">
              {phaseInfo.phase} Phase 
              <span className="text-pink-500 text-xl font-semibold bg-white/50 px-3 py-1 rounded-full shadow-sm">Day {currentDay}</span>
              {isFemale && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200/50 rounded-full shadow-sm animate-in fade-in zoom-in slide-in-from-left-4 duration-700">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    Probable Today: {
                      phaseInfo.phase === 'Menstrual' ? "Low Energy, Cramps" :
                      phaseInfo.phase === 'Follicular' ? "High Energy, Focus" :
                      phaseInfo.phase === 'Ovulation' ? "Peak Energy, Libido" :
                      "Mood Swings, Bloating"
                    }
                  </span>
                </div>
              )}
              {isFemale && (
                <div className="ml-auto flex items-center gap-2">
                  {currentDay === 1 && (
                    <button
                      onClick={handleUnlogPeriod}
                      disabled={logLoading}
                      className="px-4 py-2 text-rose-500 font-bold hover:text-rose-600 transition-colors text-sm"
                      title="Undo last period log"
                    >
                      Undo
                    </button>
                  )}
                </div>
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              {isFemale && (
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-sm border border-white">
                  <Calendar className="w-5 h-5 text-pink-500" />
                  <span className="font-bold text-slate-700">Next Period: {nextPeriodFormatted}</span>
                </div>
              )}
              {isFemale && (
                <button
                  onClick={() => {
                    setSelectedLogDate(new Date());
                    setShowLogModal(true);
                  }}
                  className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 active:scale-95 transition-all text-white px-5 py-2.5 rounded-full shadow-md font-bold cursor-pointer"
                >
                  <Droplet className="w-4 h-4 text-white fill-current animate-pulse" />
                  <span>Log Period Start</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-white shadow-sm max-w-md w-full md:w-auto">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-inner">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-1">AI Insight</h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {isAnalyzing ? "Analyzing current state..." : phaseInfo.desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT: Symptom Logging (col-span-3) */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Symptom Logging */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/50 backdrop-blur-xl rounded-[2rem] p-7 border border-white/60 shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <List className="w-5 h-5 text-pink-500" /> Log Symptoms
              </h3>
              <button 
                onClick={handleSaveSymptoms} 
                disabled={logLoading || selectedSymptoms.length === 0}
                className="text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logLoading ? "Saving..." : "Save Today"}
              </button>
            </div>
            
            <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Tap to cycle: Mild → Mod → Severe → Off</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {commonSymptoms.map(sym => {
                const selectedSymptom = selectedSymptoms.find(s => s.name === sym);
                const severity = selectedSymptom?.severity;
                const emoji = SYMPTOM_EMOJIS[sym] || '🤒';
                const chipStyle = getSymptomChipStyle(severity);

                return (
                  <button
                    key={sym}
                    onClick={() => handleCycleSymptom(sym)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all active:scale-95 shadow-sm min-h-[82px] cursor-pointer",
                      chipStyle
                    )}
                  >
                    <span className="text-2xl mb-1">{emoji}</span>
                    <span className="text-xs font-bold tracking-tight leading-tight">{sym}</span>
                    {severity && (
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded-md",
                        severity === 'Mild' ? 'bg-emerald-200 text-emerald-800' :
                        severity === 'Moderate' ? 'bg-amber-200 text-amber-800' :
                        'bg-rose-200 text-rose-800'
                      )}>
                        {severity}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Hormone Trends */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/50 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-sm"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-500" /> Hormone Trends
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col p-3 bg-white/80 rounded-2xl border border-slate-100 shadow-sm group relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estrogen</span>
                  <div className="relative">
                    <Info className="w-4 h-4 text-slate-400 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl z-50 pointer-events-none">
                      Primary female sex hormone. Regulates menstrual cycle, supports bone health, and affects mood and energy levels.
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-slate-800">{getHormoneTrend('estrogen').status}</span>
                  <div className="p-2 bg-slate-50 rounded-full">{getHormoneTrend('estrogen').icon}</div>
                </div>
              </div>
              <div className="flex flex-col p-3 bg-white/80 rounded-2xl border border-slate-100 shadow-sm group relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progesterone</span>
                  <div className="relative">
                    <Info className="w-4 h-4 text-slate-400 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl z-50 pointer-events-none">
                      Prepares uterus for pregnancy and maintains it. Calming hormone that can cause drowsiness and mood changes.
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-slate-800">{getHormoneTrend('progesterone').status}</span>
                  <div className="p-2 bg-slate-50 rounded-full">{getHormoneTrend('progesterone').icon}</div>
                </div>
              </div>
              <div className="flex flex-col p-3 bg-white/80 rounded-2xl border border-slate-100 shadow-sm group relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Testosterone</span>
                  <div className="relative">
                    <Info className="w-4 h-4 text-slate-400 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl z-50 pointer-events-none">
                      Primary male sex hormone present in both sexes. Affects muscle mass, bone density, libido, and energy levels.
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-slate-800">{getHormoneTrend('testosterone').status}</span>
                  <div className="p-2 bg-slate-50 rounded-full">{getHormoneTrend('testosterone').icon}</div>
                </div>
              </div>
            </div>
          </motion.div>



        </div>

        {/* CENTER: Smart Cycle Visual (col-span-6) */}
        <div className="lg:col-span-6 space-y-8">
          
          {/* Smart Phase Visual (Calendar) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/50 backdrop-blur-xl rounded-[2rem] p-8 border border-white/60 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-purple-500" /> Smart Phase Visual
                </h3>
                <p className="text-sm font-bold text-slate-500 mt-1">{currentMonthName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setMonthOffset(prev => Math.max(prev - 1, -7))}
                  disabled={monthOffset <= -7}
                  className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <span className="text-xs font-bold text-slate-500 px-2 min-w-[60px] text-center">
                  {monthOffset === 0 ? 'Current' : displayDate.toLocaleString('default', { month: 'short' })}
                </span>
                <button 
                  onClick={() => setMonthOffset(prev => Math.min(prev + 1, 7))}
                  disabled={monthOffset >= 7}
                  className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
                {monthOffset !== 0 && (
                  <button 
                    onClick={() => setMonthOffset(0)}
                    className="ml-2 text-xs font-bold text-purple-600 hover:text-purple-800 underline"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-xs font-bold text-slate-400 text-center pb-2">{d}</div>
              ))}
              {/* Empty cells for days before start of month */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const cellDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
                
                // Calculate difference in days safely
                const utcCell = Date.UTC(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
                const utcStart = Date.UTC(cycleStartDate.getFullYear(), cycleStartDate.getMonth(), cycleStartDate.getDate());
                const diffDays = Math.floor((utcCell - utcStart) / (1000 * 60 * 60 * 24));
                
                const dayOfCycle = (((diffDays % cycleLength) + cycleLength) % cycleLength) + 1;
                let phaseClass = "bg-white/60 text-slate-600 border-slate-100 hover:bg-slate-50";
                
                if (isFemale) {
                  if (dayOfCycle >= 1 && dayOfCycle <= periodLength) phaseClass = "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100"; // Menstrual
                  else if (dayOfCycle > periodLength && dayOfCycle <= Math.floor(cycleLength * 0.43)) phaseClass = "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"; // Follicular
                  else if (dayOfCycle > Math.floor(cycleLength * 0.43) && dayOfCycle <= Math.floor(cycleLength * 0.6)) phaseClass = "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"; // Ovulation
                  else phaseClass = "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100"; // Luteal
                }

                const isToday = monthOffset === 0 && day === today.getDate();
                const isSelected = selectedLogDate && 
                                  selectedLogDate.getDate() === day && 
                                  selectedLogDate.getMonth() === displayDate.getMonth() &&
                                  selectedLogDate.getFullYear() === displayDate.getFullYear();

                return (
                  <div 
                    key={day} 
                    onClick={() => {
                      const d = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
                      setSelectedDayDate(d);
                      // Pre-populate the log date so the modal opens with the correct calendar date
                      setSelectedLogDate(d);
                      setSelectedLogDateStr(toLocalDateString(d));
                      // Pull symptoms for this day if any
                      const dayLogs = activeCycle?.symptoms?.filter((s: any) => 
                        new Date(s.date).toDateString() === d.toDateString()
                      ) || [];
                      setDaySymptoms(dayLogs.map((s: any) => ({ name: s.type, severity: s.severity })));
                      setShowDayModal(true);
                    }}
                    className={cn(
                      "aspect-square rounded-2xl border flex flex-col items-center justify-center relative cursor-pointer transition-all duration-300 group", 
                      phaseClass, 
                      isToday && "ring-2 ring-offset-2 ring-purple-500 shadow-lg scale-110 z-10 font-extrabold bg-white",
                      isSelected && "ring-2 ring-rose-500 ring-offset-2 scale-105 z-20 shadow-xl bg-white"
                    )}
                  >
                    <span className={cn("text-sm sm:text-base", (isToday || isSelected) ? "font-extrabold" : "font-bold")}>{day}</span>
                    {isFemale && dayOfCycle === 14 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shadow-sm" />}
                    
                    {/* Log Prompt */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Droplet className="w-3 h-3 text-rose-400 fill-current" />
                    </div>

                    {/* Hover Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block w-32 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl z-50 text-center pointer-events-none">
                      {isSelected ? "Log Period Start" : `Day ${dayOfCycle} • ${
                        dayOfCycle <= periodLength ? 'Menstrual' : dayOfCycle <= Math.floor(cycleLength * 0.43) ? 'Follicular' : dayOfCycle <= Math.floor(cycleLength * 0.6) ? 'Ovulation' : 'Luteal'
                      }`}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {isFemale && (
              <div className="flex flex-wrap gap-4 mt-8 justify-center text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2 group relative cursor-help">
                  <div className="w-3 h-3 rounded-full bg-rose-200 border border-rose-300" /> Period
                  <div className="absolute bottom-full mb-2 hidden group-hover:block w-40 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl z-50 text-center pointer-events-none">
                    Days 1-5: Menstrual phase. Uterine lining sheds. Focus on rest and iron-rich foods.
                  </div>
                </div>
                <div className="flex items-center gap-2 group relative cursor-help">
                  <div className="w-3 h-3 rounded-full bg-blue-200 border border-blue-300" /> Follicular
                  <div className="absolute bottom-full mb-2 hidden group-hover:block w-40 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl z-50 text-center pointer-events-none">
                    Days 6-11: Follicular phase. Estrogen rises. Energy increases, great for new projects.
                  </div>
                </div>
                <div className="flex items-center gap-2 group relative cursor-help">
                  <div className="w-3 h-3 rounded-full bg-emerald-200 border border-emerald-300" /> Ovulation
                  <div className="absolute bottom-full mb-2 hidden group-hover:block w-40 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl z-50 text-center pointer-events-none">
                    Days 12-16: Ovulation phase. Peak fertility and energy. Best time for social activities.
                  </div>
                </div>
                <div className="flex items-center gap-2 group relative cursor-help">
                  <div className="w-3 h-3 rounded-full bg-purple-200 border border-purple-300" /> Luteal
                  <div className="absolute bottom-full mb-2 hidden group-hover:block w-40 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl z-50 text-center pointer-events-none">
                    Days 17-28: Luteal phase. Progesterone rises. May experience PMS, focus on self-care.
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Cycle History */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/50 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-500" /> Cycle History
              </h3>
              <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200 shadow-sm">
                Pattern: Stable
              </span>
            </div>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-purple-200 before:via-pink-200 before:to-transparent">
              {getDynamicHistory().map((item, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-4 border-white shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10",
                    item.isCurrent ? "bg-emerald-100 text-emerald-500" :
                    item.isPredicted ? "bg-slate-100 text-slate-400" :
                    idx === 0 ? "bg-purple-100 text-purple-500" : "bg-pink-100 text-pink-500"
                  )}>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-extrabold text-slate-800 text-sm flex flex-col gap-0.5">
                        <span className="text-slate-800 text-sm font-black">{item.month}</span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tight">{item.startDateStr}</span>
                      </div>
                      <div className={cn(
                        "text-xs font-bold px-2 py-1 rounded-md",
                        item.isCurrent ? "bg-emerald-50 text-emerald-600 border border-emerald-100/60" :
                        item.isPredicted ? "bg-slate-100/60 text-slate-500 border border-slate-200/50" :
                        idx === 0 ? "bg-purple-50 text-purple-600" : "bg-pink-50 text-pink-600"
                      )}>
                        {item.isCurrent ? 'Active' : item.isPredicted ? 'Estimated' : `${item.length} Days`}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                      Symptoms: {item.symptoms}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>



        </div>

        {/* RIGHT: AI Insights & Planner (col-span-3) */}
        <div className="lg:col-span-3 space-y-8 h-full">
          
          {/* AI Insights Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/50 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-sm h-full flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500"/> AI Insights
              </h3>
              {isAnalyzing && <RefreshCw className="w-4 h-4 text-purple-500 animate-spin" />}
            </div>
            
            <div className="space-y-4 flex-grow">
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 shadow-sm transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-4 h-4 text-emerald-600"/> 
                  <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Energy</span>
                </div>
                <p className="text-sm text-emerald-900 font-medium">{insights?.insights?.energy || "Best time for light workouts."}</p>
              </div>
              
              <div className="p-4 bg-orange-50/80 rounded-2xl border border-orange-100 shadow-sm transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-2 mb-2">
                  <Apple className="w-4 h-4 text-orange-600"/> 
                  <span className="text-xs font-extrabold text-orange-800 uppercase tracking-wider">Nutrition</span>
                </div>
                <p className="text-sm text-orange-900 font-medium">{insights?.insights?.nutrition || "Increase magnesium intake."}</p>
              </div>
              
              <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-100 shadow-sm transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-2 mb-2">
                  <Smile className="w-4 h-4 text-purple-600"/> 
                  <span className="text-xs font-extrabold text-purple-800 uppercase tracking-wider">Mood</span>
                </div>
                <p className="text-sm text-purple-900 font-medium">{insights?.insights?.mood || "Higher emotional sensitivity expected."}</p>
              </div>

              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 shadow-sm transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-blue-600"/> 
                  <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">Productivity</span>
                </div>
                <p className="text-sm text-blue-900 font-medium">{insights?.insights?.productivity || "Avoid high cognitive load tasks."}</p>
              </div>

              {/* Recommendations */}
              <div className="pt-4 border-t border-slate-100 mt-auto">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Recommendations
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100 shadow-sm">
                    <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Good Habit</span>
                    <p className="text-xs font-medium text-emerald-800 mt-1">{insights?.recommendations?.good || "Increase iron intake (period approaching)"}</p>
                  </div>
                  <div className="p-3 bg-yellow-50/80 rounded-xl border border-yellow-100 shadow-sm">
                    <span className="text-[10px] font-extrabold text-yellow-700 uppercase tracking-wider">Caution</span>
                    <p className="text-xs font-medium text-yellow-800 mt-1">{insights?.recommendations?.caution || "Avoid HIIT workouts today"}</p>
                  </div>
                  <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-100 shadow-sm">
                    <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">Alert</span>
                    <p className="text-xs font-medium text-rose-800 mt-1">{insights?.recommendations?.alert || "Hydration is lower than usual"}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          </div>
      </div>

      {/* Elegant Intensity Popup */}
      <AnimatePresence>
        {showLogModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-white/40"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Droplet className="w-8 h-8 text-rose-500 fill-current animate-pulse" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800">Log Period Start</h3>
              </div>

              <div className="mb-6 text-left">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Period Start Date</label>
                <input
                  type="date"
                  value={selectedLogDateStr}
                  max={toLocalDateString(new Date())}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      // Parse as local date to avoid UTC timezone shift
                      setSelectedLogDateStr(val);
                      setSelectedLogDate(parseLocalDate(val));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all cursor-pointer shadow-inner"
                />
              </div>

              {logError && (
                <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {logError}
                </div>
              )}

              <div className="space-y-3">
                {['Light', 'Moderate', 'Heavy'].map((intensity) => (
                  <button
                    key={intensity}
                    disabled={logLoading}
                    onClick={() => handleLogPeriod(intensity)}
                    className="w-full py-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-between px-6 group"
                  >
                    <span>{intensity}</span>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowLogModal(false)}
                className="w-full mt-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Back to details
              </button>
            </motion.div>
          </motion.div>
        )}

        {showDayModal && selectedDayDate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-white/40 overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                 <div>
                  <h3 className="text-2xl font-black text-slate-800">Day Intelligence</h3>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
                    {selectedDayDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <button onClick={() => setShowDayModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Historical Log Section */}
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <History className="w-3 h-3" /> 
                    {selectedDayDate > new Date() ? "Predicted State" : "Recorded History"}
                  </h4>
                  
                  {daySymptoms.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {daySymptoms.map((s, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
                          <Activity className="w-3 h-3 text-pink-500" />
                          <span className="text-xs font-bold text-slate-700">{s.name}</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-black uppercase">
                            {s.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-400 italic">
                      {selectedDayDate > new Date() 
                        ? `Probable: ${
                            selectedDayDate.getDate() % 4 === 0 ? "High Energy, Focus" :
                            selectedDayDate.getDate() % 3 === 0 ? "Cramps, Lower Energy" :
                            "Stable & Balanced"
                          }` 
                        : "No symptoms logged for this date."}
                    </p>
                  )}
                </div>

                {/* AI Advice Pill */}
                <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl border border-pink-100 shadow-inner">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-black text-purple-700 uppercase tracking-widest">Phase Intelligence</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-bold">
                    {selectedDayDate > new Date() 
                      ? "Prepare for your rising estrogen. Excellent time for social networking and challenging gym sessions."
                      : "We noticed consistent fatigue recorded here. Analyzing these patterns for your next cycle cycle intelligence report."}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    onClick={() => {
                      setShowDayModal(false);
                      setSelectedLogDate(selectedDayDate);
                      setSelectedLogDateStr(toLocalDateString(selectedDayDate));
                      setShowLogModal(true);
                    }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Log Period Start
                  </button>
                  <button 
                    onClick={() => setShowDayModal(false)}
                    className="w-full py-3 text-xs font-black text-slate-400 hover:text-slate-600 tracking-widest uppercase"
                  >
                    Close Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
