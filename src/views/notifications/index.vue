<template>
	<div>
		<v-row>
			<h1 class="mr-5 ml-5">Notifications</h1>
		</v-row>
		<v-data-iterator :items="notifications" hide-default-footer no-data-text="No notifications">
			<template v-slot:default="props">
				<v-row v-for="notification in props.items" :key="notification.title" class="mt-3" no-gutters>
					<v-col cols="12" lg="6" md="12">
						<v-card>
							<v-card-text class="pa-2">
								<v-row no-gutters  justify-center>
									<v-col cols="auto" dense class="mr-5">
										<v-avatar color="red">
											<img v-if="notification.icon" alt="Avatar" :src="notification.icon" />
											<span v-else class="white--text headline text-uppercase">{{ notification.title.substring(0, 2) }}</span>
										</v-avatar>
									</v-col>
									<v-col>
										<v-row dense>
											<b>{{ notification.title }}</b>
										</v-row>
										<v-row dense class="overline">
										 {{ getDate(notification.created_at) }}
										</v-row>
										<v-row dense>
											{{ notification.content }}
										</v-row>
									</v-col>
									<v-col cols="auto">
										<v-btn outlined text rounded @click="sendResponse(item)">I'm in</v-btn>
									</v-col>
								</v-row>
							</v-card-text>
						</v-card>
					</v-col>
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
import { UserModule } from '../../store/modules/user';
import moment from "moment";
import { NotificationApi } from '@/api/NotificationApi';
import { Notification } from "@/models/Notification/notification";

@Component({
	name: "Notifications",
})
export default class extends Vue {
	private loading: boolean = false;
  private errorMessage: string = "";

	get notifications(){
		return UserModule.utilisateur.notifications_received.reverse();
	}

	private getDate(date: Date): string{
		return moment(date).format("DD/MM/YYYY HH:mm");
	}

	private sendResponse(notifReceived:NotificationReceived){
		let notif = new Notification();
		notif.title = "Incoming !!";
		notif.content = "I'm in comrade !";

		NotificationApi.sendNotification(notif, [notifReceived.sender_id.toString()])
	}
}
</script>
