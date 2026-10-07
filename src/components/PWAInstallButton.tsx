import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'header' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'sidebar',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone PWA mode, hide the button
  if (isInstalled) {
    return null;
  }

  // If neither Chromium prompt nor iOS is detected (e.g. standard browser that doesn't support install),
  // we can still offer the iOS / Chrome instructions if opened on mobile.
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 hover:border-blue-300 text-blue-700 hover:text-blue-800 transition shadow-2xs group cursor-pointer ${className}`}
          title="Installa ClassHub come App"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Download className="w-3.5 h-3.5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[11px] font-extrabold text-slate-800 truncate leading-tight">
                Installa App
              </p>
              <p className="text-[9px] font-medium text-blue-600 truncate leading-tight">
                {isIOS ? 'Su iPhone / iPad' : 'Su Android / Desktop'}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded shadow-2xs shrink-0">
            PWA
          </span>
        </button>
      )}

      {variant === 'header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Installa App</span>
          <span className="sm:hidden">Installa</span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer ${className}`}
        >
          <Smartphone className="w-3 h-3" />
          <span>Installa App</span>
        </button>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Installa su iPhone / iPad</h3>
                <p className="text-[11px] text-slate-500 font-medium">Usa ClassHub a schermo intero come vera app</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="leading-snug">
                  Tocca il pulsante <strong className="inline-flex items-center gap-0.5 text-blue-700 font-bold"><Share className="w-3 h-3 inline" /> Condividi</strong> nella barra inferiore di Safari.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="leading-snug">
                  Scorri l'elenco e tocca <strong className="inline-flex items-center gap-0.5 text-slate-900 font-bold"><PlusSquare className="w-3 h-3 inline text-slate-700" /> Aggiungi alla schermata Home</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="leading-snug">
                  Conferma toccando <strong className="text-blue-700 font-bold">Aggiungi</strong> in alto a destra. Troverai l'icona di ClassHub sulla tua Home!
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Nessun download da App Store necessario</span>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </>
  );
};
