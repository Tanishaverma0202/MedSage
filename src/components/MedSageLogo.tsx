import React from 'react';

interface MedSageLogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'icon' | 'full';
}

export const MedSageLogo: React.FC<MedSageLogoProps> = ({ 
  className = "w-20 h-20", 
  showText = false,
  variant = 'full'
}) => (
  <div className="flex flex-col items-center justify-center">
    <div className={`relative ${className}`}>
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full drop-shadow-2xl"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Vibrant Teal to Emerald Gradient for Cross */}
          <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          
          {/* ECG Line Gradient with Pulse Effect */}
          <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#f0fdfa" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.8" />
          </linearGradient>

          {/* Glow Filter */}
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Medical Cross Body */}
        <g filter="url(#logoGlow)">
          {/* Vertical Bar */}
          <rect x="70" y="20" width="60" height="160" rx="16" fill="url(#crossGrad)" />
          {/* Horizontal Bar */}
          <rect x="20" y="70" width="160" height="60" rx="16" fill="url(#crossGrad)" />
        </g>
        
        {/* Heart Shape in center */}
        <path 
          d="M100 75
             C90 65, 75 70, 75 85
             C75 100, 100 115, 100 115
             C100 115, 125 100, 125 85
             C125 70, 110 65, 100 75Z" 
          fill="white"
          opacity="0.9"
        />
        
        {/* ECG Line through cross */}
        <path 
          d="M25 100 H55 L65 85 L75 115 L90 70 L110 130 L125 80 L135 115 L145 100 H175" 
          stroke="white" 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="animate-draw-ecg"
        />
      </svg>
    </div>
    
    {(showText || variant === 'full') && (
      <span className="mt-2 text-xl font-black tracking-[0.25em] text-teal-800 font-sans">
        MEDSAGE
      </span>
    )}
  </div>
);

