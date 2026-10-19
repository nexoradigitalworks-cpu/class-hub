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
  SubjectItem, Classroom, ClassMember, UserMembership, UserRole,
  VolunteerSlot
} from '../../types';
import { formatVolunteerName } from '../../utils/formatters';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isValidUUID(id: string | null | undefined): boolean {
  return Boolean(id && UUID_REGEX.test(id.trim()));
}

// ============================================================================
// 1. AUTH & PROFILE ADAPTER
// ============================================================================
export const authAdapter = {
  isCloudReady: () => isSupabaseConfigured && Boolean(supabase),

  async getProfile(uid: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(uid)) {
      return localStore.getUser(uid);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (error) {
        logger.adapter('warn', 'Errore recupero profilo cloud', { error: error.message });
        return null;
      }
      if (!data) {
        // Safe sync: If profile row is not yet present, check current auth session and initialize
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user && authData.user.id === uid) {
          const fn = authData.user.user_metadata?.first_name || 'Studente';
          const ln = authData.user.user_metadata?.last_name || 'ClassHub';
          const av = authData.user.user_metadata?.avatar_id || 'avatar-blue';
          const em = authData.user.email || '';

          const { data: created, error: createErr } = await supabase
            .from('profiles')
            .upsert({
              id: uid,
              first_name: fn,
              last_name: ln,
              avatar_id: av,
              email: em
            })
            .select('*')
            .single();

          if (!createErr && created) {
            return {
              uid: created.id,
              firstName: created.first_name,
              lastName: created.last_name,
              email: created.email,
              avatarId: created.avatar_id,
              role: 'STUDENT',
              classId: created.active_class_id,
              activeClassId: created.active_class_id,
              createdAt: created.created_at
            };
          }
        }
        return null;
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
    } catch (err: any) {
      logger.adapter('error', 'Eccezione recupero profilo cloud', { error: err?.message });
      return null;
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
    if (!isSupabaseConfigured || !supabase || !isValidUUID(classId)) {
      return localStore.getClass(classId);
    }

    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .maybeSingle();

      if (error) {
        logger.adapter('warn', 'Errore recupero classe cloud', { error: error.message });
        return null;
      }
      if (!data) return null;

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
    } catch (err: any) {
      logger.adapter('error', 'Eccezione recupero classe cloud', { error: err?.message });
      return null;
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

      if (error) {
        logger.adapter('warn', 'Errore recupero classe per codice cloud', { error: error.message });
        return null;
      }
      if (!data) return null;

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
    } catch (err: any) {
      logger.adapter('error', 'Eccezione recupero classe per codice cloud', { error: err?.message });
      return null;
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
      p_name: name.trim(),
      p_school_name: (schoolName || 'Scuola Superiore').trim(),
      p_academic_year: (academicYear || '2026/2027').trim(),
      p_allow_self_join: allowSelfJoin ?? true
    });

    if (error || !data) {
      logger.adapter('error', 'Errore RPC create_class', { error: error?.message });
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

    if (cleanCode === 'DEVTEST' || cleanCode === 'DEV-TEST') {
      const localCls = localStore.getClassByCode('DEVTEST') || localStore.getClass('cls-dev-test');
      return {
        success: true,
        message: 'Ti sei unito alla classe test con successo!',
        classId: 'cls-dev-test',
        className: localCls?.name || 'ClassHub — Developer Test',
        role: 'ADMIN'
      };
    }

    if (!isSupabaseConfigured || !supabase) {
      const localCls = localStore.getClassByCode(cleanCode);
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
      logger.adapter('error', 'Errore RPC join_class_by_code', { error: error?.message });
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

    if (!isValidUUID(classId)) {
      throw new Error('ID classe non valido.');
    }

    const { error } = await (supabase.rpc as any)('set_active_class', {
      p_class_id: classId
    });

    if (error) {
      logger.adapter('error', 'Errore RPC set_active_class', { error: error.message });
      throw new Error(error.message);
    }
  },

  async getUserMemberships(userId: string): Promise<UserMembership[]> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(userId)) {
      return localStore.getUserMemberships(userId);
    }

    try {
      const { data, error } = await supabase
        .from('class_members')
        .select('*, classes(name, code)')
        .eq('user_id', userId);

      if (error) {
        logger.adapter('warn', 'Errore recupero memberships cloud', { error: error.message });
        return [];
      }
      if (!data) return [];

      return data.map((item: any) => ({
        classId: item.class_id,
        className: item.classes?.name || 'Classe',
        classCode: item.classes?.code || 'CODICE',
        role: item.role as UserRole,
        joinedAt: item.joined_at
      }));
    } catch (err: any) {
      logger.adapter('error', 'Eccezione recupero memberships cloud', { error: err?.message });
      return [];
    }
  },

  async getMembersOfClass(classId: string): Promise<ClassMember[]> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(classId) || classId === 'cls-dev-test') {
      return localStore.getMembersOfClass(classId);
    }

    try {
      const { data, error } = await supabase
        .from('class_members')
        .select('*, profiles(first_name, last_name, email, avatar_id)')
        .eq('class_id', classId);

      if (error) {
        logger.adapter('warn', 'Errore recupero membri classe cloud', { error: error.message });
        return [];
      }
      if (!data) return [];

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
    } catch (err: any) {
      logger.adapter('error', 'Eccezione recupero membri classe cloud', { error: err?.message });
      return [];
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
  },

  async updateClassSettings(
    classId: string,
    settings: {
      allowSelfJoin?: boolean;
      controllerCanCreateNotices?: boolean;
      lockVolunteersOnDeadline?: boolean;
    }
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase || classId === 'cls-dev-test' || !isValidUUID(classId)) {
      const updated = localStore.updateClass(classId, {
        allowSelfJoin: settings.allowSelfJoin,
        controllerCanCreateNotices: settings.controllerCanCreateNotices,
        lockVolunteersOnDeadline: settings.lockVolunteersOnDeadline
      });
      if (!updated) {
        throw new Error('Classe non trovata.');
      }
      return;
    }

    const payload: Record<string, boolean> = {};
    if (settings.allowSelfJoin !== undefined) payload.allow_self_join = settings.allowSelfJoin;
    if (settings.controllerCanCreateNotices !== undefined) payload.controller_can_create_notices = settings.controllerCanCreateNotices;
    if (settings.lockVolunteersOnDeadline !== undefined) payload.lock_volunteers_on_deadline = settings.lockVolunteersOnDeadline;

    if (Object.keys(payload).length === 0) return;

    const { data, error } = await supabase
      .from('classes')
      .update(payload as any)
      .eq('id', classId)
      .select('id');

    if (error) {
      logger.adapter('error', 'Errore aggiornamento impostazioni classe', { error: error.message });
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('Classe non trovata o permessi non sufficienti per aggiornare le impostazioni.');
    }
  }
};

// ============================================================================
// 3. CALENDAR & EVENTS ADAPTER
// ============================================================================
export const eventsAdapter = {
  async getEvents(classId: string, userId: string): Promise<CalendarEvent[]> {
    if (!isSupabaseConfigured || !supabase || !classId || !isValidUUID(classId) || classId === 'cls-dev-test') {
      return localStore.getEvents(classId, userId);
    }

    try {
      let query = supabase.from('events').select('*, profiles(first_name, last_name)');
      if (classId && userId && isValidUUID(classId)) {
        query = query.or(`class_id.eq.${classId},and(is_personal.eq.true,author_id.eq.${userId})`);
      } else if (classId && isValidUUID(classId)) {
        query = query.eq('class_id', classId);
      } else if (userId) {
        query = query.eq('is_personal', true).eq('author_id', userId);
      } else {
        return [];
      }
      query = query.order('event_date', { ascending: true });

      let rows: any[] | null = null;
      const { data, error } = await query;

      if (!error && data) {
        rows = data as any[];
      } else if (error) {
        // Fallback retry without profiles join if PostgREST schema cache is refreshing
        let fallbackQuery = supabase.from('events').select('*');
        if (classId && userId && isValidUUID(classId)) {
          fallbackQuery = fallbackQuery.or(`class_id.eq.${classId},and(is_personal.eq.true,author_id.eq.${userId})`);
        } else if (classId && isValidUUID(classId)) {
          fallbackQuery = fallbackQuery.eq('class_id', classId);
        } else if (userId) {
          fallbackQuery = fallbackQuery.eq('is_personal', true).eq('author_id', userId);
        }
        const fallbackRes = await fallbackQuery.order('event_date', { ascending: true });
        if (!fallbackRes.error && fallbackRes.data) {
          rows = fallbackRes.data as any[];
        } else {
          logger.adapter('warn', 'Errore recupero eventi cloud', { error: error.message });
          return [];
        }
      }
      if (!rows) return [];

      return rows.map((e: any) => {
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
    } catch (err: any) {
      logger.adapter('error', 'Eccezione recupero eventi cloud', { error: err?.message });
      return [];
    }
  },

  async addEvent(event: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<CalendarEvent> {
    if (!isSupabaseConfigured || !supabase || (!event.isPersonal && (!isValidUUID(event.classId || '') || event.classId === 'cls-dev-test'))) {
      return localStore.addEvent(event);
    }

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
          class_id: event.classId,
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
      .insert(insertPayload as any)
      .select()
      .single();

    if (error || !data) {
      logger.adapter('error', 'Errore salvataggio evento cloud', { error: error?.message });
      throw new Error(error?.message || 'Errore durante il salvataggio dell\'evento su cloud.');
    }

    if (!event.isPersonal && data.class_id && data.id) {
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          classId: data.class_id,
          notificationType: 'EVENT',
          referenceId: data.id
        }
      });
      if (pushError) {
        console.warn('Impossibile inviare notifica push');
      }
    }

    return {
      ...event,
      id: data.id,
      createdAt: data.created_at
    };
  },

  async deleteEvent(eventId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(eventId)) {
      localStore.deleteEvent(eventId);
      return;
    }

    // Retrieve event details before deleting to dispatch push notification
    const { data: eventInfo } = await supabase
      .from('events')
      .select('title, class_id, is_personal, type')
      .eq('id', eventId)
      .maybeSingle();

    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) {
      logger.adapter('error', 'Errore eliminazione evento cloud', { error: error.message });
      throw new Error(error.message);
    }

    if (eventInfo?.class_id && !eventInfo.is_personal) {
      const isVerifica = eventInfo.type === 'VERIFICA';
      supabase.functions.invoke('send-push-notification', {
        body: {
          classId: eventInfo.class_id,
          notificationType: 'EVENT',
          action: 'DELETE',
          customTitle: isVerifica ? '[Annullata] Verifica Scolastica' : '[Annullato] Evento in Calendario',
          customBody: `${eventInfo.title || 'Attività'} è stato rimosso dal calendario.`
        }
      }).catch(() => {});
    }
  },

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(eventId)) {
      localStore.updateEvent(eventId, updates);
      return;
    }

    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.subject !== undefined) payload.subject_name = updates.subject;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.date !== undefined) payload.event_date = updates.date;
    if (updates.startTime !== undefined) payload.start_time = updates.startTime;
    if (updates.endTime !== undefined) payload.end_time = updates.endTime;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.teacher !== undefined) payload.teacher = updates.teacher;

    const { data, error } = await supabase
      .from('events')
      .update(payload as any)
      .eq('id', eventId)
      .select('id, title, class_id, is_personal, type')
      .single();

    if (error) {
      logger.adapter('error', 'Errore modifica evento cloud', { error: error.message });
      throw new Error(error.message);
    }

    if (data?.class_id && !data.is_personal) {
      supabase.functions.invoke('send-push-notification', {
        body: {
          classId: data.class_id,
          notificationType: 'EVENT',
          action: 'UPDATE',
          referenceId: data.id
        }
      }).catch(() => {});
    }
  }
};

// ============================================================================
// 4. INTERROGATIONS & VOLUNTEERS ADAPTER
// ============================================================================
export const interrogationsAdapter = {
  async getInterrogations(classId: string): Promise<Interrogation[]> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(classId) || classId === 'cls-dev-test') {
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
            status,
            notes,
            profiles (first_name, last_name, avatar_id)
          )
        `)
        .eq('class_id', classId)
        .order('interrogation_date', { ascending: true });

      if (error) {
        logger.adapter('warn', 'Errore recupero interrogazioni cloud', { error: error.message });
        return [];
      }
      if (!data) return [];

      return data.map((item: any) => {
        const volunteersList = (item.interrogation_volunteers || []).map((v: any) => {
          const fn = v.profiles?.first_name || '';
          const ln = v.profiles?.last_name || '';
          const full = formatVolunteerName(fn, ln);
          return {
            userId: v.user_id,
            userName: full || 'Studente',
            userAvatar: v.profiles?.avatar_id || 'avatar-blue',
            timestamp: v.joined_at,
            status: (v.status || 'VOLUNTEER') as any,
            notes: v.notes || undefined
          };
        });

        const examinedIds = volunteersList
          .filter((v: any) => v.status === 'EXAMINED')
          .map((v: any) => v.userId);

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
          volunteerIds: volunteersList.map((v: any) => v.userId),
          examinedStudentIds: examinedIds
        };
      });
    } catch (err: any) {
      logger.adapter('error', 'Eccezione recupero interrogazioni cloud', { error: err?.message });
      return [];
    }
  },

  async createInterrogation(
    interrogation: Omit<Interrogation, 'id' | 'volunteers' | 'volunteerIds' | 'status'>,
    creatorUid: string
  ): Promise<Interrogation> {
    if (!isSupabaseConfigured || !supabase || !interrogation.classId || !isValidUUID(interrogation.classId) || interrogation.classId === 'cls-dev-test') {
      return localStore.addInterrogation(interrogation);
    }

    const { data, error } = await supabase
      .from('interrogations')
      .insert({
        class_id: interrogation.classId,
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
      logger.adapter('error', 'Errore creazione interrogazione cloud', { error: error?.message });
      throw new Error(error?.message || 'Errore durante la creazione dell\'interrogazione.');
    }

    if (data.class_id && data.id) {
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          classId: data.class_id,
          notificationType: 'INTERROGATION',
          referenceId: data.id
        }
      });
      if (pushError) {
        console.warn('Impossibile inviare notifica push');
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
    if (!isSupabaseConfigured || !supabase || !isValidUUID(id)) {
      localStore.updateInterrogationStatus(id, status);
      return;
    }

    const { error } = await supabase
      .from('interrogations')
      .update({ status })
      .eq('id', id);

    if (error) {
      logger.adapter('error', 'Errore aggiornamento stato interrogazione', { error: error.message });
      throw new Error(error.message);
    }
  },

  async deleteInterrogation(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(id)) {
      localStore.deleteInterrogation(id);
      return;
    }

    const { data: interInfo } = await supabase
      .from('interrogations')
      .select('class_id, subject_name, title')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase
      .from('interrogations')
      .delete()
      .eq('id', id);

    if (error) {
      logger.adapter('error', 'Errore eliminazione interrogazione', { error: error.message });
      throw new Error(error.message);
    }

    if (interInfo?.class_id) {
      supabase.functions.invoke('send-push-notification', {
        body: {
          classId: interInfo.class_id,
          notificationType: 'INTERROGATION',
          action: 'DELETE',
          customTitle: '[Annullata] Interrogazione Annullata',
          customBody: `L'interrogazione di ${interInfo.subject_name || interInfo.title || 'classe'} è stata rimossa.`
        }
      }).catch(() => {});
    }
  },

  async toggleVolunteer(
    interrogationId: string, 
    user: { uid: string; name: string; avatarId: string }
  ): Promise<{ success: boolean; message: string }> {
    logger.adapter('info', `Richiesta cambio volontario per interrogazione ${interrogationId}`, { userId: user.uid, userName: user.name });

    if (!isSupabaseConfigured || !supabase || !isValidUUID(interrogationId)) {
      return localStore.toggleVolunteer(interrogationId, user);
    }

    // Tier 1: Try Supabase RPC call if available
    try {
      const { data, error } = await (supabase.rpc as any)('toggle_volunteer_reservation', {
        p_interrogation_id: interrogationId
      });

      if (!error && data) {
        return {
          success: data.success ?? true,
          message: data.message || 'Operazione completata'
        };
      }
      if (error) {
        logger.adapter('warn', 'Risposta RPC toggle_volunteer_reservation', { error: error.message });
      }
    } catch (err: any) {
      logger.adapter('warn', 'Eccezione RPC toggle_volunteer_reservation', { error: err?.message });
    }

    // Tier 2: Direct Supabase table operations on interrogation_volunteers
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || user.uid;

      if (!userId) {
        throw new Error('Utente non autenticato.');
      }

      // Check if user is already registered as a volunteer
      const { data: existing, error: checkError } = await supabase
        .from('interrogation_volunteers')
        .select('user_id')
        .eq('interrogation_id', interrogationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        throw new Error(checkError.message);
      }

      if (existing) {
        // Unbook volunteer slot
        const { error: delError } = await supabase
          .from('interrogation_volunteers')
          .delete()
          .eq('interrogation_id', interrogationId)
          .eq('user_id', userId);

        if (delError) {
          throw new Error(delError.message);
        }
        return { success: true, message: 'Prenotazione ritirata con successo.' };
      } else {
        // Book volunteer slot: check status and capacity
        const { data: interrogation, error: intError } = await supabase
          .from('interrogations')
          .select('id, class_id, status, max_volunteers, subject_name')
          .eq('id', interrogationId)
          .single();

        if (intError || !interrogation) {
          throw new Error(intError?.message || 'Interrogazione non trovata.');
        }

        if (interrogation.status === 'CLOSED') {
          return { success: false, message: 'Le iscrizioni per questa interrogazione sono chiuse.' };
        }

        const { count, error: countError } = await supabase
          .from('interrogation_volunteers')
          .select('*', { count: 'exact', head: true })
          .eq('interrogation_id', interrogationId);

        if (countError) {
          throw new Error(countError.message);
        }

        if (count !== null && count >= interrogation.max_volunteers) {
          return { success: false, message: 'Tutti i posti disponibili per i volontari sono esauriti.' };
        }

        const { error: insError } = await supabase
          .from('interrogation_volunteers')
          .insert({
            interrogation_id: interrogationId,
            user_id: userId,
            status: 'VOLUNTEER'
          });

        if (insError) {
          // Fallback without status column if schema not yet updated
          const { error: fallbackErr } = await supabase
            .from('interrogation_volunteers')
            .insert({
              interrogation_id: interrogationId,
              user_id: userId
            });
          if (fallbackErr) {
            throw new Error(fallbackErr.message);
          }
        }

        // Check if newly reached full capacity, notify class if so
        const newCount = (count || 0) + 1;
        if (newCount >= interrogation.max_volunteers) {
          await supabase
            .from('interrogations')
            .update({ status: 'FULL' })
            .eq('id', interrogationId);

          if (interrogation.class_id) {
            supabase.functions.invoke('send-push-notification', {
              body: {
                classId: interrogation.class_id,
                notificationType: 'INTERROGATION',
                action: 'FULL_SLOTS',
                referenceId: interrogation.id
              }
            }).catch(() => {});
          }
        }

        return { success: true, message: 'Prenotazione registrata! Sei nella lista volontari.' };
      }
    } catch (err: any) {
      logger.adapter('error', 'Errore gestione volontario su cloud', { error: err?.message });
      throw new Error(err?.message || 'Impossibile aggiornare la prenotazione sul cloud.');
    }
  },

  async updateInterrogation(id: string, updates: Partial<Interrogation>): Promise<void> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(id)) {
      localStore.updateInterrogation(id, updates);
      return;
    }

    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.subject !== undefined) payload.subject_name = updates.subject;
    if (updates.date !== undefined) payload.interrogation_date = updates.date;
    if (updates.startTime !== undefined) payload.start_time = updates.startTime;
    if (updates.endTime !== undefined) payload.end_time = updates.endTime;
    if (updates.maxVolunteers !== undefined) payload.max_volunteers = updates.maxVolunteers;
    if (updates.teacher !== undefined) payload.teacher = updates.teacher;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error } = await supabase
      .from('interrogations')
      .update(payload as any)
      .eq('id', id)
      .select('id, class_id, subject_name')
      .single();

    if (error) {
      logger.adapter('error', 'Errore modifica interrogazione cloud', { error: error.message });
      throw new Error(error.message);
    }

    if (data?.class_id) {
      supabase.functions.invoke('send-push-notification', {
        body: {
          classId: data.class_id,
          notificationType: 'INTERROGATION',
          action: 'UPDATE',
          referenceId: data.id
        }
      }).catch(() => {});
    }
  },

  async updateInterrogationVolunteers(
    interrogationId: string, 
    volunteers: VolunteerSlot[],
    classId?: string
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(interrogationId)) {
      localStore.updateVolunteersList(interrogationId, volunteers);
      return;
    }

    try {
      const { data: inter } = await supabase
        .from('interrogations')
        .select('id, class_id, max_volunteers, status, subject_name')
        .eq('id', interrogationId)
        .single();

      const targetClassId = classId || inter?.class_id;

      // Existing volunteers in database
      const { data: existingRows } = await supabase
        .from('interrogation_volunteers')
        .select('id, user_id, status')
        .eq('interrogation_id', interrogationId);

      const existingUserIds = new Set((existingRows || []).map((r: any) => r.user_id));
      const newUserIds = new Set(volunteers.map(v => v.userId));

      // Delete removed volunteers
      const toDelete = (existingRows || []).filter((r: any) => !newUserIds.has(r.user_id));
      for (const del of toDelete) {
        await supabase
          .from('interrogation_volunteers')
          .delete()
          .eq('id', del.id);
      }

      // Upsert current volunteers with their statuses
      for (const v of volunteers) {
        const payload: Record<string, any> = {
          interrogation_id: interrogationId,
          user_id: v.userId,
          status: v.status || 'VOLUNTEER',
          notes: v.notes || null
        };

        const { error: upsertErr } = await supabase
          .from('interrogation_volunteers')
          .upsert(payload, { onConflict: 'interrogation_id,user_id' });

        if (upsertErr) {
          // Fallback if status column not present
          try {
            await supabase
              .from('interrogation_volunteers')
              .upsert({ interrogation_id: interrogationId, user_id: v.userId }, { onConflict: 'interrogation_id,user_id' });
          } catch {
            // Ignore fallback error
          }
        }
      }

      // Update interrogation status
      if (inter) {
        const isFull = volunteers.length >= inter.max_volunteers;
        if (inter.status !== 'CLOSED') {
          const newStatus = isFull ? 'FULL' : 'OPEN';
          await supabase
            .from('interrogations')
            .update({ status: newStatus })
            .eq('id', interrogationId);

          if (isFull && inter.status !== 'FULL' && targetClassId) {
            supabase.functions.invoke('send-push-notification', {
              body: {
                classId: targetClassId,
                notificationType: 'INTERROGATION',
                action: 'FULL_SLOTS',
                referenceId: interrogationId
              }
            }).catch(() => {});
          }
        }
      }
    } catch (err: any) {
      logger.adapter('error', 'Errore gestione manuale volontari cloud', { error: err?.message });
      throw new Error(err?.message || 'Impossibile aggiornare i volontari sul server.');
    }
  }
};

// ============================================================================
// 5. NOTICES ADAPTER
// ============================================================================
export const noticesAdapter = {
  async getNotices(classId: string): Promise<Notice[]> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(classId) || classId === 'cls-dev-test') {
      return localStore.getNotices(classId);
    }

    try {
      let rows: any[] | null = null;
      const { data, error } = await supabase
        .from('notices')
        .select('*, profiles(first_name, last_name)')
        .eq('class_id', classId)
        .order('notice_date', { ascending: false });

      if (!error && data) {
        rows = data as any[];
      } else if (error) {
        const fallbackRes = await supabase
          .from('notices')
          .select('*')
          .eq('class_id', classId)
          .order('notice_date', { ascending: false });
        if (!fallbackRes.error && fallbackRes.data) {
          rows = fallbackRes.data as any[];
        } else {
          logger.adapter('warn', 'Errore recupero avvisi cloud', { error: error.message });
          return [];
        }
      }
      if (!rows) return [];

      return rows.map((n: any) => ({
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
    } catch (err: any) {
      logger.adapter('error', 'Eccezione recupero avvisi cloud', { error: err?.message });
      return [];
    }
  },

  async addNotice(notice: Omit<Notice, 'id'>, authorUid: string): Promise<Notice> {
    if (!isSupabaseConfigured || !supabase || !notice.classId || !isValidUUID(notice.classId) || notice.classId === 'cls-dev-test') {
      return localStore.addNotice(notice);
    }

    const { data, error } = await supabase
      .from('notices')
      .insert({
        class_id: notice.classId,
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
      logger.adapter('error', 'Errore pubblicazione avviso cloud', { error: error?.message });
      throw new Error(error?.message || 'Errore durante la pubblicazione dell\'avviso su cloud.');
    }

    if (data.class_id && data.id) {
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          classId: data.class_id,
          notificationType: 'NOTICE',
          referenceId: data.id
        }
      });
      if (pushError) {
        console.warn('Impossibile inviare notifica push');
      }
    }

    return {
      ...notice,
      id: data.id,
      createdAt: data.created_at
    };
  },

  async deleteNotice(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(id)) {
      localStore.deleteNotice(id);
      return;
    }

    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) {
      logger.adapter('error', 'Errore eliminazione avviso', { error: error.message });
      throw new Error(error.message);
    }
  },

  async updateNotice(id: string, updates: { title?: string; content?: string; priority?: 'NORMAL' | 'HIGH'; date?: string }): Promise<void> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(id)) {
      const res = localStore.updateNotice(id, updates);
      if (!res) {
        throw new Error('Avviso non trovato nel database locale.');
      }
      return;
    }

    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.date !== undefined) payload.notice_date = updates.date;

    if (Object.keys(payload).length === 0) return;

    const { data, error } = await supabase
      .from('notices')
      .update(payload as any)
      .eq('id', id)
      .select('id');

    if (error) {
      logger.adapter('error', 'Errore modifica avviso cloud', { error: error.message });
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('Avviso non trovato o permessi non sufficienti per la modifica.');
    }
  }
};

// ============================================================================
// 6. MATERIALS & STORAGE ADAPTER
// Path: {class_id}/{material_id}/{file_name}
// ============================================================================
export const materialsAdapter = {
  async getMaterials(classId: string): Promise<MaterialItem[]> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(classId) || classId === 'cls-dev-test') {
      return localStore.getMaterials(classId);
    }

    try {
      let rows: any[] | null = null;
      const { data, error } = await supabase
        .from('materials')
        .select('*, profiles(first_name, last_name)')
        .eq('class_id', classId)
        .order('material_date', { ascending: false });

      if (!error && data) {
        rows = data as any[];
      } else if (error) {
        const fallbackRes = await supabase
          .from('materials')
          .select('*')
          .eq('class_id', classId)
          .order('material_date', { ascending: false });
        if (!fallbackRes.error && fallbackRes.data) {
          rows = fallbackRes.data as any[];
        } else {
          logger.adapter('warn', 'Errore recupero materiali cloud', { error: error.message });
          return [];
        }
      }
      if (!rows) return [];

      // Generate signed URLs for private bucket files
      const items: MaterialItem[] = await Promise.all(
        rows.map(async (m: any) => {
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
    } catch (err: any) {
      logger.adapter('error', 'Eccezione recupero materiali cloud', { error: err?.message });
      return [];
    }
  },

  async uploadAndAddMaterial(
    material: Omit<MaterialItem, 'id'>, 
    fileObject?: File | Blob | null,
    uploaderUid?: string
  ): Promise<MaterialItem> {
    if (!isSupabaseConfigured || !supabase || !material.classId || !isValidUUID(material.classId) || material.classId === 'cls-dev-test') {
      return localStore.addMaterial(material);
    }

    let storagePath: string | null = null;
    let fileName = material.fileName || null;
    let fileSize = 0;

    // 1. Upload to Supabase Storage if file is provided
    if (fileObject) {
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
        logger.adapter('error', 'Errore caricamento Storage', { error: uploadError.message });
        throw new Error(`Errore caricamento Storage: ${uploadError.message}`);
      }
    }

    // 2. Insert into PostgreSQL materials table
    const { data: authUserRes } = await supabase.auth.getUser();
    const effectiveUploaderUid = uploaderUid || authUserRes?.user?.id;
    if (!effectiveUploaderUid) {
      throw new Error('Utente non autenticato. Effettua l\'accesso per caricare file.');
    }

    const { data, error } = await supabase
      .from('materials')
      .insert({
        class_id: material.classId,
        uploaded_by: effectiveUploaderUid,
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
      logger.adapter('error', 'Errore inserimento materiale cloud', { error: error?.message });
      throw new Error(error?.message || 'Impossibile registrare il materiale nel database.');
    }

    if (data.class_id) {
      supabase.functions.invoke('send-push-notification', {
        body: {
          classId: data.class_id,
          notificationType: 'MATERIAL',
          action: 'CREATE',
          referenceId: data.id,
          customTitle: 'Nuovo Materiale Didattico',
          customBody: `Caricato "${material.title}" per ${material.subject}`
        }
      }).catch(() => {});
    }

    return {
      ...material,
      id: data.id,
      fileName: data.file_name || undefined,
      fileSize: data.file_size ? `${Math.round(data.file_size / 1024)} KB` : undefined
    };
  },

  async deleteMaterial(id: string, _classId?: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(id)) {
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
    if (error) {
      logger.adapter('error', 'Errore eliminazione materiale cloud', { error: error.message });
      throw new Error(error.message);
    }
  }
};

// ============================================================================
// 7. TIMETABLE & SUBJECTS ADAPTER
// ============================================================================
export const timetableAdapter = {
  async getTimetable(classId?: string): Promise<TimetableSlot[]> {
    if (!isSupabaseConfigured || !supabase || !classId || !isValidUUID(classId) || classId === 'cls-dev-test') {
      return localStore.getTimetable();
    }

    try {
      const { data, error } = await supabase
        .from('timetable_slots')
        .select('*')
        .eq('class_id', classId)
        .order('day_of_week')
        .order('hour');

      if (error) {
        logger.adapter('warn', 'Errore recupero orario cloud', { error: error.message });
        return [];
      }
      if (!data) return [];

      return data.map((s: any) => ({
        id: s.id,
        dayOfWeek: s.day_of_week,
        hour: s.hour,
        timeRange: s.time_range,
        subject: s.subject_name,
        teacher: s.teacher || undefined,
        room: s.room || undefined
      }));
    } catch (err: any) {
      logger.adapter('error', 'Eccezione recupero orario cloud', { error: err?.message });
      return [];
    }
  },

  async updateTimetableSlot(slot: TimetableSlot, classId?: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase || !classId || !isValidUUID(classId) || classId === 'cls-dev-test') {
      localStore.updateTimetableSlot(slot);
      return;
    }

    // Check if slot exists in DB
    const { data: existing, error: checkError } = await supabase
      .from('timetable_slots')
      .select('id')
      .eq('class_id', classId)
      .eq('day_of_week', slot.dayOfWeek)
      .eq('hour', slot.hour)
      .maybeSingle();

    if (checkError) {
      logger.adapter('error', 'Errore verifica slot orario cloud', { error: checkError.message });
      throw new Error(checkError.message);
    }

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

      if (error) {
        logger.adapter('error', 'Errore aggiornamento orario cloud', { error: error.message });
        throw new Error(error.message);
      }
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

      if (error) {
        logger.adapter('error', 'Errore inserimento orario cloud', { error: error.message });
        throw new Error(error.message);
      }
    }
  },

  async deleteTimetableSlot(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(id)) {
      localStore.deleteTimetableSlot(id);
      return;
    }

    await supabase.from('timetable_slots').delete().eq('id', id);
  },

  async getSubjects(classId?: string): Promise<SubjectItem[]> {
    if (!isSupabaseConfigured || !supabase || !classId || !isValidUUID(classId) || classId === 'cls-dev-test') {
      return localStore.getSubjects(classId || 'cls-dev-test');
    }

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('class_id', classId)
        .order('name');

      if (error) {
        logger.adapter('warn', 'Errore recupero materie cloud', { error: error.message });
        return [];
      }
      if (!data) return [];

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
    } catch (err: any) {
      logger.adapter('error', 'Eccezione recupero materie cloud', { error: err?.message });
      return [];
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
    if (!isSupabaseConfigured || !supabase || !isValidUUID(classId) || classId === 'cls-dev-test') {
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

      if (error) {
        logger.adapter('warn', 'Errore recupero sondaggi cloud', { error: error.message });
        return [];
      }
      if (!data) return [];

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
    } catch (err: any) {
      logger.adapter('error', 'Eccezione recupero sondaggi cloud', { error: err?.message });
      return [];
    }
  },

  async addSurvey(
    survey: Omit<Survey, 'id' | 'createdAt' | 'totalVotes'>, 
    authorUid: string
  ): Promise<Survey> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.addSurvey(survey);
    }

    if (!survey.classId || !isValidUUID(survey.classId)) {
      throw new Error('Nessuna classe attiva selezionata.');
    }

    // 1. Create survey record
    const { data: surveyRow, error: surveyError } = await supabase
      .from('surveys')
      .insert({
        class_id: survey.classId,
        author_id: authorUid,
        title: survey.title,
        question: survey.question,
        status: survey.status || 'OPEN',
        deadline: survey.deadline || null
      })
      .select()
      .single();

    if (surveyError || !surveyRow) {
      logger.adapter('error', 'Errore creazione sondaggio cloud', { error: surveyError?.message });
      throw new Error(surveyError?.message || 'Errore durante la creazione del sondaggio.');
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
      logger.adapter('error', 'Errore inserimento opzioni sondaggio', { error: optError.message });
      throw new Error(optError.message);
    }

    if (surveyRow.class_id) {
      supabase.functions.invoke('send-push-notification', {
        body: {
          classId: surveyRow.class_id,
          notificationType: 'SURVEY',
          action: 'CREATE',
          referenceId: surveyRow.id,
          customTitle: 'Nuovo Sondaggio di Classe',
          customBody: `Aperto: "${surveyRow.title}"`
        }
      }).catch(() => {});
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
      logger.adapter('error', 'Errore salvataggio voto sondaggio', { error: error.message });
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

    if (error) {
      logger.adapter('error', 'Errore cambio stato sondaggio', { error: error.message });
      throw new Error(error.message);
    }
  },

  async deleteSurvey(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStore.deleteSurvey(id);
      return;
    }

    const { error } = await supabase.from('surveys').delete().eq('id', id);
    if (error) {
      logger.adapter('error', 'Errore eliminazione sondaggio', { error: error.message });
      throw new Error(error.message);
    }
  }
};

// ============================================================================
// 9. REPRESENTATION ADAPTER
// ============================================================================
export const representationAdapter = {
  async getRepresentationItems(classId: string): Promise<RepresentationItem[]> {
    if (!isSupabaseConfigured || !supabase || !isValidUUID(classId) || classId === 'cls-dev-test') {
      return localStore.getRepresentationItems(classId);
    }

    try {
      let rows: any[] | null = null;
      const { data, error } = await supabase
        .from('representation_items')
        .select('*, profiles(first_name, last_name)')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        rows = data as any[];
      } else if (error) {
        const fallbackRes = await supabase
          .from('representation_items')
          .select('*')
          .eq('class_id', classId)
          .order('created_at', { ascending: false });
        if (!fallbackRes.error && fallbackRes.data) {
          rows = fallbackRes.data as any[];
        } else {
          logger.adapter('warn', 'Errore recupero richieste rappresentanza cloud', { error: error.message });
          return [];
        }
      }
      if (!rows) return [];

      return rows.map((item: any) => {
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
    } catch (err: any) {
      logger.adapter('error', 'Eccezione recupero richieste rappresentanza cloud', { error: err?.message });
      return [];
    }
  },

  async addRepresentationItem(
    item: Omit<RepresentationItem, 'id'>, 
    authorUid: string
  ): Promise<RepresentationItem> {
    if (!isSupabaseConfigured || !supabase) {
      return localStore.addRepresentationItem(item);
    }

    if (!item.classId || !isValidUUID(item.classId)) {
      throw new Error('Nessuna classe attiva selezionata.');
    }

    const { data, error } = await supabase
      .from('representation_items')
      .insert({
        class_id: item.classId,
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
      logger.adapter('error', 'Errore creazione richiesta rappresentanza cloud', { error: error?.message });
      throw new Error(error?.message || 'Errore durante la creazione della proposta.');
    }

    if (data.class_id) {
      supabase.functions.invoke('send-push-notification', {
        body: {
          classId: data.class_id,
          notificationType: 'REPRESENTATION',
          action: 'CREATE',
          referenceId: data.id,
          customTitle: 'Nuova Comunicazione Rappresentanti',
          customBody: `Nuova ${item.category || 'proposta'}: "${item.title}"`
        }
      }).catch(() => {});
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

    if (error) {
      logger.adapter('error', 'Errore aggiornamento stato rappresentanza', { error: error.message });
      throw new Error(error.message);
    }
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

    if (error) {
      logger.adapter('error', 'Errore eliminazione richiesta rappresentanza', { error: error.message });
      throw new Error(error.message);
    }
  }
};
