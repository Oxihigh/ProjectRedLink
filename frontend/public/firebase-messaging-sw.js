importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Hardcoded Firebase config for reliable background initialization
const firebaseConfig = {
  apiKey: "AIzaSyCGL9XSRdWu9ZWriLxFw2wTpU2bPRuHMGM",
  authDomain: "redlinkproject.firebaseapp.com",
  projectId: "redlinkproject",
  storageBucket: "redlinkproject.firebasestorage.app",
  messagingSenderId: "867840543171",
  appId: "1:867840543171:web:4b7295f5c8d79ea52bd576"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || '/icon.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Dummy fetch handler to satisfy PWA installation requirements
self.addEventListener('fetch', (event) => {
  // We don't intercept fetches, but having this listener allows the app to be installable
});
