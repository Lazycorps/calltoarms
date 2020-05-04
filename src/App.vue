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
		AppModule.InitPushNotification();
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
