import type { App } from "firebase-admin/app";
import { initializeApp, cert, getApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Initialize Firebase Admin SDK
let firebaseAdmin: App | null = null;

export function getFirebaseAdmin(): App {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  try {
    // Check if app is already initialized
    try {
      firebaseAdmin = getApp("admin");
    } catch {
      const runtimeConfig = useRuntimeConfig();
      firebaseAdmin = initializeApp(
        {
          credential: cert({
            projectId: runtimeConfig.firebaseProjectId as string,
            clientEmail: runtimeConfig.firebaseClientEmail as string,
            privateKey: (runtimeConfig.firebasePrivateKey as string)?.replace(
              /\\n/g,
              "\n"
            ),
          }),
        },
        "admin"
      );
    }
    return firebaseAdmin;
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
    throw new Error("Failed to initialize Firebase Admin SDK");
  }
}

export function getFirebaseMessaging() {
  const app = getFirebaseAdmin();
  return getMessaging(app);
}
