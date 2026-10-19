import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Plus, CheckCircle2, 
  Trash2, Filter, Lock, Unlock, Users,
  Check, Edit3, Archive, CalendarDays, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { interrogationsAdapter } from '../services/adapters';
import { Interrogation } from '../types';
import { toggleVolunteerReservation } from '../services/interrogations';
import { CreateInterrogationModal } from '../components/CreateInterrogationModal';
import { ManageVolunteersModal } from '../components/ManageVolunteersModal';
import { FormSelect } from '../components/ui/FormSelect';
import { SelectOption } from '../components/ui/CustomSelect';
import { SUBJECT_OPTIONS } from '../utils/dropdownPresets';
import { AVATAR_COLORS } from '../utils/theme';
import { formatVolunteerName, formatInterrogationDate } from '../utils/formatters';

export const InterrogationsPage: React.FC = () => {
  const { profile, isController, isAdmin } = useAuth();
  const [interrogations, setInterrogations] = useState<Interrogation[]>([]);
  const [activeTab, setActiveTab] = useState<'SCHEDULED' | 'ARCHIVE'>('SCHEDULED');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [interrogationToEdit, setInterrogationToEdit] = useState<Interrogation | null>(null);
  const [interrogationToManageVolunteers, setInterrogationToManageVolunteers] = useState<Interrogation | null>(null);
  const [isManageVolunteersModalOpen, setIsManageVolunteersModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    if (!profile) return;
    try {
      const list = await interrogationsAdapter.getInterrogations(profile.classId || profile.activeClassId || 'cls-dev-test');
      setInterrogations(list);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.classId, profile?.activeClassId, profile?.uid]);

  const handleVolunteerAction = async (interrogationId: string) => {
    if (!profile) return;
    const currentInters = interrogations;
    const targetInter = interrogations.find(i => i.id === interrogationId);
    if (!targetInter) return;

    const myUid = profile.uid;
    const myName = formatVolunteerName(profile.firstName, profile.lastName);
    const isAlreadyBooked = Boolean(
      targetInter.volunteerIds?.includes(myUid) || 
      targetInter.volunteers?.some(v => v.userId === myUid)
    );

    // Optimistic UI update
    setInterrogations(prev => prev.map(item => {
      if (item.id !== interrogationId) return item;
      if (isAlreadyBooked) {
        return {
          ...item,
          volunteerIds: (item.volunteerIds || []).filter(id => id !== myUid),
          volunteers: (item.volunteers || []).filter(v => v.userId !== myUid)
        };
      } else {
        return {
          ...item,
          volunteerIds: [...(item.volunteerIds || []), myUid],
          volunteers: [
            ...(item.volunteers || []), 
            { 
              userId: myUid, 
              userName: myName, 
              userAvatar: profile.avatarId || 'avatar-blue', 
              timestamp: new Date().toISOString(),
              status: 'VOLUNTEER'
            }
          ]
        };
      }
    }));

    try {
      const res = await toggleVolunteerReservation(profile.classId || '', interrogationId, {
        uid: myUid,
        name: myName,
        avatarId: profile.avatarId
      });
      showToast(res.message);
      await loadData();
    } catch (err: any) {
      setInterrogations(currentInters);
      showToast(err.message || 'Errore nella prenotazione.');
    }
  };

  const handleToggleClose = async (id: string, currentStatus: string) => {
    if (!isController && !isAdmin) return;
    const newStatus = currentStatus === 'CLOSED' ? 'OPEN' : 'CLOSED';
    
    // Optimistic update
    setInterrogations(prev => prev.map(item => item.id === id ? { ...item, status: newStatus as any } : item));

    try {
      await interrogationsAdapter.updateInterrogationStatus(id, newStatus);
      showToast(newStatus === 'CLOSED' ? 'Iscrizioni chiuse' : 'Iscrizioni riaperte');
      await loadData();
    } catch (err: any) {
      await loadData();
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

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000); // Check every 30 seconds
    return () => clearInterval(timer);
  }, []);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const isInterrogationArchived = (item: Interrogation) => {
    const itemDate = item.date || '';
    if (itemDate < todayStr) return true;
    if (itemDate === todayStr) {
      if (!item.startTime) return false;
      const [h, m] = item.startTime.split(':').map(Number);
      const startMinutes = (h || 0) * 60 + (m || 0);
      return currentMinutes > startMinutes;
    }
    return false;
  };

  // Split interrogations into Scheduled (future or today not yet started) and Archive (past date or past start time today)
  const scheduledInterrogations = useMemo(() => {
    return interrogations.filter(i => !isInterrogationArchived(i));
  }, [interrogations, todayStr, currentMinutes, tick]);

  const archivedInterrogations = useMemo(() => {
    return interrogations.filter(i => isInterrogationArchived(i));
  }, [interrogations, todayStr, currentMinutes, tick]);

  // Current tab interrogations pool
  const currentTabPool = activeTab === 'SCHEDULED' ? scheduledInterrogations : archivedInterrogations;

  // Build subject options for CustomSelect dropdown based on current tab
  const subjectDropdownOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [
      {
        value: 'ALL',
        label: `Tutte le materie (${currentTabPool.length})`,
        icon: <Filter className="w-3.5 h-3.5 text-slate-500" />
      }
    ];

    const uniqueSubjects = Array.from(new Set(currentTabPool.map(i => i.subject)));
    uniqueSubjects.forEach(s => {
      const matchingCount = currentTabPool.filter(i => i.subject === s).length;
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
  }, [currentTabPool]);

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
    return currentTabPool.filter(item => {
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
  }, [currentTabPool, selectedSubject, statusFilter, profile?.uid]);

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
              {scheduledInterrogations.length} in programma
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Prenotazione volontari alle prove orali, registro interrogati e archivio storico delle interrogazioni.
          </p>
        </div>

        {(isController || isAdmin) && (
          <button
            onClick={() => {
              setInterrogationToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#7C3AED] hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Programma Interrogazione</span>
          </button>
        )}
      </div>

      {/* Section View Tabs: Programmate vs Archivio */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('SCHEDULED')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'SCHEDULED'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Programmate</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'SCHEDULED' ? 'bg-purple-700 text-purple-100' : 'bg-slate-100 text-slate-700'
          }`}>
            {scheduledInterrogations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ARCHIVE')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'ARCHIVE'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Archivio Storico</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'ARCHIVE' ? 'bg-purple-700 text-purple-100' : 'bg-slate-100 text-slate-700'
          }`}>
            {archivedInterrogations.length}
          </span>
        </button>
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
          const isArchived = isInterrogationArchived(item);
          const examinedCount = (item.volunteers || []).filter(v => v.status === 'EXAMINED').length;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-5 bg-white shadow-xs flex flex-col justify-between transition-all duration-300 ${
                isArchived
                  ? 'border-slate-200/90 bg-slate-50/40'
                  : isClosed
                    ? 'border-slate-200 opacity-80'
                    : isBooked
                      ? 'border-purple-300 ring-2 ring-purple-500/20'
                      : 'border-slate-200/90 hover:shadow-md'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                      {item.subject}
                    </span>
                    {isArchived && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        Archiviata
                      </span>
                    )}
                  </div>

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
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {formatInterrogationDate(item.date)} {item.startTime ? `• ore ${item.startTime}` : ''}
                  </p>
                  {item.teacher && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Docente: {item.teacher}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-slate-600 mt-1 italic line-clamp-2">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Volunteers & Examined Slot List */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-purple-600" /> Partecipanti:
                    </span>
                    <span className="font-extrabold text-purple-700">
                      {item.volunteers.length} / {item.maxVolunteers}
                      {examinedCount > 0 && ` (${examinedCount} interrogati)`}
                    </span>
                  </div>

                  {/* Visual slots list */}
                  <div className="space-y-1">
                    {Array.from({ length: Math.max(item.maxVolunteers, item.volunteers.length) }).map((_, idx) => {
                      const vol = item.volunteers[idx];
                      if (vol) {
                        const avatar = AVATAR_COLORS[vol.userAvatar] || AVATAR_COLORS['avatar-1'];
                        const isExamined = vol.status === 'EXAMINED';
                        const isAbsent = vol.status === 'ABSENT' || vol.status === 'NOT_EXAMINED';

                        return (
                          <div
                            key={vol.userId || idx}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border ${
                              isExamined 
                                ? 'bg-emerald-50/70 border-emerald-200'
                                : isAbsent
                                  ? 'bg-amber-50/60 border-amber-200'
                                  : 'bg-slate-50 border-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full ${avatar.bg} ${avatar.text} flex items-center justify-center text-[9px] font-bold`}>
                                {formatVolunteerName(vol.userName).slice(0, 2).toUpperCase()}
                              </div>
                              <span className="font-medium text-slate-800">{formatVolunteerName(vol.userName)}</span>
                              {vol.userId === profile?.uid && (
                                <span className="text-[10px] text-purple-600 font-bold">(Tu)</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isExamined ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                  <UserCheck className="w-2.5 h-2.5" /> Interrogato
                                </span>
                              ) : isAbsent ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                  Non Interr.
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                  Volontario
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">#{idx + 1}</span>
                            </div>
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
              <div className="pt-4 mt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                {(isController || isAdmin) && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setInterrogationToManageVolunteers(item);
                        setIsManageVolunteersModalOpen(true);
                      }}
                      title="Gestisci volontari ed effettivamente interrogati"
                      className="px-2 py-1 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold shrink-0"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Volontari</span>
                    </button>

                    <button
                      onClick={() => {
                        setInterrogationToEdit(item);
                        setIsModalOpen(true);
                      }}
                      title="Modifica interrogazione (rinvia, data, posti, ecc.)"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {!isArchived && (
                      <button
                        onClick={() => handleToggleClose(item.id, item.status)}
                        title={item.status === 'CLOSED' ? 'Riapri iscrizioni' : 'Chiudi iscrizioni'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      >
                        {item.status === 'CLOSED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Elimina interrogazione"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {!isArchived ? (
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
                ) : (
                  <span className="ml-auto text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
                    Data conclusa
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs max-w-lg mx-auto">
          {activeTab === 'SCHEDULED' ? (
            <>
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Nessuna interrogazione programmata</h3>
              <p className="text-xs text-slate-500 mt-1">
                Non ci sono prove orali future corrispondenti ai filtri. Gli amministratori possono programmarne una nuova con il pulsante sopra.
              </p>
            </>
          ) : (
            <>
              <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Nessuna interrogazione in archivio</h3>
              <p className="text-xs text-slate-500 mt-1">
                Le interrogazioni con data trascorsa verranno archiviate qui automaticamente, preservando lo storico dei volontari e degli interrogati.
              </p>
            </>
          )}
        </div>
      )}

      {/* Creation / Edit Modal */}
      <CreateInterrogationModal
        isOpen={isModalOpen}
        interrogationToEdit={interrogationToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setInterrogationToEdit(null);
        }}
        onCreated={() => {
          loadData();
          showToast(interrogationToEdit ? 'Interrogazione aggiornata!' : 'Interrogazione programmata con successo!');
        }}
      />

      {/* Manual Volunteers & Examined Management Modal */}
      <ManageVolunteersModal
        isOpen={isManageVolunteersModalOpen}
        interrogation={interrogationToManageVolunteers}
        onClose={() => {
          setIsManageVolunteersModalOpen(false);
          setInterrogationToManageVolunteers(null);
        }}
        onUpdated={() => {
          loadData();
          showToast('Registro volontari e interrogati aggiornato!');
        }}
      />
    </div>
  );
};
