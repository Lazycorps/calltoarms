import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { useNotificationsStore } from "@/store/notifications";
import { useMessagingTokensDB } from "@/db/MessagingTokensDB";
import { useFirebaseApp } from "vuefire";

export const firebaseConfig = {
  apiKey: "AIzaSyBQ-2r3HN2_Vf60dnwNQcxBikwi4s7XknQ",
  authDomain: "calltoarms-54d89.firebaseapp.com",
  projectId: "calltoarms-54d89",
  storageBucket: "calltoarms-54d89.appspot.com",
  messagingSenderId: "887099058022",
  appId: "1:887099058022:web:321bd36d9e6820becccaa7",
};

export const firebaseApp = initializeApp(firebaseConfig);

export const messaging = getMessaging(firebaseApp);
onMessage(messaging, (payload) => {
  const notificationsStore = useNotificationsStore();
  notificationsStore.increment();
  console.log("Message received. ", payload);
});

export function useWebNotification() {
  const messaging = getMessaging(useFirebaseApp());
  async function enableWebNotification() {
    try {
      const currentToken = await getToken(messaging, {
        vapidKey:
          "BB8nRs86IjldHGzatHr_QDd0It22crgz42z5d-e5BVCDYJQUahn704LxrFPra3tTGPtOaIZqPRuIoMaLiOsM3-U",
      });
      if (currentToken) {
        const messaginTokenDB = useMessagingTokensDB();
        await messaginTokenDB.addMessagingToken(currentToken);
      } else {
        console.log(
          "No registration token available. Request permission to generate one."
        );
      }
    } catch (err: any) {
      console.log("An error occurred while retrieving token. ", err);
    }
  }

  return { messaging, enableWebNotification };
}
