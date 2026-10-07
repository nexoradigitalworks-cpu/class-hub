import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PlusCircle, Check, Copy, ArrowRight, Loader2, School, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (classInfo: { classId: string; code: string; name: string }) => void;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { createClass } = useAuth();
  const [className, setClassName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success step
  const [createdInfo, setCreatedInfo] = useState<{ classId: string; code: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setClassName('');
    setSchoolName('');
    setAcademicYear('2026/2027');
    setError(null);
    setCreatedInfo(null);
    setCopied(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = className.trim();
    if (!cleanName) {
      setError('Inserisci il nome della classe.');
      return;
    }

    try {
      setLoading(true);
      const res = await createClass(cleanName, schoolName, academicYear);
      setCreatedInfo(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Errore durante la creazione della classe.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (createdInfo?.code) {
      navigator.clipboard.writeText(createdInfo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden"
      >
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          {!createdInfo ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Crea nuova classe</h2>
                  <p className="text-xs text-slate-500 font-medium">Avvia lo spazio per una nuova sezione</p>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nome della classe *
                  </label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="Es. 4° Liceo Scientifico A"
                    required
                    disabled={loading}
                    autoFocus
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Scuola / Istituto (Opzionale)
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Es. Liceo Leonardo da Vinci"
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Anno Scolastico
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2026/2027"
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                  />
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200/60 text-xs text-purple-900 font-medium">
                  Creando questa classe ne diventerai l'<strong>Admin</strong> con pieni permessi di gestione.
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !className.trim()}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs transition shadow-sm shadow-purple-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creazione...</span>
                      </>
                    ) : (
                      <>
                        <span>Crea Classe</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-5"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Classe Creata!</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  La tua classe <strong className="text-slate-800">{createdInfo.name}</strong> è attiva.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                  Codice Invito Classe
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-2xl font-black tracking-widest text-slate-900">
                    {createdInfo.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition shadow-2xs cursor-pointer"
                    title="Copia codice"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copied && (
                  <p className="text-[11px] font-semibold text-emerald-600">Codice copiato negli appunti!</p>
                )}
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Accedi alla classe</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
