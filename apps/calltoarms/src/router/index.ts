// Composables
import { getAuth } from "firebase/auth";
import { createRouter, createWebHistory } from "vue-router";
import { getCurrentUser } from "vuefire";

const routes = [
  {
    path: "/",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "Home",
        // route level code-splitting
        // this generates a separate chunk (Home-[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import("@/views/Home.vue"),
      },
    ],
  },
  {
    path: "/signin",
    component: () => import("@/layouts/default/Empty.vue"),
    children: [
      {
        path: "",
        name: "SignIn",
        // route level code-splitting
        // this generates a separate chunk (Home-[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import("@/views/login/SignIn.vue"),
      },
    ],
  },
  {
    path: "/register",
    component: () => import("@/layouts/default/Empty.vue"),
    children: [
      {
        path: "",
        name: "Register",
        // route level code-splitting
        // this generates a separate chunk (Home-[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import("@/views/login/Register.vue"),
      },
      {
        path: "/register/validation",
        name: "RegisterValidation",
        // route level code-splitting
        // this generates a separate chunk (Home-[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import("@/views/login/RegisterValidation.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from) => {
  const currentUser = await getCurrentUser();
  if (!currentUser?.emailVerified && to.name !== "SignIn") {
    if (to.name?.toString().startsWith("Register")) return true;
    else return { name: "SignIn" };
  } else if (
    currentUser?.emailVerified &&
    (to.name === "SignIn" || to.name?.toString().startsWith("Register"))
  ) {
    return { name: "Home" };
  }
});

export default router;
