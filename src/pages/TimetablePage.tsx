import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, User, Edit3, 
  Check, Save, Sparkles, Filter, Grid3X3, ListFilter,
  Layers, Coffee
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { localStore } from '../services/dataStore';
import { TimetableSlot } from '../types';
import { getSubjectStyle } from '../utils/theme';
import { CustomSelect } from '../components/ui/CustomSelect';
import { SUBJECT_OPTIONS, FREQUENT_SUBJECT_CHIPS } from '../utils/dropdownPresets';

export const TimetablePage: React.FC = () => {
  const { isController, isAdmin } = useAuth();
  const [timetable, setTimetable] = useState<TimetableSlot[]>(localStore.getTimetable());
  
  // View mode: 'weekly' (default for tablet & PC) or 'daily' (compact/mobile friendly)
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>(() => {
    return window.innerWidth >= 768 ? 'weekly' : 'daily';
  });

  const [activeDay, setActiveDay] = useState<number>(() => {
    const today = new Date().getDay();
    return today >= 1 && today <= 5 ? today : 1;
  });
  
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);

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
    { num: 4, timeRange: '11:15 – 12:15' },
    { num: 5, timeRange: '12:15 – 13:15' }
  ];

  const syncData = () => {
    setTimetable(localStore.getTimetable());
  };

  useEffect(() => {
    syncData();
    const unsub = localStore.subscribe(syncData);
    return () => unsub();
  }, []);

  const handleSaveSlot = (slot: TimetableSlot) => {
    localStore.updateTimetableSlot(slot);
    setEditingSlot(null);
  };

  const getSlot = (dayNum: number, hourNum: number) => {
    return timetable.find(s => s.dayOfWeek === dayNum && s.hour === hourNum);
  };

  const currentDaySlots = timetable
    .filter(s => s.dayOfWeek === activeDay)
    .sort((a, b) => a.hour - b.hour);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header with View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Orario Settimanale delle Lezioni
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              4° Liceo Sc. A
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quadro orario completo con materie colorate, docenti e aule per Tablet, PC e Smartphone.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
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
                {hours.map((hr, idx) => {
                  const isBreakAfterThis = hr.num === 3;

                  return (
                    <React.Fragment key={hr.num}>
                      <tr className="hover:bg-slate-50/40 transition">
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
                          const style = slot ? getSubjectStyle(slot.subject) : null;

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

                                      {(isController || isAdmin) && (
                                        <button
                                          onClick={() => setEditingSlot(slot)}
                                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 rounded bg-white/80 transition"
                                          title="Modifica"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                      )}
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
                                <div className="h-full rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-300">
                                  Libera
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Intervallo Break Divider */}
                      {isBreakAfterThis && (
                        <tr className="bg-amber-50/40 border-y border-amber-200/60">
                          <td colSpan={6} className="py-1 px-4 text-center">
                            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider inline-flex items-center gap-1.5">
                              <Coffee className="w-3 h-3" />
                              Intervallo Ricreazione (11:00 – 11:15)
                            </span>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>Legenda: Le materie sono categorizzate con palette cromatica dedicata per facilitare la scansione visiva.</span>
            <span className="font-semibold text-slate-700">Durata lezione: 60 minuti</span>
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
                  className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-xs'
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
            {currentDaySlots.map(slot => {
              const style = getSubjectStyle(slot.subject);

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

                  {(isController || isAdmin) && (
                    <button
                      onClick={() => setEditingSlot(slot)}
                      className="p-2 text-slate-400 hover:text-[#2563EB] rounded-xl hover:bg-blue-50 transition"
                      title="Modifica ora"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 pb-8 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">
              Modifica {editingSlot.hour}ª Ora ({days.find(d => d.num === editingSlot.dayOfWeek)?.name})
            </h3>

            <div className="space-y-3">
              <div>
                <CustomSelect
                  label="Materia *"
                  value={editingSlot.subject}
                  onChange={val => setEditingSlot({ ...editingSlot, subject: val })}
                  options={SUBJECT_OPTIONS}
                  quickChips={FREQUENT_SUBJECT_CHIPS}
                  searchable={true}
                  searchPlaceholder="Cerca materia..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Docente</label>
                <input
                  type="text"
                  value={editingSlot.teacher || ''}
                  onChange={e => setEditingSlot({ ...editingSlot, teacher: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border rounded-xl border-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Aula / Laboratorio</label>
                <input
                  type="text"
                  value={editingSlot.room || ''}
                  onChange={e => setEditingSlot({ ...editingSlot, room: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => handleSaveSlot(editingSlot)}
                className="px-5 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
