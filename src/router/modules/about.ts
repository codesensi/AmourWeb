import { about } from "@/router/enums";

export default {
  path: "/admin/about",
  redirect: "/admin/about/index",
  meta: {
    icon: "ri/file-info-line",
    title: "关于",
    rank: about
  },
  children: [
    {
      path: "/admin/about/index",
      name: "About",
      component: () => import("@/views/about/index.vue"),
      meta: {
        title: "关于"
      }
    }
  ]
} satisfies RouteConfigsTable;
