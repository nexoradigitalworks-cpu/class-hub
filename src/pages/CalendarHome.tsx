import React, { useState, useEffect } from 'react';
import { 
  format, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, 
  addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval 
} from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Plus, Filter, Info, AlertTriangle,
  Lock, Trash2, CheckCircle2, UserCheck, Sparkles,
  CalendarDays, Columns, LayoutGrid, List, FileText, Check,
  BookOpen, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { eventsAdapter, interrogationsAdapter, noticesAdapter, timetableAdapter } from '../services/adapters';
import { CalendarEvent, Interrogation, Notice, SubjectItem } from '../types';
import { toggleVolunteerReservation } from '../services/interrogations';
import { CreateEventModal } from '../components/CreateEventModal';
import { CreateInterrogationModal } from '../components/CreateInterrogationModal';
import { FormSelect } from '../components/ui/FormSelect';
import { SelectOption } from '../components/ui/CustomSelect';
import { formatSubjectToOption } from '../utils/dropdownPresets';

type CalendarRangeMode = 'week' | 'month';
type MobileWeekView = 'day' | 'all';

interface CalendarHomeProps {
  onOpenInterrogationsTab?: () => void;
}

export const CalendarHome: React.FC<CalendarHomeProps> = () => {
  const { profile, currentClass, isController, isAdmin } = useAuth();
  
  // Date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Range view: 'week' (Lun - Ven) as default, with option for 'month'
  const [rangeMode, setRangeMode] = useState<CalendarRangeMode>('week');
  const [mobileWeekView, setMobileWeekView] = useState<MobileWeekView>('day');
  
  // Data state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [interrogations, setInterrogations] = useState<Interrogation[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [classSubjects, setClassSubjects] = useState<SubjectItem[]>([]);
  
  // Modals & UI state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isInterrogationModalOpen, setIsInterrogationModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'EVENTI' | 'VERIFICHE' | 'INTERROGAZIONI' | 'PERSONALI'>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [modalDate, setModalDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const refreshData = async () => {
    if (!profile) return;
    const cid = profile.classId || '';
    try {
      const [evs, ints, nots, subs] = await Promise.all([
        eventsAdapter.getEvents(cid, profile.uid),
        interrogationsAdapter.getInterrogations(cid),
        noticesAdapter.getNotices(cid),
        timetableAdapter.getSubjects(cid)
      ]);
      setEvents(evs);
      setInterrogations(ints);
      setNotices(nots);
      setClassSubjects(subs);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    refreshData();
  }, [profile]);

  // Week calculation (Monday - Friday: 5 days)
  const weekStartMonday = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = [0, 1, 2, 3, 4].map(offset => addDays(weekStartMonday, offset));
  const weekFriday = weekDays[4];

  // Month calculation (for month view fallback)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (monthStart.getDay() + 6) % 7;
  const emptyPaddedDays = Array.from({ length: startDayOfWeek });

  // Navigation handlers
  const handlePrev = () => {
    if (rangeMode === 'week') {
      const newDate = subWeeks(currentDate, 1);
      setCurrentDate(newDate);
      setSelectedDate(subWeeks(selectedDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (rangeMode === 'week') {
      const newDate = addWeeks(currentDate, 1);
      setCurrentDate(newDate);
      setSelectedDate(addWeeks(selectedDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Helper filters
  const filterTypeOptions: SelectOption[] = [
    { value: 'ALL', label: 'Tutti gli impegni', icon: <Filter className="w-3.5 h-3.5 text-slate-500" /> },
    { value: 'EVENTI', label: 'Assemblee, Uscite & Eventi', icon: <Sparkles className="w-3.5 h-3.5 text-emerald-600" />, badge: 'Evento', badgeClass: 'bg-emerald-100 text-emerald-700' },
    { value: 'VERIFICHE', label: 'Verifiche Scritte', icon: <FileText className="w-3.5 h-3.5 text-blue-600" />, badge: 'Scritto', badgeClass: 'bg-blue-100 text-blue-700' },
    { value: 'INTERROGAZIONI', label: 'Interrogazioni & Volontari', icon: <Clock className="w-3.5 h-3.5 text-purple-600" />, badge: 'Orale', badgeClass: 'bg-purple-100 text-purple-700' },
    { value: 'PERSONALI', label: 'Impegni Personali', icon: <Lock className="w-3.5 h-3.5 text-slate-600" />, badge: 'Privato', badgeClass: 'bg-slate-100 text-slate-700' }
  ];

  const calendarSubjectOptions: SelectOption[] = [
    { value: 'ALL', label: 'Tutte le materie', icon: <Filter className="w-3.5 h-3.5 text-slate-400" /> },
    ...classSubjects.map(formatSubjectToOption)
  ];

  // Detect special collective events (Assemblea, Uscita, Gita, Eventi di classe/istituto)
  const isSpecialEvent = (e: CalendarEvent) => {
    return e.type === 'EVENTO' || 
      (!e.isPersonal && e.type !== 'VERIFICA') || 
      /assemblea|uscita|visita|gita|viaggio|pcto|evento|torneo|collettiv|straordinari|progetto|festa|vacanz|ponte|sciopero|orientamento/i.test(e.title || '') ||
      /assemblea|uscita|visita|gita|viaggio|pcto|evento|torneo|orientamento/i.test(e.subject || '');
  };

  // Helper to get events for a specific day
  const getDayItems = (day: Date) => {
    const dStr = format(day, 'yyyy-MM-dd');
    let evs = events.filter(e => {
      if (e.date !== dStr) return false;
      if (subjectFilter !== 'ALL' && e.subject && !e.subject.includes(subjectFilter)) return false;
      if (filterType === 'EVENTI' && !isSpecialEvent(e)) return false;
      if (filterType === 'VERIFICHE' && e.type !== 'VERIFICA') return false;
      if (filterType === 'INTERROGAZIONI') return false;
      if (filterType === 'PERSONALI' && !e.isPersonal) return false;
      return true;
    });

    let ints = interrogations.filter(i => {
      if (i.date !== dStr) return false;
      if (subjectFilter !== 'ALL' && i.subject !== subjectFilter) return false;
      if (filterType === 'EVENTI' || filterType === 'VERIFICHE' || filterType === 'PERSONALI') return false;
      return true;
    });

    const nots = notices.filter(n => n.date === dStr);
    const hasSpecialEvents = evs.some(isSpecialEvent);
    const hasVerifiche = evs.some(e => e.type === 'VERIFICA');
    const hasInterrogazioni = ints.length > 0;
    const hasPersonal = evs.some(e => e.isPersonal);

    return { 
      events: evs, 
      interrogations: ints, 
      notices: nots, 
      total: evs.length + ints.length,
      hasSpecialEvents,
      hasVerifiche,
      hasInterrogazioni,
      hasPersonal
    };
  };

  const handleVolunteerAction = async (interrogationId: string) => {
    if (!profile) return;
    try {
      const res = await toggleVolunteerReservation(profile.classId || '', interrogationId, {
        uid: profile.uid,
        name: `${profile.firstName} ${profile.lastName[0]}.`,
        avatarId: profile.avatarId
      });
      showToast(res.message);
      refreshData();
    } catch (err: any) {
      showToast(err.message || "Impossibile completare l'operazione.");
    }
  };

  const handleDeleteEvent = async (eventId: string, isPersonal: boolean, authorId: string) => {
    if (isPersonal && authorId !== profile?.uid) {
      showToast('Non puoi eliminare un evento personale altrui');
      return;
    }
    if (!isPersonal && !isController && !isAdmin) {
      showToast('Solo il Controller o l\'Admin possono eliminare eventi di classe');
      return;
    }
    try {
      await eventsAdapter.deleteEvent(eventId);
      showToast('Evento rimosso con successo');
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Errore nella rimozione dell\'evento');
    }
  };

  const openNewEvent = (dayDate?: Date) => {
    setModalDate(format(dayDate || selectedDate, 'yyyy-MM-dd'));
    setIsEventModalOpen(true);
  };

  const openNewInterrogation = (dayDate?: Date) => {
    setModalDate(format(dayDate || selectedDate, 'yyyy-MM-dd'));
    setIsInterrogationModalOpen(true);
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayData = getDayItems(selectedDate);

  // Format header title based on view mode
  const getHeaderTitle = () => {
    if (rangeMode === 'week') {
      const monStr = format(weekStartMonday, 'd MMM', { locale: it });
      const friStr = format(weekFriday, 'd MMM yyyy', { locale: it });
      return `${monStr} – ${friStr}`;
    }
    return format(currentDate, 'MMMM yyyy', { locale: it });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
      
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

      {/* Top Bar: View Mode switcher & quick actions (side-by-side on all screens) */}
      <div className="bg-white border-b border-slate-200/90 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-3 shrink-0">
        
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100/90 p-0.5 sm:p-1 rounded-xl text-xs font-bold shrink-0">
          <button
            onClick={() => setRangeMode('week')}
            className={`px-2 sm:px-3 py-1.5 rounded-lg transition flex items-center gap-1 sm:gap-1.5 cursor-pointer text-xs ${
              rangeMode === 'week'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Vista Settimana (Lun-Ven)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settimana (Lun-Ven)</span>
            <span className="sm:hidden">Settimana</span>
          </button>

          <button
            onClick={() => setRangeMode('month')}
            className={`px-2 sm:px-3 py-1.5 rounded-lg transition flex items-center gap-1 sm:gap-1.5 cursor-pointer text-xs ${
              rangeMode === 'month'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Vista Mese"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Mese</span>
          </button>
        </div>

        {/* Right: Quick action buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          {isController && (
            <button
              onClick={() => openNewInterrogation()}
              className="flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95 shrink-0"
              title="Nuova interrogazione programmata"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Interrogazione</span>
              <span className="sm:hidden">+ Interr.</span>
            </button>
          )}

          <button 
            onClick={() => openNewEvent()}
            className="flex items-center gap-1 bg-[#2563EB] hover:bg-blue-700 text-white px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title={isController ? 'Nuovo Evento' : 'Nuovo Impegno Privato'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isController ? 'Nuovo Evento' : 'Impegno Privato'}</span>
            <span className="sm:hidden">{isController ? 'Evento' : 'Impegno'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Navigation & Filters Sub-header */}
        <div className="px-3 sm:px-6 pt-3 pb-2 bg-white/60 border-b border-slate-200/60 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Welcome Greeting & Range Title */}
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-blue-600">
                {profile?.firstName ? `Ciao, ${profile.firstName}!` : 'Ciao!'}
              </span>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight capitalize text-slate-900 leading-tight mt-0.5">
                {getHeaderTitle()}
              </h1>
            </div>

            {/* Navigation Buttons: Oggi + Chevrons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleGoToday}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition cursor-pointer active:scale-95"
              >
                Oggi
              </button>
              
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
                <button 
                  onClick={handlePrev}
                  className="p-1.5 hover:bg-white rounded-md transition text-slate-600 hover:text-slate-900 shadow-2xs cursor-pointer active:scale-95"
                  aria-label="Precedente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleNext}
                  className="p-1.5 hover:bg-white rounded-md transition text-slate-600 hover:text-slate-900 shadow-2xs cursor-pointer active:scale-95"
                  aria-label="Successivo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-slate-100">
            <div className="w-40 sm:w-48 shrink-0">
              <FormSelect
                value={filterType}
                onChange={(val) => setFilterType(val as any)}
                options={filterTypeOptions}
                compact
              />
            </div>

            <div className="w-36 sm:w-44 shrink-0">
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
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                Resetta filtri
              </button>
            )}

            {/* Mobile-only view toggle in Week Mode */}
            {rangeMode === 'week' && (
              <div className="flex sm:hidden ml-auto items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  onClick={() => setMobileWeekView('day')}
                  className={`px-2 py-0.5 rounded transition ${mobileWeekView === 'day' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                >
                  Giorno
                </button>
                <button
                  onClick={() => setMobileWeekView('all')}
                  className={`px-2 py-0.5 rounded transition ${mobileWeekView === 'all' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                >
                  Tutti (5g)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* -------------------- WEEK VIEW (LUNEDÌ - VENERDÌ) -------------------- */}
        {rangeMode === 'week' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Mobile Week Strip (Monday to Friday Selector) */}
            <div className="sm:hidden px-3 py-2 bg-white border-b border-slate-200/80 shrink-0">
              <div className="grid grid-cols-5 gap-1.5">
                {weekDays.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const dayData = getDayItems(day);
                  const hasSpecialEvents = dayData.hasSpecialEvents;
                  const hasVerifiche = dayData.hasVerifiche;
                  const hasInterrogazioni = dayData.hasInterrogazioni;
                  const hasPersonal = dayData.hasPersonal;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        setSelectedDate(day);
                        setMobileWeekView('day');
                      }}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl transition border cursor-pointer select-none ${
                        isSelected 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                          : isToday 
                            ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                            : hasSpecialEvents
                              ? 'bg-gradient-to-b from-emerald-50 to-white text-emerald-900 border-emerald-300 ring-1 ring-emerald-300/60 shadow-[0_0_8px_rgba(16,185,129,0.18)]'
                              : 'bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`text-[10px] uppercase font-bold tracking-tight ${isSelected ? 'text-blue-100' : hasSpecialEvents ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}`}>
                        {format(day, 'EEE', { locale: it })}
                      </span>
                      <span className="text-sm font-black mt-0.5">
                        {format(day, 'd')}
                      </span>

                      {/* Dots indicator */}
                      <div className="flex items-center gap-0.5 mt-1 h-1.5">
                        {hasSpecialEvents && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                        )}
                        {hasVerifiche && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-blue-600'}`} />
                        )}
                        {hasInterrogazioni && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-purple-200' : 'bg-purple-600'}`} />
                        )}
                        {hasPersonal && !hasVerifiche && !hasInterrogazioni && !hasSpecialEvents && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-400'}`} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop / Tablet: 5-Column Week Planner Grid (Lunedì - Venerdì) */}
            <div className="hidden sm:grid sm:grid-cols-5 gap-3 p-4 lg:p-6 flex-1 overflow-y-auto min-h-0 bg-[#F8FAFC]">
              {weekDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const dayData = getDayItems(day);
                const hasSpecialEvents = dayData.hasSpecialEvents;

                return (
                  <div 
                    key={dateStr}
                    onClick={() => setSelectedDate(day)}
                    className={`flex flex-col h-full rounded-2xl border transition-all duration-150 select-none ${
                      isSelected
                        ? hasSpecialEvents
                          ? 'border-blue-500 bg-gradient-to-b from-emerald-50/30 via-white to-white ring-2 ring-blue-500/20 shadow-[0_0_16px_rgba(16,185,129,0.2)]'
                          : 'border-blue-500 bg-white ring-2 ring-blue-500/20 shadow-md'
                        : isToday
                          ? hasSpecialEvents
                            ? 'border-emerald-300 bg-gradient-to-b from-emerald-50/50 via-white to-white ring-1 ring-emerald-300/60 shadow-[0_0_14px_rgba(16,185,129,0.16)]'
                            : 'border-blue-200 bg-white/90 shadow-2xs'
                          : hasSpecialEvents
                            ? 'border-emerald-200/90 bg-gradient-to-b from-emerald-50/20 via-white to-white ring-1 ring-emerald-200/60 shadow-[0_0_12px_rgba(16,185,129,0.14)] hover:border-emerald-300 hover:shadow-[0_0_16px_rgba(16,185,129,0.22)]'
                            : 'border-slate-200/90 bg-white/70 hover:bg-white hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    {/* Day Column Header */}
                    <div className={`p-3 border-b flex items-center justify-between rounded-t-2xl ${
                      hasSpecialEvents
                        ? 'bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border-emerald-100'
                        : isToday 
                          ? 'bg-blue-50/70 border-blue-100' 
                          : isSelected 
                            ? 'bg-blue-50/40 border-blue-100' 
                            : 'bg-slate-50/50 border-slate-100'
                    }`}>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                            {format(day, 'EEEE', { locale: it })}
                          </span>
                          {isToday && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-blue-600 text-white rounded-full">
                              Oggi
                            </span>
                          )}
                          {hasSpecialEvents && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-full flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> Evento
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          {format(day, 'd MMMM', { locale: it })}
                        </p>
                      </div>

                      {/* Quick Add Button per day */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openNewEvent(day);
                        }}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-700 flex items-center justify-center transition cursor-pointer"
                        title="Aggiungi impegno in questo giorno"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Day Cards List Container */}
                    <div className="p-2.5 flex-1 overflow-y-auto space-y-2 max-h-[calc(100vh-280px)]">
                      {dayData.total === 0 && (
                        <div className="h-28 rounded-xl border border-dashed border-slate-200/80 flex flex-col items-center justify-center text-center p-2 text-slate-400">
                          <span className="text-[11px]">Nessun impegno</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openNewEvent(day);
                            }}
                            className="mt-1 text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            + Aggiungi
                          </button>
                        </div>
                      )}

                      {/* Interrogazioni & Volontari Cards */}
                      {dayData.interrogations.map(inter => {
                        const isBooked = Boolean(inter.volunteerIds?.includes(profile?.uid || '') || inter.volunteers?.some(v => v.userId === profile?.uid));
                        const isFull = (inter.volunteers?.length || 0) >= inter.maxVolunteers;

                        return (
                          <div 
                            key={inter.id}
                            className="p-2.5 rounded-xl border border-purple-200/90 bg-purple-50/50 hover:bg-purple-50 transition space-y-1.5 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                                {inter.subject}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                isFull ? 'bg-rose-100 text-rose-700' : 'bg-purple-200/80 text-purple-900'
                              }`}>
                                {inter.volunteers.length}/{inter.maxVolunteers}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                              {inter.title}
                            </p>

                            <div className="flex items-center gap-1 text-[10px] text-purple-700 font-semibold">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{inter.startTime} – {inter.endTime}</span>
                            </div>

                            {/* Volunteers mini avatars */}
                            {inter.volunteers.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1 border-t border-purple-100/60">
                                {inter.volunteers.map(v => (
                                  <span 
                                    key={v.userId} 
                                    className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-white border border-purple-100 text-slate-700 flex items-center gap-1"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                                    {v.userName}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Volunteer Quick Toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVolunteerAction(inter.id);
                              }}
                              disabled={!isBooked && isFull}
                              className={`w-full mt-1 py-1 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                isBooked
                                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                  : isFull
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                              }`}
                            >
                              {isBooked ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Iscritto (Ritira)</span>
                                </>
                              ) : isFull ? (
                                <span>Posti esauriti</span>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3" />
                                  <span>Offriti volontario</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}

                      {/* Verifiche & Events Cards */}
                      {dayData.events.map(ev => {
                        const isVerifica = ev.type === 'VERIFICA';
                        const isSpecial = isSpecialEvent(ev);

                        return (
                          <div 
                            key={ev.id}
                            className={`p-2.5 rounded-xl border transition space-y-1.5 shadow-2xs ${
                              isSpecial
                                ? 'border-emerald-200/90 bg-gradient-to-r from-emerald-50/80 to-teal-50/40 ring-1 ring-emerald-200/60 hover:bg-emerald-50'
                                : isVerifica
                                  ? 'border-blue-200/90 bg-blue-50/50 hover:bg-blue-50'
                                  : ev.isPersonal
                                    ? 'border-slate-200 bg-slate-50/80 hover:bg-slate-100'
                                    : 'border-emerald-200/90 bg-emerald-50/40 hover:bg-emerald-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className={`text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                isSpecial
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : isVerifica
                                    ? 'bg-blue-100 text-blue-800'
                                    : ev.isPersonal
                                      ? 'bg-slate-200 text-slate-700'
                                      : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isSpecial && <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />}
                                {ev.subject || (ev.isPersonal ? 'Personale' : isSpecial ? 'Evento' : 'Attività')}
                              </span>

                              <div className="flex items-center gap-0.5">
                                {(ev.authorId === profile?.uid || isController || isAdmin) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEvent(ev.id, ev.isPersonal, ev.authorId);
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                                    title="Elimina"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                              {ev.title}
                            </p>

                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{ev.startTime} {ev.endTime ? `– ${ev.endTime}` : ''}</span>
                            </div>

                            {ev.description && (
                              <p className="text-[10px] text-slate-600 line-clamp-2 bg-white/70 p-1.5 rounded border border-slate-100">
                                {ev.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile View: Dedicated Day Details or Full 5-Day Stack (with generous pb-32 so it is NEVER covered!) */}
            <div className="sm:hidden flex-1 overflow-y-auto px-3 pt-3 pb-32 bg-[#F8FAFC]">
              
              {mobileWeekView === 'day' ? (
                /* Focused Single Day View on Mobile */
                <div className="space-y-4">
                  {/* Selected day header */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-600">
                        {format(selectedDate, 'EEEE', { locale: it })}
                      </span>
                      <h2 className="text-lg font-black text-slate-900 capitalize">
                        {format(selectedDate, 'd MMMM yyyy', { locale: it })}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isController && (
                        <button
                          onClick={() => openNewInterrogation(selectedDate)}
                          className="px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-700 rounded-xl border border-purple-200 cursor-pointer"
                        >
                          + Interr.
                        </button>
                      )}
                      <button
                        onClick={() => openNewEvent(selectedDate)}
                        className="px-2.5 py-1 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-xs cursor-pointer"
                      >
                        + Impegno
                      </button>
                    </div>
                  </div>

                  {/* Interrogazioni & Volontari */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        Interrogazioni ({selectedDayData.interrogations.length})
                      </span>
                    </div>

                    {selectedDayData.interrogations.length === 0 ? (
                      <div className="p-3 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        Nessuna interrogazione programmata per oggi.
                      </div>
                    ) : (
                      selectedDayData.interrogations.map(inter => {
                        const isBooked = Boolean(inter.volunteerIds?.includes(profile?.uid || '') || inter.volunteers?.some(v => v.userId === profile?.uid));
                        const isFull = (inter.volunteers?.length || 0) >= inter.maxVolunteers;

                        return (
                          <div key={inter.id} className="p-3.5 bg-white rounded-2xl border border-purple-100 shadow-2xs space-y-2.5">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                                  {inter.subject}
                                </span>
                                <h3 className="text-sm font-black text-slate-900 mt-1">{inter.title}</h3>
                                <p className="text-xs text-purple-700 font-semibold">{inter.startTime} – {inter.endTime}</p>
                              </div>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                isFull ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {inter.volunteers.length}/{inter.maxVolunteers} posti
                              </span>
                            </div>

                            {inter.notes && (
                              <p className="text-xs text-slate-600 bg-purple-50/50 p-2 rounded-xl border border-purple-100/60">
                                {inter.notes}
                              </p>
                            )}

                            {/* Volunteers */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Volontari:</span>
                              {inter.volunteers.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">Nessun volontario ancora iscritto.</p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {inter.volunteers.map(v => (
                                    <span key={v.userId} className="text-xs px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                                      {v.userName}
                                      {v.userId === profile?.uid && <span className="text-emerald-600 font-bold">(Tu)</span>}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            <button
                              onClick={() => handleVolunteerAction(inter.id)}
                              disabled={!isBooked && isFull}
                              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                isBooked
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : isFull
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-purple-600 text-white shadow-xs'
                              }`}
                            >
                              {isBooked ? 'Ritira iscrizione' : isFull ? 'Posti esauriti' : 'Voglio essere interrogato'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Verifiche & Events */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                      Verifiche & Impegni ({selectedDayData.events.length})
                    </span>

                    {selectedDayData.events.length === 0 ? (
                      <div className="p-3 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        Nessun evento o verifica per questa giornata.
                      </div>
                    ) : (
                      selectedDayData.events.map(ev => {
                        const isVerifica = ev.type === 'VERIFICA';
                        const isSpecial = isSpecialEvent(ev);

                        return (
                          <div 
                            key={ev.id} 
                            className={`p-3.5 rounded-2xl border space-y-1.5 shadow-2xs ${
                              isSpecial
                                ? 'bg-gradient-to-r from-emerald-50/80 to-teal-50/40 border-emerald-200/90 ring-1 ring-emerald-200/60'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                    isSpecial
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : isVerifica
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {isSpecial && <Sparkles className="w-3 h-3 text-emerald-600" />}
                                    {ev.subject || (isSpecial ? 'Assemblea / Uscita' : isVerifica ? 'Verifica' : ev.isPersonal ? 'Privato' : 'Evento')}
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 mt-1">{ev.title}</h3>
                                <p className="text-xs text-slate-500">{ev.startTime} {ev.endTime ? `– ${ev.endTime}` : ''}</p>
                              </div>

                              {(ev.authorId === profile?.uid || isController || isAdmin) && (
                                <button
                                  onClick={() => handleDeleteEvent(ev.id, ev.isPersonal, ev.authorId)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {ev.description && (
                              <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                {ev.description}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* Full 5-Days Stack on Mobile */
                <div className="space-y-4">
                  {weekDays.map((day) => {
                    const dayData = getDayItems(day);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <div 
                        key={day.toISOString()}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
                      >
                        <div className={`p-3 border-b flex items-center justify-between ${
                          isToday ? 'bg-blue-50/80 border-blue-100' : 'bg-slate-50/70 border-slate-100'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 uppercase">
                              {format(day, 'EEEE d MMM', { locale: it })}
                            </span>
                            {isToday && (
                              <span className="text-[10px] font-bold px-1.5 bg-blue-600 text-white rounded-full">
                                Oggi
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => openNewEvent(day)}
                            className="text-[11px] font-bold text-blue-600 flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Aggiungi
                          </button>
                        </div>

                        <div className="p-3 space-y-2">
                          {dayData.total === 0 ? (
                            <p className="text-xs text-slate-400 italic py-1">Nessun impegno in programma.</p>
                          ) : (
                            <>
                              {dayData.interrogations.map(inter => (
                                <div key={inter.id} className="p-2.5 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center justify-between gap-2">
                                  <div>
                                    <span className="text-[10px] font-extrabold text-purple-800 bg-purple-100 px-1.5 py-0.2 rounded">
                                      {inter.subject}
                                    </span>
                                    <p className="text-xs font-bold text-slate-900 mt-0.5">{inter.title}</p>
                                    <p className="text-[10px] text-purple-700">{inter.startTime} – {inter.endTime}</p>
                                  </div>
                                  <button
                                    onClick={() => handleVolunteerAction(inter.id)}
                                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-purple-600 text-white cursor-pointer"
                                  >
                                    Volontari ({inter.volunteers.length}/{inter.maxVolunteers})
                                  </button>
                                </div>
                              ))}

                              {dayData.events.map(ev => (
                                <div key={ev.id} className="p-2.5 bg-blue-50/30 rounded-xl border border-blue-100 flex items-center justify-between gap-2">
                                  <div>
                                    <span className="text-[10px] font-extrabold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded">
                                      {ev.subject || (ev.isPersonal ? 'Privato' : 'Verifica')}
                                    </span>
                                    <p className="text-xs font-bold text-slate-900 mt-0.5">{ev.title}</p>
                                    <p className="text-[10px] text-slate-500">{ev.startTime}</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedDate(day);
                                      setMobileWeekView('day');
                                    }}
                                    className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                                  >
                                    Dettagli →
                                  </button>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* -------------------- MONTH VIEW (CALENDARIO COMPLETO) -------------------- */}
        {rangeMode === 'month' && (
          <div className="flex-1 flex flex-col p-3 sm:p-6 overflow-y-auto pb-32 lg:pb-8 space-y-4">
            
            {/* Month Calendar Card Container */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-5 flex flex-col">
              {/* Weekdays header */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[11px] sm:text-xs font-black text-slate-400 uppercase tracking-wider shrink-0">
                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 w-full">
                {emptyPaddedDays.map((_, i) => (
                  <div 
                    key={`empty-${i}`} 
                    className="min-w-0 aspect-square sm:aspect-auto sm:h-20 lg:h-24 rounded-xl sm:rounded-2xl border border-dashed border-slate-100 bg-slate-50/30 opacity-30 pointer-events-none" 
                  />
                ))}

                {daysInMonth.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDate);
                  const dayData = getDayItems(day);
                  const hasSpecialEvents = dayData.hasSpecialEvents;
                  const hasVerifiche = dayData.hasVerifiche;
                  const hasInterrogazioni = dayData.hasInterrogazioni;
                  const hasPersonal = dayData.hasPersonal;

                  return (
                    <div 
                      key={dateStr}
                      onClick={() => {
                        setSelectedDate(day);
                        setCurrentDate(day);
                      }}
                      className={`min-w-0 p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center select-none aspect-square sm:aspect-auto sm:h-20 lg:h-24 ${
                        isSelected 
                          ? hasSpecialEvents
                            ? 'border-blue-600 bg-gradient-to-br from-emerald-50/70 via-blue-50/50 to-white shadow-[0_0_16px_rgba(16,185,129,0.3)] ring-2 ring-blue-500/40'
                            : 'border-blue-600 bg-blue-50/60 shadow-sm ring-2 ring-blue-500/25' 
                          : isToday
                            ? hasSpecialEvents
                              ? 'border-emerald-400 bg-gradient-to-br from-emerald-50/80 via-blue-50/20 to-white ring-2 ring-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.25)]'
                              : 'border-blue-300 bg-blue-50/20 ring-1 ring-blue-200/80 shadow-2xs'
                            : hasSpecialEvents
                              ? 'border-emerald-300/90 bg-gradient-to-br from-emerald-50/50 via-teal-50/20 to-white ring-1 ring-emerald-300/60 shadow-[0_0_12px_rgba(16,185,129,0.18)] hover:border-emerald-400 hover:shadow-[0_0_16px_rgba(16,185,129,0.28)]'
                              : 'border-slate-200/80 bg-white hover:border-blue-300 hover:bg-slate-50/50 hover:shadow-2xs'
                      }`}
                    >
                      {/* Day Number */}
                      <span className={`text-xs sm:text-sm font-black w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition shrink-0 ${
                        isToday 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : isSelected
                            ? 'text-blue-700 bg-blue-100 font-black'
                            : hasSpecialEvents
                              ? 'text-emerald-950 font-black'
                              : 'text-slate-800'
                      }`}>
                        {format(day, 'd')}
                      </span>

                      {/* Clean Indicator Dots inside the Day Box */}
                      <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-1 sm:mt-1.5 min-h-[6px] sm:min-h-[8px]">
                        {hasSpecialEvents && (
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 ring-1 ring-emerald-300 shadow-2xs shrink-0" title="Assemblea, Uscita o Evento" />
                        )}
                        {hasVerifiche && (
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-600 shadow-2xs shrink-0" title="Verifica scritta" />
                        )}
                        {hasInterrogazioni && (
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-600 shadow-2xs shrink-0" title="Interrogazione" />
                        )}
                        {hasPersonal && !hasVerifiche && !hasInterrogazioni && !hasSpecialEvents && (
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-400 shadow-2xs shrink-0" title="Impegno personale" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected day full summary below month grid */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                    {format(selectedDate, 'EEEE', { locale: it })}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 capitalize">
                    {format(selectedDate, 'd MMMM yyyy', { locale: it })}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {isController && (
                    <button
                      onClick={() => openNewInterrogation(selectedDate)}
                      className="px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl transition cursor-pointer"
                    >
                      + Interrogazione
                    </button>
                  )}
                  <button
                    onClick={() => openNewEvent(selectedDate)}
                    className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                  >
                    + Impegno
                  </button>
                </div>
              </div>

              {/* Day Items Detailed Cards */}
              <div className="space-y-3">
                {selectedDayData.total === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Nessun impegno programmato per {format(selectedDate, 'd MMMM', { locale: it })}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Interrogazioni */}
                    {selectedDayData.interrogations.map(inter => {
                      const isBooked = Boolean(inter.volunteerIds?.includes(profile?.uid || '') || inter.volunteers?.some(v => v.userId === profile?.uid));
                      const isFull = (inter.volunteers?.length || 0) >= inter.maxVolunteers;

                      return (
                        <div key={inter.id} className="p-3.5 bg-purple-50/40 rounded-xl border border-purple-100 flex flex-col justify-between gap-2.5">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                                {inter.subject}
                              </span>
                              <span className="text-xs font-bold text-purple-700">
                                {inter.volunteers.length}/{inter.maxVolunteers} posti
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">{inter.title}</h4>
                            <p className="text-xs text-purple-700 font-medium">{inter.startTime} – {inter.endTime}</p>
                          </div>

                          <button
                            onClick={() => handleVolunteerAction(inter.id)}
                            disabled={!isBooked && isFull}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              isBooked
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                : isFull
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                          >
                            {isBooked ? 'Ritira iscrizione' : isFull ? 'Posti esauriti' : 'Offriti volontario'}
                          </button>
                        </div>
                      );
                    })}

                    {/* Verifiche & Events */}
                    {selectedDayData.events.map(ev => {
                      const isVerifica = ev.type === 'VERIFICA';
                      const isSpecial = isSpecialEvent(ev);

                      return (
                        <div 
                          key={ev.id} 
                          className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                            isSpecial
                              ? 'bg-gradient-to-r from-emerald-50/80 to-teal-50/40 border-emerald-200/90 ring-1 ring-emerald-200/60'
                              : isVerifica 
                                ? 'bg-blue-50/40 border-blue-100' 
                                : 'bg-slate-50 border-slate-200/80'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded flex items-center gap-1 ${
                                isSpecial
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : isVerifica
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-200 text-slate-700'
                              }`}>
                                {isSpecial && <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />}
                                {ev.subject || (ev.isPersonal ? 'Personale' : isSpecial ? 'Evento' : 'Attività')}
                              </span>
                              {(ev.authorId === profile?.uid || isController || isAdmin) && (
                                <button
                                  onClick={() => handleDeleteEvent(ev.id, ev.isPersonal, ev.authorId)}
                                  className="text-slate-400 hover:text-red-500 transition cursor-pointer"
                                  title="Elimina"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">{ev.title}</h4>
                            <p className="text-xs text-slate-500 font-medium">{ev.startTime} {ev.endTime ? `– ${ev.endTime}` : ''}</p>
                            {ev.description && (
                              <p className="text-xs text-slate-600 bg-white p-1.5 rounded border border-slate-100">
                                {ev.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Modals */}
      <CreateEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        defaultDate={modalDate}
        onCreated={() => showToast('Evento salvato!')}
      />

      <CreateInterrogationModal
        isOpen={isInterrogationModalOpen}
        onClose={() => setIsInterrogationModalOpen(false)}
        defaultDate={modalDate}
        onCreated={() => showToast('Interrogazione programmata!')}
      />

    </div>
  );
};
