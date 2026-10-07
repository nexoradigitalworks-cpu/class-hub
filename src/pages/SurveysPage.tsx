import React, { useState, useEffect } from 'react';
import { 
  Vote, Plus, CheckCircle, Clock, 
  Trash2, Lock, Unlock, Users, BarChart3 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { surveysAdapter } from '../services/adapters';
import { Survey } from '../types';
import { CreateSurveyModal } from '../components/CreateSurveyModal';

export const SurveysPage: React.FC = () => {
  const { profile, isController, isAdmin } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    if (!profile) return;
    try {
      const list = await surveysAdapter.getSurveys(profile.classId || '', profile.uid);
      setSurveys(list);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const handleVote = async (surveyId: string, optionId: string) => {
    if (!profile) return;
    try {
      await surveysAdapter.voteSurvey(surveyId, optionId, profile.uid);
      showToast('Voto registrato con successo!');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Errore nella registrazione del voto');
    }
  };

  const handleToggleStatus = async (surveyId: string, currentStatus?: 'OPEN' | 'CLOSED') => {
    if (!isController && !isAdmin) return;
    try {
      await surveysAdapter.toggleSurveyStatus(surveyId, currentStatus);
      showToast('Stato sondaggio aggiornato');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Errore nell\'aggiornamento dello stato');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isController && !isAdmin) return;
    try {
      await surveysAdapter.deleteSurvey(id);
      showToast('Sondaggio eliminato');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Errore nell\'eliminazione del sondaggio');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <Vote className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              Sondaggi di Classe
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {surveys.length} attivi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Votazioni democratiche per decisioni su gite, recuperi, orari e progetti di classe.
          </p>
        </div>

        {isController && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Sondaggio</span>
          </button>
        )}
      </div>

      {/* Surveys List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {surveys.map(survey => {
          const isClosed = survey.status === 'CLOSED';
          const totalVotes = survey.totalVotes || survey.options.reduce((acc, o) => acc + o.votesCount, 0);

          return (
            <div
              key={survey.id}
              className={`p-6 rounded-2xl border transition bg-white shadow-xs space-y-4 ${
                isClosed ? 'border-slate-200 opacity-80' : 'border-slate-200/90'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isClosed ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isClosed ? 'Concluso' : 'Aperto alle votazioni'}
                    </span>
                    {survey.deadline && (
                      <span className="text-xs text-slate-400">
                        Scadenza: {survey.deadline}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1.5">
                    {survey.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {survey.question}
                  </p>
                </div>

                {isController && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(survey.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                      title={isClosed ? 'Riapri sondaggio' : 'Chiudi sondaggio'}
                    >
                      {isClosed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(survey.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Options & Progress Bars */}
              <div className="space-y-3 pt-2">
                {survey.options.map(opt => {
                  const hasVoted = opt.votedUserIds?.includes(profile?.uid || '');
                  const pct = totalVotes > 0 ? Math.round((opt.votesCount / totalVotes) * 100) : 0;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => !isClosed && handleVote(survey.id, opt.id)}
                      className={`p-3.5 rounded-xl border transition relative overflow-hidden ${
                        isClosed ? 'cursor-default' : 'cursor-pointer hover:border-amber-400'
                      } ${
                        hasVoted
                          ? 'border-amber-400 bg-amber-50/40 font-bold'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      {/* Percentage background bar */}
                      <div
                        className="absolute inset-y-0 left-0 bg-amber-100/60 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />

                      <div className="relative flex items-center justify-between text-xs sm:text-sm z-10">
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            hasVoted ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                          }`}>
                            {hasVoted && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </span>
                          <span className="text-slate-900">{opt.text}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <span>{opt.votesCount} voti</span>
                          <span className="text-slate-400">({pct}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
                <span>Voti complessivi raccolti: {totalVotes}</span>
                {survey.authorName && <span>Creato da {survey.authorName}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <CreateSurveyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => showToast('Nuovo sondaggio aperto!')}
      />
    </div>
  );
};
