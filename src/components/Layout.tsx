import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, MessageSquare, Apple, Brain, Activity, Droplet, FileText, User, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Background3D } from './Background3D';
import { useAppContext } from '@/context/AppContext';
import { MedSageLogo } from '@/components/MedSageLogo';

const navItems = [
  { icon: Home, label: 'Home', path: '.' },
  { icon: MessageSquare, label: "Let's Talk", path: 'chat' },
  { icon: Apple, label: 'Nutrition', path: 'nutrition' },
  { icon: Activity, label: 'Workout', path: 'workout' },
  { icon: Brain, label: 'Mental Health', path: 'mental-health' },
  { icon: Droplet, label: 'Hormones', path: 'hormones' },
  { icon: FileText, label: 'Reports', path: 'reports' },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAppContext();
  
  // Try to get the actual authenticated user from local storage
  const savedUserRaw = localStorage.getItem('user');
  let authUser = null;
  if (savedUserRaw) {
    try {
      authUser = JSON.parse(savedUserRaw);
    } catch(e) {}
  }
  
  const displayUserName = authUser?.fullName || user?.name || 'Guest';
  // First name only for compact display
  const displayFirstName = displayUserName.split(' ')[0];

  // Filter nav items based on user gender (hide Hormones for male users)
  const filteredNavItems = navItems.filter(item => {
    if (item.label === 'Hormones' && user?.gender?.toLowerCase() === 'male') {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7fb]/80 text-slate-800 font-sans overflow-x-hidden relative">
      
      {/* Subtle Noise Texture */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.015] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* 3D Background Elements */}
      <Background3D />

      {/* ── Top Navigation ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-white/40 backdrop-blur-xl border-b border-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-[4.5rem]">

            {/* ── Logo ─────────────────────────────────────────────────────── */}
            <Link to="/app" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center overflow-hidden shadow-[0_8px_16px_rgba(45,212,191,0.3)] transform group-hover:rotate-6 group-hover:scale-105 transition-all duration-300 bg-white">
                <MedSageLogo variant="icon" className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 tracking-tight">
                MedSage
              </h1>
            </Link>

            {/* ── Desktop Nav Items ─────────────────────────────────────────── */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-4 py-2 xl:py-2.5 rounded-full transition-all duration-300 relative group text-xs xl:text-sm font-medium",
                      isActive ? "text-purple-700" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-top"
                        className="absolute inset-0 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-200/50 rounded-full"
                        initial={false}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <item.icon className={cn("w-3.5 h-3.5 xl:w-4 xl:h-4 relative z-10 transition-transform duration-300 group-hover:scale-110", isActive ? "text-purple-600" : "text-slate-400 group-hover:text-slate-600")} />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* ── Right side: Profile + Mobile Toggle ──────────────────────── */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Profile button — shown on all screen sizes */}
              <button 
                onClick={() => navigate('/app/profile')}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full hover:bg-white/80 transition-all duration-300 border border-transparent hover:border-slate-200/50 hover:shadow-sm group"
              >
                {/* Name — hidden on xs, shown sm+ */}
                <p className="hidden sm:block text-xs sm:text-sm font-semibold text-slate-800 max-w-[6rem] lg:max-w-[8rem] truncate">
                  {displayFirstName}
                </p>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 border border-teal-300 flex items-center justify-center shadow-sm group-hover:from-teal-200 group-hover:to-teal-300 transition-all shrink-0">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                </div>
              </button>
              
              {/* Hamburger — visible below lg */}
              <button 
                className="lg:hidden p-1.5 sm:p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen
                  ? <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Navigation Drawer ──────────────────────────────────────── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-xl"
            >
              {/* Nav grid — 2 columns on phone, 3+ on tablet */}
              <div className="py-4 px-3 sm:px-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {filteredNavItems.map((item) => {
                  const isActive = location.pathname.endsWith(item.path === '.' ? '/app' : item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl transition-all duration-200 text-center",
                        isActive
                          ? "bg-purple-50 text-purple-700 border border-purple-100 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5", isActive ? "text-purple-600" : "text-slate-400")} />
                      <span className="text-xs font-semibold leading-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 lg:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.99 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
