import React, { useState } from 'react';
import { 
  Calendar, Clock, Bell, BookOpen, 
  Vote, Landmark, ShieldCheck, GraduationCap, 
  CalendarDays, Key, Sparkles, School, Users, LogOut, Check, Copy,
  ChevronDown, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/theme';
import { AvatarIcon } from './AvatarIcon';

export type NavigationTab = 
  | 'calendario' 
  | 'interrogazioni' 
  | 'orario' 
  | 'avvisi' 
  | 'materiali' 
  | 'sondaggi' 
  | 'rappresentanza' 
  | 'controllo';

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
  const [copiedCode, setCopiedCode] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);

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
    }
  ];

  const roleInfo = ROLE_LABELS[profile?.role || 'STUDENT'];
  const classNameDisplay = currentClass?.name || profile?.className || 'Classe';
  const classCodeDisplay = currentClass?.code || 'CODICE';

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (classCodeDisplay) {
      navigator.clipboard.writeText(classCodeDisplay);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <aside className="w-64 bg-white h-full flex flex-col border-r border-slate-200/80 shrink-0 select-none relative">
      {/* Brand Header & Multi-Class Switcher */}
      <div className="p-4 border-b border-slate-100 relative">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-base tracking-tight text-slate-900 leading-tight">ClassHub</h1>
              
              {userMemberships.length > 1 ? (
                <button
                  onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                  className="text-[11px] font-semibold text-[#2563EB] hover:text-blue-800 flex items-center gap-1 truncate text-left cursor-pointer w-full"
                >
                  <span className="truncate">{classNameDisplay}</span>
                  <ChevronDown className="w-3 h-3 shrink-0" />
                </button>
              ) : (
                <p className="text-[11px] font-semibold text-[#2563EB] flex items-center gap-1 truncate">
                  <span className="truncate">{classNameDisplay}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Multi-Class Dropdown Menu */}
        {classDropdownOpen && userMemberships.length > 1 && (
          <div className="absolute left-3 right-3 top-16 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
              Le tue classi ({userMemberships.length})
            </span>
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

      {/* Classroom Code Quick Access Banner */}
      <div className="px-3 pb-2">
        <div
          onClick={() => onSelectTab('controllo')}
          className={`w-full p-2.5 rounded-xl text-left transition border cursor-pointer ${
            currentTab === 'controllo'
              ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/20'
              : 'bg-gradient-to-r from-purple-50/60 to-indigo-50/60 border-purple-200/70 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-purple-700 flex items-center gap-1">
              <Key className="w-3 h-3" />
              Codice Classe
            </span>
            <button
              onClick={handleCopyCode}
              className="text-[9px] font-bold text-purple-700 bg-white hover:bg-purple-50 px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Copia codice"
            >
              {copiedCode ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
              <span>{copiedCode ? 'Copiato' : 'Copia'}</span>
            </button>
          </div>
          <p className="font-mono text-xs font-black text-slate-900 mt-1 tracking-wider">{classCodeDisplay}</p>
        </div>
      </div>

      {/* User Footer Card & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/70 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <AvatarIcon 
              avatarId={profile?.avatarId || 'avatar-blue'} 
              size="sm" 
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {profile?.firstName} {profile?.lastName}
              </p>
              <span className={`inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${roleInfo.badge}`}>
                {roleInfo.title}
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
            title="Esci dall'account"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
