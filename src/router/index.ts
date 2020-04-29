import Vue from 'vue'
import Router, { Route, RouteConfig } from "vue-router";
import Layout from "@/layout/index.vue";
import Home from '../views/Home.vue'
import { PermissionModule } from '@/store/modules/permissions';
import { UserModule } from '@/store/modules/user';

Vue.use(Router)
const whiteList = ["/login", "/register"];
export const constantRoutes: RouteConfig[] = [
  {
    path: '/',
    name: 'layout',
    component: Layout,
    redirect: 'games',
    children: [
      {
        path: 'games',
        name: 'Games',
        component: () => import(/* webpackChunkName: "login" */ "@/views/Games/index.vue"),
        meta: { icon: "mdi-gamepad-square" }
      },
      {
        path: "login",
        name: "Login",
        component: () => import(/* webpackChunkName: "login" */ "@/views/login/index.vue"),
        meta: { hidden: true }
      },
      {
        path: "register",
        name: "Register",
        component: () => import(/* webpackChunkName: "register" */ "@/views/register/index.vue"),
        meta: { hidden: true  }
      }
    ]
  }
];

export const asyncRoutes: RouteConfig[] = [
  {
    path: "/register",
    name: "Register",
    component: () =>
      import(/* webpackChunkName: "register" */ "@/views/register/index.vue"),
    //meta: { hidden: true }
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
    routes: constantRoutes
  });


const router = createRouter();
// router.beforeEach(async (to: Route, from: Route, next: any) => {
//   if (UserModule.token) {
//     PermissionModule.GenerateRoutes(
//       UserModule.utilisateur.Permissions.map(p => p.Id)
//     );
//     next();
//   } else {
//     PermissionModule.GenerateRoutes([]);
//     next();
//   }
// });
export default router
