"use client";
import { useState, useEffect } from "react";
import { requestNotificationPermission, onMessageListener } from "../utils/firebase";
import { apiCall } from "../utils/api";

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("default");

  const setupMessageListener = () => {
    onMessageListener((payload) => {
      console.log("Foreground message received:", payload);
      if (payload.notification) {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.image || '/icon.png',
          data: payload.data
        });
      }
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionStatus(Notification.permission);
      if (Notification.permission === "default") {
        setShowPrompt(true);
      } else if (Notification.permission === "granted") {
        // Automatically fetch and save token if already granted
        requestNotificationPermission().then(token => {
          if (token) {
            apiCall('/users/fcm-token', 'PATCH', { fcm_token: token }).catch(console.error);
          }
        });
        
        setupMessageListener();
      }
    }
  }, []);

  const handleEnable = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      setShowPrompt(false);
      setPermissionStatus("granted");
      
      setupMessageListener();
      
      // Send token to backend
      try {
        await apiCall('/users/fcm-token', 'PATCH', { fcm_token: token });
        console.log("FCM token saved to backend");
      } catch (err) {
        console.error("Failed to save FCM token", err);
      }
    } else {
      setPermissionStatus(Notification.permission);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 flex justify-between items-center glass-panel">
      <div>
        <strong className="font-bold block text-dark">Enable Emergency Alerts</strong>
        <span className="block sm:inline text-gray text-sm">Allow notifications so we can ping you instantly when someone nearby needs blood.</span>
      </div>
      <button 
        onClick={handleEnable} 
        className="btn btn-red text-sm whitespace-nowrap ml-4"
      >
        Turn On Alerts
      </button>
    </div>
  );
}
