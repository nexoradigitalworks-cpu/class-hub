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
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200 select-none"
      aria-label="ClassHub Logo"
    >
      {/* Top Center Head */}
      <circle cx="100" cy="42" r="23" fill="#0047BA" />

      {/* Left Head */}
      <circle cx="48" cy="76" r="23" fill="#0047BA" />

      {/* Right Head */}
      <circle cx="152" cy="76" r="23" fill="#0047BA" />

      {/* Center Top Shoulders */}
      <path
        d="M 68 76 C 76 60, 124 60, 132 76 C 120 84, 80 84, 68 76 Z"
        fill="#0047BA"
      />

      {/* Main Group Body Silhouette Embracing Document */}
      <path
        d="M 37 98 
           C 37 98, 62 82, 95 90 
           C 96 90, 96 94, 96 96
           C 80 96, 68 102, 68 110
           L 68 156
           C 68 166, 78 174, 90 174
           L 110 174
           C 122 174, 132 166, 132 156
           L 132 110
           C 132 102, 120 96, 104 96
           C 104 94, 104 90, 105 90
           C 138 82, 163 98, 163 98
           C 165 128, 148 162, 128 174
           C 114 182, 86 182, 72 174
           C 52 162, 35 128, 37 98 Z"
        fill="#0047BA"
      />

      {/* Central White Document Sheet with Smooth Rounded Corners */}
      <rect x="68" y="90" width="64" height="78" rx="14" fill="#FFFFFF" />

      {/* 3 Light Blue Horizontal Stripes */}
      <rect x="77" y="105" width="46" height="8" rx="4" fill="#4C9AFF" />
      <rect x="77" y="123" width="46" height="8" rx="4" fill="#4C9AFF" />
      <rect x="77" y="141" width="46" height="8" rx="4" fill="#4C9AFF" />
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
            Class<span className="text-[#0047BA]">Hub</span>
          </span>
          {showBadge && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 text-[#0047BA] border border-blue-100">
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
