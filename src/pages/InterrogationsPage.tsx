import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Plus, CheckCircle2, 
  Trash2, Filter, Lock, Unlock, Calendar, Users,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { interrogationsAdapter } from '../services/adapters';
import { Interrogation } from '../types';
import { toggleVolunteerReservation } from '../services/interrogations';
import { CreateInterrogationModal } from '../components/CreateInterrogationModal';
import { FormSelect } from '../components/ui/FormSelect';
import { SelectOption } from '../components/ui/CustomSelect';
import { SUBJECT_OPTIONS } from '../utils/dropdownPresets';
import { AVATAR_COLORS } from '../utils/theme';

export const InterrogationsPage: React.FC = () => {
  const { profile, isController, isAdmin } = useAuth();
  const [interrogations, setInterrogations] = useState<Interrogation[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    if (!profile) return;
    try {
      const list = await interrogationsAdapter.getInterrogations(profile.classId || '');
      setInterrogations(list);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const handleVolunteerAction = async (interrogationId: string) => {
    if (!profile) return;
    try {
      const res = await toggleVolunteerReservation(profile.classId || '', interrogationId, {
        uid: profile.uid,
        name: `${profile.firstName} ${profile.lastName[0]}.`,
        avatarId: profile.avatarId
      });
      showToast(res.message);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Errore nella prenotazione.');
    }
  };

  const handleToggleClose = async (id: string, currentStatus: string) => {
    if (!isController && !isAdmin) return;
    const newStatus = currentStatus === 'CLOSED' ? 'OPEN' : 'CLOSED';
    try {
      await interrogationsAdapter.updateInterrogationStatus(id, newStatus);
      showToast(newStatus === 'CLOSED' ? 'Iscrizioni chiuse' : 'Iscrizioni riaperte');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Errore nell\'aggiornamento dello stato.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isController && !isAdmin) return;
    if (confirm('Sei sicuro di voler eliminare questa interrogazione?')) {
      try {
        await interrogationsAdapter.deleteInterrogation(id);
        showToast('Interrogazione eliminata');
        await loadData();
      } catch (err: any) {
        showToast(err.message || 'Errore nell\'eliminazione.');
      }
    }
  };

  // Build subject options for CustomSelect dropdown
  const subjectDropdownOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [
      {
        value: 'ALL',
        label: `Tutte le materie (${interrogations.length})`,
        icon: <Filter className="w-3.5 h-3.5 text-slate-500" />
      }
    ];

    const uniqueSubjects = Array.from(new Set(interrogations.map(i => i.subject)));
    uniqueSubjects.forEach(s => {
      const matchingCount = interrogations.filter(i => i.subject === s).length;
      const preset = SUBJECT_OPTIONS.find(p => p.value === s);
      list.push({
        value: s,
        label: `${s} (${matchingCount})`,
        icon: preset?.icon,
        colorDot: preset?.colorDot,
        description: preset?.description
      });
    });

    return list;
  }, [interrogations]);

  const statusDropdownOptions: SelectOption[] = [
    {
      value: 'ALL',
      label: 'Tutti gli stati',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />,
      description: 'Mostra aperte, piene e concluse'
    },
    {
      value: 'AVAILABLE',
      label: 'Solo con Posti Liberi',
      icon: <Users className="w-3.5 h-3.5 text-emerald-600" />,
      badge: 'Disponibili',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      description: 'Prove orali con ancora posti disponibili'
    },
    {
      value: 'MY_BOOKINGS',
      label: 'Le Mie Prenotazioni',
      icon: <Check className="w-3.5 h-3.5 text-purple-600" />,
      badge: 'Personali',
      badgeClass: 'bg-purple-100 text-purple-800',
      description: 'Sessioni a cui sei attualmente iscritto'
    },
    {
      value: 'OPEN',
      label: 'Iscrizioni Aperte',
      icon: <Unlock className="w-3.5 h-3.5 text-blue-600" />,
      description: 'Sessioni con prenotazione attiva'
    }
  ];

  const filtered = useMemo(() => {
    return interrogations.filter(item => {
      // Subject filter
      if (selectedSubject !== 'ALL' && item.subject !== selectedSubject) {
        return false;
      }

      // Status filter
      if (statusFilter === 'AVAILABLE') {
        if (item.status === 'CLOSED' || item.volunteers.length >= item.maxVolunteers) {
          return false;
        }
      } else if (statusFilter === 'MY_BOOKINGS') {
        const booked = item.volunteerIds?.includes(profile?.uid || '') || item.volunteers?.some(v => v.userId === profile?.uid);
        if (!booked) {
          return false;
        }
      } else if (statusFilter === 'OPEN') {
        if (item.status !== 'OPEN') {
          return false;
        }
      }

      return true;
    });
  }, [interrogations, selectedSubject, statusFilter, profile?.uid]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <Clock className="w-4 h-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              Interrogazioni & Volontari
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {filtered.length} in programma
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Prenotazione autonoma dei volontari alle prove orali con limite posti e rispetto del turno.
          </p>
        </div>

        {isController && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#7C3AED] hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Programma Interrogazione</span>
          </button>
        )}
      </div>

      {/* Clean Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <FormSelect
              label="Filtra per Materia"
              value={selectedSubject}
              onChange={setSelectedSubject}
              options={subjectDropdownOptions}
            />
          </div>

          <div>
            <FormSelect
              label="Filtra per Stato & Mie Prenotazioni"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusDropdownOptions}
            />
          </div>
        </div>
      </div>

      {/* Interrogations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(item => {
          const isBooked = Boolean(item.volunteerIds?.includes(profile?.uid || '') || item.volunteers?.some(v => v.userId === profile?.uid));
          const isFull = (item.volunteers?.length || 0) >= item.maxVolunteers;
          const isClosed = item.status === 'CLOSED';

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-5 bg-white shadow-xs flex flex-col justify-between transition-all duration-300 ${
                isClosed
                  ? 'border-slate-200 opacity-80'
                  : isBooked
                    ? 'border-purple-300 ring-2 ring-purple-500/20'
                    : 'border-slate-200/90 hover:shadow-md'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                    {item.subject}
                  </span>
                  <div className="flex items-center gap-1">
                    {isBooked && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        Iscritto
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isClosed
                          ? 'bg-slate-100 text-slate-600'
                          : isFull
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isClosed ? 'Chiusa' : isFull ? 'Completa' : 'Aperta'}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">{item.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{item.date}</span>
                    <span>·</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.startTime} – {item.endTime}</span>
                  </div>
                  {item.teacher && (
                    <p className="text-xs text-slate-500 mt-1">
                      Docente: <span className="font-semibold text-slate-700">{item.teacher}</span>
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-slate-600 mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100 italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Volunteers Slot List */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-purple-600" /> Volontari:
                    </span>
                    <span className="font-extrabold text-purple-700">
                      {item.volunteers.length} / {item.maxVolunteers}
                    </span>
                  </div>

                  {/* Visual slots list */}
                  <div className="space-y-1">
                    {Array.from({ length: item.maxVolunteers }).map((_, idx) => {
                      const vol = item.volunteers[idx];
                      if (vol) {
                        const avatar = AVATAR_COLORS[vol.userAvatar] || AVATAR_COLORS['avatar-1'];
                        return (
                          <div
                            key={vol.userId || idx}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 text-xs border border-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full ${avatar.bg} ${avatar.text} flex items-center justify-center text-[9px] font-bold`}>
                                {vol.userName.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="font-medium text-slate-800">{vol.userName}</span>
                              {vol.userId === profile?.uid && (
                                <span className="text-[10px] text-purple-600 font-bold">(Tu)</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">#{idx + 1}</span>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={`empty-${idx}`}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400"
                        >
                          <span className="italic">Posto {idx + 1} libero</span>
                          <span className="text-[10px]">Disponibile</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {isController && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleClose(item.id, item.status)}
                      title={item.status === 'CLOSED' ? 'Riapri iscrizioni' : 'Chiudi iscrizioni'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                      {item.status === 'CLOSED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Elimina interrogazione"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => handleVolunteerAction(item.id)}
                  disabled={isClosed || (!isBooked && isFull)}
                  className={`ml-auto px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isBooked
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      : isClosed || isFull
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-[#7C3AED] hover:bg-purple-700 text-white shadow-xs'
                  }`}
                >
                  {isBooked ? (
                    <span>Annulla Volontariato</span>
                  ) : isClosed ? (
                    'Iscrizioni Chiuse'
                  ) : isFull ? (
                    'Posti Esauriti'
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Prenotati Ora</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs max-w-lg mx-auto">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nessuna interrogazione corrisponde ai filtri</h3>
          <p className="text-xs text-slate-500 mt-1">
            Modifica i filtri materia o stato nei menu a tendina sopra oppure programma una nuova prova orale.
          </p>
        </div>
      )}

      {/* Creation Modal */}
      <CreateInterrogationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => {
          loadData();
          showToast('Interrogazione programmata con successo!');
        }}
      />
    </div>
  );
};
