import React, { useState, useEffect } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameMonth, isSameDay, parseISO 
} from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Bell, CheckCircle2, Clock, Plus, Filter, Info, AlertTriangle,
  Lock, Trash2, Eye, Sparkles, CalendarDays, ListFilter,
  Columns, LayoutGrid, List, FileText, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { localStore } from '../services/dataStore';
import { CalendarEvent, Interrogation, Notice } from '../types';
import { toggleVolunteerReservation } from '../services/interrogations';
import { CreateEventModal } from '../components/CreateEventModal';
import { CreateInterrogationModal } from '../components/CreateInterrogationModal';
import { FormSelect } from '../components/ui/FormSelect';
import { SelectOption } from '../components/ui/CustomSelect';
import { SUBJECT_OPTIONS, formatSubjectToOption } from '../utils/dropdownPresets';

type ViewMode = 'split' | 'calendar' | 'details';

interface CalendarHomeProps {
  onOpenInterrogationsTab?: () => void;
}

export const CalendarHome: React.FC<CalendarHomeProps> = ({ onOpenInterrogationsTab }) => {
  const { profile, isController, isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [interrogations, setInterrogations] = useState<Interrogation[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isInterrogationModalOpen, setIsInterrogationModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'VERIFICHE' | 'INTERROGAZIONI' | 'PERSONALI'>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  
  // Universal View Selector for all devices: 'split', 'calendar', or 'details'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return window.innerWidth >= 1024 ? 'split' : 'split';
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const refreshData = () => {
    if (!profile) return;
    const cid = profile.classId || '';
    setEvents(localStore.getEvents(cid, profile.uid));
    setInterrogations(localStore.getInterrogations(cid));
    setNotices(localStore.getNotices(cid));
  };

  useEffect(() => {
    refreshData();
    const unsub = localStore.subscribe(refreshData);
    return () => unsub();
  }, [profile]);

  // Calendar calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Monday-first offset
  const startDayOfWeek = (monthStart.getDay() + 6) % 7;
  const emptyPaddedDays = Array.from({ length: startDayOfWeek });

  // Filter options for dropdown
  const filterTypeOptions: SelectOption[] = [
    { value: 'ALL', label: 'Tutti gli impegni', icon: <Filter className="w-3.5 h-3.5 text-slate-500" />, description: 'Verifiche, interrogazioni e personali' },
    { value: 'VERIFICHE', label: 'Verifiche Scritte', icon: <FileText className="w-3.5 h-3.5 text-blue-600" />, colorDot: 'bg-blue-600', badge: 'Scritto', badgeClass: 'bg-blue-100 text-blue-700' },
    { value: 'INTERROGAZIONI', label: 'Interrogazioni & Volontari', icon: <Clock className="w-3.5 h-3.5 text-purple-600" />, colorDot: 'bg-purple-600', badge: 'Orale', badgeClass: 'bg-purple-100 text-purple-700' },
    { value: 'PERSONALI', label: 'Impegni Personali Privati', icon: <Lock className="w-3.5 h-3.5 text-slate-600" />, colorDot: 'bg-slate-600', badge: 'Privato', badgeClass: 'bg-slate-100 text-slate-700' }
  ];

  const classSubjects = localStore.getSubjects(profile?.classId || '');
  const calendarSubjectOptions: SelectOption[] = [
    { value: 'ALL', label: 'Tutte le materie', icon: <Filter className="w-3.5 h-3.5 text-slate-400" /> },
    ...classSubjects.map(formatSubjectToOption)
  ];

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayEvents = events.filter(e => {
    if (e.date !== selectedDateStr) return false;
    if (subjectFilter !== 'ALL' && e.subject && !e.subject.includes(subjectFilter)) return false;
    return true;
  });
  const dayInterrogations = interrogations.filter(i => {
    if (i.date !== selectedDateStr) return false;
    if (subjectFilter !== 'ALL' && i.subject !== subjectFilter) return false;
    return true;
  });
  const dayNotices = notices.filter(n => n.date === selectedDateStr);

  const handleVolunteerAction = async (interrogationId: string) => {
    if (!profile) return;
    try {
      const res = await toggleVolunteerReservation(profile.classId || '', interrogationId, {
        uid: profile.uid,
        name: `${profile.firstName} ${profile.lastName[0]}.`,
        avatarId: profile.avatarId
      });
      showToast(res.message);
    } catch (err: any) {
      showToast(err.message || "Impossibile completare l'operazione.");
    }
  };

  const handleDeleteEvent = (eventId: string, isPersonal: boolean, authorId: string) => {
    if (isPersonal && authorId !== profile?.uid) {
      showToast('Non puoi eliminare un evento personale altrui');
      return;
    }
    if (!isPersonal && !isController && !isAdmin) {
      showToast('Solo il Controller o l\'Admin possono eliminare eventi di classe');
      return;
    }
    localStore.deleteEvent(eventId);
    showToast('Evento rimosso con successo');
  };

  const onSelectDay = (day: Date) => {
    setSelectedDate(day);
  };

  // Determine visibility of sections
  const showCalendarSection = viewMode === 'split' || viewMode === 'calendar';
  const showDetailsSection = viewMode === 'split' || viewMode === 'details';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F7FB] overflow-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm flex items-center gap-2 border border-slate-700 font-medium"
          >
            <Info className="w-4 h-4 text-[#60A5FA] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Universal View Mode Switcher Header for ALL Devices (PC, Tablet, Mobile) */}
      <div className="bg-white border-b border-slate-200/90 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        
        {/* Left: Device-wide Layout Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold shadow-2xs">
          <span className="text-[11px] text-slate-400 px-2 hidden sm:inline uppercase tracking-wider font-extrabold">
            Visualizzazione:
          </span>
          
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              viewMode === 'split'
                ? 'bg-white text-[#2563EB] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Mostra Mese e Dettagli giornalieri insieme"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{window.innerWidth < 640 ? 'Entrambi' : 'Mese & Dettagli'}</span>
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-white text-[#2563EB] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Vista calendario mensile a tutto schermo"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Solo Mese</span>
          </button>

          <button
            onClick={() => setViewMode('details')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              viewMode === 'details'
                ? 'bg-white text-[#2563EB] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Vista dettagli e lista volontari della giornata"
          >
            <List className="w-3.5 h-3.5" />
            <span>Solo Dettagli</span>
            {(dayEvents.length > 0 || dayInterrogations.length > 0) && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-0.5" />
            )}
          </button>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          {isController && (
            <button
              onClick={() => setIsInterrogationModalOpen(true)}
              className="flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Interrogazione</span>
            </button>
          )}

          <button 
            onClick={() => setIsEventModalOpen(true)}
            className="flex items-center gap-1 bg-[#2563EB] hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isController ? 'Nuovo Evento' : 'Impegno Privato'}</span>
          </button>
        </div>

      </div>

      {/* Main Responsive Container */}
      <div className={`flex-1 flex flex-col lg:flex-row h-full ${
        viewMode === 'split' ? 'overflow-y-auto lg:overflow-hidden' : 'overflow-hidden'
      }`}>
        
        {/* PANEL 1: CALENDAR VIEW */}
        {showCalendarSection && (
          <main className={`flex-1 flex flex-col px-3 sm:px-6 py-4 lg:py-6 border-b lg:border-b-0 lg:border-r border-slate-200/80 ${
            viewMode === 'calendar' 
              ? 'w-full max-w-6xl mx-auto h-full overflow-y-auto' 
              : 'min-h-[460px] lg:h-full lg:overflow-y-auto'
          }`}>
            
            {/* Calendar Month Navigation Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight capitalize text-slate-900">
                    {format(currentDate, 'MMMM yyyy', { locale: it })}
                  </h1>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    4° Sc. A
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Verifiche, interrogazioni con volontari e impegni personali
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}
                  className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-50 transition shadow-2xs"
                >
                  Oggi
                </button>
                
                <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 shadow-2xs">
                  <button 
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-600"
                    aria-label="Mese precedente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-600"
                    aria-label="Mese successivo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter toolbar with FormSelects */}
            <div className="flex flex-wrap items-center gap-2 mb-3 py-1 text-xs shrink-0">
              <div className="w-52 sm:w-60 shrink-0">
                <FormSelect
                  value={filterType}
                  onChange={(val) => setFilterType(val as any)}
                  options={filterTypeOptions}
                  compact
                />
              </div>

              <div className="w-48 sm:w-56 shrink-0">
                <FormSelect
                  value={subjectFilter}
                  onChange={setSubjectFilter}
                  options={calendarSubjectOptions}
                  compact
                />
              </div>

              {(filterType !== 'ALL' || subjectFilter !== 'ALL') && (
                <button
                  onClick={() => { setFilterType('ALL'); setSubjectFilter('ALL'); }}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition cursor-pointer"
                >
                  Resetta filtri
                </button>
              )}
            </div>

            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1.5 text-center text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1 auto-rows-fr min-h-[350px]">
              {emptyPaddedDays.map((_, i) => (
                <div 
                  key={`empty-${i}`} 
                  className="rounded-xl sm:rounded-2xl border border-dashed border-slate-200/40 bg-slate-50/20 opacity-30" 
                />
              ))}

              {daysInMonth.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                
                let dayEvs = events.filter(e => e.date === dateStr);
                let dayInters = interrogations.filter(i => i.date === dateStr);

                if (filterType === 'VERIFICHE') {
                  dayEvs = dayEvs.filter(e => e.type === 'VERIFICA');
                  dayInters = [];
                } else if (filterType === 'INTERROGAZIONI') {
                  dayEvs = [];
                } else if (filterType === 'PERSONALI') {
                  dayEvs = dayEvs.filter(e => e.isPersonal);
                  dayInters = [];
                }

                const totalCount = dayEvs.length + dayInters.length;

                return (
                  <div 
                    key={dateStr}
                    onClick={() => onSelectDay(day)}
                    className={`p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                      isSelected 
                        ? 'border-[#2563EB] bg-blue-50/40 shadow-sm ring-2 ring-blue-500/25' 
                        : 'border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-2xs'
                    }`}
                  >
                    {/* Day number & status dots */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full transition ${
                        isToday 
                          ? 'bg-[#2563EB] text-white shadow-xs' 
                          : isSelected
                            ? 'text-blue-700 bg-blue-100 font-extrabold'
                            : 'text-slate-700'
                      }`}>
                        {format(day, 'd')}
                      </span>

                      {totalCount > 0 && (
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {dayInters.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Interrogazione" />
                          )}
                          {dayEvs.some(e => e.type === 'VERIFICA') && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Verifica" />
                          )}
                          {dayEvs.some(e => e.isPersonal) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" title="Personale" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Micro Tags */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      <div className="hidden sm:block space-y-1">
                        {dayInters.slice(0, 1).map(item => (
                          <div 
                            key={item.id} 
                            className="text-[10px] truncate px-1 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-100 flex items-center gap-1"
                          >
                            <span className="w-1 h-1 rounded-full bg-purple-600 shrink-0" />
                            <span className="truncate">{item.subject}</span>
                          </div>
                        ))}
                        {dayEvs.slice(0, 1).map(ev => (
                          <div 
                            key={ev.id} 
                            className={`text-[10px] truncate px-1 py-0.5 rounded font-medium flex items-center gap-1 ${
                              ev.type === 'VERIFICA' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-100 font-bold'
                                : ev.isPersonal 
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}
                          >
                            <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                            <span className="truncate">{ev.title}</span>
                          </div>
                        ))}
                        {totalCount > 2 && (
                          <span className="text-[9px] text-slate-400 font-bold block pl-0.5">
                            +{totalCount - 2} altri
                          </span>
                        )}
                      </div>

                      <div className="sm:hidden text-center">
                        {totalCount > 0 && (
                          <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded inline-block leading-tight">
                            {totalCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}

        {/* PANEL 2: DAY DETAILS & VOLUNTEERS */}
        {showDetailsSection && (
          <aside className={`bg-white p-4 sm:p-6 flex flex-col gap-5 shrink-0 border-slate-200/80 ${
            viewMode === 'details' 
              ? 'flex-1 max-w-4xl mx-auto w-full h-full overflow-y-auto' 
              : 'w-full lg:w-96 lg:h-full lg:overflow-y-auto lg:border-l'
          }`}>
            
            {/* Header Data */}
            <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-[#2563EB]">
                  {format(selectedDate, 'EEEE', { locale: it })}
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] mt-0.5 capitalize">
                  {format(selectedDate, 'd MMMM yyyy', { locale: it })}
                </h2>
              </div>
              
              <button
                onClick={() => setIsEventModalOpen(true)}
                className="flex items-center gap-1 text-xs text-[#2563EB] font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi</span>
              </button>
            </div>

            {/* Interrogazioni della Giornata */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  Interrogazioni & Volontari ({dayInterrogations.length})
                </h3>
                {isController && (
                  <button
                    onClick={() => setIsInterrogationModalOpen(true)}
                    className="text-[11px] font-bold text-purple-600 hover:underline"
                  >
                    + Nuova
                  </button>
                )}
              </div>

              {dayInterrogations.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                  <p className="text-xs text-slate-400">Nessuna interrogazione per questa giornata.</p>
                </div>
              ) : (
                dayInterrogations.map(inter => {
                  const isBooked = inter.volunteerIds?.includes(profile?.uid || '');
                  const isFull = inter.volunteers.length >= inter.maxVolunteers;

                  return (
                    <div key={inter.id} className="p-4 rounded-2xl border border-purple-100 bg-purple-50/30 space-y-3 transition hover:shadow-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">{inter.title}</h4>
                          <p className="text-xs text-purple-700 font-semibold mt-0.5">
                            {inter.subject} · {inter.startTime} – {inter.endTime}
                          </p>
                          {inter.teacher && (
                            <p className="text-[11px] text-slate-500 mt-0.5">Docente: {inter.teacher}</p>
                          )}
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isFull ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-[#7C3AED]'
                        }`}>
                          {inter.volunteers.length}/{inter.maxVolunteers} posti
                        </span>
                      </div>

                      {inter.notes && (
                        <p className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-xl border border-purple-100/70 leading-relaxed">
                          📖 {inter.notes}
                        </p>
                      )}

                      {/* Volunteers list */}
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Volontari registrati:
                        </p>
                        {inter.volunteers.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Nessun volontario ancora registrato.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {inter.volunteers.map(v => (
                              <span 
                                key={v.userId} 
                                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl bg-white border border-purple-100 font-medium text-slate-700 shadow-2xs"
                              >
                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                <span>{v.userName}</span>
                                {v.userId === profile?.uid && (
                                  <span className="text-[10px] text-emerald-600 font-bold">(Tu)</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Booked indicator */}
                      {isBooked && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Sei iscritto come volontario!</span>
                        </div>
                      )}

                      {/* Interactive Button */}
                      <button
                        onClick={() => handleVolunteerAction(inter.id)}
                        disabled={!isBooked && isFull}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-xs ${
                          isBooked
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                            : isFull
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              : 'bg-[#7C3AED] hover:bg-purple-700 text-white'
                        }`}
                      >
                        {isBooked ? 'Ritira disponibilità' : isFull ? 'Lista posti esaurita' : 'Voglio essere interrogato'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Eventi del Giorno */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                Eventi in programma ({dayEvents.length})
              </h3>

              {dayEvents.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                  <p className="text-xs text-slate-400">Non ci sono eventi collettivi o personali.</p>
                </div>
              ) : (
                dayEvents.map(event => (
                  <div 
                    key={event.id}
                    className={`p-3.5 rounded-2xl border flex flex-col gap-1.5 transition ${
                      event.type === 'VERIFICA' 
                        ? 'border-blue-200 bg-blue-50/30' 
                        : event.isPersonal 
                          ? 'border-slate-200 bg-slate-50/60' 
                          : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{event.title}</span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-semibold">{event.startTime} {event.endTime ? `– ${event.endTime}` : ''}</span>
                          {event.subject && <span>· {event.subject}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          event.isPersonal 
                            ? 'bg-slate-200 text-slate-700' 
                            : event.type === 'VERIFICA'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {event.isPersonal ? 'Privato' : event.type}
                        </span>

                        {(event.authorId === profile?.uid || isController || isAdmin) && (
                          <button
                            onClick={() => handleDeleteEvent(event.id, event.isPersonal, event.authorId)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                            title="Elimina evento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-white/70 p-2 rounded-lg border border-slate-100">
                        {event.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Avvisi del Giorno */}
            <div className="space-y-3 mt-auto border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-red-500" />
                Avvisi del giorno
              </h3>

              {dayNotices.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nessun avviso per oggi.</p>
              ) : (
                dayNotices.map(n => (
                  <div key={n.id} className="p-3 rounded-xl bg-red-50/40 border border-red-200/80 space-y-1">
                    <div className="flex items-center gap-1.5">
                      {n.priority === 'HIGH' && <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                      <span className="text-xs font-bold text-slate-900 leading-tight">{n.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
                  </div>
                ))
              )}
            </div>

          </aside>
        )}

      </div>

      {/* Modals */}
      <CreateEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        defaultDate={selectedDateStr}
        onCreated={() => showToast('Evento salvato!')}
      />

      <CreateInterrogationModal
        isOpen={isInterrogationModalOpen}
        onClose={() => setIsInterrogationModalOpen(false)}
        defaultDate={selectedDateStr}
        onCreated={() => showToast('Interrogazione programmata!')}
      />

    </div>
  );
};
