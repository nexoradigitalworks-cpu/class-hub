import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { localStore } from '../services/dataStore';
import { X, Lock, Users } from 'lucide-react';
import { ActivityTypeCategory } from '../types';
import { FormSelect } from './ui/FormSelect';
import { PersonalEventSelect, PERSONAL_CATEGORIES } from './ui/PersonalEventSelect';
import { SUBJECT_OPTIONS, EVENT_TYPE_OPTIONS } from '../utils/dropdownPresets';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  onCreated?: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  onCreated
}) => {
  const { profile, isController, isAdmin } = useAuth();
  const canCreateClassEvent = isController || isAdmin;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    const enforcedPersonal = canCreateClassEvent ? isPersonal : true;

    localStore.addEvent({
      title,
      subject: enforcedPersonal ? `Personale (${PERSONAL_CATEGORIES.find(c => c.value === personalCategory)?.label || 'Impegno'})` : subject,
      type: enforcedPersonal ? 'PERSONALE' : type,
      date,
      startTime,
      endTime,
      teacher: enforcedPersonal ? undefined : (teacher || undefined),
      description: description || undefined,
      isPersonal: enforcedPersonal,
      authorId: profile.uid,
      authorName: `${profile.firstName} ${profile.lastName}`
    });

    setTitle('');
    setDescription('');
    setTeacher('');
    onCreated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              {!canCreateClassEvent
                ? 'Nuovo Impegno Personale'
                : isPersonal
                  ? 'Nuovo Impegno Personale'
                  : 'Crea Evento di Classe'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {!canCreateClassEvent
                ? 'Visibile solo a te. I compagni e gli admin non potranno vederlo.'
                : isPersonal
                  ? 'Visibile esclusivamente nel tuo profilo personale.'
                  : 'Visibile all\'intera classe nel calendario collettivo.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Role selector toggle for Controller/Admin */}
          {canCreateClassEvent && (
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setIsPersonal(false)}
                className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
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
                className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  isPersonal
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Personale (Privato)</span>
              </button>
            </div>
          )}

          {/* If Personal Event: Category selector with quick presets */}
          {isPersonal && (
            <PersonalEventSelect
              value={personalCategory}
              onChange={setPersonalCategory}
              onSelectPreset={handleSelectPreset}
            />
          )}

          {/* Titolo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Titolo Impegno <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              placeholder={isPersonal ? 'Es. Studio Capitolo 4, Ripetizioni, Dentista...' : 'Es. Verifica di Matematica, Laboratorio, Uscita...'}
            />
          </div>

          {/* Grid: Data & Tipo Evento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

            {!isPersonal ? (
              <div>
                <FormSelect
                  label="Tipo Evento"
                  value={type}
                  onChange={(val) => setType(val as ActivityTypeCategory)}
                  options={EVENT_TYPE_OPTIONS}
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Visibilità</label>
                <div className="w-full h-11 px-3.5 py-2.5 text-xs border rounded-xl border-slate-200 bg-slate-50 text-slate-600 font-semibold flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Solo Tuo (Privato al 100%)</span>
                </div>
              </div>
            )}
          </div>

          {/* Grid: Materia & Docente (for Class events) */}
          {!isPersonal && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <FormSelect
                  label="Materia di Riferimento"
                  value={subject}
                  onChange={(val) => setSubject(val)}
                  options={SUBJECT_OPTIONS}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Docente (opzionale)</label>
                <input
                  type="text"
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  placeholder="Es. Prof. Barbieri"
                />
              </div>
            </div>
          )}

          {/* Grid: Orari Inizio & Fine */}
          <div className="grid grid-cols-2 gap-3.5">
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
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Salva Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
