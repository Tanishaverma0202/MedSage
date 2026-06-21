import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ArrowRight, CheckCircle } from 'lucide-react';

export const CTAPanel: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stat = entry.target as HTMLDivElement;
            const value = stat.getAttribute('data-value');
            
            if (value) {
              const from = { val: 0 };
              const to = { val: parseInt(value) };

              gsap.to(from, {
                val: to.val,
                duration: 2.5,
                ease: 'back.out',
                onUpdate: () => {
                  stat.textContent = Math.floor(from.val).toLocaleString();
                },
              });
            }
            
            // Stop observing after animation
            observer.unobserve(stat);
          }
        });
      },
      { threshold: 0.5 }
    );

    statsRef.current.forEach((stat) => {
      if (stat) observer.observe(stat);
    });

    return () => {
      statsRef.current.forEach((stat) => {
        if (stat) observer.unobserve(stat);
      });
    };
  }, []);

  const benefits = [
    'Real-time health tracking',
    'AI-powered personalized insights',
    'Complete health history',
    'Secure & private',
    'Zero ads or data selling',
  ];

  return (
    <div className="relative py-32 px-6 md:px-12 bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#0f172a] overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_25%,rgba(68,68,68,.2)_50%,transparent_50%,transparent_75%,rgba(68,68,68,.2)_75%,rgba(68,68,68,.2))] bg-[length:60px_60px] opacity-10" />

      <div
        ref={containerRef}
        className="relative z-10 max-w-5xl mx-auto"
      >
        <motion.div
          className="grid lg:grid-cols-2 gap-16 items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Left side - Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h2 className="text-5xl md:text-6xl font-display font-light text-white leading-tight">
                Start Your <span className="font-black italic text-emerald-400">Health Intelligence</span> Journey
              </h2>
              <p className="text-xl text-slate-300 font-light">
                Join thousands of users who have transformed their health with AI-powered insights and holistic tracking.
              </p>
            </motion.div>

            {/* Benefits list */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 pt-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <button
                onClick={() => onNavigate('signup')}
                className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-2">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              <button
                onClick={() => {
                  // Scroll to demo section
                  document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 border-2 border-emerald-400/50 text-emerald-400 font-bold rounded-full hover:bg-emerald-400/10 transition-all"
              >
                See It in Action
              </button>
            </motion.div>
          </div>

          {/* Right side - Stats */}
          <motion.div
            className="grid grid-cols-2 gap-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {[
              { value: 50, label: 'Health Metrics', suffix: '+' },
              { value: 100, label: 'K Active Users', suffix: '' },
              { value: 7, label: 'Day Analytics', suffix: '-' },
              { value: 24, label: '/7 Tracking', suffix: '' },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 hover:border-emerald-500/50 transition-all"
              >
                <div className="text-4xl font-black text-emerald-400 mb-2">
                  <div
                    ref={(el) => {
                      statsRef.current[i] = el;
                    }}
                    data-value={stat.value}
                    className="inline-block"
                  >
                    0
                  </div>
                  <span className="text-2xl">{stat.suffix}</span>
                </div>
                <p className="text-slate-300 text-sm">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Animated background elements */}
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
    </div>
  );
};
