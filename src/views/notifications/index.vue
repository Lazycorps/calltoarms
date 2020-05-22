<template>
	<div>
		<v-row v-if="friendships_requests && friendships_requests.length > 0">
			<h1 class="mr-5 ml-5">Comrades request</h1>
		</v-row>
		<v-data-iterator v-if="friendships_requests && friendships_requests.length > 0" :items="friendships_requests" hide-default-footer color="primary" disable-pagination no-data-text="">
			<template v-slot:default="props">
				<FriendshipVue v-for="friendship in props.items" :key="friendship.id" class="mt-3" :friendship="friendship"/>
			</template>
		</v-data-iterator>
		<v-row>
			<h1 class="mr-5 ml-5">Notifications</h1>
		</v-row>
		<v-data-iterator :items="notifications" hide-default-footer no-data-text="No notifications">
			<template v-slot:default="props">
				<div >
					<NotificationVue v-for="notification in props.items" :key="notification.id" :notification="notification"/>
				</div>
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
import { UserModule } from "@/store/modules/user";
import moment from "moment";
import { NotificationApi } from "@/api/NotificationApi";
import { Notification } from "@/models/Notification/notification";
import NotificationVue from "./components/notification.vue";
import { Friendship } from '@/models/Friend/friendship';
import FriendshipVue from '@/views/user/friends/components/friendship.vue';

@Component({
	name: "Notifications",
	components: { NotificationVue, FriendshipVue }
})
export default class extends Vue {
	private loading: boolean = false;
	private errorMessage: string = "";

	get friendships_requests(): Friendship[]{
		return UserModule.utilisateur.friendships_requests.filter(f => f.status == "pending").sort((a,b) => b.id - a.id);
	}

	get notifications(): NotificationReceived[]{
		return UserModule.utilisateur.notifications_received.sort((a,b) => {return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()});
	}
}
</script>
