<template>
	<v-app id="inspire">
		<!-- <v-navigation-drawer v-model="drawer" :mini-variant.sync="mini" app>
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
		</v-navigation-drawer> -->

		<v-app-bar app color="primary" dark>
			<v-app-bar-nav-icon @click.stop="mini = !mini">
				<v-icon>mdi-menu</v-icon>
			</v-app-bar-nav-icon>
			<v-toolbar-title class="d-flex justify-start">
       <v-icon x-large class="mr-5">mdi-gamepad-variant</v-icon>
        <h2>I Play <b>BITCH</b></h2>
				</v-toolbar-title>
			<v-spacer></v-spacer>
			{{ username }}
			<v-btn icon class="ml-5" @click="logout">
				<v-icon>mdi-logout</v-icon>
			</v-btn>
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
  private currentRoute: any = "";

  mounted() {
    this.currentRoute = this.$route.name;
  }

	get routes(){
		return PermissionModule.routes.filter((r) => !r.meta || !r.meta.hidden);
	}

	private getOnlyChildren(route:RouteConfig){
    if (route.children) {
      for (let child of route.children) {
        if (!child.meta || !child.meta.hidden) {
          return child
        }
      }
    }
    return { ...route, path: '' }
	}

  get username() {
    return UserModule.username;
  }

  private logout() {
    UserModule.Logout();
    this.$router.push("/login");
  }
}
</script>