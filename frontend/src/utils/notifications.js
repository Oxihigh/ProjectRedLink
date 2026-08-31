import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { requestNotificationPermission as webRequestPermission, onMessageListener as webOnMessageListener } from './firebase';
import { apiCall } from './api';

let isNative = false;
try {
  isNative = Capacitor.isNativePlatform();
} catch (e) {
  isNative = false;
}

/**
 * Creates high-priority notification channels on Android.
 */
export async function initializeNotificationChannels() {
  if (!isNative) return;

  try {
    await PushNotifications.createChannel({
      id: 'emergency_alerts',
      name: 'Emergency Blood Alerts',
      description: 'Critical notifications for urgent blood donation requests nearby.',
      importance: 5, // High priority (Heads-up notification banner + sound)
      visibility: 1, // Show on lock screen
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: '#DC2626',
    });
    console.log('Native Emergency Notification Channel created.');
  } catch (err) {
    console.warn('Failed to create native notification channel:', err);
  }
}

/**
 * Universal push notification permission request and token registration.
 * Handles both Native Android (Capacitor) and Web Browser (Service Worker).
 */
export async function registerForPushNotifications(onNotificationReceived = null) {
  if (isNative) {
    try {
      // 1. Initialize Android High-Priority Channel
      await initializeNotificationChannels();

      // 2. Request OS-level notification permission
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Push notification permission denied by user.');
        return null;
      }

      // 3. Setup listeners
      return new Promise((resolve) => {
        PushNotifications.removeAllListeners().then(() => {
          // Token registration listener
          PushNotifications.addListener('registration', async (token) => {
            console.log('Native FCM Token registered:', token.value);
            try {
              await apiCall('/users/fcm-token', 'PATCH', { fcm_token: token.value });
              console.log('Native FCM token saved to backend successfully.');
            } catch (err) {
              console.error('Failed to sync native FCM token to backend:', err);
            }
            resolve(token.value);
          });

          // Registration error listener
          PushNotifications.addListener('registrationError', (error) => {
            console.error('Native FCM Registration error:', error);
            resolve(null);
          });

          // Foreground notification listener
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Native Foreground Notification received:', notification);
            if (onNotificationReceived) {
              onNotificationReceived(notification);
            }
          });

          // Notification action (tap) listener
          PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('Notification tapped / action performed:', action);
            const data = action.notification?.data;
            if (data?.request_id) {
              // Can trigger custom navigation or modal open
              console.log('Opened from emergency request:', data.request_id);
            }
          });

          // 4. Register with Apple / Google Play Services
          PushNotifications.register();
        });
      });
    } catch (err) {
      console.error('Error during native push registration:', err);
      return null;
    }
  } else {
    // Web Browser Fallback
    const token = await webRequestPermission();
    if (token) {
      try {
        await apiCall('/users/fcm-token', 'PATCH', { fcm_token: token });
      } catch (err) {
        console.error('Failed to sync web FCM token to backend:', err);
      }
      if (onNotificationReceived) {
        webOnMessageListener(onNotificationReceived);
      }
    }
    return token;
  }
}

/**
 * Check if the current platform is native Android / iOS.
 */
export function isNativeApp() {
  return isNative;
}
