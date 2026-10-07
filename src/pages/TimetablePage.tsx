import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, User, Edit3, 
  Check, Save, Sparkles, Filter, Grid3X3, ListFilter,
  Plus, BookOpen, Trash2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { localStore } from '../services/dataStore';
import { TimetableSlot, SubjectItem } from '../types';
import { getSubjectStyle } from '../utils/theme';
import { FormSelect } from '../components/ui/FormSelect';
import { SelectOption } from '../components/ui/CustomSelect';
import { formatSubjectToOption } from '../utils/dropdownPresets';
import { SubjectManagerModal } from '../components/SubjectManagerModal';

export const TimetablePage: React.FC = () => {
  const { profile, isController, isAdmin } = useAuth();
  const [timetable, setTimetable] = useState<TimetableSlot[]>(localStore.getTimetable());
  const [subjects, setSubjects] = useState<SubjectItem[]>(localStore.getSubjects(profile?.classId || ''));
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View mode: 'weekly' (default for tablet & PC) or 'daily' (compact/mobile friendly)
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>(() => {
    return window.innerWidth >= 768 ? 'weekly' : 'daily';
  });

  const [activeDay, setActiveDay] = useState<number>(() => {
    const today = new Date().getDay();
    return today >= 1 && today <= 5 ? today : 1;
  });
  
  // Modal for editing or creating a timetable slot
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [isNewSlot, setIsNewSlot] = useState(false);

  const days = [
    { num: 1, name: 'Lunedì', short: 'Lun' },
    { num: 2, name: 'Martedì', short: 'Mar' },
    { num: 3, name: 'Mercoledì', short: 'Mer' },
    { num: 4, name: 'Giovedì', short: 'Gio' },
    { num: 5, name: 'Venerdì', short: 'Ven' }
  ];

  const hours = [
    { num: 1, timeRange: '08:00 – 09:00' },
    { num: 2, timeRange: '09:00 – 10:00' },
    { num: 3, timeRange: '10:00 – 11:00' },
    { num: 4, timeRange: '11:00 – 12:00' },
    { num: 5, timeRange: '12:00 – 13:00' },
    { num: 6, timeRange: '13:00 – 14:00' }
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const syncData = () => {
    setTimetable(localStore.getTimetable());
    setSubjects(localStore.getSubjects(profile?.classId || ''));
  };

  useEffect(() => {
    syncData();
    const unsub = localStore.subscribe(syncData);
    return () => unsub();
  }, [profile]);

  const handleSaveSlot = (slot: TimetableSlot) => {
    localStore.updateTimetableSlot(slot);
    setEditingSlot(null);
    setIsNewSlot(false);
    showToast('Orario aggiornato con successo!');
  };

  const handleDeleteSlot = (id: string) => {
    if (confirm('Rimuovere questa lezione dall\'orario?')) {
      localStore.deleteTimetableSlot(id);
      setEditingSlot(null);
      setIsNewSlot(false);
      showToast('Lezione rimossa dall\'orario');
    }
  };

  const handleOpenAddSlot = (dayNum: number, hourNum: number) => {
    const timeRange = hours.find(h => h.num === hourNum)?.timeRange || '08:00 – 09:00';
    const firstSubject = subjects[0]?.name || 'Matematica';
    const matchedSubject = subjects.find(s => s.name === firstSubject);

    setEditingSlot({
      id: `tt-${dayNum}-${hourNum}-${Date.now()}`,
      dayOfWeek: dayNum,
      hour: hourNum,
      timeRange,
      subject: firstSubject,
      teacher: matchedSubject?.defaultTeacher || '',
      room: matchedSubject?.defaultRoom || 'Aula 24'
    });
    setIsNewSlot(true);
  };

  const getSlot = (dayNum: number, hourNum: number) => {
    return timetable.find(s => s.dayOfWeek === dayNum && s.hour === hourNum);
  };

  // Convert subjects to SelectOption
  const subjectOptions: SelectOption[] = subjects.map(formatSubjectToOption);

  const dayOptions: SelectOption[] = days.map(d => ({
    value: String(d.num),
    label: d.name
  }));

  const hourOptions: SelectOption[] = hours.map(h => ({
    value: String(h.num),
    label: `${h.num}ª Ora (${h.timeRange})`
  }));

  const currentDaySlots = timetable
    .filter(s => s.dayOfWeek === activeDay)
    .sort((a, b) => a.hour - b.hour);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm flex items-center gap-2 border border-slate-700 font-medium"
          >
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with View Switcher & Subject Manager Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Orario Settimanale delle Lezioni
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              Quadro Orario
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Editor dell'orario e delle materie scolastiche per la classe.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          
          {/* Button: Gestione Materie */}
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition shadow-2xs"
          >
            <BookOpen className="w-4 h-4" />
            <span>Editor Materie ({subjects.length})</span>
          </button>

          {/* View Switcher Pills */}
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200/90 shadow-2xs text-xs font-bold">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                viewMode === 'weekly'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Tabella Settimanale</span>
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                viewMode === 'daily'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Vista Giornaliera</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. VISTA SETTIMANALE COMPLETA (Ottimizzata per Tablet & PC) */}
      {viewMode === 'weekly' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="py-3.5 px-4 text-[11px] font-black uppercase tracking-wider text-slate-400 w-28 text-center border-r border-slate-200/60">
                    Ora / Orario
                  </th>
                  {days.map(d => (
                    <th key={d.num} className="py-3.5 px-3 text-xs font-extrabold text-slate-800 text-center border-r border-slate-200/60 last:border-r-0">
                      <span className="block text-sm">{d.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{d.short}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hours.map((hr) => {
                  return (
                    <tr key={hr.num} className="hover:bg-slate-50/40 transition">
                      {/* Time Row Header */}
                      <td className="py-3 px-3 bg-slate-50/50 text-center border-r border-slate-200/60">
                        <span className="inline-block text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                          {hr.num}ª Ora
                        </span>
                        <span className="block text-[10px] text-slate-400 font-bold mt-1">
                          {hr.timeRange}
                        </span>
                      </td>

                      {/* 5 Days Columns */}
                      {days.map(d => {
                        const slot = getSlot(d.num, hr.num);
                        const matchedSub = subjects.find(s => s.name === slot?.subject);
                        const style = slot ? getSubjectStyle(slot.subject, matchedSub?.color) : null;

                        return (
                          <td 
                            key={`${d.num}-${hr.num}`} 
                            className="p-2 border-r border-slate-200/60 last:border-r-0 align-top h-24"
                          >
                            {slot ? (
                              <div className={`h-full p-2.5 rounded-2xl border transition-all flex flex-col justify-between group relative ${style?.bg} ${style?.border} hover:shadow-xs`}>
                                <div>
                                  <div className="flex items-start justify-between gap-1">
                                    <span className={`text-xs font-black truncate block ${style?.text}`}>
                                      {slot.subject}
                                    </span>

                                    <button
                                      onClick={() => {
                                        setEditingSlot(slot);
                                        setIsNewSlot(false);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 rounded bg-white/80 transition"
                                      title="Modifica"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {slot.teacher && (
                                    <p className="text-[10px] text-slate-600 font-medium truncate mt-0.5">
                                      {slot.teacher}
                                    </p>
                                  )}
                                </div>

                                {slot.room && (
                                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-white/80 px-1.5 py-0.5 rounded-md w-fit border border-slate-200/50 mt-1">
                                    <MapPin className="w-2.5 h-2.5" />
                                    <span className="truncate">{slot.room}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenAddSlot(d.num, hr.num)}
                                className="w-full h-full rounded-2xl border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 flex flex-col items-center justify-center text-[10px] text-slate-300 hover:text-indigo-600 transition group cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                                <span className="group-hover:font-semibold">Aggiungi</span>
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>Clicca su qualsiasi casella per modificare o aggiungere una materia all'orario.</span>
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="text-indigo-600 font-bold hover:underline"
            >
              + Personalizza Materie e Colori
            </button>
          </div>
        </div>
      )}

      {/* 2. VISTA GIORNALIERA (Giorno per Giorno per Smartphone o vista dettagliata) */}
      {viewMode === 'daily' && (
        <div className="space-y-4 max-w-3xl">
          {/* Day Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {days.map(d => {
              const isActive = activeDay === d.num;

              return (
                <button
                  key={d.num}
                  onClick={() => setActiveDay(d.num)}
                  className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{d.name}</span>
                </button>
              );
            })}
          </div>

          {/* Slots list for selected day */}
          <div className="space-y-3">
            {currentDaySlots.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <p className="text-sm font-semibold">Nessuna lezione programmata per questo giorno.</p>
                <button
                  onClick={() => handleOpenAddSlot(activeDay, 1)}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                >
                  + Aggiungi 1ª Ora
                </button>
              </div>
            ) : (
              currentDaySlots.map(slot => {
                const matchedSub = subjects.find(s => s.name === slot.subject);
                const style = getSubjectStyle(slot.subject, matchedSub?.color);

                return (
                  <div
                    key={slot.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-4 hover:shadow-sm transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex flex-col items-center justify-center shrink-0 border border-slate-200/70">
                        <span className="text-xs font-black text-slate-800">{slot.hour}ª</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Ora</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {slot.timeRange}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${style.bg} ${style.text} ${style.border}`}>
                            {slot.subject}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 mt-1">
                          {slot.subject}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          {slot.teacher && (
                            <span className="flex items-center gap-1 font-medium">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {slot.teacher}
                            </span>
                          )}
                          {slot.room && (
                            <span className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {slot.room}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEditingSlot(slot);
                        setIsNewSlot(false);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition"
                      title="Modifica ora"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Edit or Add Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {isNewSlot ? 'Aggiungi Lezione all\'Orario' : `Modifica ${editingSlot.hour}ª Ora`}
              </h3>
              <button
                onClick={() => setEditingSlot(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Giorno e Ora (in caso di aggiunta o spostamento) */}
              <div className="grid grid-cols-2 gap-3">
                <FormSelect
                  label="Giorno"
                  value={String(editingSlot.dayOfWeek)}
                  onChange={val => setEditingSlot({ ...editingSlot, dayOfWeek: Number(val) })}
                  options={dayOptions}
                  required
                />
                <FormSelect
                  label="Ora di Lezione"
                  value={String(editingSlot.hour)}
                  onChange={val => {
                    const hNum = Number(val);
                    const range = hours.find(h => h.num === hNum)?.timeRange || editingSlot.timeRange;
                    setEditingSlot({ ...editingSlot, hour: hNum, timeRange: range });
                  }}
                  options={hourOptions}
                  required
                />
              </div>

              {/* Materia con supporto a materie create dall'utente */}
              <div>
                <FormSelect
                  label="Materia *"
                  value={editingSlot.subject}
                  onChange={val => {
                    const matched = subjects.find(s => s.name === val);
                    setEditingSlot({
                      ...editingSlot,
                      subject: val,
                      teacher: matched?.defaultTeacher || editingSlot.teacher,
                      room: matched?.defaultRoom || editingSlot.room
                    });
                  }}
                  options={subjectOptions}
                  required
                />
              </div>

              {/* Docente */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Docente (opzionale)</label>
                <input
                  type="text"
                  value={editingSlot.teacher || ''}
                  onChange={e => setEditingSlot({ ...editingSlot, teacher: e.target.value })}
                  placeholder="Es. Prof. Barbieri"
                  className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                />
              </div>

              {/* Aula */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Aula / Laboratorio (opzionale)</label>
                <input
                  type="text"
                  value={editingSlot.room || ''}
                  onChange={e => setEditingSlot({ ...editingSlot, room: e.target.value })}
                  placeholder="Es. Aula 24, Lab. Fisica"
                  className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              {!isNewSlot ? (
                <button
                  type="button"
                  onClick={() => handleDeleteSlot(editingSlot.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
                  title="Elimina questa ora"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSlot(editingSlot)}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm transition cursor-pointer"
                >
                  Salva Lezione
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subject Manager Modal */}
      <SubjectManagerModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        classId={profile?.classId || ''}
        onSubjectChanged={syncData}
      />

    </div>
  );
};
