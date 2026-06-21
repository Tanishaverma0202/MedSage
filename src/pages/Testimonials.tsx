import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

export const Testimonials: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const testimonials = [
    {
      quote:
        'MedSage transformed how I think about my health. The AI insights are incredibly accurate and the mood tracking helped me identify patterns I never noticed.',
      author: 'Sarah Johnson',
      role: 'Health Coach',
      image: '👩‍🔬',
      rating: 5,
      metric: 'Lost 15 lbs in 3 months',
    },
    {
      quote:
        'As someone with an irregular cycle, MedSage\'s hormonal insights have been a game-changer. I now plan my activities around my cycle phases.',
      author: 'Emma Williams',
      role: 'Software Engineer',
      image: '🧑‍💻',
      rating: 5,
      metric: 'Better energy levels daily',
    },
    {
      quote:
        'The Luna AI chat feature feels like having a personal health advisor. Knowing it understands my complete health context makes the recommendations so much more relevant.',
      author: 'Marcus Chen',
      role: 'Athlete',
      image: '🏃',
      rating: 5,
      metric: 'Improved performance by 20%',
    },
    {
      quote:
        'Finally a health app that doesn\'t get overwhelming. MedSage makes tracking enjoyable and the insights are presented in a way I actually understand.',
      author: 'Lisa Rodriguez',
      role: 'Busy Mom',
      image: '👩‍🦰',
      rating: 5,
      metric: 'More consistent daily habits',
    },
  ];

  useEffect(() => {
    autoplayRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [testimonials.length]);

  const next = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="relative py-32 px-6 md:px-12 bg-gradient-to-b from-[#0f172a] to-[#020617] overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-blob" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-display font-light mb-6 text-white leading-tight">
            Loved by <span className="font-black italic text-emerald-400">Health Enthusiasts</span>
          </h2>
          <p className="text-lg text-slate-400">
            See what real users have achieved with MedSage
          </p>
        </motion.div>

        {/* Testimonial Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="p-12 rounded-3xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-emerald-500/30 min-h-[400px] flex flex-col justify-between"
            >
              {/* Rating stars */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonials[activeIndex].rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-2xl md:text-3xl font-light text-white mb-8 leading-relaxed italic">
                "{testimonials[activeIndex].quote}"
              </blockquote>

              {/* Author info */}
              <div className="flex items-center gap-4">
                <div className="text-5xl">{testimonials[activeIndex].image}</div>
                <div>
                  <p className="font-bold text-white text-lg">
                    {testimonials[activeIndex].author}
                  </p>
                  <p className="text-emerald-400 text-sm mb-1">
                    {testimonials[activeIndex].role}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {testimonials[activeIndex].metric}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={prev}
              className="p-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Dots indicator */}
            <div className="flex gap-3">
              {testimonials.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === activeIndex
                      ? 'bg-emerald-400'
                      : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                  animate={{
                    width: i === activeIndex ? 32 : 8,
                  }}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="p-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <motion.div
          className="grid grid-cols-3 gap-6 mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {[
            { value: '4.9', label: 'Star Rating' },
            { value: '10K+', label: 'Active Users' },
            { value: '98%', label: 'Satisfaction' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-3xl font-black text-emerald-400 mb-2">{stat.value}</p>
              <p className="text-slate-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
