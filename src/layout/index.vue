<template>
	<v-app id="inspire">
		<v-navigation-drawer v-model="drawer" :mini-variant.sync="mini" clipped app>
			<v-list>
				<!-- <v-app-bar-nav-icon @click.stop="mini = !mini">

				</v-app-bar-nav-icon> -->
				<v-list-item >
					<v-list-item-action @click="mini = !mini">
           	<v-icon v-if="mini">mdi-arrow-expand-right</v-icon>
						<v-icon v-if="!mini">mdi-arrow-expand-left</v-icon>
          </v-list-item-action>
				</v-list-item>
				<v-divider class="ma-1"></v-divider>
        <v-list-item value="true" v-for="(item, i) in menu" :key="i" :to="item.link">
          <v-list-item-action>
            <v-icon v-html="item.icon"></v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="item.title"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
		</v-navigation-drawer>
		<v-app-bar app color="primary" dark clipped-left>
			<v-toolbar-title class="d-flex justify-start">
       <v-icon x-large class="mr-5" @click="goHome">mdi-gamepad-variant</v-icon>
        <h2>I Play <b>BITCH</b></h2>
				</v-toolbar-title>
			<v-spacer></v-spacer>
			<v-btn text	color="white"	class="mr-2" v-if="!token" @click="logout">
				<b>Sign-in</b>
			</v-btn>
			<b v-if="token" class="mr-2">{{ username }}</b>
			<v-menu bottom offset-y v-if="token">
				<template v-slot:activator="{ on }">
					<v-btn
						icon
						color="white"
						v-on="on"
					>
						<v-avatar color="grey darken-2" size="36" class="pa-0">
							<v-icon size="36" color="grey lighten-1">mdi-account-circle</v-icon>
						</v-avatar>
					</v-btn>
				</template>
				<v-list>
					<v-list-item @click="logout">
						<v-list-item-title><v-icon class="mr-2">mdi-logout</v-icon> Logout</v-list-item-title>
					</v-list-item>
				</v-list>
			</v-menu>
		</v-app-bar>
	
		<v-content>
			<v-container fluid>
				<app-main />
			</v-container>
		</v-content>
	</v-app>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { AppMain } from "./components";
import { UserModule } from "@/store/modules/user";
import { Route, RouteConfig } from "vue-router";
import { Getter } from "vuex-class";
import { constantRoutes } from "@/router/index";

@Component({
  name: "Layout",
  components: {
    AppMain
  }
})
export default class extends Vue {
  private drawer: Boolean = true;
  private mini: Boolean = true;
	private source: String = "";
	private menu: {title: string, icon: string, link: string}[] = [];

	get isLogged(): boolean{
		return !!UserModule.token;
	}

	mounted(){
		this.routeChanged(!!UserModule.token);
	}

	@Watch("isLogged")
	private routeChanged(islogged: boolean){
		this.menu = [];
		this.menu.push({ title: 'Games', icon: 'mdi-gamepad-square', link: '/games' });
		if(islogged){
			this.menu.push({ title: 'CRUD games', icon:'mdi-gamepad-round-outline', link: '/admin/games' });
		}
	}

  get username() {
    return UserModule.username;
	}
	
	get token() {
    return UserModule.token;
  }

  private logout() {
    UserModule.Logout();
    this.$router.push("/user/login");
	}
	
	private goHome(){
		this.$router.push("/");
	}
}
</script>