import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { eventsAdapter, interrogationsAdapter } from './adapters';
import { UserProfile } from '../types';
import { logger } from '../utils/logger';

/**
 * Service to process scheduled reminders for upcoming school activities.
 * Ensures:
 * 1. Day-before and morning-of reminders are dispatched.
 * 2. Personal events are sent strictly to their owner (never exposed to class).
 * 3. Strict deduplication so no reminder is ever received twice.
 */

function getSentRemindersLocal(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`classhub_reminders_sent_${userId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    }
  } catch {
    // Ignore parse error
  }
  return new Set();
}

function markReminderSentLocal(userId: string, reminderKey: string) {
  try {
    const set = getSentRemindersLocal(userId);
    set.add(reminderKey);
    localStorage.setItem(`classhub_reminders_sent_${userId}`, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore storage error
  }
}

export async function processScheduledReminders(profile: UserProfile): Promise<number> {
  if (!profile || !profile.uid) return 0;
  const classId = profile.classId || profile.activeClassId;
  if (!classId) return 0;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  let remindersSent = 0;
  const localSentSet = getSentRemindersLocal(profile.uid);

  try {
    // 1. Fetch events and interrogations
    const [events, interrogations] = await Promise.all([
      eventsAdapter.getEvents(classId, profile.uid),
      interrogationsAdapter.getInterrogations(classId)
    ]);

    // 2. Process Calendar Events
    for (const ev of events) {
      if (ev.date !== todayStr && ev.date !== tomorrowStr) continue;

      // Personal event privacy check: only process for event owner
      if (ev.isPersonal && ev.authorId !== profile.uid) {
        continue;
      }

      const isToday = ev.date === todayStr;
      const reminderType = isToday ? 'MORNING_OF' : 'DAY_BEFORE';
      const reminderKey = `event_${ev.id}_${reminderType}_${ev.date}`;

      if (localSentSet.has(reminderKey)) continue;

      // Check remote database deduplication log
      let alreadySentRemote = false;
      if (isSupabaseConfigured && supabase) {
        const { data: logEntry } = await (supabase as any)
          .from('scheduled_reminders_log')
          .select('id')
          .eq('user_id', profile.uid)
          .eq('reference_id', ev.id)
          .eq('reminder_type', reminderType)
          .maybeSingle();

        if (logEntry) {
          alreadySentRemote = true;
          markReminderSentLocal(profile.uid, reminderKey);
        }
      }

      if (alreadySentRemote) continue;

      // Prepare notification message
      const isVerifica = ev.type === 'VERIFICA';
      const timingLabel = isToday ? 'Oggi' : 'Domani';
      const title = `${isVerifica ? '⚠️ Verifica' : '📅 Evento'}: ${timingLabel} ${ev.startTime ? 'alle ' + ev.startTime : ''}`;
      const body = `${ev.title}${ev.subject ? ' (' + ev.subject + ')' : ''}`;

      // Dispatch push notification
      if (isSupabaseConfigured && supabase) {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            classId: classId,
            notificationType: 'REMINDER',
            targetUserId: profile.uid,
            referenceId: ev.id,
            customTitle: title,
            customBody: body,
            customUrl: '/calendar',
            customTag: `reminder-${ev.id}-${reminderType}`
          }
        }).catch(() => {});

        try {
          await (supabase as any)
            .from('scheduled_reminders_log')
            .insert({
              user_id: profile.uid,
              reference_id: ev.id,
              reminder_type: reminderType
            });
        } catch {}
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/pwa-192x192.png' });
      }

      markReminderSentLocal(profile.uid, reminderKey);
      remindersSent++;
    }

    // 3. Process Interrogations
    for (const inter of interrogations) {
      if (inter.date !== todayStr && inter.date !== tomorrowStr) continue;

      const isToday = inter.date === todayStr;
      const reminderType = isToday ? 'MORNING_OF' : 'DAY_BEFORE';
      const reminderKey = `inter_${inter.id}_${reminderType}_${inter.date}`;

      if (localSentSet.has(reminderKey)) continue;

      let alreadySentRemote = false;
      if (isSupabaseConfigured && supabase) {
        const { data: logEntry } = await (supabase as any)
          .from('scheduled_reminders_log')
          .select('id')
          .eq('user_id', profile.uid)
          .eq('reference_id', inter.id)
          .eq('reminder_type', reminderType)
          .maybeSingle();

        if (logEntry) {
          alreadySentRemote = true;
          markReminderSentLocal(profile.uid, reminderKey);
        }
      }

      if (alreadySentRemote) continue;

      const isUserBooked = inter.volunteerIds?.includes(profile.uid) || inter.volunteers?.some(v => v.userId === profile.uid);
      const timingLabel = isToday ? 'Oggi' : 'Domani';
      const title = `🗣️ Interrogazione: ${timingLabel} alle ${inter.startTime}`;
      const body = isUserBooked 
        ? `Sei iscritto come volontario per ${inter.subject}. Preparati per la prova!`
        : `Interrogazione programmata di ${inter.subject}.`;

      if (isSupabaseConfigured && supabase) {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            classId: classId,
            notificationType: 'REMINDER',
            targetUserId: profile.uid,
            referenceId: inter.id,
            customTitle: title,
            customBody: body,
            customUrl: '/interrogations',
            customTag: `reminder-inter-${inter.id}-${reminderType}`
          }
        }).catch(() => {});

        try {
          await (supabase as any)
            .from('scheduled_reminders_log')
            .insert({
              user_id: profile.uid,
              reference_id: inter.id,
              reminder_type: reminderType
            });
        } catch {}
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/pwa-192x192.png' });
      }

      markReminderSentLocal(profile.uid, reminderKey);
      remindersSent++;
    }

    if (remindersSent > 0) {
      logger.push('info', `Inviati ${remindersSent} promemoria programmati per utente`, { userId: profile.uid });
    }
  } catch (err: any) {
    logger.push('warn', 'Errore esecuzione promemoria programmati', { error: err?.message });
  }

  return remindersSent;
}
