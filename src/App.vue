<template>
	<v-app>
		<router-view />
	</v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import axios from 'axios';
import firebase from 'firebase'
import { UserModule } from "@/store/modules/user";
import { UserApi } from './api/UserApi';

@Component({
  name: "Home"
})
export default class extends Vue {	
	mounted(){
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
				this.saveToken(token);
			})
		}).catch((err) => {
			console.log('Unable to get permission to notify.', err);
		});
	}

	private async saveToken(firebaseToken :string){
		try {
			if(UserModule.token){
				let userConnected = await UserApi.getConnected();
				userConnected.firebase_token = firebaseToken;
				await UserApi.updateUser({email: userConnected.email, username: userConnected.username, firebase_token: firebaseToken});
				console.log("token updated");
			}
		} catch (error) {
			console.log("token not updated");
		}
	}
}
</script>
