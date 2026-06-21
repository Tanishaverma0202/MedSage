import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Wind, BookHeart, Smile, Frown, Meh, Zap, Coffee, Battery, Lock, Edit3, X, Play, Pause, PauseIcon, SkipBack, SkipForward, Volume2, Moon, TrendingUp, Heart, Archive, Mic, ChevronRight, Plus, ArrowRight, Sparkles, AlertCircle, Unlock, Trash2, StopCircle, Loader2, RotateCcw, Activity, CheckCircle, History as HistoryIcon, Fingerprint, Layers, Target, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MedSageLogo } from '@/components/MedSageLogo';
import Markdown from 'react-markdown';
import { apiCall, API_ENDPOINTS } from '@/api';
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// These types are missing in the build environment but exist in the browser
type SpeechRecognition = any;
type SpeechRecognitionEvent = any;
type SpeechRecognitionErrorEvent = any;
type SpeechRecognitionResultList = any;

const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly slower, calmer voice rate for meditation
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
};

// Plays a triple meditation bell chime using the Web Audio API
const playMeditationBell = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playBell = (startTime: number, frequency: number, gain: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, startTime);

      // Attack
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.02);
      // Sustain then long decay — meditation bowl feel
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 3.5);

      osc.start(startTime);
      osc.stop(startTime + 3.5);
    };

    const now = ctx.currentTime;
    // Three bells: root, fifth, octave — classic Tibetan bowl chord
    playBell(now,        528, 0.5);  // First bell
    playBell(now + 1.2,  660, 0.45); // Second bell
    playBell(now + 2.4,  792, 0.4);  // Third bell (gentle fade-out)

    // Close context after all bells finish
    setTimeout(() => ctx.close(), 7000);
  } catch (e) {
    // Silently ignore — Web Audio unavailable
  }
};

// Plays an alarming sound using the Web Audio API
const playAlarmSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playBeep = (startTime: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, startTime); // Higher pitch for alarm
      osc.frequency.setValueAtTime(1100, startTime + 0.1); // Two-tone alarm

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gainNode.gain.setValueAtTime(0.4, startTime + 0.2);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.25);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    };

    const now = ctx.currentTime;
    // 4 quick alarming double-beeps
    playBeep(now);
    playBeep(now + 0.4);
    playBeep(now + 0.8);
    playBeep(now + 1.2);

    setTimeout(() => ctx.close(), 3000);
  } catch (e) {
    // Silently ignore
  }
};

// ============================================================================
// MEDITATION TYPES & DATA
// ============================================================================

interface MeditationStep {
  id: number;
  title: string;
  instruction: string;
  duration: number;
  type: 'breathing' | 'body_scan' | 'visualization' | 'affirmation' | 'silence';
}

interface MeditationSessionType {
  id: string;
  title: string;
  description: string;
  duration: number;
  icon: any;
  color: string;
  bgColor: string;
  steps: MeditationStep[];
  breathingPattern?: {
    inhale: number;
    hold: number;
    exhale: number;
    holdEmpty: number;
  };
}

const meditationSessions: MeditationSessionType[] = [
  {
    id: 'box_breathing',
    title: 'Box Breathing',
    description: 'Calm your mind with this 4-4-4-4 pattern used by Navy SEALs for focus and stress relief.',
    duration: 5,
    icon: Wind,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    breathingPattern: { inhale: 4, hold: 4, exhale: 4, holdEmpty: 4 },
    steps: [
      { id: 1, title: 'Get Comfortable', instruction: 'Sit comfortably with your back straight. Close your eyes or soften your gaze. Take a moment to settle in.', duration: 30, type: 'silence' },
      { id: 2, title: 'Begin Box Breathing', instruction: 'Inhale deeply through your nose for 4 counts... Hold for 4... Exhale for 4... Hold empty for 4...', duration: 120, type: 'breathing' },
      { id: 3, title: 'Maintain Rhythm', instruction: 'Continue the pattern: Inhale (4) → Hold (4) → Exhale (4) → Hold (4). Find your natural rhythm.', duration: 180, type: 'breathing' },
      { id: 4, title: 'Deepening', instruction: 'With each breath, feel your body becoming more relaxed and present. Let go of any tension.', duration: 120, type: 'breathing' },
      { id: 5, title: 'Closing', instruction: 'Take one final deep breath. Slowly open your eyes when you\'re ready, carrying this calm with you.', duration: 30, type: 'silence' }
    ]
  },
  {
    id: 'body_scan',
    title: 'Body Scan',
    description: 'Release physical tension by systematically bringing awareness to each part of your body.',
    duration: 10,
    icon: Sparkles,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    steps: [
      { id: 1, title: 'Settle In', instruction: 'Lie down or sit comfortably. Take 3 deep breaths to center yourself and arrive in this moment.', duration: 60, type: 'silence' },
      { id: 2, title: 'Feet & Legs', instruction: 'Bring gentle attention to your feet. Notice any sensations without judgment. Allow them to relax completely.', duration: 90, type: 'body_scan' },
      { id: 3, title: 'Hips & Lower Back', instruction: 'Move awareness to your hips and lower back. Release any tension you find. Let them melt into support.', duration: 90, type: 'body_scan' },
      { id: 4, title: 'Stomach & Chest', instruction: 'Notice your belly rising and falling with breath. Let your chest soften and open like a flower blooming.', duration: 90, type: 'body_scan' },
      { id: 5, title: 'Hands & Arms', instruction: 'Scan your hands, fingers, arms, and shoulders. Let them become heavy, warm, and deeply relaxed.', duration: 90, type: 'body_scan' },
      { id: 6, title: 'Neck & Face', instruction: 'Release tension in your neck, jaw, and forehead. Soften the muscles around your eyes. Let your face be peaceful.', duration: 90, type: 'body_scan' },
      { id: 7, title: 'Full Body Awareness', instruction: 'Feel your entire body as one connected, relaxed whole. You are present, grounded, and at peace.', duration: 120, type: 'silence' },
      { id: 8, title: 'Gentle Return', instruction: 'Wiggle your fingers and toes. Take a deep breath. When ready, gently open your eyes.', duration: 60, type: 'silence' }
    ]
  },
  {
    id: '478_breathing',
    title: '4-7-8 Breathing',
    description: 'Dr. Weil\'s technique for deep relaxation, reducing anxiety, and falling asleep faster.',
    duration: 5,
    icon: Moon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    breathingPattern: { inhale: 4, hold: 7, exhale: 8, holdEmpty: 0 },
    steps: [
      { id: 1, title: 'Preparation', instruction: 'Exhale completely through your mouth, making a gentle whoosh sound. Let all the air out.', duration: 30, type: 'silence' },
      { id: 2, title: 'First Cycle', instruction: 'Inhale through nose (4 counts) → Hold (7 counts) → Exhale through mouth (8 counts). Repeat this pattern.', duration: 240, type: 'breathing' },
      { id: 3, title: 'Continue Pattern', instruction: 'Maintain the 4-7-8 rhythm. Feel your body drifting into deep relaxation with each cycle.', duration: 180, type: 'breathing' },
      { id: 4, title: 'Deep Rest', instruction: 'Let your breath return to its natural rhythm. Rest in the profound calm you\'ve created.', duration: 60, type: 'silence' }
    ]
  },
  {
    id: 'loving_kindness',
    title: 'Loving Kindness',
    description: 'Cultivate compassion and positive emotions through directed well-wishes for yourself and others.',
    duration: 10,
    icon: Heart,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    steps: [
      { id: 1, title: 'Center Yourself', instruction: 'Sit comfortably, close your eyes, and take 3 deep breaths. Feel your heart space.', duration: 45, type: 'silence' },
      { id: 2, title: 'Self-Love', instruction: 'Repeat silently: "May I be happy. May I be healthy. May I be at peace." Feel these wishes for yourself.', duration: 120, type: 'affirmation' },
      { id: 3, title: 'Loved One', instruction: 'Think of someone you love deeply. Send them wishes: "May you be happy. May you be healthy. May you be at peace."', duration: 120, type: 'affirmation' },
      { id: 4, title: 'Neutral Person', instruction: 'Think of someone neutral - a neighbor, cashier, or passerby. Send them the same loving wishes.', duration: 120, type: 'affirmation' },
      { id: 5, title: 'Difficult Person', instruction: 'Think of someone challenging. Offer them compassion: "May you be at peace. May you find happiness."', duration: 120, type: 'affirmation' },
      { id: 6, title: 'All Beings', instruction: 'Extend to all beings everywhere: "May all beings be happy. May all beings be at peace."', duration: 120, type: 'affirmation' },
      { id: 7, title: 'Integration', instruction: 'Feel the warmth in your heart. Know this compassion is always available to you and all beings.', duration: 75, type: 'silence' }
    ]
  },
  {
    id: 'mindful_observation',
    title: '5-4-3-2-1 Grounding',
    description: 'Anchor your attention to the present moment through systematic sensory awareness.',
    duration: 5,
    icon: Coffee,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    steps: [
      { id: 1, title: '5 Things You See', instruction: 'Look around and notice 5 things you can see. Name them silently to yourself.', duration: 30, type: 'visualization' },
      { id: 2, title: '4 Things You Touch', instruction: 'Notice 4 things you can physically feel right now - your clothes, the chair, air on skin.', duration: 30, type: 'visualization' },
      { id: 3, title: '3 Things You Hear', instruction: 'Listen carefully. Identify 3 sounds you can hear, near or far.', duration: 30, type: 'visualization' },
      { id: 4, title: '2 Things You Smell', instruction: 'Notice 2 scents around you. If you can\'t detect any, name 2 favorite scents.', duration: 30, type: 'visualization' },
      { id: 5, title: '1 Thing You Taste', instruction: 'Notice 1 taste in your mouth, or simply take a sip of water and notice it.', duration: 30, type: 'visualization' },
      { id: 6, title: 'Breath Anchor', instruction: 'Close your eyes. Focus entirely on the sensation of breath at your nostrils.', duration: 120, type: 'breathing' },
      { id: 7, title: 'Expand Awareness', instruction: 'Notice sounds around you without labeling them. Just pure listening.', duration: 60, type: 'silence' },
      { id: 8, title: 'Return', instruction: 'Take a deep breath. Open your eyes and carry this presence forward into your day.', duration: 30, type: 'silence' }
    ]
  }
];

// ============================================================================
// MEDITATION SESSION COMPONENT
// ============================================================================

function MeditationSession({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [selectedSession, setSelectedSession] = useState<MeditationSessionType | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'holdEmpty'>('inhale');
  const [showInstructions, setShowInstructions] = useState(true);
  const [sessionCountdown, setSessionCountdown] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breathingRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (breathingRef.current) clearTimeout(breathingRef.current);
    };
  }, []);

  // Use a ref for handleNextStep to avoid stale closures in setInterval
  const handleNextStepRef = useRef<() => void>(() => {});
  
  // Update the ref whenever the function changes
  useEffect(() => {
    handleNextStepRef.current = handleNextStep;
  });

  // Main timer effect
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Clear interval immediately when time runs out
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            handleNextStepRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying]);

  // Breathing animation effect
  useEffect(() => {
    if (isPlaying && selectedSession?.breathingPattern &&
      selectedSession.steps[currentStepIndex]?.type === 'breathing') {
      const pattern = selectedSession.breathingPattern;
      let phase: 'inhale' | 'hold' | 'exhale' | 'holdEmpty' = 'inhale';

      const runBreathingCycle = () => {
        setBreathingPhase(phase);

        if (phase === 'inhale' && pattern.inhale > 0) speak('Inhale');
        else if (phase === 'hold' && pattern.hold > 0) speak('Hold');
        else if (phase === 'exhale' && pattern.exhale > 0) speak('Exhale');
        else if (phase === 'holdEmpty' && pattern.holdEmpty > 0) speak('Pause');

        const duration = phase === 'inhale' ? pattern.inhale * 1000 :
          phase === 'hold' ? pattern.hold * 1000 :
            phase === 'exhale' ? pattern.exhale * 1000 :
              pattern.holdEmpty * 1000;

        breathingRef.current = setTimeout(() => {
          if (phase === 'inhale') phase = 'hold';
          else if (phase === 'hold') phase = 'exhale';
          else if (phase === 'exhale') phase = 'holdEmpty';
          else phase = 'inhale';

          runBreathingCycle();
        }, duration);
      };

      runBreathingCycle();

      return () => {
        if (breathingRef.current) clearTimeout(breathingRef.current);
      };
    }
  }, [isPlaying, currentStepIndex, selectedSession]);

  // Voice prompts for step instructions
  useEffect(() => {
    if (isPlaying && selectedSession) {
      const step = selectedSession.steps[currentStepIndex];
      if (step) {
        if (step.type === 'breathing') {
          speak(`Step ${currentStepIndex + 1}: ${step.title}. Prepare to breathe.`);
        } else {
          speak(`Step ${currentStepIndex + 1}: ${step.title}. ${step.instruction}`);
        }
      }
    }
  }, [currentStepIndex, selectedSession, isPlaying]);

  // Voice prompt on session complete
  useEffect(() => {
    if (isComplete && selectedSession) {
      playAlarmSound(); // Use alarming sound as requested
      const title = selectedSession.title;
      // Delay voice prompt slightly so the alarm plays first
      setTimeout(() => {
        speak(
          `Your ${title} meditation has ended. ` +
          `Meditation complete.`
        );
      }, 1800);
    }
  }, [isComplete]);

  // Cancel speech when pausing
  useEffect(() => {
    if (!isPlaying) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isPlaying]);

  const handleStartSession = (session: MeditationSessionType) => {
    setSelectedSession(session);
    setCurrentStepIndex(0);
    setTimeLeft(session.steps[0].duration);
    setIsPlaying(false);
    setIsComplete(false);
  };

  const handleNextStep = () => {
    if (!selectedSession) return;

    // Clear any running timer before switching steps
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (currentStepIndex < selectedSession.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setTimeLeft(selectedSession.steps[nextIndex].duration);
    } else {
      setIsComplete(true);
      setIsPlaying(false);
      onComplete();
    }
  };

  const handlePreviousStep = () => {
    if (!selectedSession || currentStepIndex === 0) return;

    // Clear any running timer before switching steps
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const prevIndex = currentStepIndex - 1;
    setCurrentStepIndex(prevIndex);
    setTimeLeft(selectedSession.steps[prevIndex].duration);
    setIsPlaying(false);
  };

  const startCountdownThenPlay = () => {
    if (sessionCountdown !== null) return; // already counting
    setSessionCountdown(3);
    speak('3');
    let count = 3;
    const tick = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(tick);
        setSessionCountdown(null);
        setIsPlaying(true);
        speak('Begin');
      } else {
        setSessionCountdown(count);
        speak(String(count));
      }
    }, 1000);
  };

  const togglePlay = () => {
    if (!isPlaying && sessionCountdown === null) {
      startCountdownThenPlay();
    } else {
      // Pause — cancel any running countdown
      setSessionCountdown(null);
      setIsPlaying(false);
    }
  };

  const resetStep = () => {
    if (selectedSession) {
      setTimeLeft(selectedSession.steps[currentStepIndex].duration);
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case 'inhale': return 'Inhale deeply...';
      case 'hold': return 'Hold your breath...';
      case 'exhale': return 'Exhale slowly...';
      case 'holdEmpty': return 'Pause...';
      default: return '';
    }
  };

  // Session selection view
  if (!selectedSession) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Guided Meditation</h3>
          <p className="text-sm text-slate-600">Choose a session to begin your practice</p>
        </div>

        <div className="grid gap-3 max-h-[320px] overflow-y-auto pr-2">
          {meditationSessions.map((session) => {
            const IconComponent = session.icon;
            return (
              <button
                key={session.id}
                onClick={() => handleStartSession(session)}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-slate-300 hover:shadow-md transition-all text-left bg-white"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", session.bgColor)}>
                  <IconComponent className={cn("w-6 h-6", session.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-800">{session.title}</h4>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {session.duration} min
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{session.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 text-slate-500 hover:text-slate-700 font-medium"
        >
          Close
        </button>
      </div>
    );
  }

  // Completion view
  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center"
        >
          <Sparkles className="w-12 h-12 text-emerald-500" />
        </motion.div>

        <div>
          <h4 className="text-2xl font-bold text-slate-800 mb-2">Session Complete!</h4>
          <p className="text-slate-600">You\'ve completed {selectedSession.title}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl max-w-xs">
          <p className="text-sm text-slate-600 italic">
            "Peace comes from within. Do not seek it without."
          </p>
          <p className="text-xs text-slate-500 mt-2">— Buddha</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setSelectedSession(null)}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
          >
            Choose Another
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Active session view
  const currentStep = selectedSession.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / selectedSession.steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedSession(null)}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm font-medium"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">
            Step {currentStepIndex + 1} of {selectedSession.steps.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-orange-400 to-amber-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Main content */}
      <div className="text-center space-y-6">
        {/* Breathing Animation */}
        {currentStep.type === 'breathing' && selectedSession.breathingPattern && (
          <div className="relative h-48 flex items-center justify-center">
            <motion.div
              className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 opacity-50"
              animate={{
                scale: breathingPhase === 'inhale' ? 1.5 :
                  breathingPhase === 'hold' ? 1.5 :
                    breathingPhase === 'exhale' ? 1 : 1,
                opacity: breathingPhase === 'hold' ? 0.7 : 0.5
              }}
              transition={{
                duration: breathingPhase === 'inhale' ? selectedSession.breathingPattern.inhale :
                  breathingPhase === 'exhale' ? selectedSession.breathingPattern.exhale : 0.3,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-orange-300 to-amber-300 opacity-60"
              animate={{
                scale: breathingPhase === 'inhale' ? 1.4 :
                  breathingPhase === 'hold' ? 1.4 :
                    breathingPhase === 'exhale' ? 1 : 1,
              }}
              transition={{
                duration: breathingPhase === 'inhale' ? selectedSession.breathingPattern.inhale :
                  breathingPhase === 'exhale' ? selectedSession.breathingPattern.exhale : 0.3,
                ease: "easeInOut"
              }}
            />
            <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center shadow-lg">
              {isPlaying ? (
                <span className="text-white font-bold text-lg">
                  {breathingPhase === 'inhale' && <Wind className="w-8 h-8" />}
                  {breathingPhase === 'hold' && <Pause className="w-8 h-8" />}
                  {breathingPhase === 'exhale' && <Wind className="w-8 h-8 rotate-180" />}
                  {breathingPhase === 'holdEmpty' && <Pause className="w-8 h-8" />}
                </span>
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </div>
          </div>
        )}

        {/* Icon for non-breathing steps */}
        {currentStep.type !== 'breathing' && (
          <div className="h-32 flex items-center justify-center">
            <div className={cn("w-24 h-24 rounded-2xl flex items-center justify-center", selectedSession.bgColor)}>
              {currentStep.type === 'body_scan' && <Sparkles className={cn("w-12 h-12", selectedSession.color)} />}
              {currentStep.type === 'affirmation' && <Heart className={cn("w-12 h-12", selectedSession.color)} />}
              {currentStep.type === 'visualization' && <Brain className={cn("w-12 h-12", selectedSession.color)} />}
              {currentStep.type === 'silence' && <Moon className={cn("w-12 h-12", selectedSession.color)} />}
            </div>
          </div>
        )}

        {/* Step title */}
        <h4 className="text-xl font-bold text-slate-800">{currentStep.title}</h4>

        {/* Instruction */}
        {showInstructions && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-slate-600 max-w-sm mx-auto leading-relaxed"
          >
            {currentStep.type === 'breathing' && selectedSession.breathingPattern ?
              getBreathingInstruction() :
              currentStep.instruction
            }
          </motion.p>
        )}

        {/* Timer */}
        <div className="py-4">
          <div className="text-5xl font-black text-slate-800 tabular-nums">
            {formatTime(timeLeft)}
          </div>
          <p className="text-xs text-slate-500 mt-2">remaining in this step</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePreviousStep}
            disabled={currentStepIndex === 0}
            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center transition-all"
          >
            <SkipBack className="w-5 h-5 text-slate-600" />
          </button>

          {sessionCountdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 rounded-2xl backdrop-blur-sm">
              <div key={sessionCountdown} className="flex flex-col items-center gap-2" style={{ animation: 'countdownPop 0.6s ease-out' }}>
                <span className="text-8xl font-black text-white drop-shadow-lg" style={{ textShadow: '0 0 40px rgba(251,146,60,0.8)' }}>
                  {sessionCountdown}
                </span>
                <span className="text-sm font-bold text-orange-300 uppercase tracking-widest">Get Ready</span>
              </div>
            </div>
          )}

          <button
            onClick={togglePlay}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg",
              isPlaying || sessionCountdown !== null
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-orange-500 hover:bg-orange-600"
            )}
          >
            {isPlaying || sessionCountdown !== null ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </button>

          <button
            onClick={handleNextStep}
            disabled={currentStepIndex === selectedSession.steps.length - 1 && timeLeft > 0}
            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center transition-all"
          >
            <SkipForward className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Secondary controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={resetStep}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
          >
            <RotateCcw className="w-3 h-3" /> Reset Step
          </button>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
          >
            {showInstructions ? 'Hide' : 'Show'} Guide
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1 pt-2">
          {selectedSession.steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                // Clear any running timer before switching steps
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                }
                setCurrentStepIndex(idx);
                setTimeLeft(selectedSession.steps[idx].duration);
                setIsPlaying(false);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === currentStepIndex ? "bg-orange-500 w-6" :
                  idx < currentStepIndex ? "bg-orange-300" : "bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ASSESSMENT TYPES & DATA
// ============================================================================

interface AssessmentOption {
  label: string;
  points: number;
}

interface AssessmentQuestion {
  id: string;
  text: string;
  category?: string;
  options: AssessmentOption[];
}

interface AssessmentType {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  questions: AssessmentQuestion[];
}

const getClinicalLabel = (type: string, score: number): string => {
  if (type === 'phq9') {
    if (score <= 4) return 'Minimal Depression';
    if (score <= 9) return 'Mild Depression';
    if (score <= 14) return 'Moderate Depression';
    if (score <= 19) return 'Moderately Severe';
    return 'Severe Depression';
  }
  if (type === 'gad7') {
    if (score <= 4) return 'Minimal Anxiety';
    if (score <= 9) return 'Mild Anxiety';
    if (score <= 14) return 'Moderate Anxiety';
    return 'Severe Anxiety';
  }
  if (type === 'bdi') {
    if (score <= 13) return 'Minimal Depression';
    if (score <= 19) return 'Mild Depression';
    if (score <= 28) return 'Moderate Depression';
    return 'Severe Depression';
  }
  if (type === 'dass21') {
    if (score <= 30) return 'Normal Profile';
    if (score <= 60) return 'Mild/Moderate Stress';
    return 'High Clinical Priority';
  }
  if (type === 'mmpi2') {
    return 'Personality Profile Ready';
  }
  if (['bigfive', 'mbti', 'disc', 'enneagram', 'strengths'].includes(type)) {
    return 'Trait Profile Ready';
  }
  return 'Analyzed';
};

const phq9Options = [
  { label: 'Not at all', points: 0 },
  { label: 'Several days', points: 1 },
  { label: 'More than half the days', points: 2 },
  { label: 'Nearly every day', points: 3 }
];

const dass20Options = [
  { label: 'Did not apply to me at all', points: 0 },
  { label: 'Applied to me to some degree', points: 1 },
  { label: 'Applied to me to a considerable degree', points: 2 },
  { label: 'Applied to me very much', points: 3 }
];

const bigFiveOptions = [
  { label: 'Disagree strongly', points: 1 },
  { label: 'Disagree a little', points: 2 },
  { label: 'Neutral / No Opinion', points: 3 },
  { label: 'Agree a little', points: 4 },
  { label: 'Agree strongly', points: 5 }
];

const mbtiOptions = (a: string, b: string) => [
  { label: a, points: 1 },
  { label: b, points: 2 }
];

const discOptions = [
  { label: 'Never', points: 1 },
  { label: 'Rarely', points: 2 },
  { label: 'Sometimes', points: 3 },
  { label: 'Often', points: 4 }
];

const enneagramOptions = [
  { label: 'Not like me', points: 1 },
  { label: 'A little like me', points: 2 },
  { label: 'Somewhat like me', points: 3 },
  { label: 'Very much like me', points: 4 },
  { label: 'Exactly like me', points: 5 }
];

const mentalAssessments: AssessmentType[] = [
  {
    id: 'bigfive',
    title: 'Big Five Personality (OCEAN)',
    description: 'The standard in academic psychology, measuring Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.',
    icon: Layers,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    questions: [
      { id: 'bf_e_1', category: 'Extraversion', text: 'I see myself as someone who is outgoing, sociable.', options: bigFiveOptions },
      { id: 'bf_a_1', category: 'Agreeableness', text: 'I see myself as someone who is generally trusting.', options: bigFiveOptions },
      { id: 'bf_c_1', category: 'Conscientiousness', text: 'I see myself as someone who does a thorough job.', options: bigFiveOptions },
      { id: 'bf_n_1', category: 'Neuroticism', text: 'I see myself as someone who is relaxed, handles stress well.', options: bigFiveOptions },
      { id: 'bf_o_1', category: 'Openness', text: 'I see myself as someone who has an active imagination.', options: bigFiveOptions },
      { id: 'bf_e_2', category: 'Extraversion', text: 'I see myself as someone who is reserved.', options: bigFiveOptions },
      { id: 'bf_a_2', category: 'Agreeableness', text: 'I see myself as someone who tends to find fault with others.', options: bigFiveOptions },
      { id: 'bf_c_2', category: 'Conscientiousness', text: 'I see myself as someone who tends to be lazy.', options: bigFiveOptions },
      { id: 'bf_n_2', category: 'Neuroticism', text: 'I see myself as someone who gets nervous easily.', options: bigFiveOptions },
      { id: 'bf_o_2', category: 'Openness', text: 'I see myself as someone who has few artistic interests.', options: bigFiveOptions }
    ]
  },
  {
    id: 'mbti',
    title: 'Myers-Briggs Type (MBTI)',
    description: 'Find your 16-type personality profile based on four core preferences.',
    icon: Fingerprint,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    questions: [
      { id: 'mbti_ei_1', category: 'Focus of Energy', text: 'Do you prefer being the center of attention (Extraversion) or being more private (Introversion)?', options: mbtiOptions('Center of Attention', 'More Private') },
      { id: 'mbti_ei_2', category: 'Focus of Energy', text: 'Are you more outgoing/talkative (Extraversion) or calm/reflective (Introversion)?', options: mbtiOptions('Outgoing/Talkative', 'Calm/Reflective') },
      { id: 'mbti_ei_3', category: 'Focus of Energy', text: 'Do you feel energized by social interaction (Extraversion) or by spending time alone (Introversion)?', options: mbtiOptions('Social Interaction', 'Spending time alone') },
      { id: 'mbti_sn_1', category: 'Information Gathering', text: 'Do you focus more on real-world facts (Sensing) or on ideas and possibilities (Intuition)?', options: mbtiOptions('Facts/Details', 'Ideas/Possibilities') },
      { id: 'mbti_sn_2', category: 'Information Gathering', text: 'Are you more practical and literal (Sensing) or imaginative and figurative (Intuition)?', options: mbtiOptions('Practical/Literal', 'Imaginative/Figurative') },
      { id: 'mbti_sn_3', category: 'Information Gathering', text: 'Do you value common sense (Sensing) or creative innovation (Intuition)?', options: mbtiOptions('Common Sense', 'Creative Innovation') },
      { id: 'mbti_tf_1', category: 'Decision Making', text: 'Do you decide based on logic and analysis (Thinking) or on personal values and feelings (Feeling)?', options: mbtiOptions('Logic/Analysis', 'Values/Feelings') },
      { id: 'mbti_tf_2', category: 'Decision Making', text: 'Are you more objective/firm (Thinking) or empathetic/harmony-focused (Feeling)?', options: mbtiOptions('Objective/Firm', 'Empathetic/Harmony') },
      { id: 'mbti_tf_3', category: 'Decision Making', text: 'Do you prioritize truth (Thinking) or people (Feeling)?', options: mbtiOptions('Absolute Truth', 'Individual Feelings') },
      { id: 'mbti_jp_1', category: 'Lifestyle Selection', text: 'Do you prefer having things decided and organized (Judging) or keeping your options open (Perceiving)?', options: mbtiOptions('Decided/Organized', 'Open/Flexible') },
      { id: 'mbti_jp_2', category: 'Lifestyle Selection', text: 'Are you more disciplined/structured (Judging) or easygoing/spontaneous (Perceiving)?', options: mbtiOptions('Disciplined/Structured', 'Easygoing/Spontaneous') },
      { id: 'mbti_jp_3', category: 'Lifestyle Selection', text: 'Do you prefer sticking to a plan (Judging) or adapting as you go (Perceiving)?', options: mbtiOptions('Stick to the plan', 'Adapt as I go') }
    ]
  },
  {
    id: 'disc',
    title: 'DiSC Behavioral Style',
    description: 'Understand your Dominance, Influence, Steadiness, and Conscientiousness in team settings.',
    icon: Target,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    questions: [
      { id: 'disc_d_1', category: 'Dominance', text: 'When working on a task, I am focus mainly on getting immediate results.', options: discOptions },
      { id: 'disc_d_2', category: 'Dominance', text: 'I am comfortable taking risks to achieve my goals.', options: discOptions },
      { id: 'disc_d_3', category: 'Dominance', text: 'I prefer to lead and direct others in group settings.', options: discOptions },
      { id: 'disc_i_1', category: 'Influence', text: 'I enjoy being around people and building social networks.', options: discOptions },
      { id: 'disc_i_2', category: 'Influence', text: 'I find it easy to persuade or motivate people.', options: discOptions },
      { id: 'disc_i_3', category: 'Influence', text: 'I am naturally optimistic and enthusiastic.', options: discOptions },
      { id: 'disc_s_1', category: 'Steadiness', text: 'I prefer stable, predictable environments over fast-paced changes.', options: discOptions },
      { id: 'disc_s_2', category: 'Steadiness', text: 'I am a good listener and value group harmony.', options: discOptions },
      { id: 'disc_s_3', category: 'Steadiness', text: 'I stay calm and patient, even during stressful times.', options: discOptions },
      { id: 'disc_c_1', category: 'Conscientiousness', text: 'I pay close attention to details and accuracy.', options: discOptions },
      { id: 'disc_c_2', category: 'Conscientiousness', text: 'I enjoy analyzing data and solving complex problems.', options: discOptions },
      { id: 'disc_c_3', category: 'Conscientiousness', text: 'I focus on maintaining high standards and quality.', options: discOptions }
    ]
  },
  {
    id: 'enneagram',
    title: 'Enneagram Type',
    description: 'Identifies your core motivations and fears across nine interconnected personality types.',
    icon: CircleDot,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    questions: [
      { id: 'enn_1', category: 'Type 1: Reformer', text: 'I have a strong sense of right and wrong and strive for perfection.', options: enneagramOptions },
      { id: 'enn_2', category: 'Type 2: Helper', text: 'I find great satisfaction in being helpful and needed by others.', options: enneagramOptions },
      { id: 'enn_3', category: 'Type 3: Achiever', text: 'Being successful and appearing competent is extremely important to me.', options: enneagramOptions },
      { id: 'enn_4', category: 'Type 4: Individualist', text: 'I often feel different from others and value my unique personal identity.', options: enneagramOptions },
      { id: 'enn_5', category: 'Type 5: Investigator', text: 'I prefer to observe and analyze world from a distance rather than jump in.', options: enneagramOptions },
      { id: 'enn_6', category: 'Type 6: Loyalist', text: 'I am very aware of potential risks and value loyalty and security.', options: enneagramOptions },
      { id: 'enn_7', category: 'Type 7: Enthusiast', text: 'I am always looking for new experiences and hate feeling limited or bored.', options: enneagramOptions },
      { id: 'enn_8', category: 'Type 8: Challenger', text: 'I am strong, independent, and protective of myself and those I love.', options: enneagramOptions },
      { id: 'enn_9', category: 'Type 9: Peacemaker', text: 'I avoid conflict and value inner peace and outer harmony.', options: enneagramOptions }
    ]
  },
  {
    id: 'strengths',
    title: 'StrengthsFinder (Proxy)',
    description: 'Identify your top natural talents and strengths across 34 core themes.',
    icon: Zap,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    questions: [
      { id: 'str_1', category: 'Executing', text: 'I have the stamina and discipline to work hard until a task is finished.', options: enneagramOptions },
      { id: 'str_2', category: 'Executing', text: 'I am naturally organized and enjoy creating systems for efficiency.', options: enneagramOptions },
      { id: 'str_3', category: 'Influencing', text: 'I enjoy taking charge and can easily persuade others to my viewpoint.', options: enneagramOptions },
      { id: 'str_4', category: 'Influencing', text: 'I find it easy to start conversations with strangers and build rapport.', options: enneagramOptions },
      { id: 'str_5', category: 'Relationship Building', text: 'I am very empathetic and can easily sense the emotions of others.', options: enneagramOptions },
      { id: 'str_6', category: 'Relationship Building', text: 'I enjoy helping others grow and reach their full potential.', options: enneagramOptions },
      { id: 'str_7', category: 'Strategic Thinking', text: 'I am a deep thinker who enjoys analyzing patterns and future possibilities.', options: enneagramOptions },
      { id: 'str_8', category: 'Strategic Thinking', text: 'I have a great curiosity and love learning new things constantly.', options: enneagramOptions },
      { id: 'str_9', category: 'Strategic Thinking', text: 'I can quickly spot relevant patterns and issues in any given scenario.', options: enneagramOptions }
    ]
  },
  {
    id: 'phq9',
    title: 'PHQ-9 Depression Test',
    description: 'The standard 9-item tool for detecting and measuring the severity of depression.',
    icon: Frown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    questions: [
      { id: 'phq1', category: 'Mood & Energy', text: 'Little interest or pleasure in doing things?', options: phq9Options },
      { id: 'phq2', category: 'Mood & Energy', text: 'Feeling down, depressed, or hopeless?', options: phq9Options },
      { id: 'phq3', category: 'Physical Symptoms', text: 'Trouble falling or staying asleep, or sleeping too much?', options: phq9Options },
      { id: 'phq4', category: 'Physical Symptoms', text: 'Feeling tired or having little energy?', options: phq9Options },
      { id: 'phq5', category: 'Physical Symptoms', text: 'Poor appetite or overeating?', options: phq9Options },
      { id: 'phq6', category: 'Cognitive & Emotional', text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down?', options: phq9Options },
      { id: 'phq7', category: 'Cognitive & Emotional', text: 'Trouble concentrating on things, such as reading the newspaper or watching television?', options: phq9Options },
      { id: 'phq8', category: 'Psychomotor State', text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?', options: phq9Options },
      { id: 'phq9', category: 'Acute Concerns', text: 'Thoughts that you would be better off dead or of hurting yourself in some way?', options: phq9Options }
    ]
  },
  {
    id: 'gad7',
    title: 'GAD-7 Anxiety Test',
    description: 'A 7-item questionnaire used to screen for and measure the severity of generalized anxiety.',
    icon: Wind,
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    questions: [
      { id: 'gad1', category: 'Anxiety Symptoms', text: 'Feeling nervous, anxious or on edge?', options: phq9Options },
      { id: 'gad2', category: 'Anxiety Symptoms', text: 'Not being able to stop or control worrying?', options: phq9Options },
      { id: 'gad3', category: 'Anxiety Symptoms', text: 'Worrying too much about different things?', options: phq9Options },
      { id: 'gad4', category: 'Psychosomatic State', text: 'Trouble relaxing?', options: phq9Options },
      { id: 'gad5', category: 'Psychosomatic State', text: 'Being so restless that it is hard to sit still?', options: phq9Options },
      { id: 'gad6', category: 'Mood Reactivity', text: 'Becoming easily annoyed or irritable?', options: phq9Options },
      { id: 'gad7', category: 'Acute Concerns', text: 'Feeling afraid as if something awful might happen?', options: phq9Options }
    ]
  },
  {
    id: 'bdi',
    title: 'Beck Depression Inventory (BDI)',
    description: 'A 21-item, self-report inventory that measures the severity of depression.',
    icon: Activity,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    questions: [
      { id: 'bdi1', text: 'Sadness: Do you feel sad or unhappy?', options: [{label: 'I do not feel sad', points: 0}, {label: 'I feel sad often', points: 1}, {label: 'I am sad all the time', points: 2}, {label: 'I am so sad I can\'t stand it', points: 3}] },
      { id: 'bdi2', text: 'Pessimism: Do you feel discouraged about the future?', options: [{label: 'I am not discouraged', points: 0}, {label: 'I feel discouraged', points: 1}, {label: 'I feel I have nothing to look forward to', points: 2}, {label: 'The future is hopeless', points: 3}] },
      { id: 'bdi3', text: 'Past Failure: Do you feel like a failure?', options: [{label: 'I do not feel like a failure', points: 0}, {label: 'I have failed more than I should', points: 1}, {label: 'I see a lot of failures', points: 2}, {label: 'I am a total failure', points: 3}] },
      { id: 'bdi4', text: 'Loss of Pleasure: Do you still enjoy things?', options: [{label: 'I enjoy things as much as ever', points: 0}, {label: 'I don\'t enjoy things as much', points: 1}, {label: 'I get very little pleasure', points: 2}, {label: 'I can\'t get any pleasure', points: 3}] },
      { id: 'bdi5', text: 'Guilty Feelings: Do you feel guilty?', options: [{label: 'I don\'t feel particularly guilty', points: 0}, {label: 'I feel guilty a good part of the time', points: 1}, {label: 'I feel quite guilty most of the time', points: 2}, {label: 'I feel guilty all the time', points: 3}] },
      { id: 'bdi6', text: 'Punishment Feelings: Do you feel you are being punished?', options: [{label: 'I don\'t feel I am being punished', points: 0}, {label: 'I feel I may be punished', points: 1}, {label: 'I expect to be punished', points: 2}, {label: 'I feel I am being punished', points: 3}] },
      { id: 'bdi7', text: 'Self-Dislike: How do you feel about yourself?', options: [{label: 'My feelings are the same', points: 0}, {label: 'I have lost confidence', points: 1}, {label: 'I am disappointed in myself', points: 2}, {label: 'I hate myself', points: 3}] },
      { id: 'bdi8', text: 'Self-Criticalness: Do you blame yourself for faults?', options: [{label: 'I don\'t criticize myself', points: 0}, {label: 'I am more critical of myself', points: 1}, {label: 'I criticize myself for all my faults', points: 2}, {label: 'I blame myself for everything bad', points: 3}] },
      { id: 'bdi9', text: 'Suicidal Thoughts: Do you have thoughts of killing yourself?', options: [{label: 'I don\'t have any thoughts', points: 0}, {label: 'I have thoughts but wouldn\'t do it', points: 1}, {label: 'I would like to kill myself', points: 2}, {label: 'I would kill myself if I had the chance', points: 3}] },
      { id: 'bdi10', text: 'Crying: Do you cry more than usual?', options: [{label: 'I don\'t cry any more than usual', points: 0}, {label: 'I cry more now than I used to', points: 1}, {label: 'I cry over every little thing', points: 2}, {label: 'I feel like crying but I can\'t', points: 3}] },
      { id: 'bdi11', text: 'Agitation: Are you more restless or wound up?', options: [{label: 'I am no more restless', points: 0}, {label: 'I feel more restless', points: 1}, {label: 'I am so restless it\'s hard to sit still', points: 2}, {label: 'I am so agitated I have to move', points: 3}] },
      { id: 'bdi12', text: 'Loss of Interest: Have you lost interest in people?', options: [{label: 'I haven\'t lost interest', points: 0}, {label: 'I am less interested than usual', points: 1}, {label: 'I have lost most of my interest', points: 2}, {label: 'I have lost all of my interest', points: 3}] },
      { id: 'bdi13', text: 'Indecisiveness: Do you have trouble making decisions?', options: [{label: 'I make decisions as well as ever', points: 0}, {label: 'I find it harder now', points: 1}, {label: 'I have much greater difficulty now', points: 2}, {label: 'I have trouble making any decision', points: 3}] },
      { id: 'bdi14', text: 'Worthlessness: Do you feel worthless?', options: [{label: 'I do not feel worthless', points: 0}, {label: 'I don\'t feel as useful', points: 1}, {label: 'I feel more worthless', points: 2}, {label: 'I feel utterly worthless', points: 3}] },
      { id: 'bdi15', text: 'Loss of Energy: Do you have less energy?', options: [{label: 'I have as much energy as ever', points: 0}, {label: 'I have less energy than I used to', points: 1}, {label: 'I don\'t have enough energy to do much', points: 2}, {label: 'I don\'t have enough energy to do anything', points: 3}] },
      { id: 'bdi16', text: 'Changes in Sleep: Have you had changes in sleep?', options: [{label: 'No change', points: 0}, {label: 'I sleep somewhat more/less', points: 1}, {label: 'I sleep a lot more/less', points: 2}, {label: 'I sleep most of the day/night', points: 3}] },
      { id: 'bdi17', text: 'Irritability: Are you more irritable?', options: [{label: 'No more irritable than usual', points: 0}, {label: 'I am more irritable', points: 1}, {label: 'I am much more irritable', points: 2}, {label: 'I am irritable all the time', points: 3}] },
      { id: 'bdi18', text: 'Changes in Appetite: Have you had changes in appetite?', options: [{label: 'No change', points: 0}, {label: 'My appetite is somewhat less/more', points: 1}, {label: 'My appetite is much less/more', points: 2}, {label: 'I have no appetite/crave food all the time', points: 3}] },
      { id: 'bdi19', text: 'Concentration Difficulty: Can you concentrate?', options: [{label: 'I can concentrate as well as ever', points: 0}, {label: 'I can\'t concentrate as well', points: 1}, {label: 'It\'s hard to keep my mind on anything', points: 2}, {label: 'I can\'t concentrate at all', points: 3}] },
      { id: 'bdi20', text: 'Tiredness or Fatigue: Do you feel tired?', options: [{label: 'I am no more tired than usual', points: 0}, {label: 'I get tired more easily', points: 1}, {label: 'I am too tired to do much', points: 2}, {label: 'I am too tired to do anything', points: 3}] },
      { id: 'bdi21', text: 'Loss of Interest in Sex: Any change in sex interest?', options: [{label: 'No change', points: 0}, {label: 'I am less interested', points: 1}, {label: 'I am much less interested', points: 2}, {label: 'I have lost interest in sex completely', points: 3}] }
    ]
  },
  {
    id: 'dass21',
    title: 'DASS-21 Scale',
    description: 'A 21-item questionnaire that measures the three core negative emotional states of depression, anxiety, and stress.',
    icon: Zap,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    questions: [
      { id: 'dass_s_1', text: 'I found it hard to wind down', options: dass20Options },
      { id: 'dass_a_1', text: 'I was aware of dryness of my mouth', options: dass20Options },
      { id: 'dass_d_1', text: 'I couldn\'t seem to experience any positive feeling at all', options: dass20Options },
      { id: 'dass_a_2', text: 'I experienced breathing difficulty', options: dass20Options },
      { id: 'dass_d_2', text: 'I found it difficult to work up the initiative to do things', options: dass20Options },
      { id: 'dass_s_2', text: 'I tended to over-react to situations', options: dass20Options },
      { id: 'dass_a_3', text: 'I experienced trembling (eg, in the hands)', options: dass20Options },
      { id: 'dass_s_3', text: 'I felt that I was using a lot of nervous energy', options: dass20Options },
      { id: 'dass_a_4', text: 'I was worried about situations in which I might panic', options: dass20Options },
      { id: 'dass_d_3', text: 'I felt that I had nothing to look forward to', options: dass20Options },
      { id: 'dass_s_4', text: 'I found myself getting agitated', options: dass20Options },
      { id: 'dass_s_5', text: 'I found it difficult to relax', options: dass20Options },
      { id: 'dass_d_4', text: 'I felt down-hearted and blue', options: dass20Options },
      { id: 'dass_s_6', text: 'I was intolerant of anything that kept me from getting on with what I was doing', options: dass20Options },
      { id: 'dass_a_5', text: 'I felt I was close to panic', options: dass20Options },
      { id: 'dass_d_5', text: 'I was unable to become enthusiastic about anything', options: dass20Options },
      { id: 'dass_d_6', text: 'I felt I wasn\'t worth much as a person', options: dass20Options },
      { id: 'dass_s_7', text: 'I felt that I was rather touchy', options: dass20Options },
      { id: 'dass_a_6', text: 'I was aware of the action of my heart in the absence of physical exertion', options: dass20Options },
      { id: 'dass_a_7', text: 'I felt scared without any good reason', options: dass20Options },
      { id: 'dass_d_7', text: 'I felt that life was meaningless', options: dass20Options }
    ]
  },
  {
    id: 'mmpi2',
    title: 'MMPI-2 Survey',
    description: 'A comprehensive survey used to assess clinical psychological conditions and personality disorders.',
    icon: Brain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    questions: [
      { id: 'mmpi_hs_1', category: 'Somatic Concerns', text: 'I wake up fresh and rested most mornings', options: [{label: 'True', points: 0}, {label: 'False', points: 1}] },
      { id: 'mmpi_d_1', category: 'Mood State', text: 'I am easily awakened by noise', options: [{label: 'True', points: 1}, {label: 'False', points: 0}] },
      { id: 'mmpi_hy_1', category: 'Stress Response', text: 'I like to read about crime and mystery stories', options: [{label: 'True', points: 0}, {label: 'False', points: 1}] },
      { id: 'mmpi_pd_1', category: 'Social Conflict', text: 'My hands and feet are usually warm enough', options: [{label: 'True', points: 0}, {label: 'False', points: 1}] },
      { id: 'mmpi_pa_1', category: 'Interpersonal Trust', text: 'I believe I am being plotted against', options: [{label: 'True', points: 1}, {label: 'False', points: 0}] },
      { id: 'mmpi_pt_1', category: 'Anxiety Patterns', text: 'I am certainly lacking in self-confidence', options: [{label: 'True', points: 1}, {label: 'False', points: 0}] },
      { id: 'mmpi_sc_1', category: 'Cognitive Clarity', text: 'I often feel as if things were not real', options: [{label: 'True', points: 1}, {label: 'False', points: 0}] },
      { id: 'mmpi_ma_1', category: 'Energy Levels', text: 'At times I feel like smashing things', options: [{label: 'True', points: 1}, {label: 'False', points: 0}] },
      { id: 'mmpi_si_1', category: 'Social Comfort', text: 'I am a very sociable person', options: [{label: 'True', points: 0}, {label: 'False', points: 1}] },
      { id: 'mmpi_hs_2', category: 'Somatic Concerns', text: 'I have a great deal of stomach trouble', options: [{label: 'True', points: 1}, {label: 'False', points: 0}] },
      { id: 'mmpi_d_2', category: 'Mood State', text: 'I am happy most of the time', options: [{label: 'True', points: 0}, {label: 'False', points: 1}] },
      { id: 'mmpi_hy_2', category: 'Stress Response', text: 'I feel that I have often been punished without cause', options: [{label: 'True', points: 1}, {label: 'False', points: 0}] },
      { id: 'mmpi_pd_2', category: 'Social Conflict', text: 'I have never been in trouble with the law', options: [{label: 'True', points: 0}, {label: 'False', points: 1}] },
      { id: 'mmpi_pa_2', category: 'Interpersonal Trust', text: 'I think most people would lie to get ahead', options: [{label: 'True', points: 1}, {label: 'False', points: 0}] },
      { id: 'mmpi_pt_2', category: 'Anxiety Patterns', text: 'I am troubled by discomforting thoughts', options: [{label: 'True', points: 1}, {label: 'False', points: 0}] },
      { id: 'mmpi_sc_2', category: 'Cognitive Clarity', text: 'I see things or animals or people around me that others do not see', options: [{label: 'True', points: 1}, {label: 'False', points: 0}] },
      { id: 'mmpi_ma_2', category: 'Energy Levels', text: 'I have had periods of such great activity that I did not need sleep', options: [{label: 'True', points: 1}, {label: 'False', points: 0}] },
      { id: 'mmpi_si_2', category: 'Social Comfort', text: 'I enjoy social gatherings just to be with people', options: [{label: 'True', points: 0}, {label: 'False', points: 1}] }
    ]
  }
];

// ============================================================================
// ASSESSMENT WIZARD COMPONENT
// ============================================================================

const getAssessmentTitle = (type: string): string => {
  const assessment = mentalAssessments.find(a => a.id === type);
  return assessment ? assessment.title : type.toUpperCase();
};

function AssessmentWizard({ initialAssessment, onClose, onComplete }: { initialAssessment: AssessmentType | null; onClose: () => void; onComplete: (result: any) => void }) {
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentType | null>(initialAssessment);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = (assessment: AssessmentType) => {
    setSelectedAssessment(assessment);
    setCurrentStep(0);
    setAnswers([]);
  };

  const handleAnswer = async (option: AssessmentOption) => {
    const newAnswers = [...answers, {
      questionId: selectedAssessment!.questions[currentStep].id,
      questionText: selectedAssessment!.questions[currentStep].text,
      selectedOption: option.label,
      points: option.points
    }];

    setAnswers(newAnswers);

    if (currentStep < selectedAssessment!.questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // COMPLETE
      setIsSubmitting(true);
      setError(null);
      console.log(`🧠 Submitting ${selectedAssessment!.id} assessment with ${newAnswers.length} responses...`);
      
      try {
        const data = await apiCall(API_ENDPOINTS.MENTAL_HEALTH.ASSESSMENTS, {
          method: 'POST',
          body: JSON.stringify({
            assessmentType: selectedAssessment!.id,
            responses: newAnswers
          })
        });
        

        
        if (data.success && data.data) {
          console.log('✅ Assessment successfully processed by AI:', data.data);
          setResult(data.data);
          onComplete(data.data);
        } else {
          console.error('❌ Assessment failed:', data.message || 'Unknown error');
          setError(data.message || 'Failed to process assessment results. Please try again.');
        }
      } catch (err) {
        console.error('⚠️ Critical Assessment Failure:', err);
        setError('Network error or server timeout. Your results may not have been saved.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (result) {
    const interpretation = result.aiInterpretation || {};
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">Clinical Analysis Ready</h3>
          <p className="text-sm text-slate-500">Your {selectedAssessment?.title} insights are finalized.</p>
        </div>

        {/* Clinical Alerts */}
        {interpretation.riskIndicators?.length > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-bold text-rose-800">Clinical Risk Indicators</h5>
              <ul className="mt-1 space-y-1">
                {interpretation.riskIndicators.map((risk: string, i: number) => (
                  <li key={i} className="text-xs text-rose-600 font-medium">• {risk}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <h4 className="text-lg font-bold text-slate-800 mb-2">{interpretation.summary || 'Assessment Overview'}</h4>
          <p className="text-sm text-slate-600 leading-relaxed">{interpretation.detailedAnalysis || 'Detailed scientific analysis of your psychometric data.'}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1">
              <Activity className="w-3 h-3 text-emerald-400 opacity-20" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Score</span>
            <div className="flex items-baseline gap-1">
              <div className="text-3xl font-black text-slate-800">{result.totalScore}</div>
              <span className="text-[10px] font-bold text-slate-400">PTS</span>
            </div>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1">
              <CheckCircle className="w-3 h-3 text-emerald-400 opacity-20" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Severity</span>
            <div className="text-sm font-black text-emerald-600 uppercase tracking-tight truncate leading-tight">
              {getClinicalLabel(selectedAssessment!.id, result.totalScore)}
            </div>
          </div>
        </div>

        {/* Personality Traits */}
        {interpretation.personalityTraits?.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Psychological Traits</h5>
            <div className="flex flex-wrap gap-2">
              {interpretation.personalityTraits.map((trait: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full border border-purple-200 shadow-sm">
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.subScores && Object.keys(result.subScores).length > 0 && (
          <div className="space-y-3">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sub-Scale Analysis</h5>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(result.subScores).map(([key, val]: [string, any]) => (
                <div key={key} className="p-3 bg-white rounded-xl border border-slate-100 text-center shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{key}</div>
                  <div className="text-lg font-black text-slate-800">{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Clinical Recommendations</h5>
          <ul className="space-y-2">
            {(interpretation.nextSteps || ['Continue tracking your mental wellness daily.']).map((step: string, i: number) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm group hover:border-purple-200 transition-colors">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Archive className="w-4 h-4" /> Secure in Vault & Close
        </button>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-lg font-bold text-slate-800 animate-pulse text-center px-4">Processing with AI Clinical Engine...</p>
        <p className="text-xs text-slate-400 italic">This may take 15-30 seconds for complex psychometric sets</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 space-y-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Something went wrong</h3>
          <p className="mt-2 text-sm text-slate-500 px-8 whitespace-pre-wrap">{error}</p>
        </div>
        <div className="flex gap-3 px-8">
          <button
            onClick={() => setError(null)}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
          >
            Retry Last Question
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }


  if (!selectedAssessment) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Deep Assessments</h3>
          <p className="text-sm text-slate-600">Unlock clinical-grade insights about your psychological state.</p>
        </div>
        <div className="grid gap-3">
          {mentalAssessments.map((a) => (
            <button
              key={a.id}
              onClick={() => handleStart(a)}
              className="flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-purple-200 bg-white hover:bg-purple-50/30 transition-all text-left group"
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", a.bgColor)}>
                <a.icon className={cn("w-6 h-6", a.color)} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800">{a.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{a.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentQuestion = selectedAssessment.questions[currentStep];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-white/20", selectedAssessment.bgColor)}>
            <selectedAssessment.icon className={cn("w-5 h-5", selectedAssessment.color)} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 leading-tight">{selectedAssessment.title}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", selectedAssessment.color.replace('text-', 'bg-'))} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {currentQuestion.category || 'Standard Assessment'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
          <span>Question {currentStep + 1} of {selectedAssessment.questions.length}</span>
          <span>{Math.round(((currentStep + 1) / selectedAssessment.questions.length) * 100)}% Complete</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / selectedAssessment.questions.length) * 100}%` }}
            className={cn("h-full", selectedAssessment.color.replace('text-', 'bg-'))}
          />
        </div>
      </div>

      <div className="py-6">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-8"
        >
          <h3 className="text-2xl font-black text-slate-800 leading-tight">
            {currentQuestion.text}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.01, backgroundColor: 'var(--slate-50)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(option)}
                className="w-full p-4 text-left border-2 border-slate-100 rounded-2xl hover:border-slate-300 transition-all font-bold text-slate-700 flex items-center justify-between group bg-white shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-white group-hover:text-slate-600 transition-colors border border-slate-100">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span>{option.label}</span>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:border-slate-400 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-slate-300 transition-all" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// ASSESSMENT HISTORY VIEW COMPONENT
// ============================================================================

function AssessmentHistoryView() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.MENTAL_HEALTH.ASSESSMENTS);

      if (data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch assessment history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedReport) {
    const interpretation = selectedReport.aiInterpretation || {};
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedReport(null)}
          className="text-xs font-bold text-slate-400 flex items-center gap-1 mb-4 hover:text-slate-600 transition-colors"
        >
          <ArrowRight className="w-3 h-3 rotate-180" /> Back to History
        </button>

        <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-tight text-sm">{getAssessmentTitle(selectedReport.assessmentType)} Clinical Report</h4>
              <p className="text-[10px] text-slate-400 font-bold">{new Date(selectedReport.date).toLocaleDateString()} • Recorded in Vault</p>
            </div>
          </div>

          {/* Clinical Alerts */}
          {interpretation.riskIndicators?.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-bold text-rose-800">Risk Indicators</h5>
                <ul className="mt-1 space-y-1">
                  {interpretation.riskIndicators.map((risk: string, i: number) => (
                    <li key={i} className="text-xs text-rose-600 font-medium">• {risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{interpretation.summary || 'Summary Unavailable'}</h3>
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm text-slate-600 leading-relaxed font-medium">{interpretation.detailedAnalysis || 'Detailed analysis not found.'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-1">
                <Activity className="w-3 h-3 text-emerald-400 opacity-20" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Clinical Score</span>
              <div className="flex items-baseline gap-1">
                <div className="text-3xl font-black text-slate-800">{selectedReport.totalScore}</div>
                <span className="text-[10px] font-bold text-slate-400">PTS</span>
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-1">
                <CheckCircle className="w-3 h-3 text-emerald-400 opacity-20" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Severity</span>
              <div className="text-sm font-black text-emerald-600 uppercase tracking-tight leading-tight">
                {getClinicalLabel(selectedReport.assessmentType, selectedReport.totalScore)}
              </div>
            </div>
          </div>

          {/* Personality Traits */}
          {interpretation.personalityTraits?.length > 0 && (
            <div className="space-y-2 mb-6 px-1">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identified Profiles</h5>
              <div className="flex flex-wrap gap-2">
                {interpretation.personalityTraits.map((trait: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full border border-purple-200 shadow-sm">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {selectedReport.subScores && Object.keys(selectedReport.subScores).length > 0 && (
              <div className="space-y-2 px-1">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metric Granularity</h5>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(selectedReport.subScores).map(([key, val]: [string, any]) => (
                    <div key={key} className="p-3 bg-white rounded-2xl border border-slate-100 text-center shadow-sm">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{key}</div>
                      <div className="text-lg font-black text-slate-800">{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {interpretation.nextSteps?.length > 0 && (
              <div className="space-y-2 px-1">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Therapeutic Roadmap</h5>
                <ul className="space-y-2">
                  {interpretation.nextSteps.map((step: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-xs text-slate-600 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="w-5 h-5 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                      </div>
                      <span className="font-medium">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-16 bg-slate-50 animate-pulse rounded-2xl" />
          <div className="h-16 bg-slate-50 animate-pulse rounded-2xl" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No Previous Reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((report) => (
            <button
              key={report._id}
              onClick={() => setSelectedReport(report)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <BookHeart className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <h5 className="font-bold text-slate-800 uppercase tracking-tight">{getAssessmentTitle(report.assessmentType)} Result</h5>
                  <p className="text-[10px] text-slate-400 font-bold">{new Date(report.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-black text-slate-800">PTS: {report.totalScore}</div>
                  <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">View Analysis</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ============================================================================
// GUIDED JOURNAL TYPES & DATA
// ============================================================================

interface JournalPrompt {
  id: string;
  text: string;
  category: 'gratitude' | 'reflection' | 'growth' | 'mindfulness' | 'emotions';
}

interface JournalCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  prompts: JournalPrompt[];
}

const journalCategories: JournalCategory[] = [
  {
    id: 'gratitude',
    title: 'Gratitude',
    description: 'Cultivate appreciation and positive perspective through gratitude journaling.',
    icon: Heart,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    prompts: [
      { id: 'g1', text: 'What are three things you\'re grateful for today, and why?', category: 'gratitude' },
      { id: 'g2', text: 'Who made a positive impact on your life recently? How did they help?', category: 'gratitude' },
      { id: 'g3', text: 'What small joy did you experience today that you might have overlooked?', category: 'gratitude' },
      { id: 'g4', text: 'Write about a challenge you\'re facing. What can you appreciate about this situation?', category: 'gratitude' },
      { id: 'g5', text: 'What is something beautiful you saw or experienced today?', category: 'gratitude' }
    ]
  },
  {
    id: 'reflection',
    title: 'Daily Reflection',
    description: 'Process your day, understand patterns, and gain clarity through thoughtful reflection.',
    icon: Moon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    prompts: [
      { id: 'r1', text: 'What was the most meaningful moment of your day? Why did it stand out?', category: 'reflection' },
      { id: 'r2', text: 'If you could relive one moment from today, which would it be and why?', category: 'reflection' },
      { id: 'r3', text: 'What did you learn about yourself today?', category: 'reflection' },
      { id: 'r4', text: 'Describe your day using only emotions and sensations, not events.', category: 'reflection' },
      { id: 'r5', text: 'What would you do differently if you could live today again?', category: 'reflection' }
    ]
  },
  {
    id: 'growth',
    title: 'Personal Growth',
    description: 'Explore your potential, set intentions, and track your development journey.',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    prompts: [
      { id: 'pg1', text: 'What is one skill you\'d like to develop? What\'s your first step?', category: 'growth' },
      { id: 'pg2', text: 'Describe a recent challenge you overcame. What strengths did you discover?', category: 'growth' },
      { id: 'pg3', text: 'What limiting belief would you like to release? What empowering belief will replace it?', category: 'growth' },
      { id: 'pg4', text: 'Write a letter to your future self one year from now. What do you hope to achieve?', category: 'growth' },
      { id: 'pg5', text: 'What habit would most improve your life? How can you start building it?', category: 'growth' }
    ]
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness',
    description: 'Ground yourself in the present moment with awareness and acceptance.',
    icon: Wind,
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    prompts: [
      { id: 'm1', text: 'Describe your current surroundings using all five senses.', category: 'mindfulness' },
      { id: 'm2', text: 'What are you feeling in your body right now? Where do you notice tension or ease?', category: 'mindfulness' },
      { id: 'm3', text: 'Write about your breath for one minute. Notice its rhythm and quality.', category: 'mindfulness' },
      { id: 'm4', text: 'What thoughts are occupying your mind? Observe them without judgment.', category: 'mindfulness' },
      { id: 'm5', text: 'Describe a simple activity you did today with complete presence and attention.', category: 'mindfulness' }
    ]
  },
  {
    id: 'emotions',
    title: 'Emotional Release',
    description: 'Process difficult feelings, find clarity, and create space for healing.',
    icon: Zap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    prompts: [
      { id: 'e1', text: 'What emotion is asking for your attention right now? Describe it fully.', category: 'emotions' },
      { id: 'e2', text: 'Write about something that\'s been weighing on your mind. Get it all out.', category: 'emotions' },
      { id: 'e3', text: 'If your current emotion had a color, shape, and texture, what would it be?', category: 'emotions' },
      { id: 'e4', text: 'What do you need right now that you\'re not giving yourself?', category: 'emotions' },
      { id: 'e5', text: 'Write a compassionate response to yourself about a difficult situation.', category: 'emotions' }
    ]
  }
];

const journalingTips = [
  { title: 'Stream of Consciousness', description: 'Write continuously without stopping to edit or judge. Let thoughts flow freely.' },
  { title: 'The 5-Minute Rule', description: 'Commit to just 5 minutes. You can stop after, but often you\'ll want to continue.' },
  { title: 'Write for Yourself', description: 'This is your private space. Be honest, raw, and authentic without fear of judgment.' },
  { title: 'Use Prompts', description: 'Stuck? Choose a prompt that resonates. It\'s a starting point, not a constraint.' },
  { title: 'Review Patterns', description: 'Occasionally read past entries to notice growth, patterns, and recurring themes.' }
];

// ============================================================================
// GUIDED JOURNAL COMPONENT
// ============================================================================

function GuidedJournal({ onClose, onSave }: { onClose: () => void; onSave: (entry: { title: string; content: string; category: string }) => void }) {
  const [selectedCategory, setSelectedCategory] = useState<JournalCategory | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);
  const [entryText, setEntryText] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [mode, setMode] = useState<'select' | 'write' | 'review'>('select');
  const [isRecording, setIsRecording] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showTip, setShowTip] = useState(true);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // @ts-ignore
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Update word count
  useEffect(() => {
    const words = entryText.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  }, [entryText]);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setEntryText(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleCategorySelect = (category: JournalCategory) => {
    setSelectedCategory(category);
    setSelectedPrompt(null);
    setMode('select');
  };

  const handlePromptSelect = (prompt: JournalPrompt) => {
    setSelectedPrompt(prompt);
    setEntryTitle(`Journal Entry - ${new Date().toLocaleDateString()}`);
    setMode('write');
    // Auto-focus textarea after selection
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSave = () => {
    if (entryText.trim().length < 10) {
      alert('Please write a bit more before saving. Aim for at least a few sentences.');
      return;
    }

    onSave({
      title: entryTitle || 'Untitled Entry',
      content: entryText,
      category: selectedCategory?.id || 'general'
    });

    // Reset state
    setMode('select');
    setSelectedCategory(null);
    setSelectedPrompt(null);
    setEntryText('');
    setEntryTitle('');
  };

  const getRandomPrompt = () => {
    if (!selectedCategory) return null;
    const randomIndex = Math.floor(Math.random() * selectedCategory.prompts.length);
    return selectedCategory.prompts[randomIndex];
  };

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % journalingTips.length);
  };

  // Category selection view
  if (mode === 'select' && !selectedCategory) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
            <BookHeart className="w-8 h-8 text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Guided Journal</h3>
          <p className="text-sm text-slate-600">Choose a journaling style to begin</p>
        </div>

        {/* Tips Carousel */}
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 rounded-xl border border-amber-100"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  <span className="font-bold">Tip: {journalingTips[currentTipIndex].title}</span>
                </p>
                <p className="text-xs text-amber-700 mt-1">{journalingTips[currentTipIndex].description}</p>
              </div>
              <button onClick={nextTip} className="text-amber-600 hover:text-amber-700">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2">
          {journalCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-slate-300 hover:shadow-md transition-all text-left bg-white"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", category.bgColor)}>
                  <IconComponent className={cn("w-6 h-6", category.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800">{category.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{category.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 text-slate-500 hover:text-slate-700 font-medium"
        >
          Close
        </button>
      </div>
    );
  }

  // Prompt selection view
  if (mode === 'select' && selectedCategory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm font-medium"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Back
          </button>
          <div className={cn("px-3 py-1 rounded-full text-xs font-bold", selectedCategory.bgColor, selectedCategory.color)}>
            {selectedCategory.title}
          </div>
        </div>

        <div className="text-center">
          <h4 className="text-lg font-bold text-slate-800 mb-2">Choose a Prompt</h4>
          <p className="text-sm text-slate-600">Select what resonates with you right now</p>
        </div>

        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
          {selectedCategory.prompts.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => handlePromptSelect(prompt)}
              className="w-full p-4 rounded-xl border-2 border-slate-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left"
            >
              <p className="text-sm text-slate-700">{prompt.text}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              const randomPrompt = getRandomPrompt();
              if (randomPrompt) handlePromptSelect(randomPrompt);
            }}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Surprise Me
          </button>
          <button
            onClick={() => handlePromptSelect({ id: 'free', text: 'Free writing - Write whatever comes to mind without any specific prompt.', category: selectedCategory.id as any })}
            className="flex-1 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-medium transition-all"
          >
            Free Write
          </button>
        </div>
      </div>
    );
  }

  // Writing view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (entryText.trim().length > 0 && !confirm('Discard your current entry?')) return;
            setMode('select');
            setSelectedPrompt(null);
            setEntryText('');
          }}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm font-medium"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Back
        </button>
        <div className="flex items-center gap-2">
          {selectedCategory && (
            <div className={cn("px-2 py-1 rounded-lg text-xs font-bold", selectedCategory.bgColor, selectedCategory.color)}>
              {selectedCategory.title}
            </div>
          )}
        </div>
      </div>

      {/* Selected Prompt */}
      {selectedPrompt && (
        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
          <p className="text-sm font-medium text-purple-900 italic">"{selectedPrompt.text}"</p>
        </div>
      )}

      {/* Title Input */}
      <input
        type="text"
        value={entryTitle}
        onChange={(e) => setEntryTitle(e.target.value)}
        placeholder="Entry title (optional)..."
        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
      />

      {/* Writing Area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={entryText}
          onChange={(e) => setEntryText(e.target.value)}
          placeholder="Start writing here... Don't worry about perfection, just let your thoughts flow."
          className="w-full h-64 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-xs font-bold animate-pulse">
            <div className="w-2 h-2 bg-rose-500 rounded-full" />
            Recording...
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleRecording}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              isRecording
                ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            {isRecording ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording ? 'Stop' : 'Dictate'}
          </button>

          <button
            onClick={() => setEntryText('')}
            disabled={entryText.length === 0}
            className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">{wordCount} words</span>
          <button
            onClick={handleSave}
            disabled={entryText.trim().length < 10}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
          >
            Save Entry
          </button>
        </div>
      </div>

      {/* Writing Tips */}
      <div className="p-3 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-500">
          <span className="font-bold text-slate-700">Pro tip:</span> {journalingTips[currentTipIndex].description}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// FREEFORM RANT COMPONENT
// ============================================================================

function FreeformRant({ onClose, onSave }: { onClose: () => void; onSave: (entry: { title: string; content: string }) => void }) {
  const [rantText, setRantText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showBurnAnimation, setShowBurnAnimation] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // @ts-ignore
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const comfortingMessages = [
    "This is your safe space. No judgment, no filters.",
    "Let it all out. Your feelings are valid.",
    "Say whatever you need to say. This space is yours.",
    "Release what no longer serves you.",
    "Your thoughts matter. Express them freely."
  ];

  const [currentMessage] = useState(() =>
    comfortingMessages[Math.floor(Math.random() * comfortingMessages.length)]
  );

  // Update word count
  useEffect(() => {
    const words = rantText.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  }, [rantText]);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }

        if (finalTranscript) {
          setRantText(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleBurn = () => {
    if (rantText.trim().length === 0) {
      onClose();
      return;
    }

    setShowBurnAnimation(true);
    setTimeout(() => {
      setRantText('');
      setShowBurnAnimation(false);
      onClose();
    }, 1500);
  };

  const handleSave = () => {
    if (rantText.trim().length < 5) {
      alert('Please write a bit more before saving.');
      return;
    }

    onSave({
      title: `Rant - ${new Date().toLocaleDateString()}`,
      content: rantText
    });

    setRantText('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-3">
          <Wind className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">Freeform Rant</h3>
        <p className="text-sm text-slate-500">{currentMessage}</p>
      </div>

      {/* Safe Space Notice */}
      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-emerald-700 text-xs">✓</span>
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-800">
              Private & Secure
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Your rant stays on your device unless you choose to save it. Burn it anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Writing Area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={rantText}
          onChange={(e) => setRantText(e.target.value)}
          placeholder="Type or speak whatever is on your mind... no filters, no judgment..."
          className="w-full h-56 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          disabled={showBurnAnimation}
        />

        {/* Burn Animation Overlay */}
        {showBurnAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-orange-500/20 via-rose-500/10 to-transparent rounded-xl flex items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="text-center"
            >
              <div className="text-4xl mb-2">🔥</div>
              <p className="text-sm font-bold text-rose-600">Releasing...</p>
            </motion.div>
          </motion.div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-xs font-bold animate-pulse">
            <div className="w-2 h-2 bg-rose-500 rounded-full" />
            Recording...
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleRecording}
            disabled={showBurnAnimation}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              isRecording
                ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            {isRecording ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording ? 'Stop' : 'Speak'}
          </button>

          <button
            onClick={() => setRantText('')}
            disabled={rantText.length === 0 || showBurnAnimation}
            className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">{wordCount} words</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleBurn}
          disabled={showBurnAnimation}
          className="flex-1 py-3 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
        >
          <span className="text-lg">🔥</span>
          {rantText.trim() ? 'Burn & Release' : 'Close'}
        </button>

        <button
          onClick={handleSave}
          disabled={rantText.trim().length < 5 || showBurnAnimation}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Archive className="w-4 h-4" />
          Save to Vault
        </button>
      </div>

      {/* Encouraging Footer */}
      <p className="text-center text-xs text-slate-400 italic">
        "Sometimes the act of expressing is the act of healing."
      </p>
    </div>
  );
}

// ============================================================================
// MAIN MENTAL HEALTH PAGE
// ============================================================================

export function MentalHealth() {
  // Calm Space Timer
  const [calmMeditationTime, setCalmMeditationTime] = useState(5 * 60);
  const [calmTimeLeft, setCalmTimeLeft] = useState(5 * 60);
  const [calmIsPlaying, setCalmIsPlaying] = useState(false);
  const [calmCountdown, setCalmCountdown] = useState<number | null>(null);
  const calmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const calmMountedRef = useRef(false);

  // Core countdown
  useEffect(() => {
    if (calmIsPlaying && calmTimeLeft > 0) {
      calmIntervalRef.current = setInterval(() => {
        setCalmTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(calmIntervalRef.current!);
            calmIntervalRef.current = null;
            setCalmIsPlaying(false);
            const mins = Math.floor(calmMeditationTime / 60);
            playAlarmSound();
            setTimeout(() => {
              speak(
                `Your ${mins} minute meditation has ended. ` +
                `Meditation complete.`
              );
            }, 1800);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (calmIntervalRef.current) {
        clearInterval(calmIntervalRef.current);
        calmIntervalRef.current = null;
      }
    }
    return () => {
      if (calmIntervalRef.current) {
        clearInterval(calmIntervalRef.current);
        calmIntervalRef.current = null;
      }
    };
  }, [calmIsPlaying]);

  // Announce start — skip on initial mount
  useEffect(() => {
    if (!calmMountedRef.current) {
      calmMountedRef.current = true;
      return;
    }
    if (calmIsPlaying) {
      const mins = Math.floor(calmMeditationTime / 60);
      speak(`Starting ${mins} minute meditation. Find a comfortable position and close your eyes.`);
    } else {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calmIsPlaying]);

  const calmFormatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCalmPlayPause = () => {
    if (calmIsPlaying) {
      // Pause
      setCalmIsPlaying(false);
      return;
    }
    if (calmCountdown !== null) {
      // Cancel countdown
      setCalmCountdown(null);
      return;
    }
    // Start 3-2-1 countdown then play
    const startTime = calmTimeLeft === 0 ? calmMeditationTime : calmTimeLeft;
    if (calmTimeLeft === 0) setCalmTimeLeft(startTime);
    setCalmCountdown(3);
    speak('3');
    let count = 3;
    const tick = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(tick);
        setCalmCountdown(null);
        if (calmTimeLeft === 0) setCalmTimeLeft(startTime);
        setTimeout(() => setCalmIsPlaying(true), 50);
        speak('Begin');
      } else {
        setCalmCountdown(count);
        speak(String(count));
      }
    }, 1000);
  };


  // Moods
  const [moods, setMoods] = useState<{ time: string, mood: string, note: string }[]>([
    { time: '09:00 AM', mood: 'Great', note: 'Woke up feeling refreshed' },
    { time: '01:30 PM', mood: 'Okay', note: 'Busy morning' }
  ]);
  const [moodPeriod, setMoodPeriod] = useState<'Today' | 'Weekly' | 'Monthly'>('Weekly');
  const [showMoodLog, setShowMoodLog] = useState(false);
  const [newMood, setNewMood] = useState('Okay');
  const [newMoodNote, setNewMoodNote] = useState('');

  // Assessment Overlays
  const [showAssessmentWizard, setShowAssessmentWizard] = useState(false);
  const [showAssessmentHistory, setShowAssessmentHistory] = useState(false);
  const [selectedAssessmentForWizard, setSelectedAssessmentForWizard] = useState<AssessmentType | null>(null);

  // Vault
  const [vaultOpen, setVaultOpen] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPasscode, setVaultPasscode] = useState('');
  const [vaultPasscodeInput, setVaultPasscodeInput] = useState('');
  const [activeVaultTab, setActiveVaultTab] = useState<'journals' | 'assessments'>('journals');
  const [isSettingPasscode, setIsSettingPasscode] = useState(false);
  const [journals, setJournals] = useState(() => {
    const saved = localStorage.getItem('medsage_journals');
    return saved ? JSON.parse(saved) : [];
  });
  const [viewingJournal, setViewingJournal] = useState<any>(null);
  const [editingJournal, setEditingJournal] = useState<any>(null);
  const [editContent, setEditContent] = useState('');

  // Dynamic Pulse State
  const [pulse, setPulse] = useState<any>(null);
  const [isLoadingPulse, setIsLoadingPulse] = useState(true);

  useEffect(() => {
    fetchPulse();
  }, []);

  const fetchPulse = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.MENTAL_HEALTH.DAILY);
      if (data.success && data.data) {
        setPulse(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch pulse:', err);
    } finally {
      setIsLoadingPulse(false);
    }
  };

  // User Profile for context
  const [userProfile, setUserProfile] = useState<any>(null);
  useEffect(() => {
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
  }, []);

  // Persist journals to localStorage
  useEffect(() => {
    localStorage.setItem('medsage_journals', JSON.stringify(journals));
  }, [journals]);

  // Load vault passcode from localStorage
  useEffect(() => {
    const savedPasscode = localStorage.getItem('medsage_vault_passcode');
    if (savedPasscode) {
      setVaultPasscode(savedPasscode);
    }
  }, []);

  const handleUnlockVault = () => {
    if (vaultPasscodeInput === vaultPasscode) {
      setVaultUnlocked(true);
      setVaultPasscodeInput('');
    } else {
      alert('Incorrect passcode. Please try again.');
    }
  };

  const handleSetPasscode = () => {
    if (vaultPasscodeInput.length !== 4 || !/^\d+$/.test(vaultPasscodeInput)) {
      alert('Please enter a 4-digit numeric passcode.');
      return;
    }
    localStorage.setItem('medsage_vault_passcode', vaultPasscodeInput);
    setVaultPasscode(vaultPasscodeInput);
    setIsSettingPasscode(false);
    setVaultPasscodeInput('');
    alert('Passcode set successfully! Your vault is now protected.');
  };

  const handleDeleteJournal = (id: number) => {
    if (confirm('Are you sure you want to delete this journal entry? This cannot be undone.')) {
      setJournals(journals.filter((j: any) => j.id !== id));
      if (viewingJournal?.id === id) {
        setViewingJournal(null);
      }
    }
  };

  const handleEditJournal = (journal: any) => {
    setEditingJournal(journal);
    setEditContent(journal.content);
  };

  const handleSaveEdit = () => {
    if (!editingJournal) return;
    setJournals(journals.map((j: any) =>
      j.id === editingJournal.id
        ? { ...j, content: editContent, updatedAt: new Date().toLocaleDateString() }
        : j
    ));
    setEditingJournal(null);
    setEditContent('');
    if (viewingJournal?.id === editingJournal.id) {
      setViewingJournal({ ...viewingJournal, content: editContent, updatedAt: new Date().toLocaleDateString() });
    }
  };

  const handleContinueJournal = (journal: any) => {
    const continuedContent = journal.content + '\n\n--- Continued on ' + new Date().toLocaleDateString() + ' ---\n\n';
    setEditingJournal({ ...journal, isContinuation: true });
    setEditContent(continuedContent);
  };

  const handleToggleLock = (journal: any) => {
    if (!vaultUnlocked) {
      alert('Please unlock the vault first to manage lock settings.');
      return;
    }
    setJournals(journals.map((j: any) =>
      j.id === journal.id ? { ...j, locked: !j.locked } : j
    ));
  };

  // Private Chat Passcode Protection
  const [privateChatLocked, setPrivateChatLocked] = useState(() => {
    const saved = localStorage.getItem('medsage_private_chat_locked');
    return saved ? JSON.parse(saved) : true; // Default to locked
  });
  const [chatPasscodeInput, setChatPasscodeInput] = useState('');
  const [showChatPasscodeModal, setShowChatPasscodeModal] = useState(false);

  // Persist private chat lock state
  useEffect(() => {
    localStorage.setItem('medsage_private_chat_locked', JSON.stringify(privateChatLocked));
  }, [privateChatLocked]);

  const handleUnlockPrivateChat = () => {
    if (chatPasscodeInput === vaultPasscode && vaultPasscode) {
      setPrivateChatLocked(false);
      setChatPasscodeInput('');
      setShowChatPasscodeModal(false);
    } else {
      alert('Incorrect passcode. Please enter your vault passcode.');
    }
  };

  const handleLockPrivateChat = () => {
    setPrivateChatLocked(true);
  };

  // Action Stack
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [rantText, setRantText] = useState('');
  const [isRecordingRant, setIsRecordingRant] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <header>
        <h1 className="text-2xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-500 tracking-tight">Mental Health</h1>
        <p className="text-slate-500 mt-2 font-medium">Your personal space for calming, understanding, and guiding your mind.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ================= LEFT PANEL ================= */}
        <div className="lg:col-span-3 space-y-6">

          {/* Ambient / Calm Player */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/40 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-emerald-500/5" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-4 border-purple-100 flex items-center justify-center relative mb-4">
                <div className={cn("absolute inset-0 rounded-full border-2 border-purple-400/50 transition-all duration-1000", calmIsPlaying ? "animate-[spin_10s_linear_infinite]" : "")} />
                <div className={cn("absolute inset-2 rounded-full border-2 border-emerald-400/30 transition-all duration-1000", calmIsPlaying ? "animate-[spin_15s_linear_infinite_reverse]" : "")} />
                {calmCountdown !== null ? (
                  <div key={calmCountdown} className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-emerald-500 flex flex-col items-center justify-center shadow-inner" style={{ animation: 'countdownPop 0.5s ease-out' }}>
                    <span className="text-4xl font-black text-white leading-none">{calmCountdown}</span>
                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">ready</span>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-emerald-50 flex items-center justify-center shadow-inner">
                    <Wind className="w-10 h-10 text-purple-500" />
                  </div>
                )}
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Calm Space</h3>
              <p className="text-xs text-slate-500 font-medium mb-4">Meditation Timer</p>

              <div className="text-4xl font-black text-slate-800 mb-6 font-mono tracking-tighter">
                {calmFormatTime(calmTimeLeft)}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => { setCalmTimeLeft(calmMeditationTime); setCalmIsPlaying(false); setCalmCountdown(null); }}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCalmPlayPause}
                  className="w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105"
                >
                  {calmIsPlaying ? <PauseIcon className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>
              </div>

              <div className="flex gap-2 w-full justify-center">
                {[5, 10, 15, 30].map(m => (
                  <button
                    key={m}
                    onClick={() => { setCalmMeditationTime(m * 60); setCalmTimeLeft(m * 60); setCalmIsPlaying(false); }}
                    className={cn("px-3 py-1.5 text-xs font-bold rounded-xl transition-colors", calmMeditationTime === m * 60 ? "bg-purple-600 text-white shadow-sm" : "bg-purple-50 text-purple-600 hover:bg-purple-100")}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/40 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-slate-800">AI Insights</h3>
            </div>

            <div className="space-y-4">
              {isLoadingPulse ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl" />
                ))
              ) : pulse?.aiAnalysis?.riskFlags?.length > 0 ? (
                pulse.aiAnalysis.riskFlags.map((flag: string, i: number) => (
                  <div key={i} className="p-4 rounded-2xl bg-rose-50 border border-rose-100/50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">Observation</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{flag}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                      <Heart className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Stability Detected</h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">No significant stress triggers or risks detected in your latest patterns.</p>
                    </div>
                  </div>
                </div>
              )}

              {pulse?.aiAnalysis?.recommendations?.length > 0 && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                      <Brain className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Recommendations</h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{pulse.aiAnalysis.recommendations[0]}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

        </div>

        {/* ================= CENTER GRID ================= */}
        <div className="lg:col-span-6 space-y-6">

          {/* Mood Log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/40 shadow-sm flex flex-col justify-center"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">{format(new Date(), 'MMMM do')} Mood</h3>
              <button
                onClick={() => setShowMoodLog(true)}
                className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Log Mood
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
              {moods.map((m, i) => (
                <div key={i} className="flex-shrink-0 bg-white rounded-2xl p-4 border border-slate-100 min-w-[160px] shadow-sm snap-start">
                  <div className="flex items-center gap-2 mb-2">
                    {m.mood === 'Amazing' && <Sparkles className="w-5 h-5 text-yellow-500" />}
                    {m.mood === 'Great' && <Smile className="w-5 h-5 text-emerald-500" />}
                    {m.mood === 'Good' && <Smile className="w-5 h-5 text-green-500" />}
                    {m.mood === 'Neutral' && <Meh className="w-5 h-5 text-amber-500" />}
                    {m.mood === 'Stressed' && <Zap className="w-5 h-5 text-orange-500" />}
                    {m.mood === 'Sad' && <Frown className="w-5 h-5 text-rose-500" />}
                    <span className="text-sm font-bold text-slate-700">{m.mood}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{m.time}</div>
                  <p className="text-xs text-slate-600 font-medium line-clamp-2">{m.note}</p>
                </div>
              ))}
              {moods.length === 0 && (
                <div className="text-sm text-slate-500 font-medium p-4">No moods logged today.</div>
              )}
            </div>
          </motion.div>

          {/* Action Stack + Vault */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/40 shadow-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">Action Stack</h3>
              <button
                onClick={() => setVaultOpen(true)}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Archive className="w-4 h-4" /> Vault
              </button>
            </div>

            <div className="space-y-3">
              {[
                { id: 'meditation', title: 'Guided Meditation', icon: Brain, color: 'text-orange-500', bg: 'bg-orange-50', modes: ['Listen', 'Read'] },
                { id: 'journal', title: 'Guided Journal', icon: BookHeart, color: 'text-purple-500', bg: 'bg-purple-50', modes: ['Write', 'Speak'] },
                { id: 'rant', title: 'Freeform Rant', icon: Mic, color: 'text-emerald-500', bg: 'bg-emerald-50', modes: ['Speak', 'Write'] },
              ].map((action, i) => (
                <div
                  key={i}
                  onClick={() => setActiveAction(action.id)}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm bg-white/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", action.bg, action.color)}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 group-hover:text-purple-600 transition-colors">{action.title}</h4>
                      <div className="flex gap-2 mt-1">
                        {action.modes.map(mode => (
                          <span key={mode} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{mode}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="lg:col-span-3 space-y-6 h-full">

          {/* Assessments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/40 shadow-sm h-full flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">Assessments</h3>
              <button 
                onClick={() => { setVaultOpen(true); setActiveVaultTab('assessments'); }}
                className="text-[10px] font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full hover:bg-purple-100 transition-colors uppercase tracking-widest"
              >
                View History
              </button>
            </div>

            <div className="space-y-3 flex-grow overflow-y-auto pr-1">
              {mentalAssessments.map((assessment, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedAssessmentForWizard(assessment);
                    setShowAssessmentWizard(true);
                  }}
                  className="relative overflow-hidden rounded-2xl p-4 cursor-pointer group hover:shadow-md transition-all border border-slate-100 bg-white"
                >
                  <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", assessment.bgColor)}>
                        <assessment.icon className={cn("w-5 h-5", assessment.color)} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 leading-tight">{assessment.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5 line-clamp-1">{assessment.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>

      {/* Clinical Assessment Wizard Overlay */}
      <AnimatePresence>
        {showAssessmentWizard && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 sm:p-8 overflow-y-auto">
                <AssessmentWizard
                  initialAssessment={selectedAssessmentForWizard}
                  onClose={() => {
                    setShowAssessmentWizard(false);
                    setSelectedAssessmentForWizard(null);
                  }}
                  onComplete={() => {
                    fetchPulse();
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assessment History & Clinical Reports Overlay */}
      <AnimatePresence>
        {showAssessmentHistory && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              className="bg-white rounded-[2rem] w-full max-w-lg h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 sm:p-8 overflow-y-auto h-full">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h3 className="text-2xl font-black text-slate-800">Clinical History</h3>
                  <button onClick={() => setShowAssessmentHistory(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <AssessmentHistoryView />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Private Chat Passcode Modal (Vault) */}
      <AnimatePresence>
        {showChatPasscodeModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-6 sm:p-8"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Private Chat Locked</h3>
                <p className="text-sm text-slate-500 mb-6">Enter your vault passcode to access your private chat history.</p>

                <input
                  type="password"
                  value={chatPasscodeInput}
                  onChange={(e) => setChatPasscodeInput(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  className="w-32 text-center text-2xl tracking-widest bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => { setShowChatPasscodeModal(false); setChatPasscodeInput(''); }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUnlockPrivateChat}
                    disabled={chatPasscodeInput.length !== 4}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                  >
                    Unlock
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mood Log Modal */}
      <AnimatePresence>
        {showMoodLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg">Log Mood</h3>
                <button onClick={() => setShowMoodLog(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                {['Amazing', 'Great', 'Good', 'Neutral', 'Stressed', 'Sad'].map(m => (
                  <button
                    key={m}
                    onClick={() => setNewMood(m)}
                    className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all", newMood === m ? "border-purple-500 bg-purple-50" : "border-transparent hover:bg-slate-50")}
                  >
                    {m === 'Amazing' && <Sparkles className={cn("w-8 h-8", newMood === m ? "text-yellow-500" : "text-slate-400")} />}
                    {m === 'Great' && <Smile className={cn("w-8 h-8", newMood === m ? "text-emerald-500" : "text-slate-400")} />}
                    {m === 'Good' && <Smile className={cn("w-8 h-8", newMood === m ? "text-green-500" : "text-slate-400")} />}
                    {m === 'Neutral' && <Meh className={cn("w-8 h-8", newMood === m ? "text-amber-500" : "text-slate-400")} />}
                    {m === 'Stressed' && <Zap className={cn("w-8 h-8", newMood === m ? "text-orange-500" : "text-slate-400")} />}
                    {m === 'Sad' && <Frown className={cn("w-8 h-8", newMood === m ? "text-rose-500" : "text-slate-400")} />}
                    <span className={cn("text-xs font-bold", newMood === m ? "text-slate-800" : "text-slate-500")}>{m}</span>
                  </button>
                ))}
              </div>

              <textarea
                value={newMoodNote}
                onChange={(e) => setNewMoodNote(e.target.value)}
                placeholder="Add a note (optional)..."
                className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-6"
              />

              <button
                onClick={() => {
                  setMoods([{ time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), mood: newMood, note: newMoodNote }, ...moods]);
                  setShowMoodLog(false);
                  setNewMoodNote('');
                }}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95"
              >
                Save Mood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Vault Modal */}
      <AnimatePresence>
        {vaultOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 text-white rounded-xl">
                    <Archive className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Secure Vault</h2>
                </div>
                <button onClick={() => { setVaultOpen(false); setVaultUnlocked(false); setEditingJournal(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto flex-1">
                {/* Passcode Setup State */}
                {!vaultPasscode && !isSettingPasscode && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                      <Lock className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Set Up Your Vault</h3>
                    <p className="text-sm text-slate-500 mb-6 text-center max-w-xs">Create a 4-digit passcode to protect your private journals.</p>
                    <button
                      onClick={() => setIsSettingPasscode(true)}
                      className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95"
                    >
                      Set Passcode
                    </button>
                  </div>
                )}

                {/* Setting Passcode State */}
                {isSettingPasscode && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <Lock className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Create Passcode</h3>
                    <p className="text-sm text-slate-500 mb-6 text-center max-w-xs">Enter a 4-digit numeric code you\'ll remember.</p>
                    <div className="flex gap-2 mb-6">
                      <input
                        type="password"
                        value={vaultPasscodeInput}
                        onChange={(e) => setVaultPasscodeInput(e.target.value)}
                        placeholder="••••"
                        maxLength={4}
                        className="w-32 text-center text-2xl tracking-widest bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-slate-800"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setIsSettingPasscode(false); setVaultPasscodeInput(''); }}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSetPasscode}
                        disabled={vaultPasscodeInput.length !== 4}
                        className="px-8 py-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95"
                      >
                        Set Passcode
                      </button>
                    </div>
                  </div>
                )}

                {/* Locked State - Need to unlock */}
                {vaultPasscode && !vaultUnlocked && !isSettingPasscode && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <Lock className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Enter Passcode</h3>
                    <p className="text-sm text-slate-500 mb-6 text-center max-w-xs">Your vault is protected. Enter your 4-digit passcode.</p>
                    <div className="flex gap-2 mb-6">
                      <input
                        type="password"
                        value={vaultPasscodeInput}
                        onChange={(e) => setVaultPasscodeInput(e.target.value)}
                        placeholder="••••"
                        maxLength={4}
                        className="w-32 text-center text-2xl tracking-widest bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-slate-800"
                      />
                    </div>
                    <button
                      onClick={handleUnlockVault}
                      disabled={vaultPasscodeInput.length !== 4}
                      className="px-8 py-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95"
                    >
                      Unlock Vault
                    </button>
                  </div>
                )}

                {/* Editing Journal State */}
                {editingJournal && vaultUnlocked && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => { setEditingJournal(null); setEditContent(''); }}
                        className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180" /> Back
                      </button>
                      <h3 className="font-bold text-slate-800">{editingJournal.isContinuation ? 'Continue Entry' : 'Edit Entry'}</h3>
                    </div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-80 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-800 resize-none"
                      placeholder="Edit your journal entry..."
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => { setEditingJournal(null); setEditContent(''); }}
                        className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editContent.trim()}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Viewing Single Journal State */}
                {viewingJournal && vaultUnlocked && !editingJournal && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <button
                        onClick={() => setViewingJournal(null)}
                        className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180" /> Back to Vault
                      </button>
                      <div className="flex items-center gap-2">
                        {viewingJournal.locked && <Lock className="w-4 h-4 text-amber-500" />}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{viewingJournal.title}</h3>
                    <div className="flex items-center gap-3 mb-6">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{viewingJournal.date}</p>
                      {viewingJournal.updatedAt && (
                        <p className="text-xs text-slate-400">(Updated: {viewingJournal.updatedAt})</p>
                      )}
                    </div>
                    <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap mb-6">
                      {viewingJournal.content}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditJournal(viewingJournal)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all"
                      >
                        <Edit3 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleContinueJournal(viewingJournal)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all"
                      >
                        <Plus className="w-4 h-4" /> Continue
                      </button>
                      <button
                        onClick={() => handleToggleLock(viewingJournal)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                          viewingJournal.locked
                            ? "bg-amber-100 hover:bg-amber-200 text-amber-700"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        )}
                      >
                        {viewingJournal.locked ? <><Unlock className="w-4 h-4" /> Unlock</> : <><Lock className="w-4 h-4" /> Lock</>}
                      </button>
                      <button
                        onClick={() => handleDeleteJournal(viewingJournal.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-sm font-medium transition-all ml-auto"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Journal & Assessment List State */}
                {vaultUnlocked && !viewingJournal && !editingJournal && (
                  <div className="space-y-6">
                    {/* Tab Navigation */}
                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                      <button
                        onClick={() => setActiveVaultTab('journals')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-all",
                          activeVaultTab === 'journals' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        <BookHeart className="w-4 h-4" /> Journals
                      </button>
                      <button
                        onClick={() => setActiveVaultTab('assessments')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-all",
                          activeVaultTab === 'assessments' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        <HistoryIcon className="w-4 h-4" /> Assessments
                      </button>
                    </div>

                    {activeVaultTab === 'assessments' ? (
                      <div className="space-y-3">
                        <AssessmentHistoryView />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {journals.length === 0 ? (
                          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-sm text-slate-400">No journal entries found in the vault.</p>
                          </div>
                        ) : (
                          journals.map((j: any) => (
                            <div key={j.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group bg-white">
                              <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setViewingJournal(j)}>
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", j.locked ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500")}>
                                  {j.locked ? <Lock className="w-5 h-5" /> : <BookHeart className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-slate-800 truncate">{j.title}</h4>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-medium text-slate-500">{j.date}</p>
                                    {j.updatedAt && <p className="text-xs text-slate-400">(edited)</p>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditJournal(j); }}
                                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleContinueJournal(j); }}
                                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                  title="Continue"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleLock(j); }}
                                  className={cn("p-2 rounded-lg transition-all", j.locked ? "text-amber-500 hover:bg-amber-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100")}
                                  title={j.locked ? "Unlock" : "Lock"}
                                >
                                  {j.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteJournal(j.id); }}
                                  className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Modals */}
      {/* Primary Interaction Modal (Journaling & Rant) */}
      <AnimatePresence>
        {activeAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 sm:p-8 overflow-y-auto relative">
                <button
                  onClick={() => setActiveAction(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {activeAction === 'rant' && (
                  <FreeformRant
                    onClose={() => setActiveAction(null)}
                    onSave={(entry) => {
                      setJournals([{ id: Date.now(), ...entry, date: new Date().toLocaleDateString(), locked: true }, ...journals]);
                      setMoods([{
                        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                        mood: 'Relieved',
                        note: 'Released through ranting'
                      }, ...moods]);
                      setActiveAction(null);
                    }}
                  />
                )}

                {activeAction === 'journal' && (
                  <GuidedJournal
                    onClose={() => setActiveAction(null)}
                    onSave={(entry) => {
                      setJournals([{ id: Date.now(), ...entry, date: new Date().toLocaleDateString(), locked: false }, ...journals]);
                      setMoods([{
                        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                        mood: 'Reflective',
                        note: `Journal: ${entry.title}`
                      }, ...moods]);
                      setActiveAction(null);
                    }}
                  />
                )}

                {activeAction === 'meditation' && (
                  <MeditationSession
                    onClose={() => setActiveAction(null)}
                    onComplete={() => {
                      setMoods([{ time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), mood: 'Calm', note: 'Completed meditation session' }, ...moods]);
                      setActiveAction(null);
                    }}
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

