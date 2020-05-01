import Vue from "vue";
import Router, { Route, RouteConfig } from "vue-router";
import Layout from "@/layout/index.vue";
import Home from "../views/Home.vue";
import { PermissionModule } from "@/store/modules/permissions";
import { UserModule } from "@/store/modules/user";

Vue.use(Router);
const whiteList = ["/login", "/register"];
export const constantRoutes: RouteConfig[] = [
	{
		path: "/",
		name: "home",
		component: Layout,
		redirect: "/games",
		children: [
			{
				path: "games",
				name: "Games",
				component: () => import(/* webpackChunkName: "games" */ "@/views/Games/index.vue"),
				meta: { icon: "mdi-gamepad-square", title: "Games", affix: true },
			},
		],
	},
];

export const asyncRoutes: RouteConfig[] = [
	{
		path: "/user",
		name: "user",
		component: Layout,
		redirect: "user/login",
		meta: { hidden: true },
		children: [
			{
				path: "login",
				name: "log",
				component: () => import(/* webpackChunkName: "login" */ "@/views/login/index.vue"),
				meta: { icon: "mdi-login", title: "Login", affix: true },
			},
			{
				path: "register",
				name: "Register",
				component: () => import(/* webpackChunkName: "register" */ "@/views/register/index.vue"),
				meta: { icon: "mdi-account", title: "Logout" },
			},
		],
	},
	{
		path: "/admin",
		name: "CRUD Games",
		component: Layout,
		redirect: "/games",
		meta: { roles: ["admin"] },
		children: [
			{
				path: "games",
				name: "CRUD Games",
				component: () => import(/* webpackChunkName: "gamesCrud" */ "@/views/gamesCrud/index.vue"),
				meta: { icon: "mdi-gamepad-round-outline", title: "Games" },
			},
		],
	},
];

const createRouter = () =>
	new Router({
		//mode: "history",
		scrollBehavior: (to, from, savedPosition) => {
			if (savedPosition) {
				return savedPosition;
			} else {
				return { x: 0, y: 0 };
			}
		},
		base: process.env.BASE_URL,
		routes: constantRoutes,
	});

const router = createRouter();
router.beforeEach(async (to: Route, from: Route, next: any) => {
  let roles = [];
  if(UserModule.token)
    roles.push("admin");

	if (PermissionModule.routes && PermissionModule.routes.length === 0) {
    PermissionModule.GenerateRoutes(roles);
		router.addRoutes(PermissionModule.dynamicRoutes);
		if (to.path.toUpperCase() == "/USER/LOGIN") {
			next({ path: "/" });
		} else {
			next({ ...to, replace: true });
		}
	} else {
		PermissionModule.GenerateRoutes(roles);
		next();
	}
});
export default router;
