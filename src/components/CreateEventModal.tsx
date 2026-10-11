import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventsAdapter, timetableAdapter } from '../services/adapters';
import { X, Lock, Users, AlertCircle, Edit3 } from 'lucide-react';
import { ActivityTypeCategory, CalendarEvent, SubjectItem } from '../types';
import { FormSelect } from './ui/FormSelect';
import { PersonalEventSelect, PERSONAL_CATEGORIES } from './ui/PersonalEventSelect';
import { EVENT_TYPE_OPTIONS, formatSubjectToOption } from '../utils/dropdownPresets';
import { SelectOption } from './ui/CustomSelect';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  onCreated?: () => void;
  eventToEdit?: CalendarEvent | null;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  onCreated,
  eventToEdit
}) => {
  const { profile, isController, isAdmin, activeClassId, currentClass } = useAuth();
  const canCreateClassEvent = isController || isAdmin;

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [subject, setSubject] = useState('Matematica');
  const [type, setType] = useState<ActivityTypeCategory>('VERIFICA');
  const [isPersonal, setIsPersonal] = useState(!canCreateClassEvent);
  const [personalCategory, setPersonalCategory] = useState('STUDIO');
  const [teacher, setTeacher] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      timetableAdapter.getSubjects(profile?.classId || '').then((classSubs) => {
        setSubjects(classSubs);
        if (!eventToEdit && classSubs.length > 0 && !classSubs.some(s => s.name === subject)) {
          setSubject(classSubs[0].name);
        }
      });
    }
  }, [isOpen, profile?.classId]);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setDate(eventToEdit.date || defaultDate || new Date().toISOString().split('T')[0]);
      setStartTime(eventToEdit.startTime || '09:00');
      setEndTime(eventToEdit.endTime || '10:00');
      setSubject(eventToEdit.subject || 'Matematica');
      setType((eventToEdit.type as ActivityTypeCategory) || 'VERIFICA');
      setIsPersonal(Boolean(eventToEdit.isPersonal));
      setTeacher(eventToEdit.teacher || '');
      setDescription(eventToEdit.description || '');
      setError(null);
    } else {
      setTitle('');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('10:00');
      setIsPersonal(!canCreateClassEvent);
      setTeacher('');
      setDescription('');
      setError(null);
    }
  }, [eventToEdit, isOpen, defaultDate, canCreateClassEvent]);

  if (!isOpen || !profile) return null;

  const handleSelectPreset = (presetTitle: string, durationMinutes: number) => {
    setTitle(presetTitle);
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const totalStartMin = sh * 60 + sm;
      const totalEndMin = totalStartMin + durationMinutes;
      const eh = Math.min(23, Math.floor(totalEndMin / 60));
      const em = totalEndMin % 60;
      setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
    } catch {
      // Keep default
    }
  };

  const handleSubjectChange = (val: string) => {
    setSubject(val);
    const matched = subjects.find(s => s.name === val);
    if (matched?.defaultTeacher && !teacher) {
      setTeacher(matched.defaultTeacher);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !date) {
      setError('Compila il titolo e la data.');
      return;
    }

    const enforcedPersonal = canCreateClassEvent ? isPersonal : true;

    try {
      setSubmitting(true);
      if (eventToEdit) {
        await eventsAdapter.updateEvent(eventToEdit.id, {
          title: title.trim(),
          subject: enforcedPersonal ? `Personale (${PERSONAL_CATEGORIES.find(c => c.value === personalCategory)?.label || 'Impegno'})` : subject,
          type: enforcedPersonal ? 'PERSONALE' : type,
          date,
          startTime,
          endTime,
          teacher: enforcedPersonal ? undefined : (teacher || undefined),
          description: description || undefined
        });
      } else {
        await eventsAdapter.addEvent({
          title: title.trim(),
          subject: enforcedPersonal ? `Personale (${PERSONAL_CATEGORIES.find(c => c.value === personalCategory)?.label || 'Impegno'})` : subject,
          type: enforcedPersonal ? 'PERSONALE' : type,
          date,
          startTime,
          endTime,
          teacher: enforcedPersonal ? undefined : (teacher || undefined),
          description: description || undefined,
          isPersonal: enforcedPersonal,
          authorId: profile.uid,
          authorName: `${profile.firstName} ${profile.lastName}`,
          classId: enforcedPersonal ? undefined : (activeClassId || profile.classId || profile.activeClassId || currentClass?.id || 'cls-dev-test')
        });
      }

      onCreated?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio dell\'evento.');
    } finally {
      setSubmitting(false);
    }
  };

  const subjectOptions: SelectOption[] = subjects.map(formatSubjectToOption);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              {eventToEdit ? (
                <>
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  <span>Modifica Impegno</span>
                </>
              ) : !canCreateClassEvent || isPersonal ? (
                <span>Nuovo Impegno Personale</span>
              ) : (
                <span>Crea Evento di Classe</span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {!canCreateClassEvent || isPersonal
                ? 'Visibile solo a te. I compagni e gli admin non potranno vederlo.'
                : 'Visibile all\'intera classe nel calendario collettivo.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Role selector toggle for Controller/Admin */}
          {canCreateClassEvent && !eventToEdit && (
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setIsPersonal(false)}
                className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isPersonal
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Evento di Classe</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPersonal(true)}
                className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isPersonal
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Solo Personale</span>
              </button>
            </div>
          )}

          {/* Quick presets for Personal Activity */}
          {isPersonal && (
            <div>
              <PersonalEventSelect
                value={personalCategory}
                onChange={setPersonalCategory}
                onSelectPreset={handleSelectPreset}
              />
            </div>
          )}

          {/* Titolo Attività */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Titolo dell'Attività <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              placeholder={isPersonal ? "Es. Ripasso per verifica di Matematica..." : "Es. Verifica scritta di Storia dell'Arte..."}
            />
          </div>

          {/* Sezione Collettiva: Materia e Tipologia */}
          {!isPersonal && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <FormSelect
                  label="Materia Scolastica"
                  value={subject}
                  onChange={handleSubjectChange}
                  options={subjectOptions}
                  required
                />
              </div>
              <div>
                <FormSelect
                  label="Tipo di Attività"
                  value={type}
                  onChange={(val) => setType(val as ActivityTypeCategory)}
                  options={EVENT_TYPE_OPTIONS}
                  required
                />
              </div>
            </div>
          )}

          {/* Data e Orari */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Data <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Ora Inizio</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Ora Fine</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs cursor-pointer"
              />
            </div>
          </div>

          {/* Docente (per eventi di classe) */}
          {!isPersonal && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Docente di Riferimento</label>
              <input
                type="text"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                placeholder="Es. Prof. Rossi"
              />
            </div>
          )}

          {/* Descrizione */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Descrizione o Argomenti</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
              placeholder="Dettagli aggiuntivi, capitoli del libro..."
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Salvataggio...' : eventToEdit ? 'Aggiorna Evento' : 'Salva Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
