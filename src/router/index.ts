import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "base",
      component: () => import("@/views/LoginPage.vue"),
    },
    {
      path: "/home",
      name: "HomePage",
      component: () => import("@/views/HomePage.vue"),
    },
    {
      path: "/login",
      name: "LoginPage",
      component: () => import("@/views/LoginPage.vue"),
    },
    {
      path: "/:group_id/dashboard",
      name: "DashBoard",
      component: () => import("@/views/DashBoard.vue"),
    },
    {
      path: "/:group_id/noticetable",
      name: "NoticeTable",
      component: () => import("@/views/NoticeTable.vue"),
    },
    {
      path: "/:group_id/reporttable",
      name: "ReportTable",
      component: () => import("@/views/ReportTable.vue"),
    },
    {
      path: "/usercenter",
      name: "UserCenter",
      component: () => import("@/views/UserCenter.vue"),
    },
    {
      path: "/clans",
      name: "ClanManage",
      component: () => import("@/views/ClanManage.vue"),
    },
    {
      path: "/resources",
      name: "ResourceCenter",
      component: () => import("@/views/ResourceCenter.vue"),
    },
    {
      path: "/arena",
      name: "ArenaCenter",
      component: () => import("@/views/ArenaCenter.vue"),
    },
  ],
});

export default router;
