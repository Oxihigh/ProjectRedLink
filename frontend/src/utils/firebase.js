import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
let app;
let messaging;

if (typeof window !== "undefined") {
  app = initializeApp(firebaseConfig);
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error("Firebase Messaging could not be initialized:", error);
  }
}

export const registerServiceWorker = async () => {
  if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
    try {
      const swUrl = `/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey || ''}&projectId=${firebaseConfig.projectId || ''}&messagingSenderId=${firebaseConfig.messagingSenderId || ''}&appId=${firebaseConfig.appId || ''}&authDomain=${firebaseConfig.authDomain || ''}&storageBucket=${firebaseConfig.storageBucket || ''}`;
      const registration = await navigator.serviceWorker.register(swUrl);
      console.log('Service Worker registered successfully');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

export const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || !messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const registration = await registerServiceWorker();
      const currentToken = await getToken(messaging, { 
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, // Optional but recommended
        serviceWorkerRegistration: registration || undefined
      });
      if (currentToken) {
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } else {
      console.log('Unable to get permission to notify.');
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
  return null;
};

export const onMessageListener = (callback) => {
  if (messaging) {
    onMessage(messaging, (payload) => {
      callback(payload);
    });
  }
};
