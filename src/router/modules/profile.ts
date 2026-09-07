import { profile } from "@/router/enums";

export default {
  path: "/admin/profile",
  meta: {
    icon: "ri/user-3-line",
    title: "个人中心",
    rank: profile
  },
  children: [
    {
      // 注意:子级路径必须与父级一致——侧边栏对"单子级菜单"的导航目标是父级
      // path(SidebarLinkItem :to="item"),而 vue-router 对无组件的目录父级
      // 不创建可匹配记录,路径错开会导致点击菜单 404;
      // 页签选中态依赖 route.name 比对,无 name 的父级由页签存储处的下钻逻辑兜底
      path: "/admin/profile",
      name: "UserProfile",
      component: () => import("@/views/profile/index.vue"),
      meta: {
        title: "个人中心"
      }
    }
  ]
} satisfies RouteConfigsTable;
