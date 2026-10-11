import React, { useState, useEffect } from 'react';
import { 
  User, Mail, School, ShieldCheck, Key, LogOut, 
  Sparkles, Check, ChevronRight, Lock, Calendar, BookOpen,
  UserCog, Terminal, Save, Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AvatarIcon } from '../components/AvatarIcon';
import { ROLE_LABELS } from '../utils/theme';

export const AccountPage: React.FC = () => {
  const { 
    profile, 
    currentClass, 
    userMemberships, 
    logout,
    updateProfileName,
    isDeveloperModeActive,
    developerSimulationRole,
    setDeveloperSimulationRole,
    isAdmin,
    isController,
    isStudent
  } = useAuth();
  
  const [copied, setCopied] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Edit Name State
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [savingName, setSavingName] = useState(false);
  const [nameSavedMessage, setNameSavedMessage] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
    }
  }, [profile?.firstName, profile?.lastName]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;
    try {
      setSavingName(true);
      await updateProfileName(firstName, lastName);
      setNameSavedMessage(true);
      setTimeout(() => setNameSavedMessage(false), 3000);
    } catch (err) {
      console.error('Errore aggiornamento nome:', err);
    } finally {
      setSavingName(false);
    }
  };

  const currentRoleInfo = ROLE_LABELS[profile?.role || 'STUDENT'];
  const effectiveRoleInfo = isDeveloperModeActive 
    ? (ROLE_LABELS[developerSimulationRole] || ROLE_LABELS.ADMIN)
    : currentRoleInfo;

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
          Il tuo Account & Profilo
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Gestisci il tuo profilo scolastico, i ruoli, la classe attiva e la sessione.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-50/70 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
          <div className="relative">
            <AvatarIcon avatarId={profile?.avatarId || 'avatar-blue'} size="lg" />
            <span className={`absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${effectiveRoleInfo.badge}`}>
              {effectiveRoleInfo.title}
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
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

      {/* Edit Profile Name Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Edit3 className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Modifica Nome Account
            </h3>
            <p className="text-xs text-slate-500">
              Aggiorna il tuo nome e cognome visibile nei registri di classe e nelle interrogazioni.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveName} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                placeholder="Il tuo nome"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cognome</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                placeholder="Il tuo cognome"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {nameSavedMessage ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-fade-in">
                <Check className="w-3.5 h-3.5" />
                Modifiche salvate con successo!
              </span>
            ) : <span />}

            <button
              type="submit"
              disabled={savingName}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm cursor-pointer active:scale-98 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingName ? 'Salvataggio...' : 'Salva Modifiche'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Developer Mode Role Simulator Card (If Active) */}
      {isDeveloperModeActive && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 rounded-3xl p-6 border border-amber-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                <Terminal className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                  Simulatore Ruolo (Developer Mode)
                </h3>
                <p className="text-xs text-amber-800">
                  Stai testando l'app come: <strong className="font-extrabold">{effectiveRoleInfo.title}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setDeveloperSimulationRole('ADMIN')}
              className={`p-3 rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer border ${
                developerSimulationRole === 'ADMIN'
                  ? 'bg-purple-600 text-white border-purple-700 shadow-md'
                  : 'bg-white text-slate-700 border-amber-200/60 hover:bg-amber-100/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setDeveloperSimulationRole('CONTROLLER')}
              className={`p-3 rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer border ${
                developerSimulationRole === 'CONTROLLER'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                  : 'bg-white text-slate-700 border-amber-200/60 hover:bg-amber-100/50'
              }`}
            >
              <UserCog className="w-4 h-4" />
              <span>Controller</span>
            </button>

            <button
              type="button"
              onClick={() => setDeveloperSimulationRole('STUDENT')}
              className={`p-3 rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer border ${
                developerSimulationRole === 'STUDENT'
                  ? 'bg-slate-800 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-700 border-amber-200/60 hover:bg-amber-100/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Student</span>
            </button>
          </div>
        </div>
      )}

      {/* Classroom Information Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">
          Dettagli Classe Attiva
        </h3>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome Classe</p>
            <p className="text-base font-black text-slate-900">{className}</p>
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ruolo Attivo</p>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${effectiveRoleInfo.badge}`}>
              {effectiveRoleInfo.title}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/70 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-purple-900">Codice Invito Classe</p>
            <p className="font-mono text-sm font-black text-purple-950 mt-0.5 tracking-wider">{classCode}</p>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiato!' : 'Copia Codice'}</span>
          </button>
        </div>
      </div>

      {/* User Memberships / Classes List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">
          Le tue Classi ({userMemberships.length})
        </h3>
        
        <div className="space-y-2">
          {userMemberships.map((m) => (
            <div 
              key={m.classId}
              className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                currentClass?.id === m.classId
                  ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                  : 'bg-slate-50 border-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                  {m.className.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{m.className}</h4>
                  <p className="text-xs text-slate-500 font-mono">Codice: {m.classCode}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
                {ROLE_LABELS[m.role]?.title || m.role}
              </span>
            </div>
          ))}
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
