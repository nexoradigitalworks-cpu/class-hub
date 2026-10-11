import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { noticesAdapter } from '../services/adapters';
import { X, Bell, AlertCircle, Edit3 } from 'lucide-react';
import { FormSelect } from './ui/FormSelect';
import { PRIORITY_OPTIONS } from '../utils/dropdownPresets';
import { Notice } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  noticeToEdit?: Notice | null;
}

export const CreateNoticeModal: React.FC<Props> = ({ isOpen, onClose, onCreated, noticeToEdit }) => {
  const { profile, activeClassId, currentClass } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH'>('NORMAL');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (noticeToEdit) {
      setTitle(noticeToEdit.title || '');
      setContent(noticeToEdit.content || '');
      setPriority(noticeToEdit.priority || 'NORMAL');
      setDate(noticeToEdit.date || new Date().toISOString().split('T')[0]);
      setError(null);
    } else {
      setTitle('');
      setContent('');
      setPriority('NORMAL');
      setDate(new Date().toISOString().split('T')[0]);
      setError(null);
    }
  }, [noticeToEdit, isOpen]);

  if (!isOpen || !profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !content.trim()) {
      setError('Compila tutti i campi obbligatori.');
      return;
    }

    const targetClassId = activeClassId || profile.classId || profile.activeClassId || currentClass?.id || 'cls-dev-test';

    try {
      setSubmitting(true);
      if (noticeToEdit) {
        await noticesAdapter.updateNotice(noticeToEdit.id, {
          title: title.trim(),
          content: content.trim(),
          priority,
          date
        });
      } else {
        await noticesAdapter.addNotice({
          title: title.trim(),
          content: content.trim(),
          priority,
          date,
          authorName: `${profile.firstName} ${profile.lastName} (${profile.role === 'ADMIN' ? 'Admin' : 'Controller'})`,
          classId: targetClassId
        }, profile.uid);
      }

      onCreated?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio dell\'avviso.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              {noticeToEdit ? (
                <>
                  <Edit3 className="w-5 h-5 text-amber-500" />
                  <span>Modifica Avviso o Circolare</span>
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5 text-red-500" />
                  <span>Pubblica Avviso o Circolare</span>
                </>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {noticeToEdit
                ? 'Aggiorna i dettagli della circolare o comunicazione per la classe.'
                : 'Notifica l\'intera classe di circolari, cambiamenti di aula o scadenze.'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer">
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
              disabled={submitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Salvataggio...' : noticeToEdit ? 'Aggiorna Avviso' : 'Pubblica Avviso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
