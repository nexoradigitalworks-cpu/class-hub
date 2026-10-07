import React from 'react';
import { Calendar, Clock, Bell, CalendarDays, Menu } from 'lucide-react';
import { NavigationTab } from './Sidebar';

interface MobileNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenMenu: () => void;
  counts?: {
    interrogationsCount?: number;
    noticesCount?: number;
    surveysCount?: number;
  };
}

export const MobileNavigation: React.FC<MobileNavProps> = ({ 
  currentTab, 
  onSelectTab, 
  onOpenMenu,
  counts 
}) => {
  const isOtherActive = [
    'materiali', 
    'sondaggi', 
    'rappresentanza', 
    'controllo'
  ].includes(currentTab);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-40 shadow-xl select-none">
      <div className="grid grid-cols-5 items-center max-w-md mx-auto">
        
        {/* Tab 1: Calendario */}
        <button
          onClick={() => onSelectTab('calendario')}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 ${
            currentTab === 'calendario' 
              ? 'text-blue-600 font-extrabold bg-blue-50/70' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="Calendario scolastico"
        >
          <Calendar className={`w-5 h-5 transition-transform ${currentTab === 'calendario' ? 'scale-110 text-blue-600' : 'text-slate-400'}`} />
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">Calendario</span>
        </button>

        {/* Tab 2: Volontari / Interrogazioni */}
        <button
          onClick={() => onSelectTab('interrogazioni')}
          className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 ${
            currentTab === 'interrogazioni' 
              ? 'text-purple-600 font-extrabold bg-purple-50/70' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="Interrogazioni e Volontari"
        >
          <div className="relative">
            <Clock className={`w-5 h-5 transition-transform ${currentTab === 'interrogazioni' ? 'scale-110 text-purple-600' : 'text-slate-400'}`} />
            {Boolean(counts?.interrogationsCount && counts.interrogationsCount > 0) && (
              <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 bg-purple-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                {counts!.interrogationsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">Volontari</span>
        </button>

        {/* Tab 3: Orario */}
        <button
          onClick={() => onSelectTab('orario')}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 ${
            currentTab === 'orario' 
              ? 'text-indigo-600 font-extrabold bg-indigo-50/70' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="Orario settimanale"
        >
          <CalendarDays className={`w-5 h-5 transition-transform ${currentTab === 'orario' ? 'scale-110 text-indigo-600' : 'text-slate-400'}`} />
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">Orario</span>
        </button>

        {/* Tab 4: Avvisi */}
        <button
          onClick={() => onSelectTab('avvisi')}
          className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 ${
            currentTab === 'avvisi' 
              ? 'text-rose-600 font-extrabold bg-rose-50/70' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="Avvisi e Circolari"
        >
          <div className="relative">
            <Bell className={`w-5 h-5 transition-transform ${currentTab === 'avvisi' ? 'scale-110 text-rose-600' : 'text-slate-400'}`} />
            {Boolean(counts?.noticesCount && counts.noticesCount > 0) && (
              <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                {counts!.noticesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">Avvisi</span>
        </button>

        {/* Tab 5: Menu Altro */}
        <button
          onClick={onOpenMenu}
          className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 ${
            isOtherActive 
              ? 'text-slate-900 font-extrabold bg-slate-100' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="Tutti gli spazi di classe"
        >
          <div className="relative">
            <Menu className={`w-5 h-5 transition-transform ${isOtherActive ? 'scale-110 text-slate-800' : 'text-slate-400'}`} />
            {Boolean(counts?.surveysCount && counts.surveysCount > 0) && (
              <span className="absolute -top-0.5 -right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">
            {isOtherActive ? 'Spazi' : 'Altro'}
          </span>
        </button>

      </div>
    </nav>
  );
};
