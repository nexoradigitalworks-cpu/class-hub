/**
 * ClassHub Data & Cloud Backend Adapter Layer
 * 
 * Provides an abstraction layer between React UI components and the storage engine.
 * 
 * Mode:
 * - If Supabase IS configured: communicates with Supabase PostgreSQL, Auth & Storage.
 * - If Supabase is NOT configured: seamlessly delegates to `localStore` (localStorage fallback).
 */

import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { localStore } from '../dataStore';
import { logger } from '../../utils/logger';
import { 
  UserProfile, CalendarEvent, Interrogation, Notice, 
  MaterialItem, Survey, RepresentationItem, TimetableSlot, 
  SubjectItem, Classroom, ClassMember, UserMembership, UserRole 
} from '../../types';

// ============================================================================
// 1. AUTH & PROFILE ADAPTER
// ============================================================================
export const authAdapter = {
  isCloudReady: () => isSupabaseConfigured && Boolean(supabase),

  async getProfile(uid: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.getUser(uid);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (error || !data) {
        // Fallback to localStore if user not found in cloud
        return localStore.getUser(uid);
      }

      return {
        uid: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        avatarId: data.avatar_id,
        role: 'STUDENT', // Populated by active membership
        classId: data.active_class_id,
        activeClassId: data.active_class_id,
        createdAt: data.created_at
      };
    } catch {
      return localStore.getUser(uid);
    }
  },

  async updateProfileAvatar(uid: string, avatarId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const user = localStore.getUser(uid);
      if (user) {
        localStore.saveUser({ ...user, avatarId });
      }
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_id: avatarId })
      .eq('id', uid);

    if (error) {
      throw new Error(error.message);
    }
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.saveUser(profile);
      return;
    }

    // Do NOT send email to avoid trigger constraint on auth.users email sync
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profile.firstName,
        last_name: profile.lastName,
        avatar_id: profile.avatarId,
        active_class_id: profile.activeClassId || null
      })
      .eq('id', profile.uid);

    if (error) {
      throw new Error(error.message);
    }
  }
};

// ============================================================================
// 2. CLASS & MEMBERSHIP ADAPTER
// ============================================================================
export const classAdapter = {
  async getClass(classId: string): Promise<Classroom | null> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.getClass(classId);
    }

    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .maybeSingle();

      if (error || !data) return localStore.getClass(classId);

      return {
        id: data.id,
        name: data.name,
        code: data.code,
        schoolName: data.school_name,
        academicYear: data.academic_year,
        createdBy: data.created_by,
        createdAt: data.created_at,
        allowSelfJoin: data.allow_self_join,
        lockVolunteersOnDeadline: data.lock_volunteers_on_deadline,
        controllerCanCreateNotices: data.controller_can_create_notices,
        adminEmail: data.admin_email || undefined
      };
    } catch {
      return localStore.getClass(classId);
    }
  },

  async getClassByCode(code: string): Promise<Classroom | null> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.getClassByCode(code);
    }

    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .ilike('code', code.trim())
        .maybeSingle();

      if (error || !data) return localStore.getClassByCode(code);

      return {
        id: data.id,
        name: data.name,
        code: data.code,
        schoolName: data.school_name,
        academicYear: data.academic_year,
        createdBy: data.created_by,
        createdAt: data.created_at,
        allowSelfJoin: data.allow_self_join,
        lockVolunteersOnDeadline: data.lock_volunteers_on_deadline,
        controllerCanCreateNotices: data.controller_can_create_notices,
        adminEmail: data.admin_email || undefined
      };
    } catch {
      return localStore.getClassByCode(code);
    }
  },

  async createClass(
    name: string, 
    schoolName?: string, 
    academicYear?: string, 
    allowSelfJoin?: boolean
  ): Promise<{ classId: string; code: string; name: string }> {
    if (!isSupabaseConfigured || !supabase) {
      const newClassId = 'cls-' + Date.now();
      const code = 'CLS-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      const newClass: Classroom = {
        id: newClassId,
        name,
        code,
        schoolName: schoolName || 'Scuola Superiore',
        academicYear: academicYear || '2026/2027',
        createdBy: 'local-user',
        createdAt: new Date().toISOString(),
        allowSelfJoin: allowSelfJoin ?? true,
        lockVolunteersOnDeadline: false,
        controllerCanCreateNotices: true
      };
      localStore.createClass(newClass);
      return { classId: newClassId, code, name };
    }

    // REAL SUPABASE SECURE RPC CALL
    const { data, error } = await (supabase.rpc as any)('create_class', {
      p_name: name,
      p_school_name: schoolName || 'Scuola Superiore',
      p_academic_year: academicYear || '2026/2027',
      p_allow_self_join: allowSelfJoin ?? true
    });

    if (error || !data) {
      throw new Error(error?.message || 'Errore nella creazione della classe.');
    }

    return {
      classId: data.id,
      code: data.code,
      name: data.name
    };
  },

  async joinClassByCode(code: string): Promise<{ success: boolean; message: string; classId: string; className: string; role: UserRole }> {
    const cleanCode = code.trim().toUpperCase();

    if (!isSupabaseConfigured || !supabase) {
      const localCls = localStore.getClassByCode(cleanCode) || localStore.getClass('cls-dev-test');
      if (!localCls) {
        throw new Error('Codice classe non valido o classe inesistente.');
      }
      return {
        success: true,
        message: 'Ti sei unito alla classe con successo!',
        classId: localCls.id,
        className: localCls.name,
        role: 'STUDENT'
      };
    }

    // REAL SUPABASE SECURE RPC CALL
    const { data, error } = await (supabase.rpc as any)('join_class_by_code', {
      p_code: cleanCode
    });

    if (error || !data) {
      throw new Error(error?.message || 'Impossibile accedere alla classe con il codice fornito.');
    }

    return {
      success: data.success,
      message: data.message,
      classId: data.class_id,
      className: data.name,
      role: data.role as UserRole
    };
  },

  async setActiveClass(classId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    const { error } = await (supabase.rpc as any)('set_active_class', {
      p_class_id: classId
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  async getUserMemberships(userId: string): Promise<UserMembership[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.getUserMemberships(userId);
    }

    try {
      const { data, error } = await supabase
        .from('class_members')
        .select('*, classes(name, code)')
        .eq('user_id', userId);

      if (error || !data) return localStore.getUserMemberships(userId);

      return data.map((item: any) => ({
        classId: item.class_id,
        className: item.classes?.name || 'Classe',
        classCode: item.classes?.code || 'CODICE',
        role: item.role as UserRole,
        joinedAt: item.joined_at
      }));
    } catch {
      return localStore.getUserMemberships(userId);
    }
  },

  async getMembersOfClass(classId: string): Promise<ClassMember[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.getMembersOfClass(classId);
    }

    try {
      const { data, error } = await supabase
        .from('class_members')
        .select('*, profiles(first_name, last_name, email, avatar_id)')
        .eq('class_id', classId);

      if (error || !data) return localStore.getMembersOfClass(classId);

      return data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        classId: item.class_id,
        firstName: item.profiles?.first_name || '',
        lastName: item.profiles?.last_name || '',
        email: item.profiles?.email || '',
        role: item.role as UserRole,
        avatarId: item.profiles?.avatar_id || 'avatar-blue',
        joinedAt: item.joined_at
      }));
    } catch {
      return localStore.getMembersOfClass(classId);
    }
  },

  async updateUserRole(classId: string, targetUid: string, newRole: UserRole): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.updateUserRole(targetUid, newRole);
      return;
    }

    const { error } = await supabase
      .from('class_members')
      .update({ role: newRole })
      .eq('class_id', classId)
      .eq('user_id', targetUid);

    if (error) {
      throw new Error(error.message);
    }
  },

  async leaveClass(userId: string, classId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.removeUserMembership(userId, classId);
      return;
    }

    const { error } = await supabase
      .from('class_members')
      .delete()
      .eq('class_id', classId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  }
};

// ============================================================================
// 3. CALENDAR & EVENTS ADAPTER
// ============================================================================
export const eventsAdapter = {
  async getEvents(classId: string, userId: string): Promise<CalendarEvent[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.getEvents(classId, userId);
    }

    try {
      let query = supabase.from('events').select('*, profiles(first_name, last_name)');
      if (classId && userId) {
        query = query.or(`class_id.eq.${classId},and(is_personal.eq.true,author_id.eq.${userId})`);
      } else if (classId) {
        query = query.eq('class_id', classId);
      } else if (userId) {
        query = query.eq('is_personal', true).eq('author_id', userId);
      }
      query = query.order('event_date', { ascending: true });

      const { data, error } = await query;

      if (error || !data) return localStore.getEvents(classId, userId);

      return data.map((e: any) => {
        const fn = e.profiles?.first_name || '';
        const ln = e.profiles?.last_name || '';
        const authorName = `${fn} ${ln}`.trim() || 'Autore';
        return {
          id: e.id,
          title: e.title,
          subject: e.subject_name || undefined,
          type: e.type,
          date: e.event_date,
          startTime: e.start_time,
          endTime: e.end_time || undefined,
          description: e.description || undefined,
          teacher: e.teacher || undefined,
          isPersonal: e.is_personal,
          authorId: e.author_id,
          authorName,
          classId: e.class_id || undefined,
          interrogationId: e.interrogation_id || undefined,
          createdAt: e.created_at
        };
      });
    } catch {
      return localStore.getEvents(classId, userId);
    }
  },

  async addEvent(event: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<CalendarEvent> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.addEvent(event);
    }

    // STRICT CHECK CONSTRAINT:
    // If isPersonal === true: class_id, subject_id, subject_name, interrogation_id MUST be null.
    const insertPayload = event.isPersonal
      ? {
          class_id: null,
          author_id: event.authorId,
          title: event.title,
          subject_id: null,
          subject_name: null,
          type: 'PERSONALE' as const,
          event_date: event.date,
          start_time: event.startTime,
          end_time: event.endTime || null,
          description: event.description || null,
          teacher: null,
          is_personal: true,
          interrogation_id: null
        }
      : {
          class_id: event.classId || null,
          author_id: event.authorId,
          title: event.title,
          subject_id: null,
          subject_name: event.subject || null,
          type: (event.type || 'EVENTO') as any,
          event_date: event.date,
          start_time: event.startTime,
          end_time: event.endTime || null,
          description: event.description || null,
          teacher: event.teacher || null,
          is_personal: false,
          interrogation_id: event.interrogationId || null
        };

    const { data, error } = await supabase
      .from('events')
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Impossibile salvare l\'evento.');
    }

    if (isSupabaseConfigured && supabase && !event.isPersonal && data.class_id && data.id) {
      logger.network('info', 'Invio notifica push per nuovo evento di classe', { type: 'EVENT', classId: data.class_id, referenceId: data.id });
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          classId: data.class_id,
          notificationType: 'EVENT',
          referenceId: data.id
        }
      });
      if (pushError) {
        logger.network('warn', 'Risposta Edge Function send-push-notification con warning/error', { type: 'EVENT' });
        console.warn('Impossibile inviare notifica push');
      } else {
        logger.network('info', 'Notifica push inviata con successo via Edge Function', { type: 'EVENT' });
      }
    }

    return {
      ...event,
      id: data.id,
      createdAt: data.created_at
    };
  },

  async deleteEvent(eventId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.deleteEvent(eventId);
      return;
    }

    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) {
      throw new Error(error.message);
    }
  }
};

// ============================================================================
// 4. INTERROGATIONS & VOLUNTEERS ADAPTER
// ============================================================================
export const interrogationsAdapter = {
  async getInterrogations(classId: string): Promise<Interrogation[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.getInterrogations(classId);
    }

    try {
      const { data, error } = await supabase
        .from('interrogations')
        .select(`
          *,
          interrogation_volunteers (
            user_id,
            joined_at,
            profiles (first_name, last_name, avatar_id)
          )
        `)
        .eq('class_id', classId)
        .order('interrogation_date', { ascending: true });

      if (error || !data) return localStore.getInterrogations(classId);

      return data.map((item: any) => {
        const volunteersList = (item.interrogation_volunteers || []).map((v: any) => {
          const fn = v.profiles?.first_name || '';
          const ln = v.profiles?.last_name || '';
          const full = `${fn} ${ln}`.trim();
          return {
            userId: v.user_id,
            userName: full || 'Studente',
            userAvatar: v.profiles?.avatar_id || 'avatar-blue',
            timestamp: v.joined_at
          };
        });

        return {
          id: item.id,
          title: item.title,
          subject: item.subject_name,
          date: item.interrogation_date,
          startTime: item.start_time,
          endTime: item.end_time || '',
          maxVolunteers: item.max_volunteers,
          deadline: item.deadline || undefined,
          status: item.status,
          teacher: item.teacher || undefined,
          notes: item.notes || undefined,
          classId: item.class_id,
          volunteers: volunteersList,
          volunteerIds: volunteersList.map((v: any) => v.userId)
        };
      });
    } catch {
      return localStore.getInterrogations(classId);
    }
  },

  async createInterrogation(
    interrogation: Omit<Interrogation, 'id' | 'volunteers' | 'volunteerIds' | 'status'>,
    creatorUid: string
  ): Promise<Interrogation> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.addInterrogation(interrogation);
    }

    const { data, error } = await supabase
      .from('interrogations')
      .insert({
        class_id: interrogation.classId!,
        created_by: creatorUid,
        title: interrogation.title,
        subject_name: interrogation.subject,
        interrogation_date: interrogation.date,
        start_time: interrogation.startTime,
        end_time: interrogation.endTime || null,
        max_volunteers: interrogation.maxVolunteers,
        deadline: interrogation.deadline || null,
        status: 'OPEN',
        teacher: interrogation.teacher || null,
        notes: interrogation.notes || null
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Errore nella creazione dell\'interrogazione.');
    }

    if (isSupabaseConfigured && supabase && data.class_id && data.id) {
      logger.network('info', 'Invio notifica push per nuova interrogazione', { type: 'INTERROGATION', classId: data.class_id, referenceId: data.id });
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          classId: data.class_id,
          notificationType: 'INTERROGATION',
          referenceId: data.id
        }
      });
      if (pushError) {
        logger.network('warn', 'Risposta Edge Function send-push-notification con warning/error', { type: 'INTERROGATION' });
        console.warn('Impossibile inviare notifica push');
      } else {
        logger.network('info', 'Notifica push inviata con successo via Edge Function', { type: 'INTERROGATION' });
      }
    }

    return {
      id: data.id,
      title: data.title,
      subject: data.subject_name,
      date: data.interrogation_date,
      startTime: data.start_time,
      endTime: data.end_time || '',
      maxVolunteers: data.max_volunteers,
      deadline: data.deadline || undefined,
      status: data.status,
      teacher: data.teacher || undefined,
      notes: data.notes || undefined,
      classId: data.class_id,
      volunteers: [],
      volunteerIds: []
    };
  },

  async updateInterrogationStatus(id: string, status: 'OPEN' | 'CLOSED'): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.updateInterrogationStatus(id, status);
      return;
    }

    const { error } = await supabase
      .from('interrogations')
      .update({ status })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async deleteInterrogation(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.deleteInterrogation(id);
      return;
    }

    const { error } = await supabase
      .from('interrogations')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async toggleVolunteer(
    interrogationId: string, 
    user: { uid: string; name: string; avatarId: string }
  ): Promise<{ success: boolean; message: string }> {
    logger.adapter('info', `Richiesta cambio volontario per interrogazione ${interrogationId}`, { userId: user.uid, userName: user.name });

    if (!isSupabaseConfigured || !supabase) {
      logger.adapter('info', 'Supabase non configurato, delega a localStore per volontario');
      return localStore.toggleVolunteer(interrogationId, user);
    }

    // Tier 1: Try Supabase RPC call if available
    try {
      const { data, error } = await (supabase.rpc as any)('toggle_volunteer_reservation', {
        p_interrogation_id: interrogationId
      });

      if (!error && data) {
        logger.adapter('info', 'Prenotazione volontario completata via RPC toggle_volunteer_reservation', { result: data });
        return {
          success: data.success ?? true,
          message: data.message || 'Operazione completata'
        };
      }
      if (error) {
        logger.adapter('warn', 'Risposta RPC toggle_volunteer_reservation non disponibile o errata', { error: error.message });
      }
    } catch (err: any) {
      logger.adapter('warn', 'Eccezione RPC toggle_volunteer_reservation, passaggio a query diretta tabella', { error: err?.message });
    }

    // Tier 2: Direct Supabase table operations on interrogation_volunteers
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || user.uid;

      if (userId) {
        // Check if user is already registered as a volunteer
        const { data: existing, error: checkError } = await supabase
          .from('interrogation_volunteers')
          .select('user_id')
          .eq('interrogation_id', interrogationId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!checkError && existing) {
          // Unbook volunteer slot
          const { error: delError } = await supabase
            .from('interrogation_volunteers')
            .delete()
            .eq('interrogation_id', interrogationId)
            .eq('user_id', userId);

          if (!delError) {
            logger.adapter('info', 'Cancellazione volontario eseguita su tabella interrogation_volunteers');
            localStore.toggleVolunteer(interrogationId, user);
            return { success: true, message: 'Prenotazione ritirata con successo.' };
          } else {
            logger.adapter('error', 'Errore durante la cancellazione volontario su tabella', { error: delError.message });
          }
        } else if (!checkError) {
          // Book volunteer slot: check status and capacity
          const { data: interrogation, error: intError } = await supabase
            .from('interrogations')
            .select('status, max_volunteers')
            .eq('id', interrogationId)
            .single();

          if (!intError && interrogation) {
            if (interrogation.status === 'CLOSED') {
              logger.adapter('warn', 'Tentativo di iscrizione su interrogazione CHIUSA');
              return { success: false, message: 'Le iscrizioni per questa interrogazione sono chiuse.' };
            }

            const { count, error: countError } = await supabase
              .from('interrogation_volunteers')
              .select('*', { count: 'exact', head: true })
              .eq('interrogation_id', interrogationId);

            if (!countError && count !== null && count >= interrogation.max_volunteers) {
              logger.adapter('warn', 'Posti volontari esauriti', { count, max: interrogation.max_volunteers });
              return { success: false, message: 'Tutti i posti disponibili per i volontari sono esauriti.' };
            }

            const { error: insError } = await supabase
              .from('interrogation_volunteers')
              .insert({
                interrogation_id: interrogationId,
                user_id: userId
              });

            if (!insError) {
              logger.adapter('info', 'Iscrizione volontario inserita su tabella interrogation_volunteers');
              localStore.toggleVolunteer(interrogationId, user);
              return { success: true, message: 'Prenotazione registrata! Sei nella lista volontari.' };
            } else {
              logger.adapter('error', 'Errore inserimento volontario su tabella', { error: insError.message });
            }
          }
        }
      }
    } catch (err: any) {
      logger.adapter('error', 'Eccezione tabella diretta volontari, passaggio a localStore', { error: err?.message });
    }

    // Tier 3: LocalStore fallback
    logger.adapter('warn', 'Esecuzione fallback finale localStore per volontari');
    return localStore.toggleVolunteer(interrogationId, user);
  }
};

// ============================================================================
// 5. NOTICES ADAPTER
// ============================================================================
export const noticesAdapter = {
  async getNotices(classId: string): Promise<Notice[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.getNotices(classId);
    }

    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*, profiles(first_name, last_name)')
        .eq('class_id', classId)
        .order('notice_date', { ascending: false });

      if (error || !data) return localStore.getNotices(classId);

      return data.map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        date: n.notice_date,
        priority: n.priority,
        linkedEventId: n.linked_event_id || undefined,
        authorName: n.profiles ? `${n.profiles.first_name} ${n.profiles.last_name}` : 'Docente',
        classId: n.class_id,
        createdAt: n.created_at
      }));
    } catch {
      return localStore.getNotices(classId);
    }
  },

  async addNotice(notice: Omit<Notice, 'id'>, authorUid: string): Promise<Notice> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.addNotice(notice);
    }

    const { data, error } = await supabase
      .from('notices')
      .insert({
        class_id: notice.classId!,
        author_id: authorUid,
        title: notice.title,
        content: notice.content,
        notice_date: notice.date || new Date().toISOString().split('T')[0],
        priority: notice.priority || 'NORMAL',
        linked_event_id: notice.linkedEventId || null
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Impossibile pubblicare l\'avviso.');
    }

    if (isSupabaseConfigured && supabase && data.class_id && data.id) {
      logger.network('info', 'Invio notifica push per nuovo avviso', { type: 'NOTICE', classId: data.class_id, referenceId: data.id });
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          classId: data.class_id,
          notificationType: 'NOTICE',
          referenceId: data.id
        }
      });
      if (pushError) {
        logger.network('warn', 'Risposta Edge Function send-push-notification con warning/error', { type: 'NOTICE' });
        console.warn('Impossibile inviare notifica push');
      } else {
        logger.network('info', 'Notifica push inviata con successo via Edge Function', { type: 'NOTICE' });
      }
    }

    return {
      ...notice,
      id: data.id,
      createdAt: data.created_at
    };
  },

  async deleteNotice(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.deleteNotice(id);
      return;
    }

    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
};

// ============================================================================
// 6. MATERIALS & STORAGE ADAPTER
// Path: {class_id}/{material_id}/{file_name}
// ============================================================================
export const materialsAdapter = {
  async getMaterials(classId: string): Promise<MaterialItem[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.getMaterials(classId);
    }

    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*, profiles(first_name, last_name)')
        .eq('class_id', classId)
        .order('material_date', { ascending: false });

      if (error || !data) return localStore.getMaterials(classId);

      // Generate signed URLs for private bucket files
      const items: MaterialItem[] = await Promise.all(
        data.map(async (m: any) => {
          let downloadUrl = m.url;
          if (m.storage_path) {
            const { data: signed } = await supabase!.storage
              .from('classhub_materials')
              .createSignedUrl(m.storage_path, 3600); // 1 hour token
            if (signed?.signedUrl) {
              downloadUrl = signed.signedUrl;
            }
          }

          const fn = m.profiles?.first_name || '';
          const ln = m.profiles?.last_name || '';
          const authorName = `${fn} ${ln}`.trim() || undefined;

          return {
            id: m.id,
            subject: m.subject_name,
            title: m.title,
            description: m.description || '',
            url: downloadUrl || undefined,
            fileData: undefined, // Storage URLs used instead of local Base64
            fileName: m.file_name || undefined,
            fileSize: m.file_size ? `${Math.round(m.file_size / 1024)} KB` : undefined,
            fileType: m.file_type,
            date: m.material_date,
            authorName,
            classId: m.class_id
          };
        })
      );

      return items;
    } catch {
      return localStore.getMaterials(classId);
    }
  },

  async uploadAndAddMaterial(
    material: Omit<MaterialItem, 'id'>, 
    fileObject?: File | Blob | null,
    uploaderUid?: string
  ): Promise<MaterialItem> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.addMaterial(material);
    }

    let storagePath: string | null = null;
    let fileName = material.fileName || null;
    let fileSize = 0;

    // 1. Upload to Supabase Storage if file is provided
    if (fileObject && material.classId) {
      const materialId = crypto.randomUUID();
      const rawName = material.fileName || 'file.pdf';
      const cleanFileName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
      storagePath = `${material.classId}/${materialId}/${cleanFileName}`;
      fileSize = fileObject.size;
      fileName = cleanFileName;

      const { error: uploadError } = await supabase.storage
        .from('classhub_materials')
        .upload(storagePath, fileObject, {
          contentType: (fileObject as any).type || 'application/octet-stream',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Errore caricamento Storage: ${uploadError.message}`);
      }
    }

    // 2. Insert into PostgreSQL materials table
    const { data, error } = await supabase
      .from('materials')
      .insert({
        class_id: material.classId!,
        uploaded_by: uploaderUid || 'anonymous',
        subject_name: material.subject,
        title: material.title,
        description: material.description || null,
        url: material.url || null,
        storage_path: storagePath,
        file_name: fileName,
        file_size: fileSize || null,
        file_type: material.fileType || 'PDF',
        material_date: material.date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Impossibile registrare il materiale nel database.');
    }

    return {
      ...material,
      id: data.id,
      fileName: data.file_name || undefined,
      fileSize: data.file_size ? `${Math.round(data.file_size / 1024)} KB` : undefined
    };
  },

  async deleteMaterial(id: string, classId?: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.deleteMaterial(id);
      return;
    }

    // 1. Check if it has a storage path to clean up
    const { data: item } = await supabase
      .from('materials')
      .select('storage_path')
      .eq('id', id)
      .maybeSingle();

    if (item?.storage_path) {
      await supabase.storage.from('classhub_materials').remove([item.storage_path]);
    }

    // 2. Delete row
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
};

// ============================================================================
// 7. TIMETABLE & SUBJECTS ADAPTER
// ============================================================================
export const timetableAdapter = {
  async getTimetable(classId?: string): Promise<TimetableSlot[]> {
    if (!isSupabaseConfigured || !supabase || !classId) {
      return localStore.getTimetable();
    }

    try {
      const { data, error } = await supabase
        .from('timetable_slots')
        .select('*')
        .eq('class_id', classId)
        .order('day_of_week')
        .order('hour');

      if (error || !data || data.length === 0) {
        return localStore.getTimetable();
      }

      return data.map((s: any) => ({
        id: s.id,
        dayOfWeek: s.day_of_week,
        hour: s.hour,
        timeRange: s.time_range,
        subject: s.subject_name,
        teacher: s.teacher || undefined,
        room: s.room || undefined
      }));
    } catch {
      return localStore.getTimetable();
    }
  },

  async updateTimetableSlot(slot: TimetableSlot, classId?: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase || !classId) {
      localStore.updateTimetableSlot(slot);
      return;
    }

    // Check if slot exists in DB
    const { data: existing } = await supabase
      .from('timetable_slots')
      .select('id')
      .eq('class_id', classId)
      .eq('day_of_week', slot.dayOfWeek)
      .eq('hour', slot.hour)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('timetable_slots')
        .update({
          time_range: slot.timeRange,
          subject_name: slot.subject,
          teacher: slot.teacher || null,
          room: slot.room || null
        })
        .eq('id', existing.id);

      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from('timetable_slots')
        .insert({
          class_id: classId,
          day_of_week: slot.dayOfWeek,
          hour: slot.hour,
          time_range: slot.timeRange,
          subject_name: slot.subject,
          teacher: slot.teacher || null,
          room: slot.room || null
        });

      if (error) throw new Error(error.message);
    }
  },

  async deleteTimetableSlot(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.deleteTimetableSlot(id);
      return;
    }

    await supabase.from('timetable_slots').delete().eq('id', id);
  },

  async getSubjects(classId?: string): Promise<SubjectItem[]> {
    if (!isSupabaseConfigured || !supabase || !classId) {
      return localStore.getSubjects(classId);
    }

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('class_id', classId)
        .order('name');

      if (error || !data || data.length === 0) {
        return localStore.getSubjects(classId);
      }

      return data.map((s: any) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        color: s.color,
        defaultTeacher: s.default_teacher || undefined,
        defaultRoom: s.default_room || undefined,
        description: s.description || undefined,
        classId: s.class_id
      }));
    } catch {
      return localStore.getSubjects(classId);
    }
  },

  async addSubject(item: Omit<SubjectItem, 'id'>, classId?: string): Promise<SubjectItem> {
    const effectiveClassId = item.classId || classId;
    if (!isSupabaseConfigured || !supabase || !effectiveClassId) {
      return localStore.addSubject(item);
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert({
        class_id: effectiveClassId,
        name: item.name,
        category: (item.category || 'ALTRO') as any,
        color: item.color || '#6366f1',
        default_teacher: item.defaultTeacher || null,
        default_room: item.defaultRoom || null,
        description: item.description || null
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Errore nella creazione della materia.');
    }

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      color: data.color,
      defaultTeacher: data.default_teacher || undefined,
      defaultRoom: data.default_room || undefined,
      description: data.description || undefined,
      classId: data.class_id
    };
  },

  async updateSubject(id: string, updates: Partial<SubjectItem>): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.updateSubject(id, updates);
      return;
    }

    const { error } = await supabase
      .from('subjects')
      .update({
        name: updates.name,
        category: updates.category as any,
        color: updates.color,
        default_teacher: updates.defaultTeacher || null,
        default_room: updates.defaultRoom || null,
        description: updates.description || null
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async deleteSubject(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.deleteSubject(id);
      return;
    }

    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
};

// ============================================================================
// 8. SURVEYS ADAPTER
// ============================================================================
export const surveysAdapter = {
  async getSurveys(classId: string, _currentUserId?: string): Promise<Survey[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.getSurveys(classId);
    }

    try {
      const { data, error } = await supabase
        .from('surveys')
        .select(`
          *,
          profiles (first_name, last_name),
          survey_options (
            id,
            text,
            sort_order
          ),
          survey_votes (
            id,
            option_id,
            user_id
          )
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error || !data) return localStore.getSurveys(classId);

      return data.map((s: any) => {
        const votes = s.survey_votes || [];
        const optionsList = (s.survey_options || [])
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((opt: any) => {
            const optVotes = votes.filter((v: any) => v.option_id === opt.id);
            return {
              id: opt.id,
              text: opt.text,
              votesCount: optVotes.length,
              votedUserIds: optVotes.map((v: any) => v.user_id)
            };
          });

        const sFn = s.profiles?.first_name || '';
        const sLn = s.profiles?.last_name || '';
        const authorName = `${sFn} ${sLn}`.trim() || undefined;

        return {
          id: s.id,
          title: s.title,
          question: s.question,
          options: optionsList,
          status: s.status,
          deadline: s.deadline || undefined,
          createdAt: s.created_at,
          totalVotes: votes.length,
          authorName,
          classId: s.class_id
        };
      });
    } catch {
      return localStore.getSurveys(classId);
    }
  },

  async addSurvey(
    survey: Omit<Survey, 'id' | 'createdAt' | 'totalVotes'>, 
    authorUid: string
  ): Promise<Survey> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.addSurvey(survey);
    }

    // 1. Create survey record
    const { data: surveyRow, error: surveyError } = await supabase
      .from('surveys')
      .insert({
        class_id: survey.classId!,
        author_id: authorUid,
        title: survey.title,
        question: survey.question,
        status: survey.status || 'OPEN',
        deadline: survey.deadline || null
      })
      .select()
      .single();

    if (surveyError || !surveyRow) {
      throw new Error(surveyError?.message || 'Impossibile creare il sondaggio.');
    }

    // 2. Create survey options
    const optionsToInsert = survey.options.map((opt, idx) => ({
      survey_id: surveyRow.id,
      text: opt.text,
      sort_order: idx
    }));

    const { data: optionsRows, error: optError } = await supabase
      .from('survey_options')
      .insert(optionsToInsert)
      .select();

    if (optError) {
      throw new Error(optError.message);
    }

    return {
      id: surveyRow.id,
      title: surveyRow.title,
      question: surveyRow.question,
      options: (optionsRows || []).map((o: any) => ({
        id: o.id,
        text: o.text,
        votesCount: 0,
        votedUserIds: []
      })),
      status: surveyRow.status,
      deadline: surveyRow.deadline || undefined,
      createdAt: surveyRow.created_at,
      totalVotes: 0,
      classId: surveyRow.class_id
    };
  },

  async voteSurvey(surveyId: string, optionId: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.voteSurvey(surveyId, optionId, userId);
      return;
    }

    // 1. Remove previous vote in this survey if any
    await supabase
      .from('survey_votes')
      .delete()
      .eq('survey_id', surveyId)
      .eq('user_id', userId);

    // 2. Insert new vote
    const { error } = await supabase
      .from('survey_votes')
      .insert({
        survey_id: surveyId,
        option_id: optionId,
        user_id: userId
      });

    if (error) {
      throw new Error(error.message);
    }
  },

  async toggleSurveyStatus(surveyId: string, currentStatus?: 'OPEN' | 'CLOSED'): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.toggleSurveyStatus(surveyId);
      return;
    }

    const nextStatus = currentStatus === 'CLOSED' ? 'OPEN' : 'CLOSED';
    const { error } = await supabase
      .from('surveys')
      .update({ status: nextStatus })
      .eq('id', surveyId);

    if (error) throw new Error(error.message);
  },

  async deleteSurvey(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.deleteSurvey(id);
      return;
    }

    const { error } = await supabase.from('surveys').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
};

// ============================================================================
// 9. REPRESENTATION ADAPTER
// ============================================================================
export const representationAdapter = {
  async getRepresentationItems(classId: string): Promise<RepresentationItem[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.getRepresentationItems(classId);
    }

    try {
      const { data, error } = await supabase
        .from('representation_items')
        .select('*, profiles(first_name, last_name)')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error || !data) return localStore.getRepresentationItems(classId);

      return data.map((item: any) => {
        const rFn = item.profiles?.first_name || '';
        const rLn = item.profiles?.last_name || '';
        const authorName = `${rFn} ${rLn}`.trim() || undefined;

        return {
          id: item.id,
          category: item.category,
          title: item.title,
          description: item.description,
          status: item.status,
          date: item.item_date,
          authorName,
          classId: item.class_id
        };
      });
    } catch {
      return localStore.getRepresentationItems(classId);
    }
  },

  async addRepresentationItem(
    item: Omit<RepresentationItem, 'id'>, 
    authorUid: string
  ): Promise<RepresentationItem> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.addRepresentationItem(item);
    }

    const { data, error } = await supabase
      .from('representation_items')
      .insert({
        class_id: item.classId!,
        author_id: authorUid,
        category: (item.category || 'PROPOSTA') as any,
        title: item.title,
        description: item.description,
        status: (item.status || 'IN_ATTESA') as any,
        item_date: item.date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Errore nella creazione della richiesta.');
    }

    return {
      ...item,
      id: data.id
    };
  },

  async updateRepresentationStatus(id: string, status: RepresentationItem['status']): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.updateRepresentationStatus(id, status);
      return;
    }

    const { error } = await supabase
      .from('representation_items')
      .update({ status: status as any })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async deleteRepresentationItem(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.deleteRepresentationItem(id);
      return;
    }

    const { error } = await supabase
      .from('representation_items')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};
