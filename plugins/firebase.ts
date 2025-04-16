import { initializeApp } from "firebase/app";
import { getMessaging, type Messaging } from "firebase/messaging";

export default defineNuxtPlugin(() => {
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
  let messaging: null | Messaging = null;
  if (import.meta.client) {
    messaging = getMessaging(firebaseApp);
  }

  return {
    provide: {
      firebase: firebaseApp,
      messaging: messaging,
    },
  };
});
