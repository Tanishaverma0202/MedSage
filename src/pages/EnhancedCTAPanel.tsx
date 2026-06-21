import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface EnhancedCTAPanelProps {
  onNavigate: (page: string) => void;
}

export const EnhancedCTAPanel: React.FC<EnhancedCTAPanelProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const features = [
    { icon: '🧠', title: 'AI Health Insights', description: 'Personalized recommendations from your data' },
    { icon: '📊', title: 'Visual Analytics', description: 'Track progress with beautiful dashboards' },
    { icon: '⚡', title: 'Instant Logging', description: 'Log health data in seconds' },
    { icon: '🔐', description: 'Your data stays private and secure' }
  ];

  const container = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      ref={containerRef}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-100px' }}
      className="relative space-y-8 max-w-2xl mx-auto px-6 md:px-12 py-16"
    >
      {/* Main Heading */}
      <motion.div variants={item} className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-display font-light tracking-tight text-white">
          Start Your <span className="font-black italic text-emerald-400">Health Intelligence</span> Journey
        </h2>
        <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">
          Track multiple health signals in one intelligent platform. Get actionable insights that help you optimize every aspect of your wellness.
        </p>
      </motion.div>

      {/* Feature Grid */}
      <motion.div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            variants={item}
            whileHover={{ scale: 1.05, borderColor: 'rgba(16, 185, 129, 0.5)' }}
            className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
          >
            {feature.icon && <p className="text-3xl mb-2">{feature.icon}</p>}
            {feature.title && (
              <p className="text-white font-bold text-sm mb-1">{feature.title}</p>
            )}
            <p className="text-slate-400 text-xs font-light">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Main CTA Buttons */}
      <motion.div
        variants={item}
        className="flex flex-col sm:flex-row gap-4 pt-8 justify-center"
      >
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('signup')}
          className="group relative px-8 md:px-12 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-center overflow-hidden transition-all"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            Start Free Today
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, borderColor: 'rgba(16, 185, 129, 0.8)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('login')}
          className="group px-8 md:px-12 py-4 rounded-full border-2 border-emerald-400/50 text-emerald-400 font-bold hover:bg-emerald-400/10 transition-all"
        >
          Sign In
        </motion.button>
      </motion.div>

      {/* Trust indicators */}
      <motion.div
        variants={item}
        className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-slate-400 border-t border-white/10"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>HIPAA Compliant</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>End-to-End Encrypted</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v2h8v-2zM2 15a4 4 0 008 0v2H0v-2z" />
          </svg>
          <span>Join 10K+ Users</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
