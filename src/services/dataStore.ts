import { format, addDays } from 'date-fns';
import { 
  UserProfile, CalendarEvent, Interrogation, Notice, 
  MaterialItem, Survey, RepresentationItem, VolunteerSlot, UserRole,
  ClassroomControl, TimetableSlot 
} from '../types';

const STORAGE_KEY = 'classhub_db_state_v3';

// Preset sample users including fake students and fake controllers
export const PRESET_USERS: UserProfile[] = [
  {
    uid: 'developer-test-uid',
    firstName: 'ClassHub Developer',
    lastName: 'Test Account',
    email: 'developer.test@classhub.edu',
    role: 'ADMIN',
    avatarId: 'avatar-indigo',
    classId: 'cls-dev-test',
    className: 'ClassHub — Developer Test',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'sofia-controller-uid',
    firstName: 'Sofia',
    lastName: 'Bianchi',
    email: 'sofia.bianchi@liceo.edu.it',
    role: 'CONTROLLER',
    avatarId: 'avatar-emerald',
    classId: 'cls-dev-test',
    className: 'ClassHub — Developer Test',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'matteo-controller-uid',
    firstName: 'Matteo',
    lastName: 'Ferrari',
    email: 'matteo.ferrari@liceo.edu.it',
    role: 'CONTROLLER',
    avatarId: 'avatar-amber',
    classId: 'cls-dev-test',
    className: 'ClassHub — Developer Test',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'marco-student-uid',
    firstName: 'Marco',
    lastName: 'Rossi',
    email: 'marco.rossi@liceo.edu.it',
    role: 'STUDENT',
    avatarId: 'avatar-blue',
    classId: 'cls-dev-test',
    className: 'ClassHub — Developer Test',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'giulia-student-uid',
    firstName: 'Giulia',
    lastName: 'Romano',
    email: 'giulia.romano@liceo.edu.it',
    role: 'STUDENT',
    avatarId: 'avatar-purple',
    classId: 'cls-dev-test',
    className: 'ClassHub — Developer Test',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'alessandro-student-uid',
    firstName: 'Alessandro',
    lastName: 'Russo',
    email: 'alessandro.russo@liceo.edu.it',
    role: 'STUDENT',
    avatarId: 'avatar-teal',
    classId: 'cls-dev-test',
    className: 'ClassHub — Developer Test',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'chiara-student-uid',
    firstName: 'Chiara',
    lastName: 'Colombo',
    email: 'chiara.colombo@liceo.edu.it',
    role: 'STUDENT',
    avatarId: 'avatar-rose',
    classId: 'cls-dev-test',
    className: 'ClassHub — Developer Test',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'lorenzo-student-uid',
    firstName: 'Lorenzo',
    lastName: 'Ricci',
    email: 'lorenzo.ricci@liceo.edu.it',
    role: 'STUDENT',
    avatarId: 'avatar-cyan',
    classId: 'cls-dev-test',
    className: 'ClassHub — Developer Test',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'elena-student-uid',
    firstName: 'Elena',
    lastName: 'Marino',
    email: 'elena.marino@liceo.edu.it',
    role: 'STUDENT',
    avatarId: 'avatar-violet',
    classId: 'cls-dev-test',
    className: 'ClassHub — Developer Test',
    createdAt: new Date().toISOString()
  }
];

export interface ClassHubDataState {
  users: Record<string, UserProfile>;
  events: Record<string, CalendarEvent>;
  interrogations: Record<string, Interrogation>;
  notices: Record<string, Notice>;
  materials: Record<string, MaterialItem>;
  surveys: Record<string, Survey>;
  representation: Record<string, RepresentationItem>;
  classroomControl: ClassroomControl;
  timetable: TimetableSlot[];
}

const DEFAULT_TIMETABLE: TimetableSlot[] = [
  // Lunedì (1)
  { id: 'tt-1-1', dayOfWeek: 1, hour: 1, timeRange: '08:00 - 09:00', subject: 'Italiano', teacher: 'Prof. De Luca', room: 'Aula 24' },
  { id: 'tt-1-2', dayOfWeek: 1, hour: 2, timeRange: '09:00 - 10:00', subject: 'Italiano', teacher: 'Prof. De Luca', room: 'Aula 24' },
  { id: 'tt-1-3', dayOfWeek: 1, hour: 3, timeRange: '10:00 - 11:00', subject: 'Matematica', teacher: 'Prof. Barbieri', room: 'Aula 24' },
  { id: 'tt-1-4', dayOfWeek: 1, hour: 4, timeRange: '11:15 - 12:15', subject: 'Fisica', teacher: 'Prof. Rinaldi', room: 'Lab. Fisica' },
  { id: 'tt-1-5', dayOfWeek: 1, hour: 5, timeRange: '12:15 - 13:15', subject: 'Inglese', teacher: 'Prof. Smith', room: 'Aula 24' },

  // Martedì (2)
  { id: 'tt-2-1', dayOfWeek: 2, hour: 1, timeRange: '08:00 - 09:00', subject: 'Filosofia', teacher: 'Prof.ssa Martini', room: 'Aula 24' },
  { id: 'tt-2-2', dayOfWeek: 2, hour: 2, timeRange: '09:00 - 10:00', subject: 'Storia', teacher: 'Prof.ssa Martini', room: 'Aula 24' },
  { id: 'tt-2-3', dayOfWeek: 2, hour: 3, timeRange: '10:00 - 11:00', subject: 'Latino', teacher: 'Prof.ssa Gatti', room: 'Aula 24' },
  { id: 'tt-2-4', dayOfWeek: 2, hour: 4, timeRange: '11:15 - 12:15', subject: 'Matematica', teacher: 'Prof. Barbieri', room: 'Aula 24' },
  { id: 'tt-2-5', dayOfWeek: 2, hour: 5, timeRange: '12:15 - 13:15', subject: 'Scienze', teacher: 'Prof.ssa Morelli', room: 'Lab. Chimica' },

  // Mercoledì (3)
  { id: 'tt-3-1', dayOfWeek: 3, hour: 1, timeRange: '08:00 - 09:00', subject: 'Matematica', teacher: 'Prof. Barbieri', room: 'Aula 24' },
  { id: 'tt-3-2', dayOfWeek: 3, hour: 2, timeRange: '09:00 - 10:00', subject: 'Fisica', teacher: 'Prof. Rinaldi', room: 'Aula 24' },
  { id: 'tt-3-3', dayOfWeek: 3, hour: 3, timeRange: '10:00 - 11:00', subject: 'Italiano', teacher: 'Prof. De Luca', room: 'Aula 24' },
  { id: 'tt-3-4', dayOfWeek: 3, hour: 4, timeRange: '11:15 - 12:15', subject: 'Arte', teacher: 'Prof. Valli', room: 'Aula Disegno' },
  { id: 'tt-3-5', dayOfWeek: 3, hour: 5, timeRange: '12:15 - 13:15', subject: 'Inglese', teacher: 'Prof. Smith', room: 'Aula 24' },

  // Giovedì (4)
  { id: 'tt-4-1', dayOfWeek: 4, hour: 1, timeRange: '08:00 - 09:00', subject: 'Latino', teacher: 'Prof.ssa Gatti', room: 'Aula 24' },
  { id: 'tt-4-2', dayOfWeek: 4, hour: 2, timeRange: '09:00 - 10:00', subject: 'Filosofia', teacher: 'Prof.ssa Martini', room: 'Aula 24' },
  { id: 'tt-4-3', dayOfWeek: 4, hour: 3, timeRange: '10:00 - 11:00', subject: 'Scienze', teacher: 'Prof.ssa Morelli', room: 'Aula 24' },
  { id: 'tt-4-4', dayOfWeek: 4, hour: 4, timeRange: '11:15 - 12:15', subject: 'Scienze Motorie', teacher: 'Prof. Costa', room: 'Palestra 1' },
  { id: 'tt-4-5', dayOfWeek: 4, hour: 5, timeRange: '12:15 - 13:15', subject: 'Scienze Motorie', teacher: 'Prof. Costa', room: 'Palestra 1' },

  // Venerdì (5)
  { id: 'tt-5-1', dayOfWeek: 5, hour: 1, timeRange: '08:00 - 09:00', subject: 'Storia', teacher: 'Prof.ssa Martini', room: 'Aula 24' },
  { id: 'tt-5-2', dayOfWeek: 5, hour: 2, timeRange: '09:00 - 10:00', subject: 'Latino', teacher: 'Prof.ssa Gatti', room: 'Aula 24' },
  { id: 'tt-5-3', dayOfWeek: 5, hour: 3, timeRange: '10:00 - 11:00', subject: 'Matematica', teacher: 'Prof. Barbieri', room: 'Aula 24' },
  { id: 'tt-5-4', dayOfWeek: 5, hour: 4, timeRange: '11:15 - 12:15', subject: 'Fisica', teacher: 'Prof. Rinaldi', room: 'Aula 24' },
  { id: 'tt-5-5', dayOfWeek: 5, hour: 5, timeRange: '12:15 - 13:15', subject: 'Italiano', teacher: 'Prof. De Luca', room: 'Aula 24' }
];

const getInitialState = (): ClassHubDataState => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');
  const day3Str = format(addDays(today, 3), 'yyyy-MM-dd');
  const day5Str = format(addDays(today, 5), 'yyyy-MM-dd');
  const day8Str = format(addDays(today, 8), 'yyyy-MM-dd');

  const usersMap: Record<string, UserProfile> = {};
  PRESET_USERS.forEach(u => {
    usersMap[u.uid] = u;
  });

  const events: Record<string, CalendarEvent> = {
    'ev-1': {
      id: 'ev-1',
      title: 'Verifica di Matematica: Limiti Notevoli & Continuità',
      subject: 'Matematica',
      type: 'VERIFICA',
      date: todayStr,
      startTime: '09:00',
      endTime: '11:00',
      teacher: 'Prof. Barbieri',
      description: 'Verifica scritta su forme indeterminate, limiti trigonometrici e asintoti.',
      isPersonal: false,
      authorId: 'sofia-controller-uid',
      authorName: 'Sofia Bianchi (Controller)',
      createdAt: new Date().toISOString()
    },
    'ev-2': {
      id: 'ev-2',
      title: 'Verifica di Fisica: Campo Elettrico e Teorema di Gauss',
      subject: 'Fisica',
      type: 'VERIFICA',
      date: day3Str,
      startTime: '10:00',
      endTime: '12:00',
      teacher: 'Prof. Rinaldi',
      description: 'Portare calcolatrice scientifica non programmabile e formulario approvato.',
      isPersonal: false,
      authorId: 'matteo-controller-uid',
      authorName: 'Matteo Ferrari (Controller)',
      createdAt: new Date().toISOString()
    },
    'ev-3': {
      id: 'ev-3',
      title: 'Assemblea di Classe: Gita & Progetti PCTO',
      subject: 'Attività',
      type: 'EVENTO',
      date: day5Str,
      startTime: '11:15',
      endTime: '13:00',
      description: 'Discussione delle mete per la gita primaverile e aggiornamento registro.',
      isPersonal: false,
      authorId: 'sofia-controller-uid',
      authorName: 'Sofia Bianchi (Controller)',
      createdAt: new Date().toISOString()
    },
    'ev-4': {
      id: 'ev-4',
      title: 'Studio Pomeridiano e Ripasso Personale (Privato)',
      subject: 'Personale',
      type: 'PERSONALE',
      date: tomorrowStr,
      startTime: '15:30',
      endTime: '17:30',
      description: 'Esercizi capitolo 5 e ripasso formule di fisica.',
      isPersonal: true,
      authorId: 'developer-test-uid',
      authorName: 'ClassHub Developer',
      createdAt: new Date().toISOString()
    },
    'ev-5': {
      id: 'ev-5',
      title: 'Laboratorio di Scienze: Reazioni e Titolazioni',
      subject: 'Scienze',
      type: 'EVENTO',
      date: day8Str,
      startTime: '08:15',
      endTime: '10:00',
      teacher: 'Prof.ssa Morelli',
      description: 'Obbligatorio camice bianco per tutti gli alunni in laboratorio.',
      isPersonal: false,
      authorId: 'developer-test-uid',
      authorName: 'ClassHub Developer',
      createdAt: new Date().toISOString()
    }
  };

  const interrogations: Record<string, Interrogation> = {
    'int-1': {
      id: 'int-1',
      title: 'Interrogazione Filosofia: Schopenhauer e il Velo di Maya',
      subject: 'Filosofia',
      date: todayStr,
      startTime: '11:15',
      endTime: '13:00',
      teacher: 'Prof.ssa Martini',
      maxVolunteers: 3,
      status: 'OPEN',
      notes: 'Schopenhauer: Velo di Maya, noumeno, volontà cosmica e le vie di liberazione.',
      volunteers: [
        {
          userId: 'giulia-student-uid',
          userName: 'Giulia Romano',
          userAvatar: 'avatar-purple',
          timestamp: new Date().toISOString()
        },
        {
          userId: 'elena-student-uid',
          userName: 'Elena Marino',
          userAvatar: 'avatar-violet',
          timestamp: new Date().toISOString()
        }
      ],
      volunteerIds: ['giulia-student-uid', 'elena-student-uid']
    },
    'int-2': {
      id: 'int-2',
      title: 'Interrogazione Storia: Congresso di Vienna e Moti Carbonari',
      subject: 'Storia',
      date: tomorrowStr,
      startTime: '09:00',
      endTime: '10:45',
      teacher: 'Prof.ssa Martini',
      maxVolunteers: 2,
      status: 'FULL',
      notes: 'I moti del 1820-21 e 1830 in Europa e la Restaurazione in Italia.',
      volunteers: [
        {
          userId: 'lorenzo-student-uid',
          userName: 'Lorenzo Ricci',
          userAvatar: 'avatar-cyan',
          timestamp: new Date().toISOString()
        },
        {
          userId: 'marco-student-uid',
          userName: 'Marco Rossi',
          userAvatar: 'avatar-blue',
          timestamp: new Date().toISOString()
        }
      ],
      volunteerIds: ['lorenzo-student-uid', 'marco-student-uid']
    },
    'int-3': {
      id: 'int-3',
      title: 'Interrogazione Latino: Tacito e gli Annales (Capitoli 1-4)',
      subject: 'Latino',
      date: day5Str,
      startTime: '10:00',
      endTime: '11:00',
      teacher: 'Prof.ssa Gatti',
      maxVolunteers: 3,
      status: 'OPEN',
      notes: 'Traduzione a vista, contestualizzazione storica e figure retoriche.',
      volunteers: [
        {
          userId: 'alessandro-student-uid',
          userName: 'Alessandro Russo',
          userAvatar: 'avatar-teal',
          timestamp: new Date().toISOString()
        }
      ],
      volunteerIds: ['alessandro-student-uid']
    },
    'int-4': {
      id: 'int-4',
      title: 'Interrogazione Matematica: Derivate e Teorema di Rolle',
      subject: 'Matematica',
      date: day8Str,
      startTime: '09:00',
      endTime: '10:30',
      teacher: 'Prof. Barbieri',
      maxVolunteers: 2,
      status: 'OPEN',
      notes: 'Definizione di derivata, significato geometrico e teoremi del calcolo differenziale.',
      volunteers: [],
      volunteerIds: []
    }
  };

  const notices: Record<string, Notice> = {
    'not-1': {
      id: 'not-1',
      title: 'Circolare n. 142: Modulo autorizzazione viaggio d\'istruzione',
      content: 'Tutti gli studenti devono riconsegnare entro venerdì il modulo firmato dai genitori per la gita.',
      date: todayStr,
      priority: 'HIGH',
      authorName: 'ClassHub Developer (Admin)',
      createdAt: new Date().toISOString()
    },
    'not-2': {
      id: 'not-2',
      title: 'Cambio Aula giovedì per prova simulazione',
      content: 'La 3ª ora di giovedì si terrà in Aula Magna per l\'incontro informativo con la segreteria.',
      date: tomorrowStr,
      priority: 'NORMAL',
      authorName: 'Sofia Bianchi (Controller)',
      createdAt: new Date().toISOString()
    },
    'not-3': {
      id: 'not-3',
      title: 'Dispense aggiuntive per la verifica di Fisica caricate in piattaforma',
      content: 'Trovate nella sezione Materiali gli esercizi commentati sul flusso di Gauss e circuiti.',
      date: todayStr,
      priority: 'NORMAL',
      authorName: 'Matteo Ferrari (Controller)',
      createdAt: new Date().toISOString()
    }
  };

  const materials: Record<string, MaterialItem> = {
    'mat-1': {
      id: 'mat-1',
      subject: 'Matematica',
      title: 'Formulario Completo: Limiti Notevoli e Asintoti',
      description: 'Documento PDF di sintesi con tutte le formule e forme indeterminate risolte.',
      fileName: 'Formulario_Limiti_2026.pdf',
      fileSize: '1.2 MB',
      fileType: 'PDF',
      date: todayStr,
      authorName: 'Sofia Bianchi (Controller)'
    },
    'mat-2': {
      id: 'mat-2',
      subject: 'Filosofia',
      title: 'Mappa Concettuale: Da Kant a Schopenhauer',
      description: 'Schema visuale con differenze tra fenomeno, noumeno e volontà.',
      fileName: 'Mappa_Schopenhauer.png',
      fileSize: '840 KB',
      fileType: 'PNG',
      date: todayStr,
      authorName: 'ClassHub Developer (Admin)'
    },
    'mat-3': {
      id: 'mat-3',
      subject: 'Fisica',
      title: 'Eserciziario Svolto sul Flusso di Gauss e Campo Elettrico',
      description: 'Esercizi commentati passo per passo con spiegazione e grafici vettoriali.',
      fileName: 'Fisica_Gauss_Soluzioni.pdf',
      fileSize: '2.4 MB',
      fileType: 'PDF',
      date: day3Str,
      authorName: 'Matteo Ferrari (Controller)'
    }
  };

  const surveys: Record<string, Survey> = {
    'sur-1': {
      id: 'sur-1',
      title: 'Scelta Destinazione Viaggio d\'Istruzione (5 giorni)',
      question: 'Quale meta preferite per il viaggio di primavera?',
      options: [
        { id: 'opt-1', text: 'Praga (Repubblica Ceca) - 420€ volo incl.', votesCount: 14, votedUserIds: ['marco-student-uid', 'developer-test-uid', 'alessandro-student-uid'] },
        { id: 'opt-2', text: 'Berlino (Germania) - 450€ volo incl.', votesCount: 7, votedUserIds: ['giulia-student-uid', 'chiara-student-uid'] },
        { id: 'opt-3', text: 'Barcellona (Spagna) - 480€ volo incl.', votesCount: 5, votedUserIds: ['sofia-controller-uid', 'matteo-controller-uid'] },
        { id: 'opt-4', text: 'Napoli & Costiera Amalfitana - 360€', votesCount: 2, votedUserIds: ['lorenzo-student-uid'] }
      ],
      status: 'OPEN',
      deadline: day5Str,
      createdAt: new Date().toISOString(),
      totalVotes: 28,
      authorName: 'Sofia Bianchi (Controller)'
    }
  };

  const representation: Record<string, RepresentationItem> = {
    'rep-1': {
      id: 'rep-1',
      category: 'PROPOSTA',
      title: 'Ripristino rete Wi-Fi e prese elettriche nelle aule del 2° piano',
      description: 'Presentata richiesta urgente al Consiglio d\'Istituto per prese a norma e potenziamento access point.',
      status: 'IN_CORSO',
      date: todayStr,
      authorName: 'Sofia Bianchi (Controller)'
    },
    'rep-2': {
      id: 'rep-2',
      category: 'DOMANDA_PROF',
      title: 'Spostamento Verifica di Inglese per evitare tre compiti in 48 ore',
      description: 'Il Prof. Smith ha accordato lo spostamento a lunedì per evitare sovraccarico con Matematica.',
      status: 'APPROVATO',
      date: todayStr,
      authorName: 'Matteo Ferrari (Controller)'
    }
  };

  const classroomControl: ClassroomControl = {
    classId: 'cls-dev-test',
    name: 'ClassHub — Developer Test',
    schoolName: 'Liceo Scientifico Leonardo da Vinci',
    academicYear: '2026/2027',
    classCode: 'DEVTEST',
    allowSelfJoin: true,
    lockVolunteersOnDeadline: false,
    controllerCanCreateNotices: true,
    adminEmail: 'developer.test@classhub.edu',
    createdAt: new Date().toISOString()
  };

  return {
    users: usersMap,
    events,
    interrogations,
    notices,
    materials,
    surveys,
    representation,
    classroomControl,
    timetable: DEFAULT_TIMETABLE
  };
};

class LocalDataStore {
  private state: ClassHubDataState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): ClassHubDataState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.classroomControl && parsed.timetable && parsed.interrogations) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using default data:', e);
    }
    const initial = getInitialState();
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(state: ClassHubDataState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Could not save to localStorage:', e);
    }
  }

  private notify() {
    this.saveToStorage(this.state);
    this.listeners.forEach(cb => cb());
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public getState(): ClassHubDataState {
    return this.state;
  }

  // --- Users & Roles ---
  public getUser(uid: string): UserProfile | null {
    return this.state.users[uid] || null;
  }

  public getAllUsers(): UserProfile[] {
    return Object.values(this.state.users);
  }

  public updateUserRole(uid: string, newRole: UserRole): void {
    if (this.state.users[uid]) {
      this.state.users[uid] = {
        ...this.state.users[uid],
        role: newRole
      };
      this.notify();
    }
  }

  public updateProfile(uid: string, updates: Partial<UserProfile>): void {
    if (this.state.users[uid]) {
      this.state.users[uid] = {
        ...this.state.users[uid],
        ...updates
      };
      this.notify();
    }
  }

  // --- Events ---
  public getEvents(classId: string, currentUserId?: string): CalendarEvent[] {
    return Object.values(this.state.events).filter(ev => {
      // If event belongs to a specific class and classId is provided, check match
      if (classId && ev.classId && ev.classId !== classId && ev.classId !== 'cls-dev-test') return false;
      if (!ev.isPersonal) return true;
      return ev.authorId === currentUserId;
    });
  }

  public addEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const id = 'ev-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const newEvent: CalendarEvent = { ...event, id, createdAt: new Date().toISOString() };
    this.state.events[id] = newEvent;
    this.notify();
    return newEvent;
  }

  public deleteEvent(id: string): void {
    delete this.state.events[id];
    this.notify();
  }

  // --- Interrogations & Volunteers ---
  public getInterrogations(classId: string): Interrogation[] {
    return Object.values(this.state.interrogations).filter(i => {
      if (classId && i.classId && i.classId !== classId && i.classId !== 'cls-dev-test') return false;
      return true;
    });
  }

  public addInterrogation(data: Omit<Interrogation, 'id' | 'volunteers' | 'volunteerIds' | 'status'> & { maxVolunteers: number; classId?: string }): Interrogation {
    const id = 'int-' + Date.now();
    const newInterrogation: Interrogation = {
      ...data,
      id,
      volunteers: [],
      volunteerIds: [],
      status: 'OPEN'
    };
    this.state.interrogations[id] = newInterrogation;
    this.notify();
    return newInterrogation;
  }

  public updateInterrogationStatus(id: string, status: 'OPEN' | 'FULL' | 'CLOSED'): void {
    if (this.state.interrogations[id]) {
      this.state.interrogations[id] = {
        ...this.state.interrogations[id],
        status
      };
      this.notify();
    }
  }

  public deleteInterrogation(id: string): void {
    delete this.state.interrogations[id];
    this.notify();
  }

  public toggleVolunteer(
    interrogationId: string,
    user: { uid: string; name: string; avatarId: string }
  ): { success: boolean; message: string } {
    const interrogation = this.state.interrogations[interrogationId];
    if (!interrogation) {
      throw new Error('Interrogazione non trovata.');
    }

    const isAlreadyBooked = interrogation.volunteerIds?.includes(user.uid);

    if (isAlreadyBooked) {
      const updatedVolunteers = interrogation.volunteers.filter(v => v.userId !== user.uid);
      const updatedIds = interrogation.volunteerIds.filter(id => id !== user.uid);
      const newStatus = updatedVolunteers.length >= interrogation.maxVolunteers ? 'FULL' : 'OPEN';

      this.state.interrogations[interrogationId] = {
        ...interrogation,
        volunteers: updatedVolunteers,
        volunteerIds: updatedIds,
        status: newStatus
      };
      this.notify();
      return { success: true, message: 'Prenotazione ritirata con successo.' };
    } else {
      if (interrogation.status === 'CLOSED') {
        throw new Error('Le iscrizioni per questa interrogazione sono chiuse.');
      }
      if (interrogation.volunteers.length >= interrogation.maxVolunteers) {
        throw new Error('Tutti i posti disponibili per i volontari sono esauriti.');
      }

      const newSlot: VolunteerSlot = {
        userId: user.uid,
        userName: user.name,
        userAvatar: user.avatarId,
        timestamp: new Date().toISOString()
      };

      const updatedVolunteers = [...interrogation.volunteers, newSlot];
      const updatedIds = [...(interrogation.volunteerIds || []), user.uid];
      const newStatus = updatedVolunteers.length >= interrogation.maxVolunteers ? 'FULL' : 'OPEN';

      this.state.interrogations[interrogationId] = {
        ...interrogation,
        volunteers: updatedVolunteers,
        volunteerIds: updatedIds,
        status: newStatus
      };
      this.notify();
      return { success: true, message: 'Prenotazione registrata! Sei nella lista volontari.' };
    }
  }

  // --- Notices ---
  public getNotices(classId: string): Notice[] {
    return Object.values(this.state.notices)
      .filter(n => !classId || !n.classId || n.classId === classId || n.classId === 'cls-dev-test')
      .sort((a, b) => {
        if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
        if (b.priority === 'HIGH' && a.priority !== 'HIGH') return 1;
        return b.date.localeCompare(a.date);
      });
  }

  public addNotice(notice: Omit<Notice, 'id'>): Notice {
    const id = 'not-' + Date.now();
    const newNotice = { ...notice, id, createdAt: new Date().toISOString() };
    this.state.notices[id] = newNotice;
    this.notify();
    return newNotice;
  }

  public deleteNotice(id: string): void {
    delete this.state.notices[id];
    this.notify();
  }

  // --- Materials ---
  public getMaterials(classId: string): MaterialItem[] {
    return Object.values(this.state.materials).filter(m => !classId || !m.classId || m.classId === classId || m.classId === 'cls-dev-test');
  }

  public addMaterial(item: Omit<MaterialItem, 'id'>): MaterialItem {
    const id = 'mat-' + Date.now();
    const newMat = { ...item, id };
    this.state.materials[id] = newMat;
    this.notify();
    return newMat;
  }

  public deleteMaterial(id: string): void {
    delete this.state.materials[id];
    this.notify();
  }

  // --- Surveys ---
  public getSurveys(classId: string): Survey[] {
    return Object.values(this.state.surveys).filter(s => !classId || !s.classId || s.classId === classId || s.classId === 'cls-dev-test');
  }

  public addSurvey(survey: Omit<Survey, 'id' | 'createdAt' | 'totalVotes'>): Survey {
    const id = 'sur-' + Date.now();
    const newSurvey: Survey = {
      ...survey,
      id,
      createdAt: new Date().toISOString(),
      totalVotes: 0
    };
    this.state.surveys[id] = newSurvey;
    this.notify();
    return newSurvey;
  }

  public voteSurvey(surveyId: string, optionId: string, userId: string): void {
    const survey = this.state.surveys[surveyId];
    if (!survey || survey.status === 'CLOSED') return;

    let previousOptionId: string | null = null;
    survey.options.forEach(opt => {
      if (opt.votedUserIds?.includes(userId)) {
        previousOptionId = opt.id;
      }
    });

    const updatedOptions = survey.options.map(opt => {
      let votedUsers = [...(opt.votedUserIds || [])];
      let count = opt.votesCount;

      if (previousOptionId && opt.id === previousOptionId) {
        votedUsers = votedUsers.filter(id => id !== userId);
        count = Math.max(0, count - 1);
      }

      if (opt.id === optionId) {
        if (!votedUsers.includes(userId)) {
          votedUsers.push(userId);
          count += 1;
        }
      }

      return {
        ...opt,
        votesCount: count,
        votedUserIds: votedUsers
      };
    });

    const totalVotes = updatedOptions.reduce((acc, o) => acc + o.votesCount, 0);

    this.state.surveys[surveyId] = {
      ...survey,
      options: updatedOptions,
      totalVotes
    };
    this.notify();
  }

  public toggleSurveyStatus(surveyId: string): void {
    const survey = this.state.surveys[surveyId];
    if (survey) {
      this.state.surveys[surveyId] = {
        ...survey,
        status: survey.status === 'OPEN' ? 'CLOSED' : 'OPEN'
      };
      this.notify();
    }
  }

  public deleteSurvey(id: string): void {
    delete this.state.surveys[id];
    this.notify();
  }

  // --- Representation ---
  public getRepresentationItems(classId: string): RepresentationItem[] {
    return Object.values(this.state.representation);
  }

  public addRepresentationItem(item: Omit<RepresentationItem, 'id'>): RepresentationItem {
    const id = 'rep-' + Date.now();
    const newItem = { ...item, id };
    this.state.representation[id] = newItem;
    this.notify();
    return newItem;
  }

  public updateRepresentationStatus(id: string, status: RepresentationItem['status']): void {
    if (this.state.representation[id]) {
      this.state.representation[id] = {
        ...this.state.representation[id],
        status
      };
      this.notify();
    }
  }

  public deleteRepresentationItem(id: string): void {
    delete this.state.representation[id];
    this.notify();
  }

  // --- Classroom Control ---
  public getClassroomControl(): ClassroomControl {
    return this.state.classroomControl;
  }

  public updateClassroomControl(updates: Partial<ClassroomControl>): ClassroomControl {
    this.state.classroomControl = {
      ...this.state.classroomControl,
      ...updates
    };
    this.notify();
    return this.state.classroomControl;
  }

  public regenerateClassCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'CLS-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.state.classroomControl.classCode = code;
    this.notify();
    return code;
  }

  // --- Timetable ---
  public getTimetable(): TimetableSlot[] {
    return this.state.timetable;
  }

  public updateTimetableSlot(slot: TimetableSlot): void {
    const index = this.state.timetable.findIndex(s => s.id === slot.id);
    if (index >= 0) {
      this.state.timetable[index] = slot;
    } else {
      this.state.timetable.push(slot);
    }
    this.notify();
  }

  public resetToDefaults(): void {
    this.state = getInitialState();
    this.notify();
  }
}

export const localStore = new LocalDataStore();
