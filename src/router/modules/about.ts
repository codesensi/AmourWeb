import { about } from "@/router/enums";

export default {
  path: "/about",
  redirect: "/about/index",
  meta: {
    icon: "ri/file-info-line",
    title: "关于",
    rank: about
  },
  children: [
    {
      path: "/about/index",
      name: "About",
      component: () => import("@/views/about/index.vue"),
      meta: {
        title: "关于"
      }
    }
  ]
} satisfies RouteConfigsTable;
