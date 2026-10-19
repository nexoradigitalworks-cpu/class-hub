import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { interrogationsAdapter, timetableAdapter } from '../services/adapters';
import { X, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { FormSelect } from './ui/FormSelect';
import { MAX_VOLUNTEERS_OPTIONS, formatSubjectToOption, SUBJECT_OPTIONS } from '../utils/dropdownPresets';
import { SubjectItem, Interrogation } from '../types';
import { SelectOption } from './ui/CustomSelect';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  interrogationToEdit?: Interrogation | null;
  onCreated?: () => void;
}

export const CreateInterrogationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultDate,
  interrogationToEdit,
  onCreated
}) => {
  const { profile, activeClassId, currentClass } = useAuth();

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Filosofia');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [maxVolunteers, setMaxVolunteers] = useState('3');
  const [teacher, setTeacher] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (interrogationToEdit) {
        setTitle(interrogationToEdit.title || '');
        setSubject(interrogationToEdit.subject || 'Filosofia');
        setDate(interrogationToEdit.date || defaultDate || new Date().toISOString().split('T')[0]);
        setStartTime(interrogationToEdit.startTime || '10:00');
        setEndTime(interrogationToEdit.endTime || '11:00');
        setMaxVolunteers(String(interrogationToEdit.maxVolunteers || 3));
        setTeacher(interrogationToEdit.teacher || '');
        setNotes(interrogationToEdit.notes || '');
      } else {
        setTitle('');
        setDate(defaultDate || new Date().toISOString().split('T')[0]);
        setStartTime('10:00');
        setEndTime('11:00');
        setMaxVolunteers('3');
        setTeacher('');
        setNotes('');
      }

      timetableAdapter.getSubjects(profile?.classId || '').then((classSubs) => {
        setSubjects(classSubs);
        if (!interrogationToEdit && classSubs.length > 0 && !classSubs.some(s => s.name === subject)) {
          setSubject(classSubs[0].name);
          if (classSubs[0].defaultTeacher && !teacher) {
            setTeacher(classSubs[0].defaultTeacher);
          }
        }
      });
    }
  }, [isOpen, interrogationToEdit, defaultDate, profile?.classId]);

  if (!isOpen || !profile) return null;

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

    const targetClassId = activeClassId || profile.classId || profile.activeClassId || currentClass?.id || 'cls-dev-test';

    try {
      setSubmitting(true);
      if (interrogationToEdit) {
        await interrogationsAdapter.updateInterrogation(interrogationToEdit.id, {
          title: title.trim(),
          subject,
          date,
          startTime,
          endTime,
          maxVolunteers: Number(maxVolunteers) || 3,
          teacher: teacher || undefined,
          notes: notes || undefined
        });
      } else {
        await interrogationsAdapter.createInterrogation(
          {
            title: title.trim(),
            subject,
            date,
            startTime,
            endTime,
            maxVolunteers: Number(maxVolunteers) || 3,
            teacher: teacher || undefined,
            notes: notes || undefined,
            classId: targetClassId
          },
          profile.uid
        );
      }

      setTitle('');
      setNotes('');
      setTeacher('');
      onCreated?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore nel salvataggio dell\'interrogazione.');
    } finally {
      setSubmitting(false);
    }
  };

  const subjectOptions: SelectOption[] = subjects.length > 0 
    ? subjects.map(formatSubjectToOption) 
    : SUBJECT_OPTIONS;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span>{interrogationToEdit ? 'Modifica Interrogazione' : 'Nuova Interrogazione Programmata'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {interrogationToEdit 
                ? 'Aggiorna data, posti volontari disponibili o altri dettagli della sessione orale.' 
                : 'Imposta materia, posti volontari disponibili e orario per la prova orale.'}
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
          {/* Titolo / Argomento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Argomento o Titolo della Sessione <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-2xs"
              placeholder="Es. Interrogazione Filosofia: Il pessimismo di Schopenhauer"
            />
          </div>

          {/* Grid: Materia & Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <FormSelect
                label="Materia Orale"
                value={subject}
                onChange={handleSubjectChange}
                options={subjectOptions}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Data Prova Orale <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs cursor-pointer"
              />
            </div>
          </div>

          {/* Grid: Capienza & Docente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <FormSelect
                label="Capienza Volontari"
                value={maxVolunteers}
                onChange={(val) => setMaxVolunteers(val)}
                options={MAX_VOLUNTEERS_OPTIONS}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Docente (opzionale)</label>
              <input
                type="text"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                placeholder="Es. Prof.ssa Martini"
              />
            </div>
          </div>

          {/* Grid: Orari */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Ora Inizio</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Ora Fine</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs cursor-pointer"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Capitoli / Pagine da Preparare (Opzionale)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
              placeholder="Es. Pagine 210-245, esercizi allegati su Classroom..."
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#7C3AED] hover:bg-purple-700 active:scale-95 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{submitting ? 'Salvataggio in corso...' : interrogationToEdit ? 'Salva Modifiche' : 'Pubblica Interrogazione'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
