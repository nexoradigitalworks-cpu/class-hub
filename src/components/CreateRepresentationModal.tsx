import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { localStore } from '../services/dataStore';
import { X, Landmark } from 'lucide-react';
import { RepresentationItem } from '../types';
import { FormSelect } from './ui/FormSelect';
import { REPRESENTATION_CATEGORY_OPTIONS } from '../utils/dropdownPresets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateRepresentationModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  const { profile } = useAuth();
  const [category, setCategory] = useState<RepresentationItem['category']>('PROPOSTA');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen || !profile) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    localStore.addRepresentationItem({
      category,
      title,
      description,
      status: 'IN_CORSO',
      date: new Date().toISOString().split('T')[0],
      authorName: `${profile.firstName} ${profile.lastName}`
    });

    setTitle('');
    setDescription('');
    onCreated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-600" />
              <span>Nuovo Tema di Rappresentanza</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inserisci una proposta, richiesta per i docenti o argomento per l'assemblea.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <FormSelect
              label="Categoria Istanza"
              value={category}
              onChange={(val) => setCategory(val as any)}
              options={REPRESENTATION_CATEGORY_OPTIONS}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Titolo o Sintesi Richiesta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
              placeholder="Es. Richiesta spostamento verifica di Latino..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Dettagli ed Esigenze della Classe</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
              placeholder="Spiega le motivazioni, i professori coinvolti o le proposte della classe..."
            />
          </div>

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
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Invia Proposta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
