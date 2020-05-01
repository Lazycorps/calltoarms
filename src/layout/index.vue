<template>
	<v-app id="inspire">
		<v-navigation-drawer v-model="drawer" :mini-variant.sync="mini" app>
			<v-list dense>
				<v-list-item v-for="item in routes" 
										:key="item.title"
										:to="item">
					<v-list-item-action>
						<v-icon>{{ getOnlyChildren(item).meta.icon}}</v-icon>
					</v-list-item-action>
					<v-list-item-content>
						<v-list-item-title>{{ getOnlyChildren(item).name }}</v-list-item-title>
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-navigation-drawer>

		<v-app-bar app color="primary" dark>
			<v-app-bar-nav-icon @click.stop="mini = !mini">
				<v-icon>mdi-menu</v-icon>
			</v-app-bar-nav-icon>
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
			<!-- <v-btn icon class="ml-5" @click="logout">
				<v-icon>mdi-logout</v-icon>
			</v-btn> -->
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
import { PermissionModule } from '@/store/modules/permissions'
import { Getter } from "vuex-class";

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
	
	//@Getter("permissionModule/routes")
	private routes: RouteConfig[] = PermissionModule.routes.filter((r) => !r.meta || !r.meta.hidden);

	// @Getter()
	// get routes(){
	// 	return PermissionModule.routes.filter((r) => !r.meta || !r.meta.hidden);
	// }

	private getOnlyChildren(route: RouteConfig){
    if (route.children) {
      for (let child of route.children) {
        if (!child.meta || !child.meta.hidden) {
          return child;
        }
      }
    }
    return { ...route, path: '' }
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