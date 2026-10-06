import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, Users, PlusCircle, ArrowRight, ArrowLeft, 
  Key, Check, Copy, AlertCircle, Loader2, LogOut, Sparkles, School
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AvatarIcon } from '../components/AvatarIcon';

type OnboardingStep = 'select' | 'join' | 'create' | 'created_success';

export const ClassOnboardingPage: React.FC = () => {
  const { profile, joinClass, createClass, logout } = useAuth();

  const [step, setStep] = useState<OnboardingStep>('select');
  const [classCode, setClassCode] = useState('');
  const [className, setClassName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Success state after creating a class
  const [createdClassInfo, setCreatedClassInfo] = useState<{
    classId: string;
    code: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const clearError = () => setError(null);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const clean = classCode.trim().toUpperCase();
    if (!clean) {
      setError('Inserisci il codice della classe.');
      return;
    }

    try {
      setLoading(true);
      await joinClass(clean);
      // Auth state will update and automatically transition to Calendar
    } catch (err: any) {
      setError(err?.message || 'Codice classe non valido. Controlla il codice e riprova.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const clean = className.trim();
    if (!clean) {
      setError('Inserisci il nome della classe.');
      return;
    }

    try {
      setLoading(true);
      const res = await createClass(clean, schoolName, academicYear);
      setCreatedClassInfo(res);
      setStep('created_success');
    } catch (err: any) {
      setError(err?.message || 'Errore durante la creazione della classe. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (createdClassInfo?.code) {
      navigator.clipboard.writeText(createdClassInfo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-between p-4 sm:p-6 bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Bar with user info & logout */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900">ClassHub</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <AvatarIcon avatarId={profile?.avatarId || 'avatar-blue'} size="xs" />
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
              {profile?.firstName} {profile?.lastName}
            </span>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100/80 border border-slate-200 transition shadow-2xs cursor-pointer"
            title="Esci dall'account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Esci</span>
          </button>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="w-full max-w-md my-auto py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/70">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: SELECT (JOIN OR CREATE) */}
            {step === 'select' && (
              <motion.div
                key="step-select"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] mb-3.5">
                    <School className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Inizia con la tua classe
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium leading-relaxed">
                    Per utilizzare ClassHub devi entrare in una classe oppure crearne una nuova.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Join Class Card */}
                  <button
                    onClick={() => {
                      clearError();
                      setStep('join');
                    }}
                    className="w-full p-4 rounded-2xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 transition text-left group flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">
                          Unisciti a una classe
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Inserisci il codice fornito dal tuo rappresentante
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition group-hover:translate-x-0.5" />
                  </button>

                  {/* Create Class Card */}
                  <button
                    onClick={() => {
                      clearError();
                      setStep('create');
                    }}
                    className="w-full p-4 rounded-2xl border border-slate-200 hover:border-purple-400 bg-slate-50/50 hover:bg-purple-50/30 transition text-left group flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
                        <PlusCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition">
                          Crea una classe
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Crea lo spazio per la tua sezione e ricevi il codice
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition group-hover:translate-x-0.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: JOIN WITH CODE */}
            {step === 'join' && (
              <motion.div
                key="step-join"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                <div>
                  <button
                    onClick={() => {
                      clearError();
                      setStep('select');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Indietro</span>
                  </button>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Unisciti alla tua classe
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                    Inserisci il codice alfanumerico della classe.
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleJoinClass} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Codice classe
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                        placeholder="Es. ABC123"
                        maxLength={12}
                        required
                        disabled={loading}
                        autoFocus
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-mono font-bold tracking-widest text-slate-900 placeholder:text-slate-300 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center uppercase transition"
                      />
                      <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                      Il codice è univoco e non fa distinzione tra maiuscole e minuscole.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !classCode.trim()}
                    className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifica codice in corso...</span>
                      </>
                    ) : (
                      <>
                        <span>Continua</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 3: CREATE CLASS */}
            {step === 'create' && (
              <motion.div
                key="step-create"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                <div>
                  <button
                    onClick={() => {
                      clearError();
                      setStep('select');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Indietro</span>
                  </button>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Crea la tua classe
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                    Inserisci le informazioni per avviare il nuovo spazio.
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleCreateClass} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome Istituto / Scuola (Opzionale)
                    </label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Es. Liceo Leonardo da Vinci"
                      disabled={loading}
                      className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Anno Scolastico
                    </label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="2026/2027"
                      disabled={loading}
                      className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="p-3 bg-purple-50/70 border border-purple-200/60 rounded-xl text-xs text-purple-800 font-medium leading-relaxed">
                    Come creatore della classe, ti verrà assegnato automaticamente il ruolo di <strong className="font-bold text-purple-900">Admin</strong> per gestire le impostazioni e i permessi.
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !className.trim()}
                    className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition shadow-sm shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creazione classe in corso...</span>
                      </>
                    ) : (
                      <>
                        <span>Crea classe</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS / SHARE CODE */}
            {step === 'created_success' && createdClassInfo && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="text-center space-y-5"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto shadow-xs">
                  <Check className="w-7 h-7 stroke-[2.5]" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Classe creata!
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                    La tua classe <strong className="text-slate-800 font-semibold">{createdClassInfo.name}</strong> è pronta.
                  </p>
                </div>

                {/* Code display card */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-center space-y-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    Codice classe
                  </span>
                  
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-2xl font-extrabold tracking-widest text-slate-900 selection:bg-blue-200">
                      {createdClassInfo.code}
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
                    <p className="text-[11px] font-semibold text-emerald-600">
                      Codice copiato negli appunti!
                    </p>
                  )}
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed px-2">
                  Condividi questo codice con i tuoi compagni per permettere loro di entrare.
                </p>

                {/* Continue button (reloads state and goes to Calendar) */}
                <button
                  onClick={() => {
                    // Triggers re-render to CalendarHome
                    window.location.reload();
                  }}
                  className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continua a ClassHub</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-2 text-[11px] text-slate-400 font-medium">
        ClassHub © 2026 — Piattaforma scolastica collaborativa
      </footer>

    </div>
  );
};
