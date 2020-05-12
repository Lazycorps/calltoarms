<template>
	<v-container class="ma-0 pa-0" fluid>
		<v-row>
			<v-col cols="12">
				<v-card>
					<v-card-title>
						<h3>{{ user.username }}</h3>
					</v-card-title>
					<v-card-text>
						<!-- <v-btn outlined @click="testNotification">Test notification</v-btn> -->
						<span class="d-flex align-center">
							<v-select :items="audiosNotification" 
								item-value="path" 
								item-text="libelle" 
								v-model="audiosNotificationSelected" 
								append-outer-icon="mdi-play-circle"
								label="Notification sound"
								@change="audioChange"
								@click:append-outer="testAudio"
							></v-select>
							<v-btn icon class="ml-2" :href="fullPathDownload"><v-icon>mdi-download</v-icon></v-btn>
						</span>
					</v-card-text>
					<v-card-text v-if="errorMessage != ''">
						<v-alert type="warning">{{ errorMessage }}</v-alert>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>
		<v-row>
			<v-col cols="12" sm="12" md="6" lg="4">
				<v-card>
					<v-card-title>
						Friends
					</v-card-title>
					<v-card-text>
						<v-data-iterator
							:items="user.friends"
							hide-default-footer
							class="ml-5 mr-5"
							no-data-text="No friends found"
						>
							<template v-slot:default="props">
								<v-row v-for="user in props.items" :key="user.username" class="mt-3">
									<span>
										<v-avatar color="red" class="mr-2">
											<img v-if="user.avatar" alt="Avatar" :src="user.avatar" />
											<span v-else class="white--text headline text-uppercase">{{
												user.username.substring(0, 2)
											}}</span>
										</v-avatar>
										{{ user.username }}
									</span>
								</v-row>
							</template>
						</v-data-iterator>
					</v-card-text>
				</v-card>
			</v-col>
			<v-col cols="12" sm="12" md="6" lg="4">
				<v-card>
					<v-card-title>
						Followers
					</v-card-title>
					<v-card-text>
						<v-data-iterator
							:items="user.followers"
							hide-default-footer
							class="ml-5 mr-5"
							no-data-text="No friends found"
							disable-pagination
						>
							<template v-slot:default="props">
								<v-row v-for="user in props.items" :key="user.username" class="mt-3">
									<span>
										<v-avatar color="green" class="mr-2">
											<img v-if="user.avatar" alt="Avatar" :src="user.avatar" />
											<span v-else class="white--text headline text-uppercase">{{
												user.username.substring(0, 2)
											}}</span>
										</v-avatar>
										{{ user.username }}
									</span>
								</v-row>
							</template>
						</v-data-iterator>
					</v-card-text>
				</v-card>
			</v-col>
			<v-col cols="12" sm="12" md="6" lg="4">
				<v-card>
					<v-card-title>
						Games library
					</v-card-title>
					<v-card-text>
						<v-data-iterator :items="user.games" hide-default-footer class="ml-5 mr-5" no-data-text="No friends found" disable-pagination>
							<template v-slot:default="props">
								<v-row v-for="game in props.items" :key="game.id" class="mt-3" @click="editGame(game)">
									<v-col cols="10">
										<v-avatar color="blue" class="mr-2">
											<img v-if="game.avatar" alt="Avatar" :src="game.title" />
											<span v-else class="white--text headline text-uppercase">{{ game.title.substring(0, 2) }}</span>
										</v-avatar>
										{{ game.title }}
										<v-spacer></v-spacer>
									</v-col>
									<v-col cols="2" justify-center>
										<v-btn icon @click="deleteGame(game)"><v-icon>mdi-close</v-icon></v-btn>
									</v-col>
								</v-row>
							</template>
						</v-data-iterator>
					</v-card-text>
					<!-- <v-dialog v-model="gameDialog" max-width="400" overlay-opacity="0.5" overlay-color="black">
						<v-card>
							<v-img
								:src="game.image_url"
								class="white--text align-end"
								gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
								height="180px"
							>
								<v-card-title>
									{{ game.title }}
								</v-card-title>
							</v-img>
							<v-card-text class="mt-5 mb-0 pb-0">
								<v-textarea
									v-model="userTag"
									label="My player tag"
									outlined
									counter="20"
									auto-grow
									rows="1"
									class="mb-0 pa-0"
								></v-textarea>
							</v-card-text>
							<v-card-actions>
                <v-btn color="red" text large @click="deleteGame" :loading="loading">
									Delete
								</v-btn>
								<v-btn color="primary" tile block large @click="saveGame" :loading="loading">
									<v-icon class="mr-3 mt-0">mdi-check</v-icon>
									Save
								</v-btn>
							</v-card-actions>
						</v-card>
					</v-dialog> -->
				</v-card>
			</v-col>
		</v-row>
	</v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { UserModule } from "@/store/modules/user";
import { Utilisateur } from "../../../models/Login/utilisateur";
import { UserApi } from "../../../api/UserApi";
import { GamesLibraryApi } from "@/api/GamesLibraryApi";
import { Game } from "@/models/Game/game";
import { AppModule } from '../../../store/modules/app';
import { NotificationApi } from '@/api/NotificationApi';
import { Notification } from "@/models/Notification/notification";

@Component({
	name: "UserProfile",
})
export default class extends Vue {
	public username: string = "";
	public loading: Boolean = false;
	public errorMessage: string = "";
	public audiosNotification: {libelle:string, path: string}[] = [];
	public audiosNotificationSelected: string = "";

  private gameDialog = false;
  private gameEdited = new Game();

	get user(){
		return UserModule.utilisateur;
	}

	get fullPathDownload(){
		return `${process.env.VUE_APP_BaseUrl}/audio/notifications/${this.audiosNotificationSelected}`;
	}

	mounted() {
		this.audiosNotification.push({libelle:"No sound", path:""});
		this.audiosNotification.push({libelle:"Horn", path:"horn.mp3"});
		this.audiosNotification.push({libelle:"Air raid", path:"air-siren.mp3"});
		this.audiosNotification.push({libelle:"Wololo", path:"wololo.mp3"});
		this.audiosNotificationSelected = AppModule.notificationSound;
	}

	private audioChange(){
		AppModule.ChangeNotificationSound(this.audiosNotificationSelected);
	}

	private async deleteGame(game: Game) {
		try {
			let test = await GamesLibraryApi.deleteGame(game.id);
			console.log(test);
			this.user.games.splice(this.user.games.indexOf(game), 1);
		} catch (err) {
			this.errorMessage = err;
		}
  }
	
	private testAudio(){
		if(this.audiosNotificationSelected) {
			var audio = new Audio(`${process.env.VUE_APP_BaseUrl}/audio/notifications/${this.audiosNotificationSelected}`);
			audio.play();
		}
	}

	private testNotification(){
		let notif = new Notification();
		notif.title = "It's a test";
		notif.content = "Oh god, i send notification to myself";
		notif.notification_type = "comrade_joining"
		notif.user_ids = [UserModule.utilisateur.id];
		NotificationApi.sendNotification(notif);
	}

  private async editGame(game: Game) {
		try {
      this.gameDialog = true;
      this.gameEdited = game;
		} catch (err) {
			this.errorMessage = err;
		}
	}
}
</script>
