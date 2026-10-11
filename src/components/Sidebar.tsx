import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, Clock, Bell, BookOpen, 
  Vote, Landmark, ShieldCheck, GraduationCap, 
  CalendarDays, Sparkles, School, Users, LogOut,
  ChevronDown, PlusCircle, UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/theme';
import { AvatarIcon } from './AvatarIcon';
import { ClassHubLogo } from './ClassHubLogo';
import { CreateClassModal } from './CreateClassModal';
import { JoinClassModal } from './JoinClassModal';
import { PWAInstallButton } from './PWAInstallButton';

export type NavigationTab = 
  | 'calendario' 
  | 'interrogazioni' 
  | 'orario' 
  | 'avvisi' 
  | 'materiali' 
  | 'sondaggi' 
  | 'rappresentanza' 
  | 'controllo'
  | 'account';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  counts?: {
    interrogationsCount?: number;
    noticesCount?: number;
    surveysCount?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, counts }) => {
  const { profile, currentClass, userMemberships, switchActiveClass, isAdmin, logout } = useAuth();
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    {
      id: 'calendario' as NavigationTab,
      label: 'Calendario',
      icon: Calendar,
      color: 'text-blue-600',
      badge: null
    },
    {
      id: 'interrogazioni' as NavigationTab,
      label: 'Interrogazioni & Volontari',
      icon: Clock,
      color: 'text-purple-600',
      badge: counts?.interrogationsCount ? `${counts.interrogationsCount}` : null
    },
    {
      id: 'orario' as NavigationTab,
      label: 'Orario Settimanale',
      icon: CalendarDays,
      color: 'text-indigo-600',
      badge: null
    },
    {
      id: 'avvisi' as NavigationTab,
      label: 'Avvisi & Circolari',
      icon: Bell,
      color: 'text-rose-500',
      badge: counts?.noticesCount ? `${counts.noticesCount}` : null
    },
    {
      id: 'materiali' as NavigationTab,
      label: 'Dispense & Materiali',
      icon: BookOpen,
      color: 'text-cyan-600',
      badge: null
    },
    {
      id: 'sondaggi' as NavigationTab,
      label: 'Sondaggi di Classe',
      icon: Vote,
      color: 'text-amber-500',
      badge: counts?.surveysCount ? `${counts.surveysCount}` : null
    },
    {
      id: 'rappresentanza' as NavigationTab,
      label: 'Rappresentanza',
      icon: Landmark,
      color: 'text-emerald-600',
      badge: null
    },
    {
      id: 'controllo' as NavigationTab,
      label: 'Classe & Registro',
      icon: Users,
      color: 'text-purple-600',
      badge: isAdmin ? 'Admin' : 'Classe'
    },
    {
      id: 'account' as NavigationTab,
      label: 'Il mio Account',
      icon: GraduationCap,
      color: 'text-blue-600',
      badge: null
    }
  ];

  const roleInfo = ROLE_LABELS[profile?.role || 'STUDENT'];
  const classNameDisplay = currentClass?.name || profile?.className || 'Classe';

  return (
    <>
      <aside className="w-full lg:w-64 bg-white h-full flex flex-col border-r border-slate-200/80 shrink-0 select-none relative">
        {/* Brand Header & Multi-Class Switcher */}
        <div className="p-4 border-b border-slate-100 relative" ref={dropdownRef}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <ClassHubLogo size="sm" />
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-base tracking-tight text-slate-900 leading-tight">ClassHub</h1>
                
                <button
                  onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                  className="text-[11px] font-semibold text-[#2563EB] hover:text-blue-800 flex items-center gap-1 truncate text-left cursor-pointer w-full group"
                  title="Gestisci o cambia classe"
                >
                  <span className="truncate">{classNameDisplay}</span>
                  <ChevronDown className="w-3 h-3 shrink-0 text-slate-400 group-hover:text-blue-700 transition" />
                </button>
              </div>
            </div>
          </div>

          {/* Multi-Class Dropdown Menu */}
          {classDropdownOpen && (
            <div className="absolute left-3 right-3 top-16 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1">
              {userMemberships.length > 0 && (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
                    Le tue classi ({userMemberships.length})
                  </span>
                  <div className="max-h-44 overflow-y-auto space-y-1">
                    {userMemberships.map((m) => {
                      const isCurrent = m.classId === (profile?.activeClassId || profile?.classId);
                      return (
                        <button
                          key={m.classId}
                          onClick={async () => {
                            await switchActiveClass(m.classId);
                            setClassDropdownOpen(false);
                          }}
                          className={`w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                            isCurrent 
                              ? 'bg-blue-50 text-blue-700 font-bold' 
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="truncate">{m.className}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 font-bold shrink-0">
                            {m.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-100 my-1" />
                </>
              )}

              <button
                onClick={() => {
                  setClassDropdownOpen(false);
                  setIsJoinModalOpen(true);
                }}
                className="w-full p-2 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                <span>Unisciti con codice</span>
              </button>

              <button
                onClick={() => {
                  setClassDropdownOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="w-full p-2 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-purple-600" />
                <span>Crea nuova classe</span>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={() => {
                  setClassDropdownOpen(false);
                  logout();
                }}
                className="w-full p-2 rounded-xl text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Esci dall'Account</span>
              </button>
            </div>
          )}
        </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Spazi di Classe
        </div>

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition group cursor-pointer ${
                isActive
                  ? 'bg-blue-50/90 text-[#2563EB] font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 transition shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    item.badge === 'Admin'
                      ? 'bg-purple-100 text-purple-700'
                      : isActive
                        ? 'bg-blue-200/80 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>



      {/* PWA Install Quick Action */}
      <div className="px-3 pb-2">
        <PWAInstallButton variant="sidebar" />
      </div>

      {/* Privacy & Terms Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
        <button
          type="button"
          onClick={() => {
            window.history.pushState({}, '', '/privacy');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="hover:text-slate-600 transition cursor-pointer"
        >
          Privacy
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={() => {
            window.history.pushState({}, '', '/terms');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="hover:text-slate-600 transition cursor-pointer"
        >
          Termini
        </button>
      </div>
    </aside>

    <CreateClassModal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
    />

    <JoinClassModal
      isOpen={isJoinModalOpen}
      onClose={() => setIsJoinModalOpen(false)}
    />
  </>
  );
};
