export interface AvatarOption {
  id: string;
  name: string;
  bg: string;
  text: string;
  border: string;
  iconName: string;
}

export const PREDEFINED_AVATARS: AvatarOption[] = [
  { id: 'avatar-blue', name: 'Blu Studio', bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', iconName: 'GraduationCap' },
  { id: 'avatar-indigo', name: 'Indaco Scienza', bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700', iconName: 'Atom' },
  { id: 'avatar-purple', name: 'Viola Filosofia', bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700', iconName: 'Sparkles' },
  { id: 'avatar-emerald', name: 'Smeraldo Botanica', bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700', iconName: 'Compass' },
  { id: 'avatar-teal', name: 'Teal Matematica', bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-700', iconName: 'Calculator' },
  { id: 'avatar-rose', name: 'Rosa Letteratura', bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600', iconName: 'BookOpen' },
  { id: 'avatar-amber', name: 'Ambra Storia', bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-700', iconName: 'Landmark' },
  { id: 'avatar-cyan', name: 'Ciano Fisica', bg: 'bg-cyan-600', text: 'text-white', border: 'border-cyan-700', iconName: 'Telescope' },
  { id: 'avatar-slate', name: 'Grafite Aula', bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-800', iconName: 'Shield' },
  { id: 'avatar-violet', name: 'Lavanda Arte', bg: 'bg-violet-600', text: 'text-white', border: 'border-violet-700', iconName: 'Palette' },
];

export const AVATAR_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'avatar-1': { bg: 'bg-indigo-600', text: 'text-white', label: 'AC' },
  'avatar-2': { bg: 'bg-emerald-600', text: 'text-white', label: 'SB' },
  'avatar-3': { bg: 'bg-blue-600', text: 'text-white', label: 'MR' },
  'avatar-4': { bg: 'bg-rose-500', text: 'text-white', label: 'GF' },
  'avatar-5': { bg: 'bg-amber-600', text: 'text-white', label: 'LM' },
  'avatar-6': { bg: 'bg-purple-600', text: 'text-white', label: 'EC' },
  'avatar-7': { bg: 'bg-teal-600', text: 'text-white', label: 'MR' },
  'avatar-blue': { bg: 'bg-blue-600', text: 'text-white', label: 'CH' },
  'avatar-indigo': { bg: 'bg-indigo-600', text: 'text-white', label: 'CH' },
  'avatar-purple': { bg: 'bg-purple-600', text: 'text-white', label: 'CH' },
  'avatar-emerald': { bg: 'bg-emerald-600', text: 'text-white', label: 'CH' },
  'avatar-teal': { bg: 'bg-teal-600', text: 'text-white', label: 'CH' },
  'avatar-rose': { bg: 'bg-rose-500', text: 'text-white', label: 'CH' },
  'avatar-amber': { bg: 'bg-amber-600', text: 'text-white', label: 'CH' },
  'avatar-cyan': { bg: 'bg-cyan-600', text: 'text-white', label: 'CH' },
  'avatar-slate': { bg: 'bg-slate-700', text: 'text-white', label: 'CH' },
  'avatar-violet': { bg: 'bg-violet-600', text: 'text-white', label: 'CH' },
};

export const ROLE_LABELS: Record<string, { title: string; badge: string; desc: string }> = {
  STUDENT: {
    title: 'Studente',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    desc: 'Visualizzazione classe, prenotazione volontari, impegni personali'
  },
  CONTROLLER: {
    title: 'Controller',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    desc: 'Gestione eventi collettivi, interrogazioni, compiti e avvisi'
  },
  ADMIN: {
    title: 'Admin',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    desc: 'Accesso totale, gestione ruoli membri e configurazione classe'
  }
};

export const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Matematica: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Fisica: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  Filosofia: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Storia: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Italiano: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Latino: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Inglese: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  Scienze: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  Arte: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  Attività: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Personale: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

export const getSubjectStyle = (subject?: string) => {
  if (!subject) return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  return SUBJECT_COLORS[subject] || { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
};
