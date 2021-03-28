import Vue from 'vue';
import Router, { Route, RouteConfig } from 'vue-router';
import Layout from '@/layout/index.vue';
import { UserModule } from '@/store/modules/user';
import Login from '@/views/user/login/index.vue';
import Register from '@/views/user/register/index.vue';
import Notifications from '@/views/notifications/index.vue';
import Friends from '@/views/user/friends/index.vue';
import Profile from '@/views/user/profile/index.vue';

Vue.use(Router);
export const constantRoutes: RouteConfig[] = [
  {
    path: '/',
    name: 'Home',
    component: Layout,
    children: [
      {
        path: '/',
        name: 'Home',
        component: () => import(/* webpackChunkName: "home" */ '@/views/home/index.vue'),
        meta: { icon: 'mdi-gamepad-square', title: 'Home', affix: true }
      }
    ]
  },
  {
    path: '/',
    name: 'help',
    component: Layout,
    redirect: '/help',
    children: [
      {
        path: 'help',
        name: 'Help',
        component: () => import(/* webpackChunkName: "games" */ '@/views/help/help.vue'),
        meta: { icon: 'mdi-help-circle', title: 'Help', affix: true }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  }
  // {
  // 	path: "*",
  // 	name: "home",
  // 	component: Layout,
  // 	redirect: "/games",
  // 	children: [
  // 		{
  // 			path: "games",
  // 			name: "Games",
  // 			component: Games,
  // 			meta: { icon: "mdi-gamepad-square", title: "Games", affix: true },
  // 		},
  // 	]
  // },
];

export const connectedRoutes: RouteConfig[] = [
  {
    path: '/user',
    name: 'user',
    component: Layout,
    redirect: 'user/login',
    meta: { roles: ['login'] },
    children: [
      {
        path: 'friends',
        name: 'Friends',
        meta: { roles: ['login'] },
        component: Friends
      },
      {
        path: 'profile',
        name: 'Profile',
        meta: { roles: ['login'] },
        component: Profile
      },
      {
        path: 'notifications',
        name: 'Notifications',
        meta: { roles: ['admin'] },
        component: Notifications
      }
    ]
  }
];

export const adminRoutes: RouteConfig[] = [
  {
    path: '/admin',
    name: 'CRUD Games',
    component: Layout,
    redirect: 'admin/games',
    meta: { roles: ['admin'] },
    children: [
      {
        path: 'games',
        name: 'CRUD Games',
        component: () => import(/* webpackChunkName: "gamesCrud" */ '@/views/admin/games/index.vue'),
        meta: {
          icon: 'mdi-gamepad-round-outline',
          title: 'Games',
          roles: ['admin']
        }
      }
    ]
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

router.beforeEach(async (to: Route, from: Route, next: any) => {
  if (UserModule.token) {
    if (!UserModule.utilisateur?.id) UserModule.LoadUtilisateur();

    if (to.path === '/login' || to.path === '/register') {
      // If is logged in, redirect to the home page
      next({ path: '/' });
    } else next();
  } else next();
});

let adminRoutesLoaded = false;
let connectedRoutesLoaded = false;
export function initDynamicRoutes() {
  if (UserModule.token && !connectedRoutesLoaded) {
    connectedRoutesLoaded = true;
    router.addRoutes(connectedRoutes);
  }

  if (UserModule.isAdmin && !adminRoutesLoaded) {
    adminRoutesLoaded = true;
    router.addRoutes(adminRoutes);
  }
}

export function resetRouter() {
  adminRoutesLoaded = false;
  connectedRoutesLoaded = false;
  const newRouter = createRouter();
  (router as any).matcher = (newRouter as any).matcher; // reset router
}

export default router;
