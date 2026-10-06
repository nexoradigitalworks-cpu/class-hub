import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { localStore } from '../services/dataStore';
import { X, Bell } from 'lucide-react';
import { FormSelect } from './ui/FormSelect';
import { PRIORITY_OPTIONS } from '../utils/dropdownPresets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateNoticeModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH'>('NORMAL');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen || !profile) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    localStore.addNotice({
      title,
      content,
      priority,
      date,
      authorName: `${profile.firstName} ${profile.lastName} (${profile.role === 'ADMIN' ? 'Admin' : 'Controller'})`
    });

    setTitle('');
    setContent('');
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
              <Bell className="w-5 h-5 text-red-500" />
              <span>Pubblica Avviso o Circolare</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Notifica l'intera classe di circolari, cambiamenti di aula o scadenze.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Titolo dell'Avviso <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs"
              placeholder="Es. Circolare n. 145: Modulo autorizzazione viaggio..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Data Pubblicazione <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs cursor-pointer"
              />
            </div>
            <div>
              <FormSelect
                label="Livello di Priorità"
                value={priority}
                onChange={(val) => setPriority(val as 'NORMAL' | 'HIGH')}
                options={PRIORITY_OPTIONS}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Testo del Comunicato <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs"
              placeholder="Inserisci il testo completo della circolare o comunicazione per gli studenti..."
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
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Pubblica Avviso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
