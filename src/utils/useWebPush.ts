import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, [currentUser?.uid]);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    }
  };

  const subscribeToPush = async (vapidPublicKey: string): Promise<boolean> => {
    if (!isSupported || !currentUser || !profile?.classId) return false;
    setLoading(true);

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        setLoading(false);
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check if VAPID key is provided
      if (!vapidPublicKey) {
        console.warn('VAPID public key not provided for push subscription');
        setLoading(false);
        return false;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // Save subscription in Supabase table 'push_subscriptions' only after verifying class membership
      if (isSupabaseConfigured && supabase) {
        // Verify server-side class membership before saving push subscription
        const { data: memberCheck, error: memberErr } = await (supabase as any)
          .from('class_members')
          .select('role')
          .eq('user_id', currentUser.uid)
          .eq('class_id', profile.classId)
          .single();

        if (memberErr || !memberCheck) {
          console.error('User is not a member of this class');
          setLoading(false);
          return false;
        }

        const subJson = subscription.toJSON();
        const endpoint = subJson.endpoint || '';

        const { error } = await (supabase as any).from('push_subscriptions').upsert({
          user_id: currentUser.uid,
          class_id: profile.classId,
          endpoint: endpoint,
          subscription: subJson,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint'
        });

        if (error) {
          console.error('Error saving push subscription to Supabase:', error);
          setLoading(false);
          return false;
        }
      }

      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
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

      setIsSubscribed(false);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Failed to unsubscribe from push:', err);
      setLoading(false);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribeToPush,
    unsubscribeFromPush,
  };
}
