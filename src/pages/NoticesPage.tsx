import React, { useState, useEffect } from 'react';
import { 
  Bell, Plus, AlertTriangle, Calendar, 
  Trash2, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localStore } from '../services/dataStore';
import { Notice } from '../types';
import { CreateNoticeModal } from '../components/CreateNoticeModal';
import { FormSelect } from '../components/ui/FormSelect';

export const NoticesPage: React.FC = () => {
  const { profile, isController, isAdmin } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'NORMAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = () => {
    if (!profile) return;
    setNotices(localStore.getNotices(profile.classId || ''));
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(loadData);
    return () => unsub();
  }, [profile]);

  const handleDelete = (id: string) => {
    if (!isController && !isAdmin) return;
    localStore.deleteNotice(id);
    showToast('Avviso eliminato');
  };

  const priorityOptions = [
    { value: 'ALL', label: `Tutti gli avvisi (${notices.length})`, description: 'Circolari urgenti e comunicazioni ordinarie' },
    { value: 'HIGH', label: 'Solo Circolari Urgenti (Alta Priorità)', description: 'Avvisi in evidenza con contrassegno rosso' },
    { value: 'NORMAL', label: 'Comunicazioni Ordinarie (Standard)', description: 'Avvisi di routine e variazioni d\'aula' }
  ];

  const filtered = notices.filter(n => {
    if (priorityFilter === 'HIGH' && n.priority !== 'HIGH') return false;
    if (priorityFilter === 'NORMAL' && n.priority === 'HIGH') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <Bell className="w-4 h-4 text-red-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              Avvisi & Circolari
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              {notices.length} comunicati
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Bacheca ufficiale per circolari scolastiche, variazioni orario e scadenze amministrative.
          </p>
        </div>

        {isController && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#EF4444] hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Avviso</span>
          </button>
        )}
      </div>

      {/* Aligned Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <FormSelect
              label="Filtra per Priorità"
              value={priorityFilter}
              onChange={(val) => setPriorityFilter(val as any)}
              options={priorityOptions}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-tight">
              Cerca nel Testo o Titolo
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca negli avvisi..."
                className="w-full h-11 pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {filtered.map(notice => {
          const isHigh = notice.priority === 'HIGH';

          return (
            <div
              key={notice.id}
              className={`p-5 rounded-2xl border transition bg-white shadow-xs space-y-3 ${
                isHigh
                  ? 'border-red-200 bg-red-50/20 shadow-red-500/5'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isHigh && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-200">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      URGENTE
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {notice.date}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium">
                    Pubblicato da: <span className="font-semibold text-slate-700">{notice.authorName}</span>
                  </span>

                  {(isController || isAdmin) && (
                    <button
                      onClick={() => handleDelete(notice.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {notice.title}
                </h3>
                <p className="text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  {notice.content}
                </p>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs max-w-lg mx-auto">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Nessun avviso trovato</h3>
            <p className="text-xs text-slate-500 mt-1">
              Nessun comunicato corrisponde ai filtri impostati.
            </p>
          </div>
        )}
      </div>

      <CreateNoticeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => showToast('Avviso pubblicato con successo!')}
      />
    </div>
  );
};
