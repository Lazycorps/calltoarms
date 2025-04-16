// utils/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
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

  return {
    firebaseApp,
    messaging,
  };
}
