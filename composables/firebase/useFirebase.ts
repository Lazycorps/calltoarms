// utils/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
// Fonctionne uniquement dans un plugin ou un composant Vue

export function useFirebase() {
  // Cette fonction doit être appelée dans un setup de composant ou un plugin
  const config = useRuntimeConfig();
  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
  };

  // Initialize Firebase
  const firebaseApp = initializeApp(firebaseConfig);
  const messaging = getMessaging(firebaseApp);

  // Request permission and get token
  async function requestNotificationPermission() {
    try {
      if (!messaging) return null;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notification permission denied");
        return null;
      }

      // Get token
      const token = await getToken(messaging, {
        vapidKey: config.public.firebaseVapidKey,
      });

      console.log("Notification token:", token);
      return token;
    } catch (error) {
      console.error("Error getting notification token:", error);
      return null;
    }
  }

  return {
    firebaseApp,
    messaging,
    requestNotificationPermission,
  };
}
