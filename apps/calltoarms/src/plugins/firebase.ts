import { addMessagingToken } from "@/fireStore/MessagingTokens";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: "AIzaSyBQ-2r3HN2_Vf60dnwNQcxBikwi4s7XknQ",
  authDomain: "calltoarms-54d89.firebaseapp.com",
  projectId: "calltoarms-54d89",
  storageBucket: "calltoarms-54d89.appspot.com",
  messagingSenderId: "887099058022",
  appId: "1:887099058022:web:321bd36d9e6820becccaa7",
};

export const firebaseApp = initializeApp(firebaseConfig);

const db = getFirestore(firebaseApp);
const messaging = getMessaging(firebaseApp);
onMessage(messaging, (payload) => {
  console.log("Message received. ", payload);
});

getToken(messaging, {
  vapidKey:
    "BB8nRs86IjldHGzatHr_QDd0It22crgz42z5d-e5BVCDYJQUahn704LxrFPra3tTGPtOaIZqPRuIoMaLiOsM3-U",
})
  .then(async (currentToken) => {
    if (currentToken) {
      console.log("Firebase Init");
      await addMessagingToken(currentToken);
    } else {
      console.log(
        "No registration token available. Request permission to generate one."
      );
    }
  })
  .catch((err) => {
    console.log("An error occurred while retrieving token. ", err);
  });
