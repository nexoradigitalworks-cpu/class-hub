import React, { useState, useEffect } from 'react';
import { 
  Bell, Plus, AlertTriangle, Calendar, 
  Trash2, Filter, ShieldAlert 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localStore } from '../services/dataStore';
import { Notice } from '../types';
import { CreateNoticeModal } from '../components/CreateNoticeModal';

export const NoticesPage: React.FC = () => {
  const { profile, isController, isAdmin } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'NORMAL'>('ALL');
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

  const filtered = notices.filter(n => {
    if (priorityFilter === 'HIGH') return n.priority === 'HIGH';
    if (priorityFilter === 'NORMAL') return n.priority !== 'HIGH';
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
            className="flex items-center gap-2 bg-[#EF4444] hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Avviso</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setPriorityFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            priorityFilter === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tutti ({notices.length})
        </button>
        <button
          onClick={() => setPriorityFilter('HIGH')}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
            priorityFilter === 'HIGH'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Solo Urgenti
        </button>
        <button
          onClick={() => setPriorityFilter('NORMAL')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            priorityFilter === 'NORMAL'
              ? 'bg-slate-700 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Standard
        </button>
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
                      className="p-1 text-slate-400 hover:text-red-500 rounded transition"
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
      </div>

      <CreateNoticeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => showToast('Avviso pubblicato con successo!')}
      />
    </div>
  );
};
