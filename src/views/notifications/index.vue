<template>
	<div>
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
import { UserModule } from "../../store/modules/user";
import moment from "moment";
import { NotificationApi } from "@/api/NotificationApi";
import { Notification } from "@/models/Notification/notification";
import NotificationVue from "./components/notification.vue";

@Component({
	name: "Notifications",
	components: { NotificationVue }
})
export default class extends Vue {
	private loading: boolean = false;
	private errorMessage: string = "";

	get notifications() {
		return UserModule.utilisateur.notifications_received.sort((a,b) => {return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()});
	}
}
</script>
