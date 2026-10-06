import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  colorDot?: string;
  badge?: string;
  badgeClass?: string;
  description?: string;
  group?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  compact?: boolean;
  align?: 'left' | 'right';
  searchable?: boolean;
  searchPlaceholder?: string;
  clearable?: boolean;
  quickChips?: SelectOption[];
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder = 'Seleziona opzione...',
  disabled = false,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  compact = false,
  align = 'left',
  searchable,
  searchPlaceholder = 'Cerca tra le opzioni...',
  clearable = false,
  quickChips
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Auto-enable search if more than 5 options unless explicitly turned off
  const isSearchEnabled = searchable !== undefined ? searchable : options.length > 5;

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(q) ||
      (opt.description && opt.description.toLowerCase().includes(q)) ||
      (opt.badge && opt.badge.toLowerCase().includes(q)) ||
      (opt.group && opt.group.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  // Group filtered options if groups exist
  const groupedOptions = useMemo(() => {
    const hasGroups = filteredOptions.some(opt => Boolean(opt.group));
    if (!hasGroups) return null;

    const groupsMap = new Map<string, SelectOption[]>();
    filteredOptions.forEach(opt => {
      const g = opt.group || 'Altro';
      if (!groupsMap.has(g)) groupsMap.set(g, []);
      groupsMap.get(g)!.push(opt);
    });

    return Array.from(groupsMap.entries()).map(([name, items]) => ({
      name,
      items
    }));
  }, [filteredOptions]);

  // Handle position detection
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If less than 240px below and more space above, open upward
      if (spaceBelow < 240 && spaceAbove > 240) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
      setSearchQuery('');
      setFocusedIndex(-1);

      if (isSearchEnabled) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }
  }, [isOpen, isSearchEnabled]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        onChange(filteredOptions[focusedIndex].value);
        setIsOpen(false);
      }
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${isOpen ? 'z-[100]' : 'z-10'} w-full ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-tight">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 rounded-xl transition-all select-none text-left border ${
          compact ? 'px-3 py-1.5 text-xs h-[38px]' : 'px-3.5 py-2.5 text-sm h-11'
        } ${
          disabled
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
              ? 'bg-white border-[#2563EB] ring-2 ring-blue-500/20 shadow-sm'
              : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs active:scale-[0.995]'
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="shrink-0 text-slate-500 transition-colors">
                  {selectedOption.icon}
                </span>
              )}
              {selectedOption.colorDot && (
                <span className={`w-2 h-2 rounded-full shrink-0 ring-2 ring-white shadow-2xs ${selectedOption.colorDot}`} />
              )}
              <span className="font-semibold truncate text-slate-900">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${selectedOption.badgeClass || 'bg-slate-100 text-slate-600'}`}>
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400 font-normal truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {clearable && selectedOption && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              title="Rimuovi selezione"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#2563EB]' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpward ? -4 : 4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? -4 : 4, scale: 0.99 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute z-[110] w-full min-w-[220px] bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col ${
              openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            } ${align === 'right' ? 'right-0' : 'left-0'} ${menuClassName}`}
          >
            {/* Search Input Bar */}
            {isSearchEnabled && (
              <div className="p-2 border-b border-slate-100 bg-slate-50/80 shrink-0">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Chips */}
            {quickChips && quickChips.length > 0 && !searchQuery && (
              <div className="px-2.5 py-1.5 border-b border-slate-100 bg-slate-50/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                  Frequenti:
                </span>
                {quickChips.map(chip => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => handleSelect(chip.value)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shrink-0 ${
                      value === chip.value
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {chip.colorDot && (
                      <span className={`w-1.5 h-1.5 rounded-full ${chip.colorDot}`} />
                    )}
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Options List */}
            <div 
              ref={listRef}
              className="py-1 max-h-56 overflow-y-auto scrollbar-thin divide-y divide-slate-50"
            >
              {filteredOptions.length === 0 ? (
                <div className="py-6 px-4 text-center">
                  <p className="text-xs font-semibold text-slate-400">Nessuna opzione trovata</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Prova a digitare un termine differente</p>
                </div>
              ) : groupedOptions ? (
                groupedOptions.map((group) => (
                  <div key={group.name} className="py-1">
                    <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                      {group.name}
                    </div>
                    {group.items.map((option) => {
                      const isSelected = option.value === value;
                      const globalIdx = filteredOptions.findIndex(o => o.value === option.value);
                      const isFocused = focusedIndex === globalIdx;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelect(option.value)}
                          onMouseEnter={() => setFocusedIndex(globalIdx)}
                          className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-left transition-colors text-xs ${
                            isSelected
                              ? 'bg-blue-50 text-[#2563EB] font-bold'
                              : isFocused
                                ? 'bg-slate-50 text-slate-900 font-medium'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 truncate flex-1">
                            {option.icon && (
                              <span className={`shrink-0 ${isSelected ? 'text-[#2563EB]' : 'text-slate-400'}`}>
                                {option.icon}
                              </span>
                            )}
                            {option.colorDot && (
                              <span className={`w-2 h-2 rounded-full shrink-0 ${option.colorDot}`} />
                            )}
                            
                            <div className="truncate flex-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="truncate">{option.label}</span>
                                {option.badge && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${option.badgeClass || 'bg-slate-100 text-slate-600'}`}>
                                    {option.badge}
                                  </span>
                                )}
                              </div>
                              {option.description && (
                                <p className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                                  {option.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                filteredOptions.map((option, idx) => {
                  const isSelected = option.value === value;
                  const isFocused = focusedIndex === idx;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setFocusedIndex(idx)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-left transition-colors text-xs ${
                        isSelected
                          ? 'bg-blue-50 text-[#2563EB] font-bold'
                          : isFocused
                            ? 'bg-slate-50 text-slate-900 font-medium'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 truncate flex-1">
                        {option.icon && (
                          <span className={`shrink-0 ${isSelected ? 'text-[#2563EB]' : 'text-slate-400'}`}>
                            {option.icon}
                          </span>
                        )}
                        {option.colorDot && (
                          <span className={`w-2 h-2 rounded-full shrink-0 ${option.colorDot}`} />
                        )}
                        
                        <div className="truncate flex-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="truncate">{option.label}</span>
                            {option.badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${option.badgeClass || 'bg-slate-100 text-slate-600'}`}>
                                {option.badge}
                              </span>
                            )}
                          </div>
                          {option.description && (
                            <p className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                              {option.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Quiet Footer */}
            <div className="px-3 py-1.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
              <span>{filteredOptions.length} opzioni</span>
              <span className="text-slate-400 font-medium">Invio per confermare</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
