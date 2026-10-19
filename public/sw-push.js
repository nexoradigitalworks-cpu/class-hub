// Service Worker Push Event Handler for ClassHub
// Handles background web push notifications and deep-linking navigation

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'ClassHub';
    const options = {
      body: data.body || 'Nuovo aggiornamento nella tua classe',
      icon: data.icon || '/pwa-192x192.png',
      badge: '/favicon.svg',
      tag: data.tag || 'classhub-notification',
      renotify: true,
      vibrate: [150, 80, 150],
      data: {
        url: data.url || '/',
        referenceId: data.referenceId,
        notificationType: data.notificationType
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('Error handling push event:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find an existing client window to focus
      for (const client of windowClients) {
        if ('focus' in client) {
          // Navigate to target route if client is on root or different page
          if (client.url && client.navigate) {
            client.navigate(rawUrl);
          }
          return client.focus();
        }
      }
      // If no window open, open new window with target url
      if (clients.openWindow) {
        return clients.openWindow(rawUrl);
      }
    })
  );
});
