<template>
<transition name="slide" >
	<v-row v-if="show" class="mt-3" v-touch:swipe.right="swipeRight" no-gutters>
		<v-col cols="12" lg="6" md="12">
			<v-card>
				<v-card-text class="pa-2">
					<v-row no-gutters justify-center>
						<v-col cols="auto" dense class="mr-5">
							<v-avatar :color="notificationColor()">
								<img v-if="notification.icon" alt="Avatar" :src="notification.icon" />
								<v-icon v-else-if="notificationIcon()">{{ notificationIcon() }}</v-icon>
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
							<v-icon v-if="notification.response" right color="green" class="ml-2" large>mdi-check-circle</v-icon>
							<v-icon v-else-if="notification.notification_type == 'friend_request' && alreadyFriend" right color="green" class="ml-2" large>mdi-check-circle</v-icon>
							<v-btn v-else-if="notification.notification_type == 'friend_request' && !alreadyFriend" color="green" class="ml-2" outlined text rounded @click="addFriend">
								<v-icon>mdi-plus</v-icon>
								Friend
							</v-btn>
							<v-btn v-else-if="notification.notification_type == 'wanna_play' && !this.notificationExpired" outlined text rounded color="green" @click="sendResponse(notification)">I'm in</v-btn>
						</v-col>
					</v-row>
				</v-card-text>
			</v-card>
		</v-col>
	</v-row>
</transition>
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

	private alreadyFriend(): boolean {
		return UserModule.utilisateur.friends.some(f => f.id == this.notification.sender_id);
	}

	private notificationExpired(): boolean{
		return this.notification.expired || 
				!this.notification.validity || 
				moment(this.notification.created_at).add(this.notification.validity, 'minutes').isBefore(moment());
	}

	private notificationColor(): string{
		if(this.notification.notification_type == 'wanna_play' || this.notification.notification_type == 'comrade_joining'){
			if(this.notificationExpired())
				return 'grey';
			else return 'green';
		}
		else if(this.notification.notification_type == 'friend_request'){
			return 'blue';
		}
		else return 'grey';
	}

	private notificationIcon(): string{
		if(this.notification.notification_type == 'wanna_play'){
			return 'mdi-bell-ring';
		}
		else if(this.notification.notification_type == 'comrade_joining'){
			return 'mdi-sword-cross';
		}
		else if(this.notification.notification_type == 'friend_request'){
			return 'mdi-account-plus';
		}
		else return '';
	}

	private getDate(date: Date): string {
		return moment(date).format("DD/MM/YYYY HH:mm");
 	}
  
	private sendResponse(notifReceived: NotificationReceived) {
		let notif = new Notification();
		notif.title = UserModule.utilisateur.username;
		notif.content = "I'm in comrade !";
		notif.notification_type = "comrade_joining";
		notif.game_id = notifReceived.game_id;
		notif.user_ids = [notifReceived.sender_id];
		NotificationApi.sendNotification(notif).then(() => {
			notifReceived.response = "true";
		});
  }
  
	private show = true;
  private swipeRight(){
		this.show = false;
		this.$nextTick(() => {
			UserModule.RemoveNotification(this.notification.id).then(()=>
				{this.$destroy();}
			);
		}); 
	}
	
	private addFriend() {
		UserApi.addFriend(this.notification.content.split(' ')[0]).then((user) => {
			this.notification.response = "true";
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
</style>
