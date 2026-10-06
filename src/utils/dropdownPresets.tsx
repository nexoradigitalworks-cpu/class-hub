import React from 'react';
import { 
  Calculator, Atom, BookOpen, Clock, Globe, 
  Palette, Dumbbell, Sparkles, Scroll, FileText, 
  Image, Link, Presentation, AlertTriangle, Bell, 
  User, UserCog, ShieldCheck, Calendar, CheckSquare,
  MessageSquare, HelpCircle, CheckCircle2, XCircle, Users
} from 'lucide-react';
import { SelectOption } from '../components/ui/CustomSelect';

export const SUBJECT_OPTIONS: SelectOption[] = [
  // Materie Scientifiche
  { 
    value: 'Matematica', 
    label: 'Matematica', 
    icon: <Calculator className="w-3.5 h-3.5" />,
    colorDot: 'bg-blue-600',
    description: 'Algebra, Trigonometria, Limiti e Derivate',
    group: 'Materie Scientifiche'
  },
  { 
    value: 'Fisica', 
    label: 'Fisica', 
    icon: <Atom className="w-3.5 h-3.5" />,
    colorDot: 'bg-cyan-600',
    description: 'Elettromagnetismo, Dinamica e Gauss',
    group: 'Materie Scientifiche'
  },
  { 
    value: 'Scienze', 
    label: 'Scienze Naturali & Chimica', 
    icon: <Atom className="w-3.5 h-3.5" />,
    colorDot: 'bg-teal-600',
    description: 'Chimica organica, Biologia e Terra',
    group: 'Materie Scientifiche'
  },

  // Materie Umanistiche
  { 
    value: 'Italiano', 
    label: 'Italiano (Letteratura)', 
    icon: <BookOpen className="w-3.5 h-3.5" />,
    colorDot: 'bg-emerald-600',
    description: 'Dante, Manzoni, Romanticismo e Verismo',
    group: 'Materie Umanistiche'
  },
  { 
    value: 'Filosofia', 
    label: 'Filosofia', 
    icon: <BookOpen className="w-3.5 h-3.5" />,
    colorDot: 'bg-purple-600',
    description: 'Da Kant a Schopenhauer e Nietzsche',
    group: 'Materie Umanistiche'
  },
  { 
    value: 'Storia', 
    label: 'Storia Contemporanea', 
    icon: <Clock className="w-3.5 h-3.5" />,
    colorDot: 'bg-amber-600',
    description: 'Età Moderna, Risorgimento e Novecento',
    group: 'Materie Umanistiche'
  },
  { 
    value: 'Latino', 
    label: 'Latino (Testi & Versione)', 
    icon: <Scroll className="w-3.5 h-3.5" />,
    colorDot: 'bg-rose-600',
    description: 'Tacito, Seneca, Cicerone e Traduzione',
    group: 'Materie Umanistiche'
  },
  { 
    value: 'Inglese', 
    label: 'Inglese (Literature)', 
    icon: <Globe className="w-3.5 h-3.5" />,
    colorDot: 'bg-indigo-600',
    description: 'Literature, Victorian Age & Global English',
    group: 'Materie Umanistiche'
  },

  // Altre Materie & Attività
  { 
    value: 'Arte', 
    label: 'Disegno & Storia dell\'Arte', 
    icon: <Palette className="w-3.5 h-3.5" />,
    colorDot: 'bg-pink-600',
    description: 'Dal Neoclassicismo al Romanticismo',
    group: 'Arte, Sport & Attività'
  },
  { 
    value: 'Scienze Motorie', 
    label: 'Scienze Motorie', 
    icon: <Dumbbell className="w-3.5 h-3.5" />,
    colorDot: 'bg-orange-600',
    description: 'Attività sportiva in palestra e tornei',
    group: 'Arte, Sport & Attività'
  },
  { 
    value: 'Attività', 
    label: 'Attività di Classe / Assemblea', 
    icon: <Sparkles className="w-3.5 h-3.5" />,
    colorDot: 'bg-slate-600',
    description: 'Assemblee, orientamento e uscite',
    group: 'Arte, Sport & Attività'
  }
];

export const FREQUENT_SUBJECT_CHIPS: SelectOption[] = [
  { value: 'Matematica', label: 'Matematica', colorDot: 'bg-blue-600' },
  { value: 'Italiano', label: 'Italiano', colorDot: 'bg-emerald-600' },
  { value: 'Filosofia', label: 'Filosofia', colorDot: 'bg-purple-600' },
  { value: 'Fisica', label: 'Fisica', colorDot: 'bg-cyan-600' }
];

export const MAX_VOLUNTEERS_OPTIONS: SelectOption[] = [
  {
    value: '1',
    label: '1 Volontario',
    icon: <Users className="w-3.5 h-3.5 text-slate-500" />,
    badge: 'Singola',
    badgeClass: 'bg-slate-100 text-slate-700',
    description: 'Verifica approfondita individuale (30-45 min)'
  },
  {
    value: '2',
    label: '2 Volontari',
    icon: <Users className="w-3.5 h-3.5 text-blue-600" />,
    badge: 'Coppia',
    badgeClass: 'bg-blue-100 text-blue-700',
    description: 'Adatto a un’ora classica di lezione (25 min ciascuno)'
  },
  {
    value: '3',
    label: '3 Volontari (Consigliato)',
    icon: <Users className="w-3.5 h-3.5 text-purple-600" />,
    badge: 'Standard',
    badgeClass: 'bg-purple-100 text-purple-700',
    description: 'Formato standard per interrogazioni orali medie'
  },
  {
    value: '4',
    label: '4 Volontari',
    icon: <Users className="w-3.5 h-3.5 text-emerald-600" />,
    badge: 'Gruppo',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    description: 'Interrogazioni rapide o sessione su due ore'
  },
  {
    value: '5',
    label: '5 Volontari (Sessione Estesa)',
    icon: <Users className="w-3.5 h-3.5 text-amber-600" />,
    badge: 'Estesa',
    badgeClass: 'bg-amber-100 text-amber-700',
    description: 'Sessione di recupero su più ore di lezione'
  }
];

export const EVENT_TYPE_OPTIONS: SelectOption[] = [
  {
    value: 'VERIFICA',
    label: 'Verifica Scritta',
    icon: <FileText className="w-3.5 h-3.5 text-blue-600" />,
    badge: 'Scritto',
    badgeClass: 'bg-blue-100 text-blue-700',
    colorDot: 'bg-blue-600',
    description: 'Compito in classe formale con voto'
  },
  {
    value: 'INTERROGAZIONE',
    label: 'Interrogazione Orale (Collettiva)',
    icon: <Clock className="w-3.5 h-3.5 text-purple-600" />,
    badge: 'Orale',
    badgeClass: 'bg-purple-100 text-purple-700',
    colorDot: 'bg-purple-600',
    description: 'Sessione con slot volontari per gli studenti'
  },
  {
    value: 'EVENTO',
    label: 'Assemblea, Uscita o Visita',
    icon: <Calendar className="w-3.5 h-3.5 text-emerald-600" />,
    badge: 'Collettivo',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    colorDot: 'bg-emerald-600',
    description: 'Attività straordinaria, gita o assemblea'
  }
];

export const ROLE_OPTIONS: SelectOption[] = [
  {
    value: 'STUDENT',
    label: 'Studente',
    icon: <User className="w-3.5 h-3.5 text-slate-500" />,
    badge: 'Studente',
    badgeClass: 'bg-slate-100 text-slate-700',
    colorDot: 'bg-slate-500',
    description: 'Accesso standard e prenotazione volontari'
  },
  {
    value: 'CONTROLLER',
    label: 'Controller (Rappresentante)',
    icon: <UserCog className="w-3.5 h-3.5 text-blue-600" />,
    badge: 'Controller',
    badgeClass: 'bg-blue-100 text-blue-700',
    colorDot: 'bg-blue-600',
    description: 'Creazione verifiche, interrogazioni e avvisi'
  },
  {
    value: 'ADMIN',
    label: 'Admin (Capoclasse)',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />,
    badge: 'Admin',
    badgeClass: 'bg-purple-100 text-purple-700',
    colorDot: 'bg-purple-600',
    description: 'Gestione ruoli, codici e impostazioni classe'
  }
];

export const PRIORITY_OPTIONS: SelectOption[] = [
  {
    value: 'NORMAL',
    label: 'Priorità Ordinaria',
    icon: <Bell className="w-3.5 h-3.5 text-slate-500" />,
    badge: 'Standard',
    badgeClass: 'bg-slate-100 text-slate-600',
    colorDot: 'bg-slate-400',
    description: 'Comunicazione ordinaria di classe'
  },
  {
    value: 'HIGH',
    label: 'Alta Priorità / Urgente',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
    badge: 'Urgente',
    badgeClass: 'bg-red-100 text-red-700',
    colorDot: 'bg-red-600',
    description: 'Notifica in evidenza con badge rosso'
  }
];

export const FILE_FORMAT_OPTIONS: SelectOption[] = [
  {
    value: 'PDF',
    label: 'Documento PDF',
    icon: <FileText className="w-3.5 h-3.5 text-rose-600" />,
    badge: 'PDF',
    badgeClass: 'bg-rose-100 text-rose-700',
    description: 'Anteprima e lettura diretta nel browser'
  },
  {
    value: 'PNG',
    label: 'Immagine (PNG / JPG)',
    icon: <Image className="w-3.5 h-3.5 text-emerald-600" />,
    badge: 'Immagine',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    description: 'Schemi, mappe concettuali e foto appunti'
  },
  {
    value: 'SLIDES',
    label: 'Presentazione / Slide',
    icon: <Presentation className="w-3.5 h-3.5 text-amber-600" />,
    badge: 'Slide',
    badgeClass: 'bg-amber-100 text-amber-700',
    description: 'Slide dei docenti in PowerPoint o Keynote'
  },
  {
    value: 'DOC',
    label: 'Documento Word / Testo',
    icon: <FileText className="w-3.5 h-3.5 text-blue-600" />,
    badge: 'DOCX',
    badgeClass: 'bg-blue-100 text-blue-700',
    description: 'File modificabili o testi'
  },
  {
    value: 'LINK',
    label: 'Collegamento Web / Drive',
    icon: <Link className="w-3.5 h-3.5 text-cyan-600" />,
    badge: 'Link',
    badgeClass: 'bg-cyan-100 text-cyan-700',
    description: 'Cartella Drive condivisa o link risorsa esterna'
  }
];

export const REPRESENTATION_CATEGORY_OPTIONS: SelectOption[] = [
  {
    value: 'PROPOSTA',
    label: 'Proposta per la Classe o Istituto',
    icon: <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />,
    badge: 'Proposta',
    badgeClass: 'bg-indigo-100 text-indigo-700',
    description: 'Migliorie in aula, laboratori o attività'
  },
  {
    value: 'DOMANDA_PROF',
    label: 'Richiesta a un Docente',
    icon: <HelpCircle className="w-3.5 h-3.5 text-blue-600" />,
    badge: 'Professori',
    badgeClass: 'bg-blue-100 text-blue-700',
    description: 'Spostamento verifiche o chiarimenti lezioni'
  },
  {
    value: 'ASSEMBLEA',
    label: 'Ordine del Giorno Assemblea',
    icon: <Clock className="w-3.5 h-3.5 text-purple-600" />,
    badge: 'Assemblea',
    badgeClass: 'bg-purple-100 text-purple-700',
    description: 'Punto di discussione per la prossima assemblea'
  },
  {
    value: 'OBIETTIVO',
    label: 'Obiettivo di Classe',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    badge: 'Obiettivo',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    description: 'Progetti comuni da raggiungere insieme'
  },
  {
    value: 'ATTIVITA',
    label: 'Attività Ricreativa o Torneo',
    icon: <Sparkles className="w-3.5 h-3.5 text-amber-600" />,
    badge: 'Attività',
    badgeClass: 'bg-amber-100 text-amber-700',
    description: 'Tornei sportivi, feste o uscite didattiche'
  }
];

export const STATUS_OPTIONS: SelectOption[] = [
  {
    value: 'IN_ATTESA',
    label: 'In Attesa',
    colorDot: 'bg-slate-400',
    badge: 'In attesa',
    badgeClass: 'bg-slate-100 text-slate-700',
    description: 'In attesa di presa in carico'
  },
  {
    value: 'IN_CORSO',
    label: 'In Corso di Valutazione',
    colorDot: 'bg-amber-500',
    badge: 'In corso',
    badgeClass: 'bg-amber-100 text-amber-800',
    description: 'Sotto esame da parte dei rappresentanti'
  },
  {
    value: 'DISCUSSO',
    label: 'Discusso in Assemblea',
    colorDot: 'bg-blue-500',
    badge: 'Discusso',
    badgeClass: 'bg-blue-100 text-blue-800',
    description: 'Argomento trattato collegialmente'
  },
  {
    value: 'APPROVATO',
    label: 'Approvato dal Docente / Consiglio',
    colorDot: 'bg-emerald-500',
    badge: 'Approvato',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    description: 'Accolto e programmato'
  },
  {
    value: 'RESPINTO',
    label: 'Respinto',
    colorDot: 'bg-rose-500',
    badge: 'Respinto',
    badgeClass: 'bg-rose-100 text-rose-800',
    description: 'Non attuabile o bocciato'
  }
];
