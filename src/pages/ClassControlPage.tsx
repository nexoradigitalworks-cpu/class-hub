import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Key, Copy, RefreshCw, QrCode, 
  Users, Check, ExternalLink, Settings, Sparkles, 
  UserPlus, Lock, GraduationCap, School, Maximize2, X,
  Search, Trash2, UserCog, User, AlertCircle, Eye, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { ClassroomControl, UserProfile, UserRole, ClassMember } from '../types';
import { ROLE_LABELS, AVATAR_COLORS } from '../utils/theme';
import { FormSelect } from '../components/ui/FormSelect';
import { ROLE_OPTIONS } from '../utils/dropdownPresets';
import { AvatarIcon } from '../components/AvatarIcon';

export const ClassControlPage: React.FC = () => {
  const { profile, currentClass, allMembers, isAdmin, updateUserRole } = useAuth();
  
  const [searchMember, setSearchMember] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showProjectorModal, setShowProjectorModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatingRoleUid, setUpdatingRoleUid] = useState<string | null>(null);

  // Settings states
  const [allowSelfJoin, setAllowSelfJoin] = useState(true);
  const [controllerNotices, setControllerNotices] = useState(true);
  const [lockVolunteers, setLockVolunteers] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const classCode = currentClass?.code || 'CODICE';
  const className = currentClass?.name || profile?.className || 'La tua Classe';
  const schoolName = currentClass?.schoolName || 'Scuola Superiore';
  const academicYear = currentClass?.academicYear || '2026/2027';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classCode);
    setCopied(true);
    showToast('Codice classe copiato negli appunti!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/?code=${classCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    showToast('Link di invito copiato!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRoleChange = async (targetUid: string, newRole: UserRole) => {
    if (!isAdmin) {
      showToast('Solo l\'Admin può modificare i ruoli della classe');
      return;
    }
    try {
      setUpdatingRoleUid(targetUid);
      await updateUserRole(targetUid, newRole);
      showToast(`Ruolo modificato in ${ROLE_LABELS[newRole].title}`);
    } catch (err: any) {
      showToast(err?.message || 'Errore durante la modifica del ruolo');
    } finally {
      setUpdatingRoleUid(null);
    }
  };

  // Display list of members (from real Firestore or current user)
  const displayMembers: Array<ClassMember | UserProfile> = allMembers.length > 0 
    ? allMembers 
    : (profile ? [profile] : []);

  const filteredMembers = displayMembers.filter(m => {
    if (!searchMember) return true;
    const query = searchMember.toLowerCase();
    const fullName = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase();
    return fullName.includes(query) || (m.email && m.email.toLowerCase().includes(query));
  });

  const studentsCount = displayMembers.filter(m => m.role === 'STUDENT').length;
  const controllersCount = displayMembers.filter(m => m.role === 'CONTROLLER').length;
  const adminsCount = displayMembers.filter(m => m.role === 'ADMIN').length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm flex items-center gap-2 border border-slate-700 font-medium"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Classe & Registro Virtuale
            </h1>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isAdmin 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {isAdmin ? 'Modalità Modifica Admin' : 'Visualizzazione Studente'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isAdmin 
              ? 'Pannello di gestione: codici di accesso, impostazioni e registro iscritti della classe.'
              : 'Informazioni ufficiali della classe, codice per invitare compagni e registro iscritti.'}
          </p>
        </div>

        {!isAdmin && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium self-start sm:self-auto">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Modifiche riservate all'Admin</span>
          </span>
        )}
      </div>

      {/* Hero Classroom Banner Card with Code & Direct Link */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 shadow-lg overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-10 top-6 opacity-15">
          <GraduationCap className="w-48 h-48" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
            <School className="w-3.5 h-3.5" />
            <span>{schoolName}</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {className}
            </h2>
            <p className="text-sm sm:text-base text-blue-100 mt-1">
              Anno Scolastico {academicYear} · {displayMembers.length} iscritti ({studentsCount} studenti, {controllersCount} controller, {adminsCount} admin)
            </p>
          </div>

          {/* Classroom Code Display Card */}
          <div className="pt-2">
            <div className="inline-flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-inner">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">
                  Codice Corso / Accesso Studenti
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-white">
                  {classCode}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:ml-6">
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-blue-50 transition text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Copia codice"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copiato!' : 'Copia Codice'}</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition text-xs font-bold flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
                  title="Copia link di invito"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <ExternalLink className="w-4 h-4" />}
                  <span className="hidden sm:inline">Link Invito</span>
                </button>

                <button
                  onClick={() => setShowProjectorModal(true)}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition backdrop-blur-md cursor-pointer"
                  title="Mostra codice a tutto schermo per la LIM / proiettore"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Impostazioni & Registro Completo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Impostazioni Classe */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5 h-fit">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-700" />
              <h3 className="font-extrabold text-base text-slate-900">
                Impostazioni Classe
              </h3>
            </div>
            {!isAdmin && (
              <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                Sola lettura
              </span>
            )}
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div>
                <p className="font-bold text-slate-800">Iscrizione con Codice</p>
                <p className="text-[11px] text-slate-500">Gli studenti possono accedere con il codice</p>
              </div>
              <button
                onClick={() => {
                  if (isAdmin) setAllowSelfJoin(!allowSelfJoin);
                  else showToast('Riservato all\'Admin');
                }}
                disabled={!isAdmin}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  allowSelfJoin ? 'bg-blue-600' : 'bg-slate-300'
                } ${!isAdmin ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              >
                <span className={`w-5 h-5 rounded-full bg-white block transition-transform shadow-xs ${
                  allowSelfJoin ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div>
                <p className="font-bold text-slate-800">Permessi Controller</p>
                <p className="text-[11px] text-slate-500">I controller pubblicano avvisi e interrogazioni</p>
              </div>
              <button
                onClick={() => {
                  if (isAdmin) setControllerNotices(!controllerNotices);
                  else showToast('Riservato all\'Admin');
                }}
                disabled={!isAdmin}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  controllerNotices ? 'bg-blue-600' : 'bg-slate-300'
                } ${!isAdmin ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              >
                <span className={`w-5 h-5 rounded-full bg-white block transition-transform shadow-xs ${
                  controllerNotices ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div>
                <p className="font-bold text-slate-800">Lock Volontari Scadenza</p>
                <p className="text-[11px] text-slate-500">Blocca modifiche alle liste a 24h dall'orale</p>
              </div>
              <button
                onClick={() => {
                  if (isAdmin) setLockVolunteers(!lockVolunteers);
                  else showToast('Riservato all\'Admin');
                }}
                disabled={!isAdmin}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  lockVolunteers ? 'bg-blue-600' : 'bg-slate-300'
                } ${!isAdmin ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              >
                <span className={`w-5 h-5 rounded-full bg-white block transition-transform shadow-xs ${
                  lockVolunteers ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Riepilogo Ruoli Classe:
            </span>
            <div className="flex items-center justify-between text-slate-600">
              <span>Studenti:</span>
              <span className="font-bold text-slate-900">{studentsCount}</span>
            </div>
            <div className="flex items-center justify-between text-blue-700">
              <span>Controller (Rappresentanti):</span>
              <span className="font-bold">{controllersCount}</span>
            </div>
            <div className="flex items-center justify-between text-purple-700">
              <span>Admin (Capoclasse):</span>
              <span className="font-bold">{adminsCount}</span>
            </div>
          </div>
        </div>

        {/* Col 2 & 3: Registro Iscritti Integrato */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Registro Iscritti della Classe ({displayMembers.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAdmin
                  ? 'Modifica istantanea dei ruoli per ogni studente con aggiornamento nel database'
                  : 'Elenco ufficiale dei compagni e rappresentanti di classe'}
              </p>
            </div>

            {/* Member search input */}
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca studente..."
                value={searchMember}
                onChange={e => setSearchMember(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-xl border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Members Table */}
          <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1 pb-10">
            {filteredMembers.map((member: any) => {
              const memberUid = member.uid || member.userId;
              const isCurrentUser = memberUid === profile?.uid;
              const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`;

              return (
                <div key={memberUid} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition px-2 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarIcon 
                      avatarId={member.avatarId || 'avatar-blue'} 
                      initials={initials}
                      size="sm" 
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {member.firstName} {member.lastName}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 shrink-0">
                            Tu
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 truncate block">{member.email}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {updatingRoleUid === memberUid && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    )}

                    {isAdmin ? (
                      <div className="w-36 sm:w-44">
                        <FormSelect
                          value={member.role}
                          onChange={(val) => handleRoleChange(memberUid, val as UserRole)}
                          options={ROLE_OPTIONS}
                          compact
                        />
                      </div>
                    ) : (
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${ROLE_LABELS[member.role]?.badge || 'bg-slate-100'}`}>
                        {ROLE_LABELS[member.role]?.title || member.role}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Projector / LIM Fullscreen Code Modal */}
      <AnimatePresence>
        {showProjectorModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 sm:p-12 max-w-xl w-full text-center space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowProjectorModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center mx-auto">
                <GraduationCap className="w-8 h-8" />
              </div>

              <div>
                <p className="text-xs uppercase font-bold tracking-widest text-blue-600 mb-1">
                  Accesso Classe Virtuale ClassHub
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  {className}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Inserisci questo codice sul tuo smartphone o PC per unirti alla classe
                </p>
              </div>

              {/* Huge Code Display */}
              <div className="p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-blue-300">
                <span className="font-mono text-5xl sm:text-6xl font-black tracking-widest text-[#2563EB]">
                  {classCode}
                </span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleCopyCode}
                  className="px-6 py-2.5 rounded-xl bg-[#2563EB] text-white hover:bg-blue-700 transition font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Copiato!' : 'Copia Codice'}</span>
                </button>
                <button
                  onClick={() => setShowProjectorModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-bold text-xs cursor-pointer"
                >
                  Chiudi Proiettore
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
