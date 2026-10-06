import React from 'react';
import { Calendar, Clock, Bell, CalendarDays, Menu } from 'lucide-react';
import { NavigationTab } from './Sidebar';

interface MobileNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenMenu: () => void;
}

export const MobileNavigation: React.FC<MobileNavProps> = ({ currentTab, onSelectTab, onOpenMenu }) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 z-40 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => onSelectTab('calendario')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
            currentTab === 'calendario' ? 'text-[#2563EB] font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Calendario</span>
        </button>

        <button
          onClick={() => onSelectTab('interrogazioni')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
            currentTab === 'interrogazioni' ? 'text-[#7C3AED] font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px]">Volontari</span>
        </button>

        <button
          onClick={() => onSelectTab('orario')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
            currentTab === 'orario' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px]">Orario</span>
        </button>

        <button
          onClick={() => onSelectTab('avvisi')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
            currentTab === 'avvisi' ? 'text-[#EF4444] font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px]">Avvisi</span>
        </button>

        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-slate-500 hover:text-slate-800 transition"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">Altro</span>
        </button>
      </div>
    </nav>
  );
};
