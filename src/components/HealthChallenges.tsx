import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Timer, 
  Play, 
  Save, 
  X, 
  ChevronRight, 
  Info, 
  Target, 
  Activity, 
  Clock,
  Users,
  Zap,
  TrendingUp,
  Calendar,
  Award,
  RotateCcw,
  Pause,
  SkipForward,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { 
  HealthChallenge, 
  ChallengeExercise, 
  getRandomChallenges, 
  getChallengeById 
} from '@/data/healthChallenges';

interface ChallengePlayerState {
  challenge: HealthChallenge | null;
  currentExerciseIndex: number;
  timeLeft: number;
  isPaused: boolean;
  playerState: 'pre' | 'active' | 'post' | 'completed';
  completedExercises: number[];
  exerciseStartTime: number;
  totalElapsedTime: number;
}

export function HealthChallenges() {
  const { user } = useAppContext();
  const [view, setView] = useState<'list' | 'player' | 'saved'>('list');
  
  // Challenges List State
  const [dailyChallenges, setDailyChallenges] = useState<HealthChallenge[]>([]);
  const [savedChallenges, setSavedChallenges] = useState<HealthChallenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<HealthChallenge | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ChallengeExercise | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');

  // Player State
  const [playerState, setPlayerState] = useState<ChallengePlayerState>({
    challenge: null,
    currentExerciseIndex: 0,
    timeLeft: 0,
    isPaused: false,
    playerState: 'pre',
    completedExercises: [],
    exerciseStartTime: 0,
    totalElapsedTime: 0
  });

  // Load daily challenges on mount
  useEffect(() => {
    const challenges = getRandomChallenges(5);
    setDailyChallenges(challenges);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playerState.playerState === 'active' && !playerState.isPaused && playerState.timeLeft > 0) {
      interval = setInterval(() => {
        setPlayerState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
          totalElapsedTime: prev.totalElapsedTime + 1
        }));
      }, 1000);
    } else if (playerState.timeLeft === 0 && playerState.playerState === 'active') {
      handleNextExercise();
    }
    return () => clearInterval(interval);
  }, [playerState.playerState, playerState.isPaused, playerState.timeLeft]);

  const startChallenge = (challenge: HealthChallenge) => {
    setPlayerState({
      challenge,
      currentExerciseIndex: 0,
      timeLeft: challenge.exercises[0]?.duration || 60,
      isPaused: false,
      playerState: 'pre',
      completedExercises: [],
      exerciseStartTime: 0,
      totalElapsedTime: 0
    });
    setView('player');
  };

  const beginActiveChallenge = () => {
    if (!playerState.challenge) return;
    
    setPlayerState(prev => ({
      ...prev,
      playerState: 'active',
      exerciseStartTime: Date.now()
    }));
  };

  const handleNextExercise = () => {
    if (!playerState.challenge) return;
    
    const currentExercise = playerState.challenge.exercises[playerState.currentExerciseIndex];
    const completedExerciseIndex = playerState.currentExerciseIndex;
    
    setPlayerState(prev => ({
      ...prev,
      completedExercises: [...prev.completedExercises, completedExerciseIndex],
      currentExerciseIndex: prev.currentExerciseIndex + 1,
      timeLeft: prev.challenge.exercises[prev.currentExerciseIndex + 1]?.duration || 60
    }));

    if (playerState.currentExerciseIndex >= playerState.challenge.exercises.length - 1) {
      setPlayerState(prev => ({ ...prev, playerState: 'completed' }));
    }
  };

  const handlePauseResume = () => {
    setPlayerState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleRestart = () => {
    if (!playerState.challenge) return;
    
    setPlayerState({
      challenge: playerState.challenge,
      currentExerciseIndex: 0,
      timeLeft: playerState.challenge.exercises[0]?.duration || 60,
      isPaused: false,
      playerState: 'pre',
      completedExercises: [],
      exerciseStartTime: 0,
      totalElapsedTime: 0
    });
  };

  const handleSaveChallenge = () => {
    if (!playerState.challenge) return;
    
    if (!savedChallenges.find(c => c.id === playerState.challenge.id)) {
      setSavedChallenges([playerState.challenge, ...savedChallenges]);
    }
  };

  const handleDeleteSaved = (id: string) => {
    setSavedChallenges(savedChallenges.filter(c => c.id !== id));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-blue-600 bg-blue-100';
      case 'Advanced': return 'text-orange-600 bg-orange-100';
      case 'Expert': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Core': return <Target className="w-5 h-5" />;
      case 'Lower Body': return <Activity className="w-5 h-5" />;
      case 'Upper Body': return <Zap className="w-5 h-5" />;
      case 'HIIT': return <Flame className="w-5 h-5" />;
      case 'Mobility': return <RotateCcw className="w-5 h-5" />;
      case 'Posture': return <Users className="w-5 h-5" />;
      case 'Back': return <TrendingUp className="w-5 h-5" />;
      case 'Full Body': return <Activity className="w-5 h-5" />;
      case 'Functional': return <Award className="w-5 h-5" />;
      case 'Calisthenics': return <Activity className="w-5 h-5" />;
      case 'Recovery': return <Clock className="w-5 h-5" />;
      case 'Hybrid': return <Activity className="w-5 h-5" />;
      case 'Fat Loss': return <Flame className="w-5 h-5" />;
      case 'Balance': return <Activity className="w-5 h-5" />;
      case 'Power': return <Zap className="w-5 h-5" />;
      case 'Yoga': return <Activity className="w-5 h-5" />;
      case 'Cardio': return <Timer className="w-5 h-5" />;
      case 'Plyometric': return <Activity className="w-5 h-5" />;
      case 'Flexibility': return <RotateCcw className="w-5 h-5" />;
      case 'Endurance': return <Timer className="w-5 h-5" />;
      case 'Morning': return <Calendar className="w-5 h-5" />;
      case 'Evening': return <Clock className="w-5 h-5" />;
      case 'Resistance Band': return <Activity className="w-5 h-5" />;
      case 'Bodyweight': return <Users className="w-5 h-5" />;
      case 'Walking': return <Activity className="w-5 h-5" />;
      case 'Weekly Plan': return <Calendar className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const renderChallengeList = () => (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-orange-600 tracking-tight">
          Daily Health Challenges 💪
        </h1>
        <p className="text-slate-600 font-medium mt-2">
          5 randomized challenges every day to push your limits and achieve your fitness goals
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Core">Core</option>
              <option value="Lower Body">Lower Body</option>
              <option value="Upper Body">Upper Body</option>
              <option value="HIIT">HIIT</option>
              <option value="Mobility">Mobility</option>
              <option value="Cardio">Cardio</option>
              <option value="Yoga">Yoga</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Difficulty</label>
            <select 
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
          <div>
            <button 
              onClick={() => {
                const challenges = getRandomChallenges(5);
                setDailyChallenges(challenges);
              }}
              className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Refresh Challenges
            </button>
          </div>
        </div>
      </div>

      {/* Daily Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dailyChallenges
          .filter(challenge => 
            (filterCategory === 'All' || challenge.category === filterCategory) &&
            (filterDifficulty === 'All' || challenge.difficulty === filterDifficulty)
          )
          .map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setSelectedChallenge(challenge)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 line-clamp-2 pr-2">{challenge.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn("text-xs font-bold px-2 py-1 rounded-md", getDifficultyColor(challenge.difficulty))}>
                      {challenge.difficulty}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      {getCategoryIcon(challenge.category)}
                      <span>{challenge.category}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    startChallenge(challenge);
                  }}
                  className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Timer className="w-4 h-4" />
                  <span>{challenge.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Target className="w-4 h-4" />
                  <span>{challenge.objective}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Activity className="w-4 h-4" />
                  <span>{challenge.exercises.length} exercises</span>
                </div>
                {challenge.equipment.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Info className="w-4 h-4" />
                    <span>{challenge.equipment.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedChallenge(challenge);
                  }}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Info className="w-4 h-4" /> View Details
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveChallenge();
                  }}
                  className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </motion.div>
          ))}
      </div>

      {/* Saved Challenges */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Save className="w-6 h-6 text-emerald-500" /> Saved Challenges
          </h2>
          <button 
            onClick={() => setView('list')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
              view === 'saved' ? "bg-slate-800 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            )}
          >
            {view === 'saved' ? 'Back to Daily' : 'View Saved'}
          </button>
        </div>

        {savedChallenges.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2xl border-dashed border-slate-200">
            <Save className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No saved challenges yet.</p>
            <p className="text-sm text-slate-400">Save challenges you like to quickly access them later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedChallenges.map((challenge, index) => (
              <div key={challenge.id} className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-lg transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 line-clamp-2 pr-2">{challenge.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("text-xs font-bold px-2 py-1 rounded-md", getDifficultyColor(challenge.difficulty))}>
                        {challenge.difficulty}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        {getCategoryIcon(challenge.category)}
                        <span>{challenge.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => startChallenge(challenge)}
                      className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSaved(challenge.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Timer className="w-4 h-4" />
                    <span>{challenge.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Target className="w-4 h-4" />
                    <span>{challenge.objective}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Activity className="w-4 h-4" />
                    <span>{challenge.exercises.length} exercises</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderChallengePlayer = () => {
    if (!playerState.challenge) return null;
    
    const currentExercise = playerState.challenge.exercises[playerState.currentExerciseIndex];
    const progress = ((playerState.currentExerciseIndex) / playerState.challenge.exercises.length) * 100;
    const completedCount = playerState.completedExercises.length;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col">
        {/* Header */}
        <div className="p-6 flex justify-between items-center bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-10">
          <button onClick={() => setView('list')} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold">{playerState.challenge.title}</h2>
            <p className="text-xs text-slate-400 font-medium">
              Exercise {playerState.currentExerciseIndex + 1} of {playerState.challenge.exercises.length} • {completedCount} completed
            </p>
          </div>
          <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <Save className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-800 w-full">
          <motion.div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500" 
            initial={{ width: 0 }} 
            animate={{ width: `${progress}%` }} 
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl rounded-full pointer-events-none" />

          <AnimatePresence mode="wait">
            {playerState.playerState === 'pre' && currentExercise && (
              <motion.div 
                key="pre" 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 1.1 }} 
                className="text-center space-y-8 z-10 max-w-2xl mx-auto"
              >
                <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto border border-purple-500/30 mb-6">
                  <Target className="w-10 h-10 text-purple-500" />
                </div>
                <div className="space-y-6">
                  <div>
                    <h1 className="text-4xl font-black mb-2">Get Ready!</h1>
                    <p className="text-slate-300 font-medium text-lg">Your challenge is about to begin.</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-sm mx-auto">
                    <div className="text-left space-y-4">
                      <div className="text-center mb-4">
                        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                          <Target className="w-3 h-3 text-slate-300" />
                          <span className="font-bold text-slate-200 text-sm">{currentExercise.name}</span>
                        </div>
                        <div className="text-lg text-slate-200 mb-2">
                          {currentExercise.sets && `${currentExercise.sets} sets × `}
                          {currentExercise.reps}
                          {currentExercise.duration && ` • ${currentExercise.duration}s`}
                        </div>
                      </div>
                      <div className="text-slate-300 text-sm leading-relaxed">
                        <p className="font-medium text-slate-200 mb-2">Exercise Instructions:</p>
                        <ul className="space-y-2">
                          {currentExercise.instructions.map((instruction, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{instruction}</span>
                            </li>
                          ))}
                        </ul>
                        {currentExercise.tips && currentExercise.tips.length > 0 && (
                          <div className="mt-4">
                            <p className="font-medium text-slate-200 mb-2">Pro Tips:</p>
                            <ul className="space-y-1">
                              {currentExercise.tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <button onClick={() => setView('list')} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-bold transition-colors flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Challenges
                  </button>
                  <button onClick={beginActiveChallenge} className="px-12 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-full text-xl font-black transition-all shadow-[0_0_40px_rgba(147,51,234,0.4)] hover:scale-105 flex items-center gap-3 mx-auto">
                    <Play className="w-6 h-6 fill-current" /> START CHALLENGE
                  </button>
                </div>
              </motion.div>
            )}

            {playerState.playerState === 'active' && currentExercise && (
              <motion.div 
                key="active" 
                initial={{ opacity: 0, x: 50 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -50 }} 
                className="w-full max-w-4xl flex flex-col items-center z-10"
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 mb-4">
                    <Target className="w-4 h-4 text-slate-300" />
                    <span className="font-bold text-slate-200">{currentExercise.name}</span>
                  </div>
                  <div className="text-lg text-slate-200 mb-2">
                    {currentExercise.sets && `Set ${playerState.currentExerciseIndex + 1} of ${currentExercise.sets}`}
                    {currentExercise.reps && ` • ${currentExercise.reps}`}
                  </div>
                </div>

                {/* Timer */}
                <div className="relative w-32 h-32 mb-8">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="60" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="transparent" />
                    <motion.circle 
                      cx="64" cy="64" r="60" 
                      stroke="#8b5cf6" 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 60}
                      strokeDashoffset={2 * Math.PI * 60 * (1 - (playerState.timeLeft / currentExercise.duration))}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black font-mono tracking-tighter">{formatTime(playerState.timeLeft)}</span>
                  </div>
                </div>

                {/* Exercise Details */}
                <div className="text-center max-w-sm">
                  <p className="text-slate-300 text-sm leading-relaxed bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    {currentExercise.instructions[0]}
                  </p>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center gap-6 mt-8">
                  <button 
                    onClick={() => {
                      setPlayerState(prev => ({ ...prev, timeLeft: currentExercise.duration, isPaused: false }));
                    }}
                    className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                  <button onClick={handlePauseResume} className="w-20 h-20 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_30px_rgba(147,51,234,0.3)]">
                    {playerState.isPaused ? <Play className="w-8 h-8 fill-current ml-1" /> : <Pause className="w-8 h-8 fill-current" />}
                  </button>
                  <button onClick={handleNextExercise} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                    <SkipForward className="w-6 h-6 fill-current" />
                  </button>
                </div>
              </motion.div>
            )}

            {playerState.playerState === 'completed' && (
              <motion.div 
                key="completed" 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="text-center space-y-8 z-10 max-w-2xl mx-auto"
              >
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 mb-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <div>
                  <h1 className="text-4xl font-black mb-2">Challenge Complete! 🎉</h1>
                  <p className="text-slate-300 font-medium text-lg">Amazing job completing your challenge!</p>
                  <div className="mt-4 text-slate-200">
                    <p className="font-medium">Total Time: {formatTime(playerState.totalElapsedTime)}</p>
                    <p className="font-medium">Exercises Completed: {playerState.completedExercises.length + 1}</p>
                  </div>
                </div>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => setView('list')} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-bold transition-colors flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Challenges
                  </button>
                  <button onClick={handleRestart} className="px-10 py-4 bg-white text-slate-900 rounded-full text-lg font-black transition-all hover:bg-slate-200 hover:scale-105">
                    Retry Challenge
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderChallengeDetailsModal = () => {
    if (!selectedChallenge) return null;

    return (
      <AnimatePresence>
        {selectedChallenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] overflow-hidden w-full max-w-4xl max-h-[80vh] shadow-2xl"
            >
              <div className="relative p-8 bg-gradient-to-br from-purple-500 to-pink-500">
                <button 
                  onClick={() => setSelectedChallenge(null)}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-[10px] font-bold text-white bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md uppercase tracking-wider">{selectedChallenge.category}</span>
                    <span className="text-[10px] font-bold text-slate-800 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md uppercase tracking-wider">{selectedChallenge.difficulty}</span>
                    {selectedChallenge.equipment.map(eq => (
                      <span key={eq} className="text-[10px] font-bold text-amber-800 bg-amber-100/90 backdrop-blur-sm px-2 py-1 rounded-md uppercase tracking-wider">{eq}</span>
                    ))}
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{selectedChallenge.title}</h2>
                  <p className="text-purple-100 text-sm mb-4">{selectedChallenge.objective}</p>
                </div>
              </div>
              
              <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4">Challenge Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Timer className="w-4 h-4" />
                        <span>{selectedChallenge.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Target className="w-4 h-4" />
                        <span>{selectedChallenge.objective}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Activity className="w-4 h-4" />
                        <span>{selectedChallenge.exercises.length} exercises</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Info className="w-4 h-4" />
                        <span>{selectedChallenge.equipment.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4">Exercises</h3>
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                      {selectedChallenge.exercises.map((exercise, index) => (
                        <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <h4 className="font-bold text-slate-800 text-lg mb-2">{exercise.name}</h4>
                          <div className="flex gap-4 mb-3 text-sm text-slate-600">
                            {exercise.sets && <span>{exercise.sets} sets</span>}
                            {exercise.reps && <span>{exercise.reps}</span>}
                            {exercise.duration && <span>{exercise.duration}s</span>}
                            {exercise.rest && <span>{exercise.rest}s rest</span>}
                          </div>
                          <div>
                            <p className="font-medium text-slate-700 mb-2">Instructions:</p>
                            <ol className="space-y-1">
                              {exercise.instructions.map((instruction, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                  <span className="font-bold text-purple-600">{i + 1}.</span>
                                  <span>{instruction}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                          {exercise.tips && exercise.tips.length > 0 && (
                            <div>
                              <p className="font-medium text-slate-700 mb-2">Tips:</p>
                              <ul className="space-y-1">
                                {exercise.tips.map((tip, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      startChallenge(selectedChallenge);
                      setSelectedChallenge(null);
                    }}
                    className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Start Challenge
                  </button>
                  <button 
                    onClick={() => {
                      if (!savedChallenges.find(c => c.id === selectedChallenge.id)) {
                        setSavedChallenges([selectedChallenge, ...savedChallenges]);
                      }
                      setSelectedChallenge(null);
                    }}
                    className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Challenge
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-300/20 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-pink-300/20 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-emerald-300/20 blur-[120px] rounded-full mix-blend-multiply" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {view === 'list' && renderChallengeList()}
        {view === 'player' && renderChallengePlayer()}
      </div>

      {/* Challenge Details Modal */}
      {renderChallengeDetailsModal()}
    </div>
  );
}
