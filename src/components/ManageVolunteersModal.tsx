import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Search, Users, Check, UserCheck, UserX, 
  AlertCircle, Save, CheckSquare, Square
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classAdapter, interrogationsAdapter } from '../services/adapters';
import { Interrogation, ClassMember, VolunteerSlot, VolunteerStatus } from '../types';
import { AvatarIcon } from './AvatarIcon';
import { formatVolunteerName } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  interrogation: Interrogation | null;
  onUpdated?: () => void;
}

export const ManageVolunteersModal: React.FC<Props> = ({
  isOpen,
  onClose,
  interrogation,
  onUpdated
}) => {
  const { profile, isController, isAdmin, activeClassId, currentClass } = useAuth();

  const [members, setMembers] = useState<ClassMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Local state for volunteers map: userId -> VolunteerSlot
  const [volunteerSlots, setVolunteerSlots] = useState<Record<string, VolunteerSlot>>({});
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const targetClassId = activeClassId || profile?.classId || profile?.activeClassId || currentClass?.id || '';

  // Initialize members and existing volunteers when modal opens
  useEffect(() => {
    if (!isOpen || !interrogation) return;
    setErrorMessage(null);
    setSearchTerm('');
    setSelectedUserIds([]);

    // Populate volunteerSlots from interrogation.volunteers
    const initialMap: Record<string, VolunteerSlot> = {};
    (interrogation.volunteers || []).forEach(v => {
      initialMap[v.userId] = {
        userId: v.userId,
        userName: v.userName,
        userAvatar: v.userAvatar || 'avatar-blue',
        timestamp: v.timestamp || new Date().toISOString(),
        status: (v.status || 'VOLUNTEER') as VolunteerStatus,
        notes: v.notes
      };
    });
    setVolunteerSlots(initialMap);

    // Fetch real class members
    if (targetClassId) {
      setLoadingMembers(true);
      classAdapter.getMembersOfClass(targetClassId)
        .then(res => {
          setMembers(res);
        })
        .catch(err => {
          console.error('Errore caricamento membri:', err);
          setErrorMessage('Impossibile caricare l\'elenco degli studenti della classe.');
        })
        .finally(() => setLoadingMembers(false));
    }
  }, [isOpen, interrogation?.id, targetClassId]);

  // Security guard: only ADMIN or CONTROLLER
  if (!isOpen || !interrogation) return null;
  if (!isController && !isAdmin) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-bold text-slate-900">Accesso Riservato</h3>
          <p className="text-xs text-slate-500">
            Solo i rappresentanti (Controller) e gli amministratori possono gestire manualmente i volontari e registrare le interrogazioni.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Chiudi
          </button>
        </div>
      </div>
    );
  }

  // Filter members by search term
  const filteredMembers = members.filter(m => {
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    const query = searchTerm.toLowerCase().trim();
    return fullName.includes(query) || (m.email && m.email.toLowerCase().includes(query));
  });

  const currentVolunteersList = Object.values(volunteerSlots);
  const volunteerCount = currentVolunteersList.filter(v => v.status === 'VOLUNTEER').length;
  const examinedCount = currentVolunteersList.filter(v => v.status === 'EXAMINED').length;
  const absentCount = currentVolunteersList.filter(v => v.status === 'ABSENT' || v.status === 'NOT_EXAMINED').length;

  // Single member status update
  const handleSetStatus = (member: ClassMember, newStatus: VolunteerStatus | 'REMOVE') => {
    setVolunteerSlots(prev => {
      const next = { ...prev };
      if (newStatus === 'REMOVE') {
        delete next[member.userId];
      } else {
        next[member.userId] = {
          userId: member.userId,
          userName: formatVolunteerName(member.firstName, member.lastName),
          userAvatar: member.avatarId || 'avatar-blue',
          timestamp: prev[member.userId]?.timestamp || new Date().toISOString(),
          status: newStatus
        };
      }
      return next;
    });
  };

  // Toggle multi-select checkbox for a member
  const handleToggleSelect = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Select all or deselect all visible filtered members
  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === filteredMembers.length && filteredMembers.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredMembers.map(m => m.userId));
    }
  };

  // Batch action for all currently selected members
  const handleBatchAction = (status: VolunteerStatus | 'REMOVE') => {
    if (selectedUserIds.length === 0) return;

    setVolunteerSlots(prev => {
      const next = { ...prev };
      selectedUserIds.forEach(uid => {
        const member = members.find(m => m.userId === uid);
        if (!member) return;

        if (status === 'REMOVE') {
          delete next[uid];
        } else {
          next[uid] = {
            userId: uid,
            userName: formatVolunteerName(member.firstName, member.lastName),
            userAvatar: member.avatarId || 'avatar-blue',
            timestamp: prev[uid]?.timestamp || new Date().toISOString(),
            status: status
          };
        }
      });
      return next;
    });

    setSuccessToast(`Azione applicata a ${selectedUserIds.length} studenti selezionati`);
    setTimeout(() => setSuccessToast(null), 2500);
    setSelectedUserIds([]);
  };

  // Save changes to backend adapter
  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      const listToSave = Object.values(volunteerSlots);

      await interrogationsAdapter.updateInterrogationVolunteers(
        interrogation.id, 
        listToSave, 
        targetClassId
      );

      onUpdated?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore durante il salvataggio dei volontari.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[92vh] shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                <Users className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Gestione Volontari & Interrogati
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {interrogation.subject} • {interrogation.title} • Limite posti: {interrogation.maxVolunteers}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Counters Strip */}
        <div className="px-5 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              Volontari: {volunteerCount} / {interrogation.maxVolunteers}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              <UserCheck className="w-3.5 h-3.5" />
              Interrogati: {examinedCount}
            </span>
            {absentCount > 0 && (
              <span className="flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                <UserX className="w-3.5 h-3.5" />
                Non interrogati/Assenti: {absentCount}
              </span>
            )}
          </div>
        </div>

        {/* Toolbar: Search & Batch Action Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cerca studente per nome o cognome..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
            />
          </div>

          {/* Batch operations */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {selectedUserIds.length === filteredMembers.length && filteredMembers.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-purple-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedUserIds.length > 0 
                  ? `Selezionati (${selectedUserIds.length})` 
                  : 'Seleziona tutti'}
              </span>
            </button>

            {selectedUserIds.length > 0 && (
              <div className="flex items-center gap-1.5 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => handleBatchAction('VOLUNTEER')}
                  className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold transition cursor-pointer"
                >
                  + Volontari
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchAction('EXAMINED')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition cursor-pointer"
                >
                  Segna Interrogati
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchAction('ABSENT')}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold transition cursor-pointer"
                >
                  Non Interrogati
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchAction('REMOVE')}
                  className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold transition cursor-pointer"
                >
                  Rimuovi
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mx-5 my-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successToast && (
          <div className="mx-5 my-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100 space-y-1">
          {loadingMembers && (
            <div className="py-12 text-center text-xs text-slate-400">
              Caricamento membri della classe...
            </div>
          )}

          {!loadingMembers && filteredMembers.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              Nessuno studente trovato per la ricerca "{searchTerm}".
            </div>
          )}

          {!loadingMembers && filteredMembers.map(member => {
            const isSelected = selectedUserIds.includes(member.userId);
            const currentSlot = volunteerSlots[member.userId];
            const currentStatus = currentSlot?.status;

            return (
              <div 
                key={member.userId}
                className={`py-2.5 px-3 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  currentStatus === 'EXAMINED'
                    ? 'bg-emerald-50/50 border border-emerald-100'
                    : currentStatus === 'VOLUNTEER'
                      ? 'bg-purple-50/40 border border-purple-100'
                      : currentStatus === 'ABSENT' || currentStatus === 'NOT_EXAMINED'
                        ? 'bg-amber-50/40 border border-amber-100'
                        : isSelected
                          ? 'bg-slate-50'
                          : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSelect(member.userId)}
                    className="cursor-pointer text-slate-400 hover:text-purple-600"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </button>

                  <AvatarIcon avatarId={member.avatarId || 'avatar-blue'} size="sm" />

                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {formatVolunteerName(member.firstName, member.lastName)}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                      {member.email}
                    </p>
                  </div>
                </div>

                {/* Status selector button */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleSetStatus(member, currentStatus === 'VOLUNTEER' ? 'REMOVE' : 'VOLUNTEER')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      currentStatus === 'VOLUNTEER'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{currentStatus === 'VOLUNTEER' ? 'Volontario (Iscritto)' : 'Rendi Volontario'}</span>
                  </button>

                  {currentStatus && (
                    <button
                      type="button"
                      onClick={() => handleSetStatus(member, 'REMOVE')}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Rimuovi"
                    >
                      Rimuovi
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold transition shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvataggio...' : 'Conferma e Salva'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
