import React from 'react';
import { ChevronDown } from 'lucide-react';
import { SelectOption } from './CustomSelect';

interface FormSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  required?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder,
  disabled = false,
  className = '',
  compact = false,
  required = false
}) => {
  // Check if options have groups
  const hasGroups = options.some(opt => Boolean(opt.group));

  let groupedOptions: { name: string; items: SelectOption[] }[] = [];
  if (hasGroups) {
    const groupsMap = new Map<string, SelectOption[]>();
    options.forEach(opt => {
      const g = opt.group || 'Altro';
      if (!groupsMap.has(g)) groupsMap.set(g, []);
      groupsMap.get(g)!.push(opt);
    });
    groupedOptions = Array.from(groupsMap.entries()).map(([name, items]) => ({
      name,
      items
    }));
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-tight">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative w-full">
        <select
          value={value}
          disabled={disabled}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-white border border-slate-200 text-slate-900 rounded-xl font-medium transition shadow-2xs appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
            compact 
              ? 'h-[38px] pl-3 pr-8 text-xs' 
              : 'h-11 pl-3.5 pr-10 text-sm'
          } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'hover:border-slate-300'}`}
        >
          {placeholder && (
            <option value="" disabled className="text-slate-400">
              {placeholder}
            </option>
          )}

          {hasGroups
            ? groupedOptions.map((group) => (
                <optgroup key={group.name} label={group.name} className="font-bold text-slate-900">
                  {group.items.map((opt) => (
                    <option key={opt.value} value={opt.value} className="font-normal text-slate-800 py-1">
                      {opt.label} {opt.description ? ` (${opt.description})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))
            : options.map((opt) => (
                <option key={opt.value} value={opt.value} className="font-normal text-slate-800 py-1">
                  {opt.label} {opt.badge ? ` [${opt.badge}]` : ''} {opt.description ? ` - ${opt.description}` : ''}
                </option>
              ))}
        </select>

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center">
          <ChevronDown className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        </div>
      </div>
    </div>
  );
};
