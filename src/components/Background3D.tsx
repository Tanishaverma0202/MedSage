import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export function Background3D() {
  const location = useLocation();
  const path = location.pathname;

  // Define page-specific elements
  const getElements = () => {
    switch (path) {
      case '/':
        return (
          <>
            <FloatingElement delay={0} top="20%" left="10%" rotate={[-10, 10, -10]} emoji="💊" size="text-7xl" />
            <FloatingElement delay={1} top="60%" right="15%" rotate={[10, -10, 10]} emoji="🧬" size="text-8xl" />
            <FloatingElement delay={2} top="15%" right="25%" rotate={[-20, 20, -20]} emoji="🩺" size="text-6xl" />
          </>
        );
      case '/chat':
        return (
          <>
            <FloatingElement delay={0} top="15%" left="15%" rotate={[-10, 10, -10]} emoji="💬" size="text-7xl" />
            <FloatingElement delay={1.5} top="70%" right="10%" rotate={[10, -10, 10]} emoji="✨" size="text-8xl" />
            <FloatingElement delay={0.5} top="30%" right="20%" rotate={[-15, 15, -15]} emoji="🤖" size="text-6xl" />
          </>
        );
      case '/nutrition':
        return (
          <>
            <FloatingElement delay={0} top="20%" left="10%" rotate={[-10, 10, -10]} emoji="🥑" size="text-7xl" />
            <FloatingElement delay={1} top="65%" right="15%" rotate={[15, -15, 15]} emoji="🥗" size="text-8xl" />
            <FloatingElement delay={2} top="15%" right="30%" rotate={[-20, 20, -20]} emoji="💧" size="text-6xl" />
          </>
        );
      case '/mental-health':
        return (
          <>
            <FloatingElement delay={0} top="25%" left="15%" rotate={[-10, 10, -10]} emoji="🧠" size="text-8xl" />
            <FloatingElement delay={1.5} top="60%" right="20%" rotate={[10, -10, 10]} emoji="🧘‍♀️" size="text-7xl" />
            <FloatingElement delay={0.8} top="15%" right="15%" rotate={[-15, 15, -15]} emoji="☁️" size="text-6xl" />
          </>
        );
      case '/workout':
        return (
          <>
            <FloatingElement delay={0} top="20%" left="15%" rotate={[-10, 10, -10]} emoji="🏋️‍♂️" size="text-8xl" />
            <FloatingElement delay={1} top="65%" right="15%" rotate={[15, -15, 15]} emoji="⚡" size="text-7xl" />
            <FloatingElement delay={2} top="15%" right="25%" rotate={[-20, 20, -20]} emoji="🔥" size="text-6xl" />
          </>
        );
      case '/hormones':
        return (
          <>
            <FloatingElement delay={0} top="25%" left="10%" rotate={[-10, 10, -10]} emoji="🩸" size="text-7xl" />
            <FloatingElement delay={1.5} top="60%" right="15%" rotate={[10, -10, 10]} emoji="📊" size="text-8xl" />
            <FloatingElement delay={0.5} top="20%" right="25%" rotate={[-15, 15, -15]} emoji="🌙" size="text-6xl" />
          </>
        );
      case '/reports':
        return (
          <>
            <FloatingElement delay={0} top="20%" left="15%" rotate={[-10, 10, -10]} emoji="📄" size="text-7xl" />
            <FloatingElement delay={1} top="65%" right="20%" rotate={[15, -15, 15]} emoji="🔬" size="text-8xl" />
            <FloatingElement delay={2} top="15%" right="15%" rotate={[-20, 20, -20]} emoji="📈" size="text-6xl" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Ambient Gradients - Always present */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-purple-400/40 to-indigo-400/40 blur-[120px] mix-blend-multiply" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.4, 0.3] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-emerald-400/40 to-teal-400/40 blur-[120px] mix-blend-multiply" 
      />

      {/* Page Specific 3D Elements */}
      {getElements()}

      {/* Generic 3D Glass Shapes */}
      <motion.div 
        animate={{ y: [0, -40, 0], rotateX: [10, -10, 10], rotateY: [-20, 20, -20] }} 
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[10%] w-24 h-48 rounded-full bg-gradient-to-tr from-white/60 to-white/10 backdrop-blur-xl border border-white/60 shadow-[0_15px_35px_rgba(0,0,0,0.1),inset_0_0_20px_rgba(255,255,255,0.5)] hidden lg:block"
        style={{ transformStyle: 'preserve-3d' }}
      />
      <motion.div 
        animate={{ y: [0, 30, 0], rotateX: [-20, 20, -20], rotateZ: [0, 45, 0] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute bottom-[25%] left-[5%] w-32 h-32 rounded-3xl bg-gradient-to-tr from-purple-500/20 to-white/40 backdrop-blur-xl border border-white/60 shadow-[0_15px_35px_rgba(0,0,0,0.1),inset_0_0_20px_rgba(255,255,255,0.5)] hidden md:block"
        style={{ transformStyle: 'preserve-3d' }}
      />
      <motion.div 
        animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }} 
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[40%] left-[40%] w-40 h-40 rounded-full bg-gradient-to-tr from-emerald-400/20 to-white/40 backdrop-blur-md border border-white/50 shadow-[0_15px_35px_rgba(0,0,0,0.1),inset_0_0_20px_rgba(255,255,255,0.5)] hidden xl:block"
        style={{ transformStyle: 'preserve-3d' }}
      />
    </div>
  );
}

function FloatingElement({ delay, top, left, right, bottom, rotate, emoji, size }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 0.8, 
        scale: 1,
        y: [0, -30, 0],
        rotate: rotate
      }}
      transition={{ 
        y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay },
        rotate: { duration: 8, repeat: Infinity, ease: "easeInOut", delay },
        opacity: { duration: 1 },
        scale: { duration: 1, type: "spring" }
      }}
      className={`absolute ${size} hidden md:flex items-center justify-center`}
      style={{ 
        top, left, right, bottom,
        filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15)) drop-shadow(0 0 20px rgba(255,255,255,0.5))',
        transformStyle: 'preserve-3d'
      }}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-150" />
        <span className="relative z-10 block" style={{ textShadow: '0 10px 20px rgba(0,0,0,0.2), inset 0 2px 5px rgba(255,255,255,0.8)' }}>
          {emoji}
        </span>
      </div>
    </motion.div>
  );
}
