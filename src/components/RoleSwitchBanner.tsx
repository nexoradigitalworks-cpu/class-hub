import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCog, User, LogOut, Key, School, Sparkles, Terminal } from 'lucide-react';
import { ROLE_LABELS } from '../utils/theme';

export const RoleSwitchBanner: React.FC = () => {
  const { 
    profile, 
    currentClass, 
    isStudent, 
    isController, 
    isAdmin, 
    isDeveloperModeActive,
    developerSimulationRole,
    setDeveloperSimulationRole,
    logout 
  } = useAuth();

  if (!profile) return null;

  const currentRoleInfo = ROLE_LABELS[profile.role] || ROLE_LABELS.STUDENT;
  const effectiveRoleInfo = isDeveloperModeActive 
    ? (ROLE_LABELS[developerSimulationRole] || ROLE_LABELS.ADMIN)
    : currentRoleInfo;

  const className = currentClass?.name || profile.className || 'Classe';

  return (
    <div className={`border-b px-4 py-2 text-xs transition-colors ${
      isDeveloperModeActive 
        ? 'bg-amber-50/70 border-amber-200/90 text-amber-950' 
        : 'bg-white border-slate-200/90'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Role status & Class Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          
          {isDeveloperModeActive ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md font-extrabold border text-[11px] shadow-xs tracking-tight bg-amber-500 text-white border-amber-600 shrink-0">
                <Terminal className="w-3.5 h-3.5" />
                <span>DEV MODE</span>
              </span>
              <span className="font-semibold text-amber-900 hidden sm:inline">
                Stai visualizzando come <strong className="font-black underline">{effectiveRoleInfo.title}</strong>
              </span>
            </div>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold border text-xs shadow-xs tracking-tight bg-slate-50 border-slate-200 shrink-0">
              {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />}
              {isController && !isAdmin && <UserCog className="w-3.5 h-3.5 text-blue-600" />}
              {isStudent && <User className="w-3.5 h-3.5 text-slate-600" />}
              <span className="uppercase text-[11px] font-bold text-slate-800">{currentRoleInfo.title}</span>
            </span>
          )}

          <span className="hidden sm:inline font-bold text-slate-800 truncate">
            {profile.firstName} {profile.lastName}
          </span>
          <span className="hidden md:inline text-slate-400">({profile.email})</span>

          <span className="hidden lg:inline text-slate-300">·</span>
          <span className="hidden lg:inline text-slate-500 truncate flex items-center gap-1">
            <School className="w-3 h-3 text-slate-400 inline" />
            <span>{className}</span>
          </span>
        </div>

        {/* Center / Right: Developer Mode Role Switcher (EXCLUSIVE TO DEVELOPER ACCOUNT) */}
        {isDeveloperModeActive && (
          <div className="flex items-center gap-1.5 bg-white/90 p-1 rounded-xl border border-amber-300/80 shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 px-1.5 hidden md:inline">
              Visualizza come:
            </span>

            <button
              type="button"
              onClick={() => setDeveloperSimulationRole('ADMIN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                developerSimulationRole === 'ADMIN'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Visualizza come Admin (Pannello completo, gestione ruoli e impostazioni)"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setDeveloperSimulationRole('CONTROLLER')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                developerSimulationRole === 'CONTROLLER'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Visualizza come Controller (Gestione verifiche, interrogazioni, avvisi)"
            >
              <UserCog className="w-3 h-3" />
              <span>Controller</span>
            </button>

            <button
              type="button"
              onClick={() => setDeveloperSimulationRole('STUDENT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                developerSimulationRole === 'STUDENT'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Visualizza come Student (Solo consultazione, prenotazione volontari, impegni personali)"
            >
              <User className="w-3 h-3" />
              <span>Student</span>
            </button>
          </div>
        )}

        {/* Right: Class Code pill & Logout */}
        <div className="flex items-center gap-2 ml-auto">
          {currentClass?.code && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200/80 text-purple-700 font-mono font-bold text-[11px]">
              <Key className="w-3 h-3" />
              <span>{currentClass.code}</span>
            </div>
          )}

          <button
            onClick={() => logout()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition font-medium cursor-pointer"
            title="Termina la sessione ed esci"
          >
            <LogOut className="w-3 h-3" />
            <span>Esci</span>
          </button>
        </div>
      </div>
    </div>
  );
};
