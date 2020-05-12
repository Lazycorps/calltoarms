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
		<v-data-iterator :items="friends" hide-default-footer class="ml-5 mr-5" disable-pagination no-data-text="No friends found">
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
import { UserModule } from '../../../store/modules/user';

@Component({
	name: "Friends",
})
export default class extends Vue {
	private userToAdd: string = "";
	private loading: boolean = false;
  private errorMessage: string = "";

	get friends(){
		return UserModule.utilisateur.friends;
	}

	private async addFriend() {
		this.errorMessage = "";
		this.loading = true;
		UserModule.AddFriend(this.userToAdd.trim()).catch((err)=> {
			this.errorMessage = err.error;
		}).finally(() => {
			this.userToAdd = "";
			this.loading = false;
		});
	}
}
</script>
