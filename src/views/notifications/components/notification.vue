<template>
	<div>
		<transition name="slide">
			<v-row v-if="show" class="mt-3" v-touch:swipe.right="swipeRight" no-gutters>
				<v-col cols="12" lg="6" md="12">
					<v-card>
						<v-card-text class="pa-2">
							<v-row no-gutters justify-center>
								<v-col cols="auto" dense class="mr-5">
									<v-avatar :color="notificationColor">
										<img v-if="notification.icon" alt="Avatar" :src="notification.icon" />
										<v-icon v-else-if="notificationIcon">{{ notificationIcon }}</v-icon>
										<span v-else class="white--text headline text-uppercase">{{
											notification.title.substring(0, 2)
										}}</span>
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
									<v-icon v-if="notification.response" right color="green" class="ml-2" large>mdi-check-circle</v-icon>
									<v-icon
										v-else-if="notification.notification_type == 'friend_request' && alreadyFriend"
										right
										color="green"
										class="ml-2"
										large
										>mdi-check-circle</v-icon
									>
									<v-btn
										v-else-if="notification.notification_type == 'wanna_play' && !notificationExpired"
										fab
										outlined
										color="green"
										@click="dialog = true"
									>
										<v-icon>mdi-message-text</v-icon>
									</v-btn>
								</v-col>
							</v-row>
						</v-card-text>
					</v-card>
				</v-col>
			</v-row>
		</transition>
		<v-dialog v-model="dialog" max-width="400" overlay-opacity="0.5" overlay-color="black">
			<v-card>
				<v-card-title>
					<div>
						{{ notification.title }} 
						<span class="date">{{ getDate(notification.created_at) }}</span>
					</div>
				</v-card-title>
				<v-card-text class="mt-5 mb-0 pb-0">
					<p>{{ notification.content }}</p>
					<v-textarea	v-model="responseMessage"	label="Response message" outlined	counter="140" auto-grow	rows="1"	class="mb-0 pa-0"	></v-textarea>
				</v-card-text>
				<v-card-actions>
					<v-col cols="6">
						<v-btn color="red" tile block large @click="sendNoResponse">
							<v-icon class="mr-3 mt-0">mdi-emoticon-sad</v-icon>
							Nope sry
						</v-btn>
					</v-col>
					<v-col cols="6">
						<v-btn color="green" tile block large @click="sendYesResponse">
							<v-icon class="mr-3 mt-0">mdi-emoticon-cool</v-icon>
							I'm in !
						</v-btn>
					</v-col>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import { Game } from "@/models/Game/game";
import { Friend } from "@/models/Friend/friend";
import { UserApi } from "@/api/UserApi";
import { NotificationReceived } from "@/models/Notification/notificationReceived";
import { UserModule } from "@/store/modules/user";
import moment from "moment";
import { NotificationApi } from "@/api/NotificationApi";
import { Notification } from "@/models/Notification/notification";

@Component({
	name: "Notification",
})
export default class extends Vue {
	@Prop()
	private id!: string;
	@Prop()
	private notification!: NotificationReceived;
	private direction!: string;
	private responseMessage: string = "";
	private dialog = false;

	get alreadyFriend(): boolean {
		return UserModule.utilisateur.friends.some((f) => f.id == this.notification.sender_id);
	}

	get notificationExpired(): boolean {
		return (
			this.notification.expired ||
			!this.notification.validity ||
			moment(this.notification.created_at)
				.add(this.notification.validity, "minutes")
				.isBefore(moment())
		);
	}

	get notificationColor(): string {
		if (
			this.notification.notification_type == "wanna_play" ||
			this.notification.notification_type == "comrade_joining"
		) {
			if (this.notificationExpired) return "grey";
			else return "green";
		}
		else if (this.notification.notification_type == "comrade_denied") {
			return "red";
		} else if (this.notification.notification_type == "friend_request") {
			return "blue";
		} else return "grey";
	}

	get notificationIcon(): string {
		if (this.notification.notification_type == "wanna_play") {
			return "mdi-bell-ring";
		} else if (this.notification.notification_type == "comrade_joining") {
			return "mdi-sword-cross";
		}else if (this.notification.notification_type == "comrade_denied") {
			return "mdi-emoticon-dead";
		} else if (this.notification.notification_type == "friend_request") {
			return "mdi-account-plus";
		} else return "";
	}

	private getDate(date: Date): string {
		return moment(date).format("DD/MM/YYYY HH:mm");
	}

	private sendYesResponse() {
		let notif = new Notification();
		notif.title = UserModule.utilisateur.username;
		notif.content = "I'm in comrade !";
		notif.notification_type = "comrade_joining";
		notif.content = this.responseMessage;
		notif.game_id = this.notification.game_id;
		notif.user_ids = [this.notification.sender_id];
		this.dialog = false;
		NotificationApi.sendNotification(notif).then(() => {
			this.notification.response = "true";
		});
	}
	private sendNoResponse() {
		let notif = new Notification();
		notif.title = UserModule.utilisateur.username;
		notif.content = "Nope sorry dude";
		notif.notification_type = "comrade_denied";
		notif.content = this.responseMessage;
		notif.game_id = this.notification.game_id;
		notif.user_ids = [this.notification.sender_id];
		this.dialog = false;
		NotificationApi.sendNotification(notif).then(() => {
			this.notification.response = "true";
		});
	}

	private show = true;
	private swipeRight() {
		this.show = false;
		this.$nextTick(() => {
			UserModule.RemoveNotification(this.notification.id).then(() => {
				this.$destroy();
			});
		});
	}
}
</script>

<style scoped>
.slide-leave-active,
.slide-enter-active {
	transition: 0.5s;
}
.slide-enter {
	transform: translate(-100%, 0);
}
.slide-leave-to {
	transform: translate(100%, 0);
}
.date{
	font-size: 12px;
	color: gray;
}
</style>
