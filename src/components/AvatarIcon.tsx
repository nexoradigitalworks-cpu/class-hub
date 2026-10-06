import React from 'react';
import { 
  GraduationCap, Atom, Sparkles, Compass, 
  Calculator, BookOpen, Landmark, Telescope, 
  Shield, Palette, User 
} from 'lucide-react';
import { AVATAR_COLORS } from '../utils/theme';

interface AvatarIconProps {
  avatarId?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarIcon: React.FC<AvatarIconProps> = ({ 
  avatarId = 'avatar-blue', 
  initials, 
  size = 'md',
  className = ''
}) => {
  const colorInfo = AVATAR_COLORS[avatarId] || AVATAR_COLORS['avatar-blue'];

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] rounded-lg',
    sm: 'w-8 h-8 text-xs rounded-xl',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-12 h-12 text-base rounded-2xl',
    xl: 'w-16 h-16 text-xl rounded-2xl'
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const getIcon = () => {
    switch (avatarId) {
      case 'avatar-blue': return <GraduationCap className={iconSizes[size]} />;
      case 'avatar-indigo': return <Atom className={iconSizes[size]} />;
      case 'avatar-purple': return <Sparkles className={iconSizes[size]} />;
      case 'avatar-emerald': return <Compass className={iconSizes[size]} />;
      case 'avatar-teal': return <Calculator className={iconSizes[size]} />;
      case 'avatar-rose': return <BookOpen className={iconSizes[size]} />;
      case 'avatar-amber': return <Landmark className={iconSizes[size]} />;
      case 'avatar-cyan': return <Telescope className={iconSizes[size]} />;
      case 'avatar-slate': return <Shield className={iconSizes[size]} />;
      case 'avatar-violet': return <Palette className={iconSizes[size]} />;
      default:
        if (initials) {
          return <span className="font-bold uppercase select-none">{initials}</span>;
        }
        return <User className={iconSizes[size]} />;
    }
  };

  return (
    <div className={`flex items-center justify-center font-bold ${colorInfo.bg} ${colorInfo.text} ${sizeClasses[size]} shadow-xs shrink-0 ${className}`}>
      {initials ? <span className="font-bold uppercase tracking-tight select-none">{initials}</span> : getIcon()}
    </div>
  );
};
