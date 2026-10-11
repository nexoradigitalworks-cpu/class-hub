import React, { useState } from 'react';
import { 
  User, Mail, School, ShieldCheck, Key, LogOut, 
  Sparkles, Check, ChevronRight, Lock, Calendar, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AvatarIcon } from '../components/AvatarIcon';
import { ROLE_LABELS, PREDEFINED_AVATARS } from '../utils/theme';

export const AccountPage: React.FC = () => {
  const { profile, currentClass, userMemberships, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const roleInfo = ROLE_LABELS[profile?.role || 'STUDENT'];
  const classCode = currentClass?.code || 'CODICE';
  const className = currentClass?.name || profile?.className || 'Classe';

  const handleCopyCode = () => {
    if (classCode) {
      navigator.clipboard.writeText(classCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-6 pb-28 lg:pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Il tuo Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Gestisci il tuo profilo scolastico, visualizza la tua classe e controlla la tua sessione.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-50/70 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
          <div className="relative">
            <AvatarIcon avatarId={profile?.avatarId || 'avatar-blue'} size="lg" />
            <span className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${roleInfo.badge}`}>
              {roleInfo.title}
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
              {profile?.firstName} {profile?.lastName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{className}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Classroom Information Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider text-slate-400">
          Dettagli Classe Attiva
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Nome Classe
            </span>
            <p className="text-base font-black text-slate-900 truncate">
              {className}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Codice Invito
              </span>
              <p className="font-mono text-base font-black text-blue-600 tracking-wider">
                {classCode}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Key className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiato' : 'Copia'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Session & Logout Section */}
      <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-rose-900">
            Sessione & Disconnessione
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Termina la sessione corrente su questo dispositivo in totale sicurezza.
          </p>
        </div>

        {showLogoutConfirm ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
            <p className="text-xs font-bold text-rose-900">
              Sei sicuro di voler uscire da ClassHub?
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Conferma ed Esci</span>
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer"
              >
                Annulla
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Esci dall'Account</span>
          </button>
        )}
      </div>

      {/* Legal & App Version Footer */}
      <div className="text-center pt-2 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-500">ClassHub © 2026</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              window.history.pushState({}, '', '/privacy');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="hover:text-slate-600 hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            onClick={() => {
              window.history.pushState({}, '', '/terms');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="hover:text-slate-600 hover:underline cursor-pointer"
          >
            Termini di Servizio
          </button>
        </div>
      </div>
    </div>
  );
};
