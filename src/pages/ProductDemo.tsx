import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

export const ProductDemo: React.FC = () => {
  const demoRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const cards = cardsRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const card = entry.target as HTMLDivElement;
            const index = cards.indexOf(card);

            gsap.to(card, {
              y: 0,
              opacity: 1,
              rotation: 0,
              duration: 0.8,
              delay: index * 0.2,
              ease: 'back.out',
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    cards.forEach((card) => {
      if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px) rotateX(10deg)';
        observer.observe(card);
      }
    });

    return () => {
      cards.forEach((card) => {
        if (card) observer.unobserve(card);
      });
    };
  }, []);

  const demoSteps = [
    {
      title: 'Log Your Daily Activities',
      description: 'Quick-log meals, workouts, sleep, mood, and water intake. MedSage learns your patterns.',
      icon: '📝',
      color: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      title: 'AI Analyzes Your Health',
      description: 'Luna AI processes your complete health context and identifies trends, patterns, and insights.',
      icon: '🧠',
      color: 'from-purple-500/20 to-pink-500/20',
    },
    {
      title: 'Get Personalized Insights',
      description: 'Receive AI-powered recommendations tailored to your unique health profile and goals.',
      icon: '✨',
      color: 'from-emerald-500/20 to-teal-500/20',
    },
    {
      title: 'Track Progress Over Time',
      description: 'Visualize 7-day trends, achieve milestones, and celebrate your health victories.',
      icon: '📈',
      color: 'from-orange-500/20 to-rose-500/20',
    },
  ];

  return (
    <div
      id="demo-section"
      ref={demoRef}
      className="relative py-32 px-6 md:px-12 bg-gradient-to-b from-[#020617] to-[#0f172a]"
    >
      {/* Background circuit pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="none" stroke="#0d9488" strokeWidth="0.5" />
              <circle cx="10" cy="10" r="2" fill="#0d9488" />
              <circle cx="90" cy="10" r="2" fill="#0d9488" />
              <circle cx="10" cy="90" r="2" fill="#0d9488" />
              <circle cx="90" cy="90" r="2" fill="#0d9488" />
              <line x1="10" y1="10" x2="90" y2="10" stroke="#0d9488" strokeWidth="0.5" />
              <line x1="10" y1="90" x2="90" y2="90" stroke="#0d9488" strokeWidth="0.5" />
              <line x1="10" y1="10" x2="10" y2="90" stroke="#0d9488" strokeWidth="0.5" />
              <line x1="90" y1="10" x2="90" y2="90" stroke="#0d9488" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-display font-light mb-6 text-white leading-tight">
            From Logs to <span className="font-black italic text-cyan-400">AI Insights</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            See how MedSage transforms your daily health data into actionable intelligence
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {demoSteps.map((step, index) => (
            <div
              key={index}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              className={`relative p-8 rounded-2xl bg-gradient-to-br ${step.color} border border-white/10 hover:border-white/30 transition-all duration-300 group`}
            >
              {/* Step number with animation */}
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-lg transform group-hover:scale-110 transition-transform">
                {index + 1}
              </div>

              {/* Icon */}
              <div className="text-5xl mb-4">{step.icon}</div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-slate-300 leading-relaxed">{step.description}</p>

              {/* Animated arrow to next step */}
              {index < demoSteps.length - 1 && (
                <div className="hidden md:block absolute -right-8 top-1/2 -translate-y-1/2 text-emerald-400/30 group-hover:text-emerald-400 transition-colors">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Live Demo Preview */}
        <motion.div
          className="relative p-12 rounded-3xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-emerald-500/30 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Animated data wave background */}
          <svg
            className="absolute inset-0 w-full h-full opacity-10"
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="demoWave" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
            </defs>
            <path
              d="M0,100 Q300,20 600,100 T1200,100"
              fill="none"
              stroke="url(#demoWave)"
              strokeWidth="4"
            />
            <path
              d="M0,120 Q300,40 600,120 T1200,120"
              fill="none"
              stroke="url(#demoWave)"
              strokeWidth="2"
              opacity="0.5"
            />
          </svg>

          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-8">Daily Health Dashboard</h3>

            {/* Simulated dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Sleep', value: '7.5h', icon: '😴', color: 'from-blue-500/20' },
                { label: 'Hydration', value: '2.3L', icon: '💧', color: 'from-cyan-500/20' },
                { label: 'Steps', value: '8,234', icon: '👣', color: 'from-emerald-500/20' },
                { label: 'Mood', value: 'Great', icon: '😊', color: 'from-purple-500/20' },
              ].map((metric, i) => (
                <motion.div
                  key={i}
                  className={`p-4 rounded-xl bg-gradient-to-br ${metric.color} to-transparent border border-white/10`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="text-3xl mb-2">{metric.icon}</div>
                  <p className="text-xs text-slate-400 mb-1">{metric.label}</p>
                  <p className="text-xl font-bold text-white">{metric.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
