<template>
  <v-app>
    <router-view />
    <service-worker-update-popup />
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { UserModule } from '@/store/modules/user';
import { AppModule } from './store/modules/app';
import ServiceWorkerUpdatePopup from '@/components/ServiceWorkerUpdatePopup.vue';

@Component({
  name: 'App',
  components: { ServiceWorkerUpdatePopup }
})
export default class extends Vue {
  mounted() {
    UserModule.ReadToken();
    UserModule.LoadUtilisateur();
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
