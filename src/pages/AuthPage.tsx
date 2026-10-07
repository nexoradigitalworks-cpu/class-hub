import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, Eye, EyeOff, Loader2, AlertCircle, 
  CheckCircle2, ArrowRight, ArrowLeft, Mail, Lock, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PREDEFINED_AVATARS } from '../utils/theme';
import { AvatarIcon } from '../components/AvatarIcon';

type AuthMode = 'login' | 'register' | 'forgot_password';

export const AuthPage: React.FC = () => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('avatar-blue');

  const clearErrors = () => {
    setError(null);
    setResetSuccessMessage(null);
  };

  const parseAuthError = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || '';

    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      return 'Email o password non corrette.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'Esiste già un account registrato con questa email.';
    }
    if (code === 'auth/invalid-email') {
      return 'Inserisci un indirizzo email valido.';
    }
    if (code === 'auth/weak-password') {
      return 'La password deve contenere almeno 6 caratteri.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Accesso con Google annullato.';
    }
    if (message.includes('network')) {
      return 'Errore di connessione. Controlla la rete e riprova.';
    }
    return message || 'Non è stato possibile completare l\'operazione. Riprova.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!email.trim() || !password) {
      setError('Inserisci email e password.');
      return;
    }

    try {
      setLoading(true);
      await loginWithEmail(email, password);
    } catch (err: any) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Compila tutti i campi.');
      return;
    }

    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Le due password non coincidono.');
      return;
    }

    try {
      setLoading(true);
      await registerWithEmail(email, password, firstName, lastName, selectedAvatarId);
    } catch (err: any) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearErrors();
    try {
      setGoogleLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      setError(parseAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!email.trim()) {
      setError('Inserisci il tuo indirizzo email per ricevere il link di recupero.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      setResetSuccessMessage('Ti abbiamo inviato un\'email con le istruzioni per reimpostare la tua password.');
    } catch (err: any) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Background soft ambient accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -top-40 -left-20 absolute" />
        <div className="w-[450px] h-[450px] bg-indigo-50/70 rounded-full blur-3xl -bottom-20 -right-20 absolute" />
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Main Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/70">
          
          {/* Header Brand */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-[#2563EB] text-white shadow-md shadow-blue-500/25 mb-4">
              <GraduationCap className="w-7 h-7" />
            </div>
            
            <AnimatePresence mode="wait">
              {mode === 'login' && (
                <motion.div
                  key="title-login"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Bentornato su ClassHub
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                    Accedi per entrare nella tua classe.
                  </p>
                </motion.div>
              )}

              {mode === 'register' && (
                <motion.div
                  key="title-register"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Crea il tuo account
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                    Registrati per entrare a far parte della tua classe.
                  </p>
                </motion.div>
              )}

              {mode === 'forgot_password' && (
                <motion.div
                  key="title-forgot"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Recupera password
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                    Inserisci la tua email per reimpostare la password.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Feedback Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}

            {resetSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{resetSuccessMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forms */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="m.rossi@liceo.edu.it"
                    required
                    disabled={loading || googleLoading}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      clearErrors();
                      setMode('forgot_password');
                    }}
                    className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 transition"
                  >
                    Password dimenticata?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading || googleLoading}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Accesso in corso...</span>
                  </>
                ) : (
                  <span>Accedi</span>
                )}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Marco"
                    required
                    disabled={loading || googleLoading}
                    className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cognome
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Rossi"
                    required
                    disabled={loading || googleLoading}
                    className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m.rossi@liceo.edu.it"
                  required
                  disabled={loading || googleLoading}
                  className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Almeno 6 caratteri"
                    required
                    disabled={loading || googleLoading}
                    className="w-full pl-3 pr-10 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Conferma password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ripeti password"
                    required
                    disabled={loading || googleLoading}
                    className="w-full pl-3 pr-10 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Predefined Avatar Selection (No personal photos allowed) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Scegli il tuo Avatar di classe
                </label>
                <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar">
                  {PREDEFINED_AVATARS.map((av) => {
                    const isSelected = selectedAvatarId === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setSelectedAvatarId(av.id)}
                        className={`p-1 rounded-2xl transition border-2 shrink-0 ${
                          isSelected 
                            ? 'border-blue-600 ring-2 ring-blue-500/20 scale-105 shadow-xs' 
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        title={av.name}
                      >
                        <AvatarIcon avatarId={av.id} size="sm" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full mt-2 py-2.5 px-4 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creazione account...</span>
                  </>
                ) : (
                  <span>Crea account</span>
                )}
              </button>
            </form>
          )}

          {mode === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email del tuo account
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="m.rossi@liceo.edu.it"
                    required
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Invio istruzioni...</span>
                  </>
                ) : (
                  <span>Invia link di recupero</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  clearErrors();
                  setMode('login');
                }}
                className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Torna al Login</span>
              </button>
            </form>
          )}

          {/* Social Divider & Google Auth (Only for login & register) */}
          {mode !== 'forgot_password' && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
                  <span className="bg-white px-3 text-slate-400">oppure</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-200/90 text-slate-700 font-semibold rounded-xl text-sm transition shadow-2xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    <span>Connessione con Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continua con Google</span>
                  </>
                )}
              </button>

              {/* Bottom Switcher */}
              <div className="mt-5 text-center">
                {mode === 'login' ? (
                  <p className="text-xs text-slate-500 font-medium">
                    Non hai ancora un account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        clearErrors();
                        setMode('register');
                      }}
                      className="font-bold text-[#2563EB] hover:text-blue-700 transition ml-1"
                    >
                      Crea account
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">
                    Hai già un account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        clearErrors();
                        setMode('login');
                      }}
                      className="font-bold text-[#2563EB] hover:text-blue-700 transition ml-1"
                    >
                      Accedi
                    </button>
                  </p>
                )}
              </div>
            </>
          )}

        </div>

        {/* Developer Test Suite Quick-Fill Card */}
        <div className="mt-4 p-4 rounded-2xl bg-white/80 backdrop-blur-xs border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Account di Sviluppo & Test (DEVTEST)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('developer.test@classhub.edu');
              setPassword('ClassHub2026!Test');
              clearErrors();
            }}
            className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-left transition flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">developer.test@classhub.edu</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                  Developer Mode
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Classe tester: <strong className="font-semibold text-slate-700">ClassHub — Developer Test (DEVTEST)</strong>
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
          </button>
        </div>

        {/* Minimal Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-4 font-medium">
          ClassHub — Sistema sicuro di gestione classe scolastica
        </p>
      </div>

    </div>
  );
};
