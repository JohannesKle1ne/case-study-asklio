import { createRouter, createWebHistory } from "vue-router";
import NewRequestView from "../views/NewRequestView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "new-request",
      component: NewRequestView,
    },
    {
      path: "/requests",
      name: "request-overview",
      component: () => import("../views/RequestOverviewView.vue"),
    },
  ],
});

export default router;
