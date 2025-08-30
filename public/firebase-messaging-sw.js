/* eslint-disable no-undef */
// import { precacheAndRoute } from "workbox-precaching";

// precacheAndRoute(self.__WB_MANIFEST);
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

// // Firebase Cloud Messaging Service Worker

// importScripts(
//   "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"
// );
// importScripts(
//   "https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js"
// );

// // Store Firebase config variables
// self.firebaseConfig = {};

// // Listen for messages from the main thread
// self.addEventListener("message", (event) => {
//   if (event.data && event.data.type === "SET_FIREBASE_CONFIG") {
//     self.firebaseConfig[event.data.key] = event.data.value;

//     // Try to initialize Firebase if we have all required config
//     tryInitializeFirebase();
//   }
// });

// // Try to initialize Firebase if all required config is available
// function tryInitializeFirebase() {
//   const requiredKeys = [
//     "FIREBASE_API_KEY",
//     "FIREBASE_AUTH_DOMAIN",
//     "FIREBASE_PROJECT_ID",
//     "FIREBASE_STORAGE_BUCKET",
//     "FIREBASE_MESSAGING_SENDER_ID",
//     "FIREBASE_APP_ID",
//   ];

//   // Check if all required keys are present
//   const hasAllKeys = requiredKeys.every(
//     (key) =>
//       self.firebaseConfig[key] !== undefined &&
//       self.firebaseConfig[key] !== null
//   );

//   if (hasAllKeys && !self.firebaseInitialized) {
//     // Initialize Firebase app in the service worker
//     firebase.initializeApp({
//       apiKey: self.firebaseConfig.FIREBASE_API_KEY,
//       authDomain: self.firebaseConfig.FIREBASE_AUTH_DOMAIN,
//       projectId: self.firebaseConfig.FIREBASE_PROJECT_ID,
//       storageBucket: self.firebaseConfig.FIREBASE_STORAGE_BUCKET,
//       messagingSenderId: self.firebaseConfig.FIREBASE_MESSAGING_SENDER_ID,
//       appId: self.firebaseConfig.FIREBASE_APP_ID,
//     });

//     self.firebaseInitialized = true;
//     console.log("Firebase initialized in service worker");

//     // Initialize messaging now that Firebase is ready
//     initializeMessaging();
//   }
// }

// // Function to initialize messaging
// function initializeMessaging() {
//   // Retrieve an instance of Firebase Messaging
//   const messaging = firebase.messaging();

//   // Handle background messages
//   messaging.onBackgroundMessage((payload) => {
//     console.log(
//       "[firebase-messaging-sw.js] Received background message ",
//       payload
//     );

//     const notificationTitle = payload.notification.title;
//     const notificationOptions = {
//       body: payload.notification.body,
//       icon: "/favicon.ico",
//       data: payload.data,
//     };

//     self.registration.showNotification(notificationTitle, notificationOptions);
//   });
// }

// // Try to initialize Firebase on load in case config is already available
// tryInitializeFirebase();

// // Handle notification click
// self.addEventListener("notificationclick", (event) => {
//   console.log("[firebase-messaging-sw.js] Notification click: ", event);

//   event.notification.close();

//   // This looks to see if the current is already open and focuses if it is
//   event.waitUntil(
//     clients
//       .matchAll({
//         type: "window",
//         includeUncontrolled: true,
//       })
//       .then((clientList) => {
//         // Get notification data
//         const notificationData = event.notification.data;

//         // URL to open when notification is clicked
//         let url = "/";

//         // If we have a gameId in the notification data, navigate to that game
//         if (notificationData && notificationData.gameId) {
//           url = `/games/${notificationData.gameId}`;
//         }

//         // If we already have a window open, focus it and navigate
//         for (let i = 0; i < clientList.length; i++) {
//           const client = clientList[i];
//           if (client.url.includes(self.location.origin) && "focus" in client) {
//             client.focus();
//             client.navigate(url);
//             return;
//           }
//         }

//         // Otherwise open a new window
//         if (clients.openWindow) {
//           return clients.openWindow(url);
//         }
//       })
//   );
// });
