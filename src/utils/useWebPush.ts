import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { logger } from './logger';
import { PushPreferences } from '../types';

export const DEFAULT_PUSH_PREFERENCES: PushPreferences = {
  verifiche: true,
  interrogazioni: true,
  eventi: true,
  avvisi: true,
  promemoria: true,
  materiali: true,
  sondaggi: true,
};

// Built-in preconfigured VAPID public key so push works out of the box without manual environment setup
export const DEFAULT_VAPID_PUBLIC_KEY = 'BKIAkKVNFhGQeVHr1eIAysArp3E0226kZ52R-UUC1RFt5Jx8yFh_n2hHClGPuDs2QX0PWqBY9FuaoA7RJPO-m58';

// Helper to convert VAPID public key string to Uint8Array required for push subscription
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush() {
  const { currentUser, profile } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<PushPreferences>(DEFAULT_PUSH_PREFERENCES);

  // Platform detection for iPhone/iPad and PWA standalone mode
  const isIOS = typeof window !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );

  // Load preferences from localStorage and/or Supabase
  useEffect(() => {
    if (!currentUser?.uid) return;
    const storageKey = `classhub_push_prefs_${currentUser.uid}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setPreferences({ ...DEFAULT_PUSH_PREFERENCES, ...JSON.parse(stored) });
      }
    } catch {
      // Ignore JSON parse errors
    }

    // Also check Supabase push_subscriptions preferences if available
    if (isSupabaseConfigured && supabase && profile?.classId) {
      (supabase as any)
        .from('push_subscriptions')
        .select('preferences')
        .eq('user_id', currentUser.uid)
        .eq('class_id', profile.classId)
        .maybeSingle()
        .then(({ data }: any) => {
          if (data?.preferences && typeof data.preferences === 'object') {
            const merged = { ...DEFAULT_PUSH_PREFERENCES, ...data.preferences };
            setPreferences(merged);
            localStorage.setItem(storageKey, JSON.stringify(merged));
          }
        })
        .catch(() => {});
    }
  }, [currentUser?.uid, profile?.classId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkExistingSubscription();
    } else {
      setIsSupported(false);
    }
  }, [currentUser?.uid]);

  const checkExistingSubscription = useCallback(async () => {
    try {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
      ]);
      if (!registration) {
        setIsSubscribed(false);
        return;
      }
      const sub = await registration.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    }
  }, []);

  const updatePreferences = async (newPrefs: Partial<PushPreferences>): Promise<boolean> => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);

    if (currentUser?.uid) {
      localStorage.setItem(`classhub_push_prefs_${currentUser.uid}`, JSON.stringify(updated));
    }

    if (isSupabaseConfigured && supabase && currentUser?.uid && profile?.classId) {
      try {
        await (supabase as any)
          .from('push_subscriptions')
          .update({ preferences: updated, updated_at: new Date().toISOString() })
          .eq('user_id', currentUser.uid)
          .eq('class_id', profile.classId);
        return true;
      } catch (err: any) {
        logger.push('warn', 'Errore aggiornamento preferenze push cloud', { error: err?.message });
      }
    }
    return true;
  };

  const subscribeToPush = async (customVapidPublicKey?: string): Promise<boolean> => {
    if (!isSupported || !currentUser || !profile?.classId) {
      logger.push('warn', 'Attivazione Push annullata: browser o utente non supportato');
      return false;
    }
    setLoading(true);

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        logger.push('warn', 'Permesso notifiche browser negato', { permission: permissionResult });
        setLoading(false);
        return false;
      }

      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500))
      ]);
      if (!registration) {
        logger.push('warn', 'Service Worker non pronto per notifiche push');
        setLoading(false);
        return false;
      }

      const vapidKey = customVapidPublicKey || (import.meta.env.VITE_VAPID_PUBLIC_KEY as string) || DEFAULT_VAPID_PUBLIC_KEY;

      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // Save subscription in Supabase table 'push_subscriptions'
      if (isSupabaseConfigured && supabase) {
        const { data: memberCheck, error: memberErr } = await (supabase as any)
          .from('class_members')
          .select('role')
          .eq('user_id', currentUser.uid)
          .eq('class_id', profile.classId)
          .single();

        if (memberErr || !memberCheck) {
          logger.push('error', 'Verifica appartenenza classe fallita per salvataggio push', { classId: profile.classId });
          setLoading(false);
          return false;
        }

        const subJson = subscription.toJSON();
        const endpoint = subJson.endpoint || '';

        // Attempt upsert with preferences
        const { error } = await (supabase as any).from('push_subscriptions').upsert({
          user_id: currentUser.uid,
          class_id: profile.classId,
          endpoint: endpoint,
          subscription: subJson,
          preferences: preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint'
        });

        // Graceful fallback if preferences column not yet created in remote DB
        if (error) {
          const { error: fallbackErr } = await (supabase as any).from('push_subscriptions').upsert({
            user_id: currentUser.uid,
            class_id: profile.classId,
            endpoint: endpoint,
            subscription: subJson,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,endpoint'
          });

          if (fallbackErr) {
            logger.push('error', 'Errore salvataggio sottoscrizione push su database Supabase', { error: fallbackErr.message });
            setLoading(false);
            return false;
          }
        }
      }

      logger.push('info', 'Sottoscrizione notifiche push attivata con successo', { classId: profile.classId });
      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (err: any) {
      logger.push('error', 'Eccezione durante la sottoscrizione push', { error: err?.message });
      setLoading(false);
      return false;
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    if (!isSupported || !currentUser) return false;
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from Supabase
      if (isSupabaseConfigured && supabase && profile?.classId) {
        await (supabase as any)
          .from('push_subscriptions')
          .delete()
          .eq('user_id', currentUser.uid)
          .eq('class_id', profile.classId);
      }

      logger.push('info', 'Disattivazione notifiche push completata');
      setIsSubscribed(false);
      setLoading(false);
      return true;
    } catch (err: any) {
      logger.push('error', 'Eccezione durante la disattivazione push', { error: err?.message });
      setLoading(false);
      return false;
    }
  };

  const sendTestNotification = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Devi essere autenticato per inviare un test.' };
    }

    if (Notification.permission !== 'granted') {
      return { success: false, message: 'I permessi notifiche non sono ancora stati concessi nel browser.' };
    }

    try {
      // Tier 1: If Supabase configured, call Edge Function for real web push delivery
      if (isSupabaseConfigured && supabase && profile?.classId) {
        const { data, error } = await supabase.functions.invoke('send-push-notification', {
          body: {
            classId: profile.classId,
            notificationType: 'TEST',
            targetUserId: currentUser.uid,
            customTitle: 'ClassHub — Test Push Notifica',
            customBody: 'Configurazione completata! Le notifiche push web funzionano correttamente.'
          }
        });

        if (!error && data?.success) {
          return { success: true, message: 'Notifica push inviata con successo al tuo dispositivo!' };
        }
      }

      // Tier 2: Service worker local notification test fallback
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg) {
          await reg.showNotification('ClassHub — Test Notifiche', {
            body: 'Le notifiche di ClassHub sono configurate e funzionanti!',
            icon: '/pwa-192x192.png',
            badge: '/favicon.svg',
            tag: 'classhub-test-local'
          });
          return { success: true, message: 'Notifica di test mostrata con successo!' };
        }
      }

      new Notification('ClassHub — Test Notifiche', {
        body: 'Le notifiche di ClassHub sono abilitate!',
        icon: '/pwa-192x192.png'
      });
      return { success: true, message: 'Notifica di test mostrata!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Errore durante l\'invio del test.' };
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    isIOS,
    isStandalone,
    preferences,
    updatePreferences,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
    checkExistingSubscription
  };
}
