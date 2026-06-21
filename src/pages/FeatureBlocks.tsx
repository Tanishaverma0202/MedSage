import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Activity, Zap, Brain, Heart, TrendingUp, Shield } from 'lucide-react';

export const FeatureBlocks: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const blocks = blocksRef.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const block = entry.target as HTMLDivElement;
            const index = blocks.indexOf(block);
            
            gsap.to(block, {
              y: 0,
              opacity: 1,
              duration: 0.8,
              delay: index * 0.15,
              ease: 'back.out',
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    blocks.forEach((block) => {
      if (block) {
        block.style.opacity = '0';
        block.style.transform = 'translateY(40px)';
        observer.observe(block);
      }
    });

    return () => {
      blocks.forEach((block) => {
        if (block) observer.unobserve(block);
      });
    };
  }, []);

  const features = [
    {
      icon: Activity,
      title: 'Track Everything',
      description: 'Log meals, workouts, sleep, mood, water, and cycle tracking all in one place',
      color: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Luna AI analyzes your complete health context to generate personalized recommendations',
      color: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-400',
    },
    {
      icon: Heart,
      title: 'Women\'s Health',
      description: 'Comprehensive cycle tracking with phase-based insights and hormonally-aware recommendations',
      color: 'from-pink-500/20 to-rose-500/20',
      iconColor: 'text-pink-400',
    },
    {
      icon: Zap,
      title: 'Real-Time Alerts',
      description: 'Instant notifications for health anomalies, hydration reminders, and milestone achievements',
      color: 'from-yellow-500/20 to-orange-500/20',
      iconColor: 'text-yellow-400',
    },
    {
      icon: TrendingUp,
      title: 'Trend Analysis',
      description: 'Visualize 7-day health trends across all metrics to identify patterns and improvements',
      color: 'from-violet-500/20 to-purple-500/20',
      iconColor: 'text-violet-400',
    },
    {
      icon: Shield,
      title: 'Privacy-First',
      description: 'Your health data is encrypted and never shared. Full control over your information',
      color: 'from-slate-500/20 to-gray-500/20',
      iconColor: 'text-slate-400',
    },
  ];

  return (
    <div
      ref={containerRef}
      className="relative py-32 px-6 md:px-12 bg-gradient-to-b from-[#020617] to-[#0f172a]"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-display font-light mb-6 text-white leading-tight">
            Everything You Need to <span className="font-black italic text-emerald-400">Master Your Health</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            From daily tracking to AI-powered insights, MedSage provides a complete health intelligence ecosystem
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                ref={(el) => {
                  blocksRef.current[index] = el;
                }}
                className={`group relative p-8 rounded-2xl bg-gradient-to-br ${feature.color} border border-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer overflow-hidden`}
              >
                {/* Animated border gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Icon with animation */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg blur-lg group-hover:blur-xl transition-all opacity-0 group-hover:opacity-100" />
                  <Icon className={`relative w-12 h-12 ${feature.iconColor} transition-transform duration-300 group-hover:scale-110`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">
                  {feature.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed relative z-10">
                  {feature.description}
                </p>

                {/* Hover arrow */}
                <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-semibold relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn More →
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data wave background element */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-24 opacity-20"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,30 Q300,60 600,30 T1200,30 L1200,120 L0,120 Z"
          fill="url(#waveGrad)"
          stroke="none"
        />
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
