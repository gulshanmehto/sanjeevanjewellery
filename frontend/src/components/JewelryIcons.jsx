import React from 'react';

// Silver gradient jewelry icons for brand consistency

export const RingIcon = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d4d4d4" />
        <stop offset="50%" stopColor="#a3a3a3" />
        <stop offset="100%" stopColor="#737373" />
      </linearGradient>
    </defs>
    <ellipse cx="32" cy="38" rx="18" ry="6" stroke="url(#silverGradient)" strokeWidth="3" fill="none"/>
    <ellipse cx="32" cy="20" rx="6" ry="6" fill="url(#silverGradient)"/>
    <path d="M 26 24 Q 26 32, 26 36" stroke="url(#silverGradient)" strokeWidth="3" fill="none"/>
    <path d="M 38 24 Q 38 32, 38 36" stroke="url(#silverGradient)" strokeWidth="3" fill="none"/>
  </svg>
);

export const NecklaceIcon = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="silverGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d4d4d4" />
        <stop offset="50%" stopColor="#a3a3a3" />
        <stop offset="100%" stopColor="#737373" />
      </linearGradient>
    </defs>
    <path d="M 10 15 Q 32 35, 54 15" stroke="url(#silverGradient2)" strokeWidth="3" fill="none"/>
    <path d="M 12 18 Q 32 36, 52 18" stroke="url(#silverGradient2)" strokeWidth="2" fill="none"/>
    <ellipse cx="32" cy="38" rx="8" ry="10" fill="url(#silverGradient2)"/>
    <ellipse cx="32" cy="38" rx="4" ry="5" fill="#1a1a1a"/>
  </svg>
);

export const EarringsIcon = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="silverGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d4d4d4" />
        <stop offset="50%" stopColor="#a3a3a3" />
        <stop offset="100%" stopColor="#737373" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="18" r="3" fill="url(#silverGradient3)"/>
    <path d="M 20 21 L 20 28" stroke="url(#silverGradient3)" strokeWidth="2"/>
    <polygon points="14,28 20,40 26,28" fill="url(#silverGradient3)"/>
    
    <circle cx="44" cy="18" r="3" fill="url(#silverGradient3)"/>
    <path d="M 44 21 L 44 28" stroke="url(#silverGradient3)" strokeWidth="2"/>
    <polygon points="38,28 44,40 50,28" fill="url(#silverGradient3)"/>
  </svg>
);

export const BangleIcon = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="silverGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d4d4d4" />
        <stop offset="50%" stopColor="#a3a3a3" />
        <stop offset="100%" stopColor="#737373" />
      </linearGradient>
    </defs>
    <ellipse cx="32" cy="32" rx="20" ry="20" stroke="url(#silverGradient4)" strokeWidth="5" fill="none"/>
    <ellipse cx="32" cy="32" rx="14" ry="14" stroke="url(#silverGradient4)" strokeWidth="2" fill="none" opacity="0.6"/>
  </svg>
);

export const BraceletIcon = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="silverGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d4d4d4" />
        <stop offset="50%" stopColor="#a3a3a3" />
        <stop offset="100%" stopColor="#737373" />
      </linearGradient>
    </defs>
    <rect x="12" y="26" width="8" height="12" rx="2" fill="url(#silverGradient5)"/>
    <rect x="22" y="26" width="8" height="12" rx="2" fill="url(#silverGradient5)"/>
    <rect x="32" y="26" width="8" height="12" rx="2" fill="url(#silverGradient5)"/>
    <rect x="42" y="26" width="8" height="12" rx="2" fill="url(#silverGradient5)"/>
  </svg>
);

export const PendantIcon = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="silverGradient6" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d4d4d4" />
        <stop offset="50%" stopColor="#a3a3a3" />
        <stop offset="100%" stopColor="#737373" />
      </linearGradient>
    </defs>
    <path d="M 32 15 L 32 25" stroke="url(#silverGradient6)" strokeWidth="2"/>
    <rect x="24" y="25" width="16" height="16" rx="2" fill="url(#silverGradient6)" transform="rotate(45 32 33)"/>
    <rect x="28" y="29" width="8" height="8" rx="1" fill="#1a1a1a" transform="rotate(45 32 33)"/>
  </svg>
);

export const MangalsutraIcon = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="silverGradient7" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d4d4d4" />
        <stop offset="50%" stopColor="#a3a3a3" />
        <stop offset="100%" stopColor="#737373" />
      </linearGradient>
    </defs>
    <path d="M 10 12 Q 32 22, 54 12" stroke="url(#silverGradient7)" strokeWidth="2" fill="none"/>
    <circle cx="22" cy="32" r="4" fill="url(#silverGradient7)"/>
    <circle cx="32" cy="36" r="5" fill="url(#silverGradient7)"/>
    <circle cx="42" cy="32" r="4" fill="url(#silverGradient7)"/>
    <path d="M 22 28 L 22 26 Q 22 20, 32 20 Q 42 20, 42 26 L 42 28" stroke="url(#silverGradient7)" strokeWidth="1.5" fill="none"/>
  </svg>
);

export const AnkletIcon = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="silverGradient8" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d4d4d4" />
        <stop offset="50%" stopColor="#a3a3a3" />
        <stop offset="100%" stopColor="#737373" />
      </linearGradient>
    </defs>
    <ellipse cx="32" cy="28" rx="22" ry="8" stroke="url(#silverGradient8)" strokeWidth="3" fill="none"/>
    <circle cx="24" cy="38" r="3" fill="url(#silverGradient8)"/>
    <circle cx="32" cy="40" r="3" fill="url(#silverGradient8)"/>
    <circle cx="40" cy="38" r="3" fill="url(#silverGradient8)"/>
    <path d="M 24 35 L 24 32" stroke="url(#silverGradient8)" strokeWidth="1.5"/>
    <path d="M 32 37 L 32 32" stroke="url(#silverGradient8)" strokeWidth="1.5"/>
    <path d="M 40 35 L 40 32" stroke="url(#silverGradient8)" strokeWidth="1.5"/>
  </svg>
);

// Map of all icons for easy access
export const JewelryIconMap = {
  ring: RingIcon,
  necklace: NecklaceIcon,
  earrings: EarringsIcon,
  bangle: BangleIcon,
  bracelet: BraceletIcon,
  pendant: PendantIcon,
  mangalsutra: MangalsutraIcon,
  anklet: AnkletIcon,
};

// Generic jewelry icon component that takes a type prop
export const JewelryIcon = ({ type, className }) => {
  const IconComponent = JewelryIconMap[type];
  return IconComponent ? <IconComponent className={className} /> : null;
};
