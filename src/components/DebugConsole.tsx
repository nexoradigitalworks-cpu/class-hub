import React, { useState, useEffect, useMemo } from 'react';
import { logger, LogCategory, LogLevel, LogEntry } from '../utils/logger';
import { 
  Terminal, ShieldCheck, Trash2, Copy, Check, 
  Search, RefreshCw, AlertTriangle, Info, AlertCircle, 
  Filter, Wifi, Database, Activity, Bell, ChevronDown, ChevronRight
} from 'lucide-react';

interface Props {
  className?: string;
  compact?: boolean;
}

export const DebugConsole: React.FC<Props> = ({ className = '', compact = false }) => {
  const [logs, setLogs] = useState<LogEntry[]>(() => logger.getLogs());
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | 'ALL'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = logger.subscribe(() => {
      setLogs(logger.getLogs());
    });
    return () => unsubscribe();
  }, []);

  const handleClear = () => {
    logger.clearLogs();
  };

  const handleGenerateTestLogs = () => {
    logger.lifecycle('info', 'Avvio verifica stato componenti e sincronizzazione sessione', { userRole: 'ADMIN' });
    logger.adapter('warn', 'Risposta RPC lenta, attivazione verifica stato tabella alternativa', { table: 'interrogation_volunteers' });
    logger.network('info', 'Esecuzione chiamata Edge Function send-push-notification', { type: 'INTERROGATION', classId: 'cls-84219' });
    logger.push('info', 'Sottoscrizione Web Push rilevata attivamente', { isSubscribed: true });
  };

  const handleCopyLogs = () => {
    const exportText = JSON.stringify(filteredLogs, null, 2);
    navigator.clipboard.writeText(exportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedLogIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) return false;
      if (selectedLevel !== 'ALL' && log.level !== selectedLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMessage = log.message.toLowerCase().includes(q);
        const matchDetails = log.details ? JSON.stringify(log.details).toLowerCase().includes(q) : false;
        return matchMessage || matchDetails;
      }
      return true;
    });
  }, [logs, selectedCategory, selectedLevel, searchQuery]);

  const counts = useMemo(() => {
    const errorCount = logs.filter(l => l.level === 'error').length;
    const warnCount = logs.filter(l => l.level === 'warn').length;
    const infoCount = logs.filter(l => l.level === 'info').length;
    return { total: logs.length, error: errorCount, warn: warnCount, info: infoCount };
  }, [logs]);

  const getCategoryBadge = (cat: LogCategory) => {
    switch (cat) {
      case 'network':
        return { label: 'Network', icon: <Wifi className="w-3 h-3 text-cyan-400" />, badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' };
      case 'adapter':
        return { label: 'Adapter', icon: <Database className="w-3 h-3 text-purple-400" />, badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
      case 'lifecycle':
        return { label: 'Lifecycle', icon: <Activity className="w-3 h-3 text-emerald-400" />, badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' };
      case 'push':
        return { label: 'Push', icon: <Bell className="w-3 h-3 text-amber-400" />, badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };
    }
  };

  const getLevelStyle = (lvl: LogLevel) => {
    switch (lvl) {
      case 'error':
        return { dot: 'bg-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' };
      case 'warn':
        return { dot: 'bg-amber-400', text: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/20' };
      case 'info':
        return { dot: 'bg-blue-400', text: 'text-blue-300', bg: 'bg-blue-500/10 border-blue-500/20' };
    }
  };

  return (
    <div className={`rounded-2xl border border-slate-800 bg-[#0F172A] text-slate-100 shadow-xl overflow-hidden font-sans ${className}`}>
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black tracking-tight text-white">
                Console Diagnostica & Log Viewer
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Sanitizzato
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Monitoraggio real-time di chiamate di rete, adattatori volontari, notifiche push e ciclo di vita.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleGenerateTestLogs}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            title="Genera eventi di test per verificare il log viewer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Simula Eventi</span>
          </button>

          <button
            onClick={handleCopyLogs}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            title="Copia log correnti in formato JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
            <span>{copied ? 'Copiati!' : 'Copia'}</span>
          </button>

          <button
            onClick={handleClear}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 border border-slate-700 text-slate-400 hover:text-rose-400 transition cursor-pointer"
            title="Pulisci log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 sm:p-4 bg-slate-900/40 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Categoria:
          </span>
          {(['ALL', 'network', 'adapter', 'lifecycle', 'push'] as const).map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                {cat === 'ALL' && <span>Tutti ({counts.total})</span>}
                {cat === 'network' && <><Wifi className="w-3 h-3" /> Network</>}
                {cat === 'adapter' && <><Database className="w-3 h-3" /> Adapter</>}
                {cat === 'lifecycle' && <><Activity className="w-3 h-3" /> Lifecycle</>}
                {cat === 'push' && <><Bell className="w-3 h-3" /> Push</>}
              </button>
            );
          })}
        </div>

        {/* Level and Search filters */}
        <div className="flex items-center gap-2">
          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={e => setSelectedLevel(e.target.value as LogLevel | 'ALL')}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
          >
            <option value="ALL">Livello: Tutti</option>
            <option value="info">Solo Info ({counts.info})</option>
            <option value="warn">Solo Warning ({counts.warn})</option>
            <option value="error">Solo Errori ({counts.error})</option>
          </select>

          {/* Search Bar */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtra testo log..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/90 text-slate-200 placeholder:text-slate-500 border border-slate-700 rounded-xl pl-8 pr-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Log Entries List View */}
      <div className={`p-3 space-y-2 overflow-y-auto ${compact ? 'max-h-[320px]' : 'max-h-[480px]'}`}>
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <Terminal className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
            <p className="text-xs font-semibold">Nessun evento registrato corrispondente ai filtri.</p>
            <p className="text-[11px] text-slate-600">
              Usa l'app o il pulsante "Simula Eventi" per generare voci nella console.
            </p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const catInfo = getCategoryBadge(log.category);
            const lvlStyle = getLevelStyle(log.level);
            const isExpanded = Boolean(expandedLogIds[log.id]);
            const hasDetails = log.details !== undefined;

            return (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition text-xs font-mono space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Timestamp */}
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">
                      {log.timestamp}
                    </span>

                    {/* Category Badge */}
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${catInfo.badge}`}>
                      {catInfo.icon}
                      <span>{catInfo.label}</span>
                    </span>

                    {/* Level Indicator */}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border flex items-center gap-1 ${lvlStyle.bg} ${lvlStyle.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${lvlStyle.dot}`} />
                      {log.level}
                    </span>
                  </div>

                  {hasDetails && (
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Dettagli</span>
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Log Message */}
                <p className="text-slate-200 font-medium leading-relaxed break-words">
                  {log.message}
                </p>

                {/* Expandable JSON Details */}
                {hasDetails && isExpanded && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto">
                    <pre className="whitespace-pre-wrap font-mono">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="p-2.5 sm:p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Debugger Attivo
          </span>
          <span>Log memorizzati: <strong className="text-slate-200">{counts.total}</strong></span>
        </div>
        <span className="text-slate-500 hidden sm:inline">
          Nessun token sensibile o password memorizzata nei log.
        </span>
      </div>
    </div>
  );
};
