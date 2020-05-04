import Vue from "vue";
import Router, { Route, RouteConfig } from "vue-router";
import Layout from "@/layout/index.vue";
import Home from "../views/Home.vue";
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
  {
		path: "/user",
		name: "user",
		component: Layout,
		redirect: "user/login",
		children: [
			{
				path: "login",
				name: "log",
				component: () => import(/* webpackChunkName: "login" */ "@/views/user/login/index.vue"),
			},
			{
				path: "register",
				name: "Register",
				component: () => import(/* webpackChunkName: "register" */ "@/views/user/register/index.vue"),
			},
			{
				path: "friends",
				name: "Friends",
				component: () => import(/* webpackChunkName: "friends" */ "@/views/user/friends/index.vue"),
			}
		],
	},
];

export const adminRoutes: RouteConfig[] = [
  {
		path: "/admin",
		name: "CRUD Games",
		component: Layout,
		redirect: "admin/games",
		meta: { roles: ["admin"]},
		children: [
			{
				path: "games",
				name: "CRUD Games",
				component: () => import(/* webpackChunkName: "gamesCrud" */ "@/views/gamesCrud/index.vue"),
				meta: { icon: "mdi-gamepad-round-outline", title: "Games", roles: ["admin"] },
			},
		],
	}
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
	if (UserModule.token) {
    if (to.path === '/user/login') {
      // If is logged in, redirect to the home page
      next({ path: '/' })
		}else	next();
	}
  else next();
});

let adminRoutLoaded = false;
export function initDynamicRoutes() {
	if(UserModule.isAdmin && !adminRoutLoaded){
		adminRoutLoaded = true;
		router.addRoutes(adminRoutes);
	}
}

export function resetRouter() {
  const newRouter = createRouter();
  (router as any).matcher = (newRouter as any).matcher // reset router
}

export default router;
