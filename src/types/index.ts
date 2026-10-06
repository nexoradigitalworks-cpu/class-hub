export type UserRole = 'STUDENT' | 'CONTROLLER' | 'ADMIN';

export interface UserMembership {
  classId: string;
  className: string;
  classCode: string;
  role: UserRole;
  joinedAt: string;
}

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatarId: string;
  classId?: string | null;
  activeClassId?: string | null;
  className?: string | null;
  createdAt: string;
}

export interface Classroom {
  id: string;
  name: string;
  code: string;
  schoolName?: string;
  academicYear?: string;
  createdBy: string;
  createdAt: string;
  allowSelfJoin?: boolean;
  lockVolunteersOnDeadline?: boolean;
  controllerCanCreateNotices?: boolean;
  adminEmail?: string;
}

export interface ClassMember {
  id?: string;
  userId: string;
  classId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatarId: string;
  joinedAt: string;
}

export type ActivityTypeCategory = 'VERIFICA' | 'INTERROGAZIONE' | 'EVENTO' | 'PERSONALE';

export interface CalendarEvent {
  id: string;
  title: string;
  subject?: string;
  type: ActivityTypeCategory | string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  description?: string;
  teacher?: string;
  isPersonal: boolean;
  authorId: string;
  authorName: string;
  classId?: string;
  interrogationId?: string;
  createdAt?: string;
}

export interface VolunteerSlot {
  userId: string;
  userName: string;
  userAvatar: string;
  timestamp: string;
}

export interface Interrogation {
  id: string;
  title: string;
  subject: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  maxVolunteers: number;
  deadline?: string;
  volunteers: VolunteerSlot[];
  volunteerIds: string[];
  status: 'OPEN' | 'FULL' | 'CLOSED';
  teacher?: string;
  notes?: string;
  classId?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  priority: 'NORMAL' | 'HIGH';
  linkedEventId?: string;
  authorName: string;
  authorRole?: string;
  classId?: string;
  createdAt?: string;
}

export interface MaterialItem {
  id: string;
  subject: string;
  title: string;
  description: string;
  url?: string;
  fileData?: string; // base64 data URL for local PDF/PNG/images
  fileName?: string;
  fileSize?: string;
  fileType: 'PDF' | 'PNG' | 'DOC' | 'LINK' | 'SLIDES';
  date: string;
  authorName?: string;
  classId?: string;
}

export interface SurveyOption {
  id: string;
  text: string;
  votesCount: number;
  votedUserIds?: string[];
}

export interface Survey {
  id: string;
  title: string;
  question: string;
  options: SurveyOption[];
  status: 'OPEN' | 'CLOSED';
  deadline?: string;
  createdAt: string;
  totalVotes?: number;
  authorName?: string;
  classId?: string;
}

export interface RepresentationItem {
  id: string;
  category: 'PROPOSTA' | 'DOMANDA_PROF' | 'ASSEMBLEA' | 'OBIETTIVO' | 'ATTIVITA';
  title: string;
  description: string;
  status?: 'IN_ATTESA' | 'IN_CORSO' | 'DISCUSSO' | 'APPROVATO' | 'RESPINTO';
  date: string;
  authorName?: string;
  classId?: string;
}

export interface ClassroomControl {
  classId: string;
  name: string;
  academicYear: string;
  schoolName: string;
  classCode: string; // e.g., 'cls-4sa-9k'
  allowSelfJoin: boolean;
  lockVolunteersOnDeadline: boolean;
  controllerCanCreateNotices: boolean;
  adminEmail: string;
  createdAt: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 1 = Lun, 2 = Mar, ..., 6 = Sab
  hour: number; // 1 to 6 (e.g. 1ª ora 08:00 - 09:00)
  timeRange: string;
  subject: string;
  teacher?: string;
  room?: string;
}
