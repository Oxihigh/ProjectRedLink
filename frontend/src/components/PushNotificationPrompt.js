"use client";
import { useState, useEffect } from "react";
import { registerForPushNotifications, isNativeApp } from "../utils/notifications";
import { PushNotifications } from "@capacitor/push-notifications";

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("default");

  const showInAppNotification = (payload) => {
    console.log("Foreground message received:", payload);
    const title = payload.title || payload.notification?.title || "Urgent Blood Alert";
    const body = payload.body || payload.notification?.body || "A blood donation is needed nearby.";
    const icon = payload.image || payload.notification?.image || "/icon.png";

    if (typeof window !== "undefined") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon,
            data: payload.data || {},
          });
        }).catch(() => {
          new Notification(title, { body, icon });
        });
      } else if ("Notification" in window) {
        new Notification(title, { body, icon });
      }
    }
  };

  useEffect(() => {
    async function checkCurrentPermission() {
      if (isNativeApp()) {
        try {
          const status = await PushNotifications.checkPermissions();
          if (status.receive === "granted") {
            setPermissionStatus("granted");
            registerForPushNotifications(showInAppNotification);
          } else {
            setShowPrompt(true);
          }
        } catch (e) {
          setShowPrompt(true);
        }
      } else if (typeof window !== "undefined" && "Notification" in window) {
        setPermissionStatus(Notification.permission);
        if (Notification.permission === "default") {
          setShowPrompt(true);
        } else if (Notification.permission === "granted") {
          registerForPushNotifications(showInAppNotification);
        }
      }
    }

    checkCurrentPermission();
  }, []);

  const handleEnable = async () => {
    const token = await registerForPushNotifications(showInAppNotification);
    if (token) {
      setShowPrompt(false);
      setPermissionStatus("granted");
    } else {
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="glass-panel border-red flex-align push-prompt mb-6" style={{ justifyContent: 'space-between' }}>
      <div>
        <strong className="font-bold block text-dark">Enable Emergency Alerts</strong>
        <span className="block text-gray text-sm mt-1">Allow notifications so we can ping you instantly when someone nearby needs blood.</span>
      </div>
      <button 
        onClick={handleEnable} 
        className="btn btn-red text-sm"
        style={{ marginLeft: '1rem', whiteSpace: 'nowrap' }}
      >
        Turn On Alerts
      </button>
    </div>
  );
}
