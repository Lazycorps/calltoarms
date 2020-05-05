<template>
	<div>
		<v-row dense>
			<v-text-field
				class="mr-5 ml-5"
				name="firendName"
				label="Add friend username"
				append-icon="mdi-plus"
				v-model="userToAdd"
				@keypress.enter="addFriend"
				@click:append="addFriend"
				:loading="loading"
				:error-messages="errorMessage"
			></v-text-field>
		</v-row>
		<v-data-iterator :items="friends" hide-default-footer class="ml-5 mr-5" no-data-text="No friends found">
			<template v-slot:default="props">
				<v-row v-for="user in props.items" :key="user.username" class="mt-3">
					<span>
						<v-avatar color="red" class="mr-2">
							<img v-if="user.avatar" alt="Avatar" :src="user.avatar" />
							<span v-else class="white--text headline text-uppercase">{{ user.username.substring(0, 2) }}</span>
						</v-avatar>
						{{ user.username }}
					</span>
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

@Component({
	name: "Friends",
})
export default class extends Vue {
	private friends: Friend[] = [];
	private userToAdd: string = "";
	private loading: boolean = false;
  private errorMessage: string = "";

	mounted() {
		UserApi.getConnected().then((userConnected) => {
			this.friends = userConnected.friends;
		}).catch((error) => {
			if (error.response) 
				this.errorMessage = `${error.response.data.error}`;
		});
	}

	private addFriend() {
		this.errorMessage = "";
		this.loading = true;
		UserApi.addFriend(this.userToAdd.trim()).then((user) => {
			this.friends = user.friends;
		}).catch((error) => {
			if (error.response) {
				this.errorMessage = `${error.response.data.error}`;
			}
		}).finally(() => {
			this.userToAdd = "";
			this.loading = false;
		});
	}
}
</script>
