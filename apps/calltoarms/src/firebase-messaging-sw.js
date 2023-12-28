/* eslint-disable no-undef */
import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js"
);

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyBQ-2r3HN2_Vf60dnwNQcxBikwi4s7XknQ",
  authDomain: "calltoarms-54d89.firebaseapp.com",
  projectId: "calltoarms-54d89",
  storageBucket: "calltoarms-54d89.appspot.com",
  messagingSenderId: "887099058022",
  appId: "1:887099058022:web:321bd36d9e6820becccaa7",
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/pwa-192x192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
