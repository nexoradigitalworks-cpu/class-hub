import React from 'react';

interface ClassHubLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  variant?: 'icon' | 'full' | 'compact';
  className?: string;
  showBadge?: boolean;
}

export const ClassHubLogo: React.FC<ClassHubLogoProps> = ({
  size = 'md',
  variant = 'icon',
  className = '',
  showBadge = false
}) => {
  // Dimension mapping
  const sizeMap: Record<string, number> = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 52,
    xl: 64,
    '2xl': 80,
  };

  const pixelSize = typeof size === 'number' ? size : (sizeMap[size] || 40);

  const IconSvg = (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200"
      aria-label="ClassHub Logo"
    >
      <defs>
        {/* Primary vibrant gradient */}
        <linearGradient id="chGradPrimary" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        {/* Accent gradient (warm glow) */}
        <linearGradient id="chGradAccent" x1="30" y1="15" x2="90" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="60%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>

        {/* Soft shadow */}
        <filter id="chShadow" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#1D4ED8" floodOpacity="0.25" />
        </filter>

        {/* Cap top highlight */}
        <linearGradient id="chCapGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Rounded squircle background badge with soft glass lighting */}
      <rect
        x="6"
        y="6"
        width="108"
        height="108"
        rx="28"
        fill="url(#chGradPrimary)"
        filter="url(#chShadow)"
      />

      {/* Inner subtle glow rim */}
      <rect
        x="7"
        y="7"
        width="106"
        height="106"
        rx="27"
        stroke="white"
        strokeOpacity="0.2"
        strokeWidth="2"
        fill="none"
      />

      {/* Decorative background rays / modern geometry */}
      <circle cx="60" cy="58" r="38" stroke="white" strokeOpacity="0.08" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Open Book Wings (Bottom foundation) */}
      <path
        d="M60 76C48 70 34 72 26 77V53C34 48 48 47 60 52C72 47 86 48 94 53V77C86 72 72 70 60 76Z"
        fill="white"
        fillOpacity="0.18"
      />
      
      {/* Dynamic Open Pages */}
      <path
        d="M60 83C47 77 34 79 28 83V60C34 56 47 55 60 60C73 55 86 56 92 60V83C86 79 73 77 60 83Z"
        fill="white"
        fillOpacity="0.95"
      />
      {/* Spine line */}
      <path
        d="M60 59V83"
        stroke="#2563EB"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Graduation Mortarboard Cap (Top Diamond) */}
      <path
        d="M60 30L94 43L60 56L26 43L60 30Z"
        fill="white"
      />

      {/* Cap Under-Band / Depth */}
      <path
        d="M38 48.5V56.5C38 63 48 68 60 68C72 68 82 63 82 56.5V48.5L60 57L38 48.5Z"
        fill="#DBEAFE"
      />

      {/* Cap Center Button & Tassel */}
      <circle cx="60" cy="43" r="3.2" fill="url(#chCapGold)" />
      {/* Tassel cord flowing to the right */}
      <path
        d="M60 43C68 44 80 47 83 55C84 58 84.5 64 84.5 67"
        stroke="#F59E0B"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Tassel end bulb */}
      <circle cx="84.5" cy="68" r="2.2" fill="#D97706" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {IconSvg}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {IconSvg}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold tracking-tight text-slate-900 text-lg sm:text-xl leading-none">
            Class<span className="text-[#2563EB]">Hub</span>
          </span>
          {showBadge && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 text-[#2563EB] border border-blue-100">
              Scuola
            </span>
          )}
        </div>
        {variant === 'full' && (
          <span className="text-[11px] font-medium text-slate-400 tracking-normal mt-0.5">
            Gestione & Calendario Classe
          </span>
        )}
      </div>
    </div>
  );
};
