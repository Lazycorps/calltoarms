import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify';
import * as firebase from "firebase";

Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')


var config = {
  apiKey: "AIzaSyB2_byyXGkLlP7Icn2ckInxHm62IEHeZ9E",
  authDomain: "iplaybitch.firebaseapp.com",
  databaseURL: "https://iplaybitch.firebaseio.com/",
  projectId: "iplaybitch",
  storageBucket: "iplaybitch.appspot.com",
  messagingSenderId: "1031582684001",
  appId: "1:1031582684001:web:94d0df1ade779e85dd2b20",
  measurementId: "G-BVYJKFCT1R"
}; // 4. Get Firebase Configuration
firebase.initializeApp(config);

const messaging = firebase.messaging();

messaging.usePublicVapidKey("BHz_yN7iQlV2j4oDBV6c432Eqw6wmQmj_YKR0xzRWlpK_RawaJ4MJzh_9IeqDjnAyCQT4OyUBMWev89uQ6gSvbQ"); // 1. Generate a new key pair

// Request Permission of Notifications
messaging.requestPermission().then(() => {
  console.log('Notification permission granted.');

  // Get Token
  messaging.getToken().then((token) => {
    console.log(token)
  })
}).catch((err) => {
  console.log('Unable to get permission to notify.', err);
});