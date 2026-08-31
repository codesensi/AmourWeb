import { $t } from "@/plugins/i18n";
import { error } from "@/router/enums";

export default {
  path: "/error",
  redirect: "/error/403",
  meta: {
    icon: "ri/information-line",
    // 错误页为功能性基础设施(404 兜底/权限跳转依赖),仅隐藏菜单,路由保留
    showLink: false,
    title: $t("menus.pureAbnormal"),
    rank: error
  },
  children: [
    {
      path: "/error/403",
      name: "403",
      component: () => import("@/views/error/403.vue"),
      meta: {
        title: $t("menus.pureAccessDenied")
      }
    },
    {
      path: "/error/404",
      name: "404",
      component: () => import("@/views/error/404.vue"),
      meta: {
        title: $t("menus.purePageNotFound")
      }
    },
    {
      path: "/error/500",
      name: "500",
      component: () => import("@/views/error/500.vue"),
      meta: {
        title: $t("menus.pureServerError")
      }
    }
  ]
} satisfies RouteConfigsTable;
