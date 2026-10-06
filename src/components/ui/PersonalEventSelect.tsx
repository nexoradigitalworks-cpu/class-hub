import React from 'react';
import { FormSelect } from './FormSelect';

export interface PersonalCategoryOption {
  value: string;
  label: string;
  description: string;
  defaultDurationMinutes: number;
  presets: string[];
}

export const PERSONAL_CATEGORIES: PersonalCategoryOption[] = [
  {
    value: 'STUDIO',
    label: 'Studio & Ripasso Individuale',
    description: 'Preparazione verifiche, riassunti ed esercizi personali',
    defaultDurationMinutes: 120,
    presets: [
      'Studio Verifica di Matematica',
      'Ripasso Filosofia & Schemi',
      'Esercizi di Fisica - Circuiti',
      'Traduzione versione di Latino'
    ]
  },
  {
    value: 'RIPETIZIONI',
    label: 'Ripetizioni & Tutoraggio',
    description: 'Lezioni private pomeridiane con docente o compagni',
    defaultDurationMinutes: 60,
    presets: [
      'Ripetizioni Matematica con Prof.',
      'Lezione di Inglese con madrelingua',
      'Tutoraggio Chimica & Biologia'
    ]
  },
  {
    value: 'SALUTE',
    label: 'Salute & Visite Mediche',
    description: 'Dentista, visite specialistiche o certificati',
    defaultDurationMinutes: 60,
    presets: [
      'Visita dal Dentista',
      'Visita Medico Curante / Certificato',
      'Fisioterapia / Riabilitazione'
    ]
  },
  {
    value: 'SPORT',
    label: 'Sport, Palestra & Gare',
    description: 'Allenamenti pomeridiani, partite o palestra',
    defaultDurationMinutes: 90,
    presets: [
      'Allenamento Calcio / Basket',
      'Sessione in Palestra',
      'Partita / Torneo di Campionato'
    ]
  },
  {
    value: 'CORSI',
    label: 'Guida Patente & Certificazioni',
    description: 'Scuola guida, lezioni di teoria o corsi di lingua',
    defaultDurationMinutes: 60,
    presets: [
      'Guida pratica Autoscuola (Patente B)',
      'Lezione di Teoria Scuola Guida',
      'Corso Certificazione Cambridge (C1)'
    ]
  },
  {
    value: 'FAMIGLIA',
    label: 'Impegno Familiare o Personale',
    description: 'Eventi di famiglia, viaggi o impegni extrascolastici',
    defaultDurationMinutes: 120,
    presets: [
      'Compleanno o Cena di Famiglia',
      'Viaggio / Weekend fuori',
      'Impegno Personale Privato'
    ]
  }
];

const categorySelectOptions = PERSONAL_CATEGORIES.map(c => ({
  value: c.value,
  label: c.label,
  description: c.description
}));

interface PersonalEventSelectProps {
  value: string;
  onChange: (categoryValue: string) => void;
  onSelectPreset?: (presetTitle: string, durationMinutes: number) => void;
  label?: string;
  className?: string;
}

export const PersonalEventSelect: React.FC<PersonalEventSelectProps> = ({
  value,
  onChange,
  onSelectPreset,
  label = 'Categoria Impegno Personale (Visibile solo a te)',
  className = ''
}) => {
  const selectedCategory = PERSONAL_CATEGORIES.find(c => c.value === value) || PERSONAL_CATEGORIES[0];

  return (
    <div className={`space-y-2.5 ${className}`}>
      <FormSelect
        label={label}
        value={value}
        onChange={onChange}
        options={categorySelectOptions}
      />

      {onSelectPreset && selectedCategory.presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Esempi rapidi:
          </span>
          {selectedCategory.presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onSelectPreset(preset, selectedCategory.defaultDurationMinutes)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition text-left truncate shadow-2xs"
            >
              + {preset}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
