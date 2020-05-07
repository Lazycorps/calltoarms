<template>
	<v-app id="inspire">
		<v-navigation-drawer v-model="drawer" :mini-variant.sync="mini" v-if="$vuetify.breakpoint.mdAndUp" mobile-break-point="960" clipped app>
			<v-list>
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
       	<v-btn icon to="/" x-large ><v-icon x-large>mdi-gamepad-variant</v-icon></v-btn>
        <h2>I Play <b>BITCH</b></h2>
				</v-toolbar-title>
			<v-spacer></v-spacer>
			<v-btn text	color="white"	class="mr-2" v-if="!token" @click="logout">
				<b>Sign-in</b>
			</v-btn>
			<!-- <router-link v-if="isLogin" to="/user/profile" v-slot="{ href, route, navigate, isActive }">
				<NavLink :active="isActive" :href="href" @click="navigate">{{ username }}</NavLink>		
			</router-link> -->
			<b class="mr-2">{{ username }}</b>
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
					<v-list-item to="/user/profile">
						<v-list-item-title><v-icon class="mr-2">mdi-account</v-icon> Profile</v-list-item-title>
					</v-list-item>
					<v-divider></v-divider>
					<v-list-item @click="logout">
						<v-list-item-title><v-icon class="mr-2">mdi-logout</v-icon> Logout</v-list-item-title>
					</v-list-item>
				</v-list>
			</v-menu>
		</v-app-bar>
		<v-content>
			<v-container fluid>
				<v-alert v-if="!pushEnabled" border="left" text outlined prominent type="warning">
					<v-row align="center">
						<v-col class="grow">Oh nooo, i play bitch can't work correctly without notifications enabled :'(, try a refresh ?</v-col>
						<!-- <v-col class="shrink">
							<v-btn>Enable notification</v-btn>
						</v-col> -->
					</v-row>
				</v-alert>
				<app-main />
			</v-container>
		</v-content>
		<v-bottom-navigation
			v-if="$vuetify.breakpoint.smAndDown"
			color="primary"
			grow
			app
		>
			<v-btn to="/games">
				<span>Games</span>
				<v-icon>mdi-gamepad-square</v-icon>
			</v-btn>
			<v-btn to="/user/friends">
				<span>Friends</span>
				<v-icon>mdi-account-multiple</v-icon>
			</v-btn>
			<v-btn to="/user/notifications" @click="refreshUser">
				<span>Calls</span>
				<v-badge
					:value="newNotification"
					color="blue"
					overlap
					dot
				>
				<v-icon>mdi-sword-cross</v-icon>
				 </v-badge>
			</v-btn>
		</v-bottom-navigation>
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
import { AppModule } from "@/store/modules/app";

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
	private bottom!: boolean;

	get pushEnabled(){
		return AppModule.pushNotificationEnabled;
	}

	get isAdmin(): boolean{
		return !!UserModule.isAdmin;
	}

	get isLogin(): boolean{
		return !!UserModule.token;
	}

	get newNotification(){
		return AppModule.newNotification;
	}

	mounted(){
		this.routeChanged();
	}

	@Watch("isAdmin")
	@Watch('isLogin')
	private routeChanged(){
		this.menu = [];
		this.menu.push({ title: 'Games', icon: 'mdi-gamepad-square', link: '/games' });
		this.menu.push({ title: 'Friends', icon: 'mdi-account-multiple', link: '/user/friends' });
		this.menu.push({ title: 'Calls', icon: 'mdi-sword-cross', link: '/user/notifications' });
		if(this.isAdmin){
			this.menu.push({ title: 'CRUD games', icon:'mdi-gamepad-round-outline', link: '/admin/games' });
		}
	}

  get username() {
    return UserModule.username;
	}
	
	get token() {
    return UserModule.token;
  }

  private async refreshUser(){
	  await UserModule.LoadUtilisateur();
	  AppModule.NewNotificationReceived(false);
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

<style>
.v-item-group.v-bottom-navigation .v-btn {
    height: inherit !important;
}
</style>