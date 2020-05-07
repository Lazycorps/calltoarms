<template>
	<div>
		<v-row dense>
			<h1>Notifications</h1>
		</v-row>
		<v-data-iterator :items="notifications" hide-default-footer class="ml-5 mr-5" no-data-text="No friends found">
			<template v-slot:default="props">
				<v-row v-for="notification in props.items" :key="notification.title" class="mt-3">
          <v-col>
            <v-avatar color="red" class="mr-2">
							<img v-if="user.icon" alt="Avatar" :src="notification.icon" />
							<span v-else class="white--text headline text-uppercase">{{ notification.title.substring(0, 2) }}</span>
						</v-avatar>
          <v-col>
          <v-col>
            <v-row>
              <b>{{ notification.title }}</b>
            </v-row>
            <v-row>
              <p>{{ notification.content }}</p>
            </v-row>
          <v-col>
				</v-row>
			</template>
		</v-data-iterator>
	</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Game } from "@/models/Game/game";
import { Friend } from "@/models/Friend/friend";
import { UserApi } from "@/api/UserApi";
import { NotificationReceived } from "@/models/Notification/notificationReceived";

@Component({
	name: "Notifications",
})
export default class extends Vue {
	private notifications: NotificationReceived[] = [];
	private loading: boolean = false;
  private errorMessage: string = "";

	mounted() {
		UserApi.getConnected().then((userConnected) => {
			this.notifications = userConnected.notifications_received;
		}).catch((error) => {
			if (error.response) 
				this.errorMessage = `${error.response.data.error}`;
		});
	}
}
</script>
