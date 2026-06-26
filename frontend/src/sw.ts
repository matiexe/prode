/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

const swSelf = (self as unknown) as ServiceWorkerGlobalScope & typeof globalThis;

// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST);

// Escuchar evento push enviado desde el backend
swSelf.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/assets/icon-192x192.png',
      badge: '/assets/icon-192x192.png',
      data: {
        url: data.data?.url || '/dashboard'
      }
    };

    event.waitUntil(
      swSelf.registration.showNotification(data.title, options)
    );
  } catch (err) {
    console.error('Error al procesar el evento push:', err);
  }
});

// Al hacer clic en la notificación, abrir la aplicación
swSelf.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, swSelf.location.origin).href;

  event.waitUntil(
    swSelf.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya está abierta, hacer foco y redirigir
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir una nueva ventana
      if (swSelf.clients.openWindow) {
        return swSelf.clients.openWindow(urlToOpen);
      }
    })
  );
});
