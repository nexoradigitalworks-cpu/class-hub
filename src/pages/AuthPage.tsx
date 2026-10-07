import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, Eye, EyeOff, Loader2, AlertCircle, 
  CheckCircle2, ArrowRight, ArrowLeft, Mail, Lock, User,
  Zap, ShieldCheck, UserCog, Terminal, Sparkles, KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PREDEFINED_AVATARS } from '../utils/theme';
import { AvatarIcon } from '../components/AvatarIcon';
import { ClassHubLogo } from '../components/ClassHubLogo';
import { isSupabaseConfigured } from '../lib/supabase';

type AuthMode = 'login' | 'register' | 'forgot_password';

export const AuthPage: React.FC = () => {
  const { loginWithEmail, loginAsDeveloper, registerWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
    const lowerMessage = message.toLowerCase();

    // Supabase Auth error patterns
    if (
      code === 'invalid_credentials' ||
      lowerMessage.includes('invalid login credentials') ||
      lowerMessage.includes('invalid credentials') ||
      code === 'auth/invalid-credential' ||
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password'
    ) {
      return 'Email o password non corrette.';
    }

    if (
      code === 'user_already_exists' ||
      lowerMessage.includes('already registered') ||
      lowerMessage.includes('user already registered') ||
      code === 'auth/email-already-in-use'
    ) {
      return 'Esiste già un account registrato con questa email. Effettua il login o recupera la password.';
    }

    if (
      code === 'weak_password' ||
      lowerMessage.includes('password should be at least') ||
      code === 'auth/weak-password'
    ) {
      return 'La password deve contenere almeno 6 caratteri.';
    }

    if (
      lowerMessage.includes('rate limit') ||
      lowerMessage.includes('over_email_send_rate_limit') ||
      lowerMessage.includes('too many requests')
    ) {
      return 'Limite di tentativi raggiunto. Attendi qualche minuto prima di riprovare.';
    }

    if (
      code === 'validation_failed' ||
      code === 'auth/invalid-email' ||
      lowerMessage.includes('invalid email')
    ) {
      return 'Inserisci un indirizzo email valido.';
    }

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return 'Errore di connessione al server. Controlla la rete e riprova.';
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
            <div className="flex justify-center mb-4">
              <ClassHubLogo size="lg" />
            </div>

            {/* Backend Environment Status Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-3 border select-none transition-colors"
              style={{
                backgroundColor: isSupabaseConfigured ? '#ECFDF5' : '#FFFBEB',
                borderColor: isSupabaseConfigured ? '#A7F3D0' : '#FDE68A',
                color: isSupabaseConfigured ? '#065F46' : '#92400E'
              }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>
                {isSupabaseConfigured
                  ? 'Cloud Database Supabase Connesso'
                  : 'Modalità Demo & Test Locale Attiva'}
              </span>
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
                    disabled={loading}
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
                    disabled={loading}
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
                disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                  disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                disabled={loading}
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

          {/* Bottom Switcher (Only for login & register) */}
          {mode !== 'forgot_password' && (
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
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
          )}

        </div>

        {/* Developer & Test Suite Quick-Access Card */}
        <div className="mt-5 p-4 rounded-3xl bg-white/90 backdrop-blur-md border border-amber-200/90 shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-100/80">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-amber-500 text-white shadow-2xs">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  Area Sviluppo & Test
                </span>
                <span className="text-[10px] text-amber-800/80 font-medium block">
                  Accesso istantaneo 1-Click con dati precaricati (DEVTEST)
                </span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              DEV READY
            </span>
          </div>

          {/* 1-Click Instant Master Login */}
          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/80">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-slate-900">👑 Developer / Admin Master</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                      Tutti i permessi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono mt-0.5 truncate">
                    developer.test@classhub.edu
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Password: <span className="font-semibold text-slate-600">ClassHub2026!Test</span> (o 1-Click)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-amber-200/60">
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    clearErrors();
                    try {
                      setLoading(true);
                      await loginAsDeveloper('developer');
                    } catch (err: any) {
                      setError(err.message || 'Errore accesso developer');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  title="Accedi istantaneamente come Admin con tutti i poteri e switch ruoli"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Accedi 1-Click</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('developer.test@classhub.edu');
                    setPassword('ClassHub2026!Test');
                    clearErrors();
                    setMode('login');
                  }}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Compila i campi del form per testare il form di login"
                >
                  <KeyRound className="w-3 h-3 text-slate-400" />
                  <span>Compila Form</span>
                </button>
              </div>
            </div>

            {/* Sub-presets: Controller & Student */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  clearErrors();
                  try {
                    setLoading(true);
                    await loginAsDeveloper('controller');
                  } catch (err: any) {
                    setError(err.message || 'Errore accesso controller');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-200 text-left transition cursor-pointer flex flex-col justify-between group disabled:opacity-60"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-900">
                  <UserCog className="w-3.5 h-3.5 text-blue-600" />
                  <span>Rappresentante</span>
                </div>
                <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                  sofia.bianchi@...
                </span>
                <span className="text-[10px] font-bold text-blue-600 group-hover:underline mt-1.5 inline-flex items-center gap-0.5">
                  Accedi 1-Click →
                </span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  clearErrors();
                  try {
                    setLoading(true);
                    await loginAsDeveloper('student');
                  } catch (err: any) {
                    setError(err.message || 'Errore accesso studente');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 text-left transition cursor-pointer flex flex-col justify-between group disabled:opacity-60"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span>Studente</span>
                </div>
                <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                  marco.rossi@...
                </span>
                <span className="text-[10px] font-bold text-slate-700 group-hover:underline mt-1.5 inline-flex items-center gap-0.5">
                  Accedi 1-Click →
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Minimal Footer & Legal Links */}
        <div className="mt-4 text-center space-y-2">
          <p className="text-[11px] text-slate-400 font-medium">
            ClassHub — Sistema sicuro di gestione classe scolastica
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/privacy');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-slate-700 underline-offset-2 hover:underline transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/terms');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-slate-700 underline-offset-2 hover:underline transition cursor-pointer"
            >
              Termini di Servizio
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
