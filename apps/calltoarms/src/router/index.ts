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
        component: () => import("@/views/Home.vue"),
      },
    ],
  },
  {
    path: "/community/:id",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "Community",
        component: () => import("@/views/communities/Community.vue"),
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
        component: () => import("@/views/login/Register.vue"),
      },
      {
        path: "/register/validation",
        name: "RegisterValidation",
        component: () => import("@/views/login/RegisterValidation.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, form) => {
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
