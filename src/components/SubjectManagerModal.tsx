import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Bookmark, Edit2, Trash2, Check,
  BookOpen, Sparkles, User, MapPin, ShieldCheck, Lock, Eye
} from 'lucide-react';
import { SubjectItem } from '../types';
import { timetableAdapter } from '../services/adapters';
import { COLOR_PALETTES } from '../utils/theme';
import { FormSelect } from './ui/FormSelect';
import { useAuth } from '../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  classId?: string;
  onSubjectChanged?: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'SCIENTIFICA', label: 'Materia Scientifica' },
  { value: 'UMANISTICA', label: 'Materia Umanistica' },
  { value: 'LINGUISTICA', label: 'Lingua Straniera' },
  { value: 'ARTISTICA_MOTORIA', label: 'Arte, Sport & Motoria' },
  { value: 'ALTRO', label: 'Altre Materie / Attività' }
];

export const SubjectManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  classId,
  onSubjectChanged
}) => {
  const { isController, isAdmin } = useAuth();
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SubjectItem['category']>('SCIENTIFICA');
  const [color, setColor] = useState('blue');
  const [defaultTeacher, setDefaultTeacher] = useState('');
  const [defaultRoom, setDefaultRoom] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSubjects = async () => {
    const list = await timetableAdapter.getSubjects(classId);
    setSubjects(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadSubjects();
      resetForm();
    }
  }, [isOpen, classId]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('SCIENTIFICA');
    setColor('blue');
    setDefaultTeacher('');
    setDefaultRoom('');
    setDescription('');
    setErrorMsg(null);
  };

  if (!isOpen) return null;

  const handleStartEdit = (sub: SubjectItem) => {
    if (!isController) return;
    setEditingId(sub.id);
    setName(sub.name);
    setCategory(sub.category || 'SCIENTIFICA');
    setColor(sub.color || 'blue');
    setDefaultTeacher(sub.defaultTeacher || '');
    setDefaultRoom(sub.defaultRoom || '');
    setDescription(sub.description || '');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isController) {
      setErrorMsg('Solo i Controller e gli Admin possono modificare o creare materie.');
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg('Inserisci il nome della materia.');
      return;
    }

    // Check duplicate name
    const exists = subjects.some(s => s.name.toLowerCase() === trimmed.toLowerCase() && s.id !== editingId);
    if (exists) {
      setErrorMsg('Esiste già una materia con questo nome.');
      return;
    }

    try {
      if (editingId) {
        await timetableAdapter.updateSubject(editingId, {
          name: trimmed,
          category,
          color,
          defaultTeacher: defaultTeacher.trim() || undefined,
          defaultRoom: defaultRoom.trim() || undefined,
          description: description.trim() || undefined,
          classId
        });
      } else {
        await timetableAdapter.addSubject({
          name: trimmed,
          category,
          color,
          defaultTeacher: defaultTeacher.trim() || undefined,
          defaultRoom: defaultRoom.trim() || undefined,
          description: description.trim() || undefined,
          classId
        }, classId);
      }

      await loadSubjects();
      resetForm();
      onSubjectChanged?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore nel salvataggio della materia.');
    }
  };

  const handleDelete = async (id: string, subName: string) => {
    if (!isController) return;
    if (confirm(`Sei sicuro di voler eliminare la materia "${subName}"?`)) {
      try {
        await timetableAdapter.deleteSubject(id);
        await loadSubjects();
        if (editingId === id) resetForm();
        onSubjectChanged?.();
      } catch (err: any) {
        alert(err.message || 'Errore nell\'eliminazione della materia.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200/90 max-h-[92vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                  Editor Materie di Classe
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isController 
                    ? 'bg-indigo-100 text-indigo-800' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {isController ? (isAdmin ? 'Admin' : 'Controller') : 'Sola Lettura'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isController 
                  ? 'Crea, personalizza e gestisci le materie scolastiche con palette colori, docenti e aule.'
                  : 'Consulta l\'elenco ufficiale delle materie scolastiche e dei relativi docenti.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two columns layout on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
          
          {/* Left Form: Add or Edit Subject (or Read-Only Info for Students) */}
          <div className="lg:col-span-6 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
            {isController ? (
              <>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{editingId ? 'Modifica Materia' : 'Crea Nuova Materia'}</span>
                </h4>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {errorMsg && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                      {errorMsg}
                    </div>
                  )}

                  {/* Nome */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome Materia <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Es. Informatica, Diritto, Spagnolo..."
                      className="w-full h-10 px-3 py-2 text-xs sm:text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  {/* Categoria */}
                  <div>
                    <FormSelect
                      label="Area Disciplinare"
                      value={category || 'SCIENTIFICA'}
                      onChange={val => setCategory(val as SubjectItem['category'])}
                      options={CATEGORY_OPTIONS}
                      compact
                      required
                    />
                  </div>

                  {/* Color Palette Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Colore Identificativo
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(COLOR_PALETTES).map(([key, pal]) => {
                        const isSelected = color === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setColor(key)}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center transition border ${pal.bg} ${pal.border} ${
                              isSelected ? 'ring-2 ring-indigo-600 ring-offset-1 scale-110 shadow-xs' : 'hover:scale-105'
                            }`}
                            title={pal.label}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${pal.dot}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grid: Docente & Aula */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Docente (opz.)</label>
                      <input
                        type="text"
                        value={defaultTeacher}
                        onChange={e => setDefaultTeacher(e.target.value)}
                        placeholder="Es. Prof. Rossi"
                        className="w-full h-9 px-3 py-1.5 text-xs bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Aula (opz.)</label>
                      <input
                        type="text"
                        value={defaultRoom}
                        onChange={e => setDefaultRoom(e.target.value)}
                        placeholder="Es. Aula 12"
                        className="w-full h-9 px-3 py-1.5 text-xs bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Descrizione / Note */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Descrizione / Programma (opz.)</label>
                    <input
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Es. Programma ministeriale, laboratorio..."
                      className="w-full h-9 px-3 py-1.5 text-xs bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
                      >
                        Annulla Modifica
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingId ? 'Salva Materia' : 'Aggiungi Materia'}</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-200/70 text-slate-500 flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Modifiche Riservate</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    L'editor delle materie (creazione, modifica e colori) è disponibile per i <strong>Controller (Rappresentanti)</strong> e per gli <strong>Admin</strong> della classe.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Modalità sola consultazione attiva</span>
                </div>
              </div>
            )}
          </div>

          {/* Right List: All Subjects */}
          <div className="lg:col-span-6 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Materie Attive ({subjects.length})
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                Disponibili per orario, eventi e interrogazioni
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {subjects.map(sub => {
                const pal = COLOR_PALETTES[sub.color] || COLOR_PALETTES.blue;
                const isSelectedForEdit = editingId === sub.id;

                return (
                  <div
                    key={sub.id}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isSelectedForEdit 
                        ? 'bg-indigo-50/70 border-indigo-300 shadow-xs' 
                        : 'bg-white border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${pal.bg} ${pal.border}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${pal.dot}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 truncate">
                            {sub.name}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${pal.bg} ${pal.text} ${pal.border}`}>
                            {pal.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          {sub.defaultTeacher && (
                            <span className="flex items-center gap-0.5 truncate">
                              <User className="w-2.5 h-2.5 text-slate-400" />
                              {sub.defaultTeacher}
                            </span>
                          )}
                          {sub.defaultRoom && (
                            <span className="flex items-center gap-0.5 truncate bg-slate-50 px-1 rounded border border-slate-100">
                              <MapPin className="w-2.5 h-2.5 text-slate-400" />
                              {sub.defaultRoom}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isController && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(sub)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Modifica materia"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sub.id, sub.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Elimina materia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-5 mt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Chiudi Editor
          </button>
        </div>

      </div>
    </div>
  );
};
