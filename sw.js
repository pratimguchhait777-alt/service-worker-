// sw.js - Service Worker for SCIENCE_IX Portal Background Native Push Alerts

const CACHE_NAME = 'science-ix-portal-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html'
];

// Perform install and cache basic offline shell fallback
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate handler
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Fetch events to keep the local files serving gracefully
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});

// Listen to true push messages broadcasted from a web-push server or FCM
self.addEventListener('push', (event) => {
    let payload = {
        title: 'SCIENCE_IX Update',
        body: 'New batch material has been successfully deployed!'
    };

    if (event.data) {
        try {
            // If server sends a structured JSON payload
            payload = event.data.json();
        } catch (e) {
            // If server sends a simple plain text payload
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3249/3249911.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3249/3249911.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        tag: 'new-upload',
        data: {
            url: self.location.origin // opens website index when clicked
        }
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});

// Open application window when user taps on the system-level lock screen notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                        break;
                    }
                }
                return client.focus();
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url || '/');
            }
        })
    );
});