import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBQ-2r3HN2_Vf60dnwNQcxBikwi4s7XknQ",
  authDomain: "calltoarms-54d89.firebaseapp.com",
  projectId: "calltoarms-54d89",
  storageBucket: "calltoarms-54d89.appspot.com",
  messagingSenderId: "887099058022",
  appId: "1:887099058022:web:321bd36d9e6820becccaa7",
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);
onMessage(messaging, (payload) => {
  console.log("Message received. ", payload);
});

getToken(messaging, {
  vapidKey:
    "BB8nRs86IjldHGzatHr_QDd0It22crgz42z5d-e5BVCDYJQUahn704LxrFPra3tTGPtOaIZqPRuIoMaLiOsM3-U",
}).catch((err) => {
  console.log("Push Error");
  console.log(err);
});
