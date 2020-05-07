<template>
	<v-app>
		<router-view />
		<service-worker-update-popup />
	</v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import axios from 'axios';
import firebase from 'firebase'
import { UserModule } from "@/store/modules/user";
import { UserApi } from './api/UserApi';
import { AppModule } from './store/modules/app';
import ServiceWorkerUpdatePopup from '@/components/ServiceWorkerUpdatePopup.vue'

@Component({
	name: "Home",
	components: { ServiceWorkerUpdatePopup }
})
export default class extends Vue {	
	mounted(){
    UserModule.ReadToken();
    UserModule.LoadUtilisateur();
		this.initFirebase();
	}
	private messaging!: firebase.messaging.Messaging;
	private initFirebase(){
		if(UserModule.token){
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
  
      this.messaging = firebase.messaging();
  
      this.messaging.usePublicVapidKey("BHz_yN7iQlV2j4oDBV6c432Eqw6wmQmj_YKR0xzRWlpK_RawaJ4MJzh_9IeqDjnAyCQT4OyUBMWev89uQ6gSvbQ"); // 1. Generate a new key pair
  
      // Request Permission of Notifications
      this.messaging.requestPermission().then(() =>{
        console.log('Notification permission granted.');
        this.messaging.getToken().then(token => {
          console.log("token");
          UserApi.updateFirebaseToken(token);
          AppModule.InitPushNotification(true);
          console.log("token updated");
          this.messaging.onMessage(payload => {
            console.log("Message received. ", payload);
            AppModule.NewNotificationReceived(true);
            const { title, ...options } = payload.notification;
          });
        }).catch((error) => {
          AppModule.InitPushNotification(false);
          console.log('Unable to get permission to notify.', error);
        });
      }).catch((error) => {
        AppModule.InitPushNotification(false);
        console.log('Unable to get permission to notify.', error);
      });
    }
	}
}
</script>

<style>
input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus,
select:-webkit-autofill,
select:-webkit-autofill:hover,
select:-webkit-autofill:focus {
  -webkit-text-fill-color: white;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
