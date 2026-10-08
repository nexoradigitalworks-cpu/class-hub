import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { surveysAdapter } from '../services/adapters';
import { X, Vote, Plus, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateSurveyModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  const { profile, activeClassId, currentClass } = useAuth();
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [deadline, setDeadline] = useState('');
  const [options, setOptions] = useState<string[]>(['Opzione 1', 'Opzione 2', 'Opzione 3']);

  if (!isOpen || !profile) return null;

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, `Opzione ${options.length + 1}`]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !question) return;

    const validOptions = options
      .map(o => o.trim())
      .filter(Boolean)
      .map((text, idx) => ({
        id: `opt-${Date.now()}-${idx}`,
        text,
        votesCount: 0,
        votedUserIds: []
      }));

    if (validOptions.length < 2) {
      alert('Inserisci almeno 2 opzioni valide');
      return;
    }

    const targetClassId = activeClassId || profile.classId || profile.activeClassId || currentClass?.id || 'cls-dev-test';

    try {
      await surveysAdapter.addSurvey({
        title,
        question,
        options: validOptions,
        status: 'OPEN',
        deadline: deadline || undefined,
        authorName: `${profile.firstName} ${profile.lastName}`,
        classId: targetClassId
      }, profile.uid);

      setTitle('');
      setQuestion('');
      onCreated?.();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Errore nella creazione del sondaggio.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Vote className="w-5 h-5 text-amber-500" />
              <span>Nuovo Sondaggio di Classe</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Raccogli le preferenze e votazioni di tutti gli studenti in tempo reale.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Titolo del Sondaggio *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
              placeholder="Es. Scelta destinazione gita di classe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Domanda per la classe *</label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
              placeholder="Es. Quale città preferite visitare a marzo?"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Scadenza Votazioni (opzionale)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">Opzioni di Risposta</label>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs text-[#2563EB] font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Aggiungi opzione
                </button>
              )}
            </div>

            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    className="flex-1 h-10 px-3.5 py-2 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
                    placeholder={`Opzione ${i + 1}`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition"
                      title="Rimuovi opzione"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Avvia Sondaggio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
