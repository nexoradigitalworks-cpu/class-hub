import React, { useState, useEffect } from 'react';
import { 
  Landmark, Plus, CheckCircle, Clock, 
  Trash2, AlertCircle, FileText, MessageSquare 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localStore } from '../services/dataStore';
import { RepresentationItem } from '../types';
import { CreateRepresentationModal } from '../components/CreateRepresentationModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { STATUS_OPTIONS } from '../utils/dropdownPresets';

export const RepresentationPage: React.FC = () => {
  const { profile, isController, isAdmin } = useAuth();
  const [items, setItems] = useState<RepresentationItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = () => {
    if (!profile) return;
    setItems(localStore.getRepresentationItems(profile.classId || ''));
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(loadData);
    return () => unsub();
  }, [profile]);

  const handleStatusChange = (id: string, newStatus: RepresentationItem['status']) => {
    if (!isController && !isAdmin) return;
    localStore.updateRepresentationStatus(id, newStatus);
    showToast('Stato richiesta aggiornato');
  };

  const handleDelete = (id: string) => {
    if (!isController && !isAdmin) return;
    localStore.deleteRepresentationItem(id);
    showToast('Voce rimossa');
  };

  const categoryLabels: Record<string, string> = {
    PROPOSTA: 'Proposta',
    DOMANDA_PROF: 'Richiesta a Docente',
    ASSEMBLEA: 'Punto Assemblea',
    OBIETTIVO: 'Obiettivo',
    ATTIVITA: 'Attività'
  };

  const filtered = categoryFilter === 'ALL'
    ? items
    : items.filter(i => i.category === categoryFilter);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <Landmark className="w-4 h-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              Rappresentanza di Classe
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {items.length} temi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Spazio di coordinamento tra studenti e rappresentanti per proposte, questioni aperte e assemblee.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuova Istanza</span>
        </button>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            categoryFilter === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tutte ({items.length})
        </button>
        {Object.entries(categoryLabels).map(([cat, label]) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              categoryFilter === cat
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(item => {
          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex flex-col justify-between hover:shadow-md transition space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {categoryLabels[item.category] || item.category}
                  </span>

                  <div className="flex items-center gap-2">
                    {isController ? (
                      <CustomSelect
                        value={item.status || 'IN_CORSO'}
                        onChange={(val) => handleStatusChange(item.id, val as any)}
                        options={STATUS_OPTIONS}
                        compact
                        className="w-44"
                        align="right"
                      />
                    ) : (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'APPROVATO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'RESPINTO'
                            ? 'bg-rose-100 text-rose-800'
                            : item.status === 'DISCUSSO'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status || 'IN_CORSO'}
                      </span>
                    )}

                    {(isController || isAdmin) && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                        title="Elimina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Presentata il {item.date}</span>
                {item.authorName && <span>Da {item.authorName}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <CreateRepresentationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => showToast('Nuova proposta aggiunta!')}
      />
    </div>
  );
};
