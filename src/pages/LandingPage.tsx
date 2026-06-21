import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowRight, Activity, Sparkles, Eye, Zap, Star, Users, Shield, Award, Cpu, Dna, Microscope, Stethoscope, Pill, Globe, Layers, Box, Pyramid, Heart } from 'lucide-react';
import { MedSageLogo } from '@/components/MedSageLogo';

export function LandingPage() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 3D Transform calculations
  const calculate3DTransform = (depth = 1) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const rotateY = ((mousePosition.x - w / 2) / w) * 20 * depth;
    const rotateX = -((mousePosition.y - h / 2) / h) * 20 * depth;
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300 overflow-x-hidden relative">
      {/* 3D Animated Background - Now in Front! */}
      <div className="fixed inset-0 z-10">
        {/* Multi-layer 3D Gradient Mesh - Slower Animation */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-300 rounded-full mix-blend-screen filter blur-3xl animate-pulse opacity-40" style={{ animationDuration: '6s' }} />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-300 rounded-full mix-blend-screen filter blur-3xl animate-pulse opacity-40" style={{ animationDuration: '5s' }} />
          <div className="absolute bottom-0 left-1/2 w-[700px] h-[700px] bg-violet-300 rounded-full mix-blend-screen filter blur-3xl animate-pulse opacity-35" style={{ animationDuration: '7s' }} />
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-green-300 rounded-full mix-blend-screen filter blur-3xl animate-pulse opacity-30" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-300 rounded-full mix-blend-screen filter blur-3xl animate-pulse opacity-30" style={{ animationDuration: '6s' }} />
        </div>

        {/* Neural Network Background - Reduced */}
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <defs>
            <radialGradient id="neuralNode">
              <stop offset="0%" stopColor="#ddd6fe" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          {[...Array(4)].map((_, i) => (
            <g key={`neural-${i}`}>
              {/* Reduced Neural Nodes */}
              {[...Array(3)].map((_, j) => (
                <circle
                  key={`node-${i}-${j}`}
                  cx={`${20 + i * 20}%`}
                  cy={`${20 + j * 25}%`}
                  r="3"
                  fill="url(#neuralNode)"
                />
              ))}
              {/* Reduced Neural Connections */}
              {[...Array(2)].map((_, k) => (
                <line
                  key={`line-${i}-${k}`}
                  x1={`${20 + i * 20}%`}
                  y1={`${20 + k * 25}%`}
                  x2={`${40 + i * 20}%`}
                  y2={`${20 + (k + 1) * 25}%`}
                  stroke="url(#neuralNode)"
                  strokeWidth="1"
                  opacity="0.5"
                />
              ))}
            </g>
          ))}
        </svg>

        {/* Data Stream Lines - Reduced */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`stream-${i}`}
            className="absolute h-px bg-gradient-to-r from-transparent via-purple-200 to-emerald-500"
            style={{
              width: `${150 + Math.random() * 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}

        {/* Holographic Grid Layers - Reduced */}
        {[...Array(2)].map((_, layer) => (
          <div
            key={`holographic-${layer}`}
            className="absolute inset-0 opacity-5"
            style={{
              transform: `translateZ(${layer * 100}px) rotateX(${layer * 15}deg)`,
            }}
          >
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(221, 214, 254, 0.2) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(16, 185, 129, 0.2) 1px, transparent 1px)
                `,
                backgroundSize: `${80 + layer * 30}px ${80 + layer * 30}px`,
                transform: calculate3DTransform(0.1 + layer * 0.05),
              }}
            />
          </div>
        ))}

        {/* Floating Medical Icons - Reduced */}
        {[...Array(5)].map((_, i) => {
          const icons = [Brain, Heart, Activity, Shield, Award];
          const Icon = icons[i % icons.length];
          const size = 24 + (i * 4);
          
          return (
            <div
              key={`medical-icon-${i}`}
              className="absolute opacity-15"
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${20 + (i * 12)}%`,
                transform: calculate3DTransform(0.3),
              }}
            >
              <Icon 
                className="text-purple-200" 
                style={{ 
                  width: `${size}px`, 
                  height: `${size}px`,
                  filter: 'drop-shadow(0 0 8px rgba(221, 214, 254, 0.4))'
                }} 
              />
            </div>
          );
        })}

        {/* DNA Double Helix Background - Simplified */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <defs>
            <linearGradient id="dnaGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ddd6fe" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ddd6fe" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          
          <path
            d="M 20 0 Q 30 50 20 100 Q 10 150 20 200"
            stroke="url(#dnaGradient1)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 20 0 Q 10 50 20 100 Q 30 150 20 200"
            stroke="url(#dnaGradient1)"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        {/* Floating Code Elements - Reduced */}
        {[...Array(4)].map((_, i) => {
          const codeSnippets = ['AI', 'DNA', 'ML', 'API'];
          return (
            <div
              key={`code-${i}`}
              className="absolute font-mono text-xs text-purple-200/20 font-bold"
              style={{
                left: `${15 + (i * 20)}%`,
                top: `${15 + (i * 20)}%`,
                transform: calculate3DTransform(0.15),
              }}
            >
              {codeSnippets[i]}
            </div>
          );
        })}

        {/* 3D Floating Geometric Shapes - Reduced */}
        {[...Array(6)].map((_, i) => {
          const shapes = ['cube', 'sphere', 'diamond'];
          const shape = shapes[i % shapes.length];
          const size = 24 + (i * 4);
          
          return (
            <div
              key={`shape-3d-${i}`}
              className="absolute opacity-20"
              style={{
                left: `${15 + (i * 12)}%`,
                top: `${15 + (i * 12)}%`,
                transform: calculate3DTransform(0.5),
              }}
            >
              {shape === 'cube' && (
                <div 
                  className="bg-gradient-to-br from-purple-200 to-emerald-400"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    transform: 'rotateX(45deg) rotateY(45deg)',
                  }}
                />
              )}
              {shape === 'sphere' && (
                <div 
                  className="bg-gradient-to-br from-purple-200 to-teal-400 rounded-full"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                  }}
                />
              )}
              {shape === 'diamond' && (
                <div 
                  className="bg-gradient-to-br from-purple-200 to-emerald-500"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    transform: 'rotate(45deg)',
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Constellation Points - Reduced */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`constellation-${i}`}
            className="absolute w-1 h-1 bg-purple-100 rounded-full"
            style={{
              left: `${15 + (i * 10)}%`,
              top: `${10 + (i * 10)}%`,
              boxShadow: '0 0 8px rgba(221, 214, 254, 0.6)',
            }}
          />
        ))}
      </div>

      {/* Content Layer - Now on Top */}
      <div className="relative z-50">   {/* 3D Human Body Visualization */}
        <motion.div 
          style={{ 
            transform: calculate3DTransform(0.2),
          }}
          className="absolute inset-0 flex items-center justify-center opacity-20"
        >
          <svg
            viewBox="0 0 300 600"
            className="w-full h-full max-w-3xl max-h-screen"
            fill="none"
            stroke="url(#neuralGradient)"
            strokeWidth="2"
          >
            <defs>
              <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="25%" stopColor="#10b981" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.6" />
                <stop offset="75%" stopColor="#059669" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
              </linearGradient>
              <filter id="glow3d">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Enhanced 3D Human Body */}
            <g filter="url(#glow3d)">
              {/* Head with Brain */}
              <motion.circle
                cx="150" cy="80" r="40" strokeWidth="3"
                animate={{
                  r: [40, 45, 40],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.circle
                cx="150" cy="80" r="15" fill="url(#neuralGradient)"
                animate={{
                  r: [15, 20, 15],
                  opacity: [0.9, 1, 0.9],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* 3D Torso */}
              <motion.rect
                x="110" y="120" width="80" height="120" rx="10" strokeWidth="3"
                animate={{
                  width: [80, 85, 80],
                  height: [120, 125, 120],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Arms */}
              <path d="M 110 140 Q 70 180 60 240" strokeWidth="3" />
              <path d="M 190 140 Q 230 180 240 240" strokeWidth="3" />
              
              {/* Legs */}
              <path d="M 130 240 Q 120 320 110 420" strokeWidth="3" />
              <path d="M 170 240 Q 180 320 190 420" strokeWidth="3" />
              
              {/* 3D Energy Centers */}
              {[{cy: 80, size: 12}, {cy: 160, size: 10}, {cy: 240, size: 10}, {cy: 320, size: 8}].map((center, i) => (
                <g key={i}>
                  <motion.circle
                    cx="150" cy={center.cy} r={center.size}
                    fill={i % 2 === 0 ? "url(#neuralGradient)" : "url(#energyGradient)"}
                    animate={{
                      r: [center.size, center.size * 1.5, center.size],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 2 + (i * 0.5),
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.circle
                    cx="150" cy={center.cy} r={center.size * 2}
                    fill="none"
                    stroke={i % 2 === 0 ? "#a855f7" : "#10b981"}
                    strokeWidth="1"
                    opacity="0.5"
                    animate={{
                      r: [center.size * 2, center.size * 3, center.size * 2],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 3 + (i * 0.5),
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </g>
              ))}
              
              {/* 3D DNA Helix */}
              <motion.path
                d="M 250 100 Q 270 150 250 200 Q 230 250 250 300"
                strokeWidth="2" opacity="0.4" stroke="#10b981"
                animate={{
                  d: [
                    "M 250 100 Q 270 150 250 200 Q 230 250 250 300",
                    "M 250 100 Q 280 150 250 200 Q 220 250 250 300",
                    "M 250 100 Q 270 150 250 200 Q 230 250 250 300"
                  ]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.path
                d="M 50 100 Q 30 150 50 200 Q 70 250 50 300"
                strokeWidth="2" opacity="0.4" stroke="#a855f7"
                animate={{
                  d: [
                    "M 50 100 Q 30 150 50 200 Q 70 250 50 300",
                    "M 50 100 Q 20 150 50 200 Q 80 250 50 300",
                    "M 50 100 Q 30 150 50 200 Q 70 250 50 300"
                  ]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </g>
          </svg>
        </motion.div>

        {/* 3D Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <motion.div 
            className="h-full w-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(147, 51, 234, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              transform: calculate3DTransform(0.1),
            }}
            animate={{
              backgroundPosition: [
                '0px 0px',
                '50px 50px',
                '0px 0px'
              ],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
      </div>

      {/* Professional Navigation - MedSage Branded */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-transparent border-b border-teal-200/30 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 -ml-2">
              <MedSageLogo className="w-10 h-10 sm:w-16 h-auto" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-teal-900 leading-tight">
                  MedSage
                </h1>
                <div className="text-[10px] sm:text-xs text-teal-600 font-medium hidden sm:block">AI Health Intelligence</div>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-teal-800">
                <a href="#features" className="hover:text-teal-600 transition-colors">Features</a>
                <a href="#" className="hover:text-teal-600 transition-colors">About</a>
                <a href="#" className="hover:text-teal-600 transition-colors">Contact</a>
                <a href="#" className="hover:text-teal-600 transition-colors">Privacy & Terms</a>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                <button 
                  onClick={() => navigate('/login')}
                  className="px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/signup')}
                  className="px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MedSage Branded Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 mt-20 overflow-hidden">
        <div
          className="relative z-10 w-full max-w-6xl"
        >
          {/* MedSage Glass Card - No Border */}
          <div 
            className="backdrop-blur-2xl rounded-3xl p-6 sm:p-12 lg:p-16 shadow-2xl relative overflow-hidden bg-transparent"
          >
            {/* Subtle Teal Background Pattern - Increased Transparency */}
            <div className="absolute inset-0 opacity-3">
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 80%, rgba(20, 184, 166, 0.015) 0%, transparent 40%),
                    radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.015) 0%, transparent 40%),
                    radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.01) 0%, transparent 50%)
                  `,
                }}
              />
            </div>

            <div className="text-center space-y-6 sm:space-y-8 relative z-10">
              {/* MedSage Badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100/60 border border-teal-300/50 rounded-full"
              >
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span className="text-xs sm:text-sm font-medium text-teal-800">Powered by Advanced AI</span>
                <Star className="w-4 h-4 text-emerald-500" />
              </div>

              {/* MedSage Logo Large */}
              <div className="flex justify-center">
                <MedSageLogo className="w-20 h-20 sm:w-32 sm:h-32" />
              </div>

              {/* MedSage Typography */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight">
                <span className="block text-teal-900 mb-2">
                  The Future of
                </span>
                <span className="block text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 mb-4">
                  Health Intelligence
                </span>
                <span className="block text-sm sm:text-lg lg:text-xl xl:text-2xl font-medium text-teal-700">
                  Powered by AI
                </span>
              </h1>
              
              <p className="text-sm sm:text-lg lg:text-xl text-teal-800 max-w-4xl mx-auto leading-relaxed">
                Experience the convergence of cutting-edge artificial intelligence and personalized healthcare. 
                Transform your wellness journey with predictive insights and real-time optimization.
              </p>
              
              {/* MedSage CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 sm:pt-6">
                <a 
                  href="/signup" 
                  className="group px-6 py-3 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Start Your Journey</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a 
                  href="#features" 
                  className="group px-6 py-3 bg-teal-100/60 text-teal-800 font-semibold rounded-xl border border-teal-300/50 hover:bg-teal-200/60 hover:text-teal-900 transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Explore Platform</span>
                </a>
              </div>
            </div>
          </div>

          {/* MedSage Floating Elements - hidden on mobile to prevent overflow */}
          <div className="hidden md:block absolute -top-16 -left-16 w-32 h-32 backdrop-blur-xl bg-teal-100/40 border border-teal-300/30 rounded-2xl" />
          <div className="hidden md:block absolute -bottom-16 -right-16 w-40 h-40 backdrop-blur-xl bg-emerald-100/40 border border-emerald-300/30 rounded-2xl" />
          <div className="hidden md:block absolute top-1/2 -left-24 w-24 h-24 backdrop-blur-xl bg-teal-200/30 border border-teal-400/30 rounded-full" />
          <div className="hidden md:block absolute top-1/3 -right-24 w-28 h-28 backdrop-blur-xl bg-green-200/30 border border-green-400/30 rounded-full" />
        </div>
      </section>

      {/* MedSage Features Section - Behind Navigation */}
      <section className="py-16 sm:py-32 px-4 sm:px-6 relative z-40 overflow-hidden">
        {/* 3D Health Background Elements - Enhanced Visibility */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating DNA Helix */}
          <svg className="absolute top-20 left-10 w-32 h-64 opacity-40" viewBox="0 0 100 200">
            <defs>
              <linearGradient id="dnaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="50%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            {[...Array(8)].map((_, i) => (
              <g key={i} transform={`translate(0, ${i * 25})`}>
                <ellipse cx="30" cy="12" rx="8" ry="4" fill="url(#dnaGrad)" opacity="0.6" />
                <ellipse cx="70" cy="12" rx="8" ry="4" fill="url(#dnaGrad)" opacity="0.6" />
                <path d={`M30 12 Q50 ${12 + (i % 2 === 0 ? 8 : -8)} 70 12`} stroke="url(#dnaGrad)" strokeWidth="1.5" fill="none" opacity="0.5" />
              </g>
            ))}
          </svg>

          {/* Heart Pulse Lines */}
          <svg className="absolute top-40 right-20 w-48 h-24 opacity-30" viewBox="0 0 200 100">
            <path d="M0 50 L40 50 L50 20 L70 80 L90 30 L110 70 L130 40 L150 60 L170 35 L190 55 L200 50" 
                  stroke="#14b8a6" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M0 65 L30 65 L40 40 L60 90 L80 45 L100 75 L120 50 L140 65 L160 45 L180 60 L200 65" 
                  stroke="#0d9488" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
          </svg>

          {/* Hexagon Grid - Molecular Structure */}
          <div className="absolute bottom-20 left-1/4 opacity-25">
            <svg width="120" height="140" viewBox="0 0 120 140">
              {[0, 1, 2].map(row =>
                [0, 1].map(col => {
                  const x = col * 70 + (row % 2) * 35;
                  const y = row * 40;
                  return (
                    <polygon
                      key={`${row}-${col}`}
                      points="30,0 60,15 60,45 30,60 0,45 0,15"
                      transform={`translate(${x}, ${y}) scale(0.5)`}
                      fill="none"
                      stroke="#2dd4bf"
                      strokeWidth="2"
                    />
                  );
                })
              )}
            </svg>
          </div>

          {/* Brain Wave Circles */}
          <div className="absolute bottom-40 right-10 opacity-30">
            <svg width="100" height="100" viewBox="0 0 100 100">
              {[20, 35, 50, 65, 80].map((r, i) => (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="1.5"
                  opacity={1 - i * 0.15}
                />
              ))}
            </svg>
          </div>

          {/* Floating Plus Signs - Medical */}
          <div className="absolute top-60 left-1/3 opacity-40">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <path d="M25 10 L35 10 L35 25 L50 25 L50 35 L35 35 L35 50 L25 50 L25 35 L10 35 L10 25 L25 25 Z" 
                    fill="#22c55e" />
            </svg>
          </div>

          <div className="absolute bottom-32 right-1/3 opacity-30">
            <svg width="40" height="40" viewBox="0 0 40 40">
              <path d="M17 5 L23 5 L23 17 L35 17 L35 23 L23 23 L23 35 L17 35 L17 23 L5 23 L5 17 L17 17 Z" 
                    fill="#14b8a6" />
            </svg>
          </div>

          {/* Cell/Atom Structure */}
          <div className="absolute top-32 right-1/4 opacity-20">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="8" fill="#0d9488" />
              <ellipse cx="40" cy="40" rx="35" ry="15" fill="none" stroke="#2dd4bf" strokeWidth="1.5" transform="rotate(0 40 40)" />
              <ellipse cx="40" cy="40" rx="35" ry="15" fill="none" stroke="#2dd4bf" strokeWidth="1.5" transform="rotate(60 40 40)" />
              <ellipse cx="40" cy="40" rx="35" ry="15" fill="none" stroke="#2dd4bf" strokeWidth="1.5" transform="rotate(120 40 40)" />
            </svg>
          </div>

          {/* Additional 3D Health Elements */}
          {/* Floating Heart Icons */}
          <div className="absolute top-1/4 left-1/2 opacity-10">
            <svg width="50" height="50" viewBox="0 0 100 100">
              <path d="M50 25 C35 10, 10 20, 10 45 C10 65, 30 80, 50 95 C70 80, 90 65, 90 45 C90 20, 65 10, 50 25Z" 
                    fill="#2dd4bf" />
            </svg>
          </div>

          {/* Medical Cross - Small Floating */}
          <div className="absolute top-2/3 left-20 opacity-15">
            <svg width="45" height="45" viewBox="0 0 60 60">
              <rect x="22" y="10" width="16" height="40" rx="5" fill="#14b8a6" />
              <rect x="10" y="22" width="40" height="16" rx="5" fill="#14b8a6" />
            </svg>
          </div>

          {/* Floating Pills/Capsules */}
          <div className="absolute bottom-1/4 left-3/4 opacity-12">
            <svg width="35" height="70" viewBox="0 0 40 80">
              <rect x="10" y="5" width="20" height="70" rx="10" fill="none" stroke="#0d9488" strokeWidth="2" />
              <line x1="10" y1="40" x2="30" y2="40" stroke="#0d9488" strokeWidth="2" />
            </svg>
          </div>

          {/* Microscope Slide Lines */}
          <div className="absolute top-1/2 right-1/4 opacity-8">
            <svg width="100" height="2" viewBox="0 0 100 2">
              <line x1="0" y1="1" x2="100" y2="1" stroke="#2dd4bf" strokeWidth="2" />
            </svg>
          </div>
          <div className="absolute top-1/2 right-1/4 mt-4 opacity-8">
            <svg width="80" height="2" viewBox="0 0 80 2">
              <line x1="0" y1="1" x2="80" y2="1" stroke="#14b8a6" strokeWidth="2" />
            </svg>
          </div>

          {/* DNA Double Helix - Second Position */}
          <div className="absolute bottom-1/3 left-10 opacity-15">
            <svg width="40" height="120" viewBox="0 0 40 120">
              {[...Array(6)].map((_, i) => (
                <g key={i}>
                  <circle cx="10" cy={i * 20 + 10} r="4" fill="#5eead4" />
                  <circle cx="30" cy={i * 20 + 10} r="4" fill="#5eead4" />
                  <path d={`M10 ${i * 20 + 10} Q20 ${i * 20 + (i % 2 === 0 ? 15 : 5)} 30 ${i * 20 + 10}`} 
                        stroke="#5eead4" strokeWidth="1" fill="none" opacity="0.5" />
                </g>
              ))}
            </svg>
          </div>

          {/* Pulse Dots */}
          <div className="absolute top-16 right-1/3 flex gap-2 opacity-40">
            <div className="w-2 h-2 bg-teal-400 rounded-full" />
            <div className="w-3 h-3 bg-teal-500 rounded-full" />
            <div className="w-2 h-2 bg-teal-400 rounded-full" />
          </div>

          {/* Molecular Bond Lines */}
          <div className="absolute bottom-1/2 left-1/2 opacity-25">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle cx="15" cy="15" r="5" fill="#2dd4bf" />
              <circle cx="45" cy="15" r="5" fill="#2dd4bf" />
              <circle cx="30" cy="45" r="5" fill="#2dd4bf" />
              <line x1="15" y1="15" x2="45" y2="15" stroke="#2dd4bf" strokeWidth="2" />
              <line x1="15" y1="15" x2="30" y2="45" stroke="#2dd4bf" strokeWidth="2" />
              <line x1="45" y1="15" x2="30" y2="45" stroke="#2dd4bf" strokeWidth="2" />
            </svg>
          </div>

          {/* Additional Health Elements */}
          {/* Stethoscope */}
          <div className="absolute top-1/3 right-1/3 opacity-30">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <path d="M15 45 C15 50, 20 55, 25 55 C30 55, 35 50, 35 45 L35 25 C35 20, 30 15, 25 15 C20 15, 15 20, 15 25" 
                    fill="none" stroke="#14b8a6" strokeWidth="2" />
              <circle cx="25" cy="10" r="5" fill="#0d9488" />
              <path d="M35 25 L45 25 L45 35 L40 40" fill="none" stroke="#14b8a6" strokeWidth="2" />
            </svg>
          </div>

          {/* Blood Drop */}
          <div className="absolute bottom-1/4 right-20 opacity-35">
            <svg width="30" height="40" viewBox="0 0 30 40">
              <path d="M15 5 C15 5, 5 20, 5 28 C5 35, 10 38, 15 38 C20 38, 25 35, 25 28 C25 20, 15 5, 15 5Z" 
                    fill="#ef4444" opacity="0.9" />
            </svg>
          </div>

          {/* Medical Chart/Graph */}
          <div className="absolute top-20 right-1/2 opacity-30">
            <svg width="80" height="50" viewBox="0 0 80 50">
              <rect x="5" y="35" width="10" height="10" fill="#2dd4bf" opacity="0.8" />
              <rect x="20" y="25" width="10" height="20" fill="#14b8a6" opacity="0.8" />
              <rect x="35" y="15" width="10" height="30" fill="#0d9488" opacity="0.8" />
              <rect x="50" y="20" width="10" height="25" fill="#2dd4bf" opacity="0.8" />
              <rect x="65" y="10" width="10" height="35" fill="#14b8a6" opacity="0.8" />
            </svg>
          </div>

          {/* Medicine Bottle */}
          <div className="absolute bottom-20 left-1/3 opacity-30">
            <svg width="35" height="50" viewBox="0 0 35 50">
              <rect x="5" y="15" width="25" height="30" rx="3" fill="none" stroke="#0d9488" strokeWidth="2" />
              <rect x="8" y="8" width="19" height="10" rx="2" fill="#14b8a6" />
              <line x1="12" y1="25" x2="23" y2="25" stroke="#2dd4bf" strokeWidth="2" />
              <line x1="12" y1="30" x2="23" y2="30" stroke="#2dd4bf" strokeWidth="2" />
              <line x1="12" y1="35" x2="18" y2="35" stroke="#2dd4bf" strokeWidth="2" />
            </svg>
          </div>

          {/* Heart with Pulse Line */}
          <div className="absolute top-40 left-1/4 opacity-35">
            <svg width="50" height="50" viewBox="0 0 50 50">
              <path d="M25 15 C20 10, 10 12, 10 22 C10 30, 25 42, 25 42 C25 42, 40 30, 40 22 C40 12, 30 10, 25 15Z" 
                    fill="none" stroke="#2dd4bf" strokeWidth="2" />
              <path d="M5 25 L12 25 L15 18 L20 32 L23 22 L27 28 L32 20 L35 25 L45 25" 
                    fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Thermometer */}
          <div className="absolute bottom-40 right-10 opacity-30">
            <svg width="25" height="60" viewBox="0 0 25 60">
              <rect x="8" y="5" width="9" height="40" rx="4" fill="none" stroke="#14b8a6" strokeWidth="2" />
              <circle cx="12.5" cy="50" r="8" fill="#0d9488" />
              <line x1="12" y1="15" x2="12" y2="35" stroke="#2dd4bf" strokeWidth="2" />
            </svg>
          </div>

          {/* Bandage/Plaster */}
          <div className="absolute top-1/2 left-20 opacity-25">
            <svg width="50" height="30" viewBox="0 0 50 30">
              <rect x="5" y="5" width="40" height="20" rx="5" fill="#f0fdfa" stroke="#14b8a6" strokeWidth="1.5" />
              <circle cx="15" cy="15" r="3" fill="#2dd4bf" opacity="0.8" />
              <circle cx="25" cy="15" r="3" fill="#2dd4bf" opacity="0.8" />
              <circle cx="35" cy="15" r="3" fill="#2dd4bf" opacity="0.8" />
            </svg>
          </div>

          {/* Syringe */}
          <div className="absolute bottom-32 left-1/2 opacity-30">
            <svg width="25" height="60" viewBox="0 0 25 60">
              <rect x="8" y="10" width="9" height="35" fill="none" stroke="#0d9488" strokeWidth="2" />
              <rect x="6" y="5" width="13" height="8" rx="2" fill="#14b8a6" />
              <line x1="12" y1="45" x2="12" y2="55" stroke="#2dd4bf" strokeWidth="2" />
              <line x1="8" y1="55" x2="16" y2="55" stroke="#2dd4bf" strokeWidth="2" />
            </svg>
          </div>

          {/* Brain Icon */}
          <div className="absolute top-28 right-28 opacity-25">
            <svg width="45" height="45" viewBox="0 0 45 45">
              <path d="M22.5 10 C15 10, 10 15, 10 22.5 C10 30, 15 35, 22.5 35 C30 35, 35 30, 35 22.5 C35 15, 30 10, 22.5 10Z" 
                    fill="none" stroke="#2dd4bf" strokeWidth="2" />
              <path d="M15 18 Q22.5 12, 30 18" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
              <path d="M12 25 Q22.5 20, 33 25" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
              <path d="M15 30 Q22.5 25, 30 30" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Microscope */}
          <div className="absolute bottom-16 left-16 opacity-25">
            <svg width="40" height="50" viewBox="0 0 40 50">
              <circle cx="25" cy="15" r="8" fill="none" stroke="#14b8a6" strokeWidth="2" />
              <line x1="25" y1="23" x2="25" y2="35" stroke="#0d9488" strokeWidth="3" />
              <rect x="15" y="35" width="20" height="5" rx="2" fill="#2dd4bf" />
              <line x1="10" y1="42" x2="30" y2="42" stroke="#14b8a6" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-24">
            <div className="backdrop-blur-2xl bg-teal-50/30 border border-teal-200/50 rounded-3xl p-6 sm:p-10 inline-block shadow-lg relative overflow-hidden">
              {/* Glass Morphism Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-teal-50/20 to-transparent backdrop-blur-md rounded-3xl" />
              
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-teal-900 mb-4 sm:mb-6">
                  Advanced Features
                </h2>
                <p className="text-sm sm:text-lg text-teal-800 max-w-4xl mx-auto leading-relaxed">
                  Cutting-edge technology meets personalized healthcare. Experience the future of wellness management.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Analysis",
                description: "Advanced machine learning algorithms analyze your health data with unprecedented accuracy.",
                features: ["Real-time processing", "Pattern recognition", "Predictive insights"]
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your health data is protected with enterprise-grade security and end-to-end encryption.",
                features: ["HIPAA compliant", "256-bit encryption", "Privacy first"]
              },
              {
                icon: Activity,
                title: "Real-Time Monitoring",
                description: "Continuous health tracking with instant alerts and personalized recommendations.",
                features: ["24/7 monitoring", "Smart alerts", "Custom thresholds"]
              },
              {
                icon: Users,
                title: "Expert Consultations",
                description: "Connect with healthcare professionals for personalized medical advice and support.",
                features: ["Video consultations", "Specialist access", "Second opinions"]
              },
              {
                icon: Award,
                title: "Certified Technology",
                description: "FDA-approved medical technology with proven clinical accuracy and reliability.",
                features: ["FDA cleared", "Clinical validation", "Evidence-based"]
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Get instant results and recommendations with our optimized processing engine.",
                features: ["Instant results", "Optimized algorithms", "Cloud processing"]
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group"
              >
                <div className="backdrop-blur-2xl bg-transparent border border-teal-200/50 rounded-3xl p-6 sm:p-8 h-full hover:border-teal-400/50 transition-all duration-300 relative overflow-hidden shadow-lg">
                  {/* Glass Morphism Background Effect - Transparent */}
                  <div className="absolute inset-0 bg-transparent backdrop-blur-md rounded-3xl" />
                  
                  {/* Subtle Teal Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div 
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, rgba(20, 184, 166, 0.15) 0%, transparent 50%)`,
                      }}
                    />
                  </div>

                  {/* MedSage Icon - Centered without shadow */}
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 via-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-all duration-300 relative z-10 mx-auto">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-teal-900 mb-4 relative z-10">
                    {feature.title}
                  </h3>
                  <p className="text-teal-800 mb-6 leading-relaxed relative z-10">
                    {feature.description}
                  </p>

                  <ul className="space-y-3 relative z-10">
                    {feature.features.map((item, j) => (
                      <li 
                        key={j} 
                        className="flex items-center gap-3 text-teal-700"
                      >
                        <div className="w-2 h-2 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" />
                        <span className="text-sm font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MedSage Footer - Centered */}
      <footer className="py-8 px-6 border-t border-gray-300 bg-transparent z-[100] relative">
        <div className="max-w-7xl mx-auto">
          {/* Centered Copyright */}
          <div className="border-t border-gray-300 pt-4 flex flex-col items-center">
            <p className="text-xs text-gray-700 font-medium text-center">© 2024 MedSage. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
