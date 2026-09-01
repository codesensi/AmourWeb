const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: "登录",
      showLink: false
    }
  },
  // 全屏403（无权访问）页面
  {
    path: "/access-denied",
    name: "AccessDenied",
    component: () => import("@/views/error/403.vue"),
    meta: {
      title: '"403"',
      showLink: false
    }
  },
  // 全屏500（服务器出错）页面
  {
    path: "/server-error",
    name: "ServerError",
    component: () => import("@/views/error/500.vue"),
    meta: {
      title: '"500"',
      showLink: false
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      title: "加载中...",
      showLink: false
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/layout/redirect.vue")
      }
    ]
  },
  {
    path: "/admin/account-settings",
    name: "AccountSettings",
    component: () => import("@/views/account-settings/index.vue"),
    meta: {
      title: "账户设置",
      showLink: false
    }
  },
  // 门户公开外壳(第二期):所有门户页面经 PortalLayout 渲染;
  // public 标记由守卫顶部短路,访客免登录。原过渡重定向(/ → /admin/welcome)随门户首页落地删除
  {
    path: "/",
    name: "Portal",
    component: () => import("@/layout/portal/PortalLayout.vue"),
    meta: {
      // 父路由标题留空:浏览器标题取子路由副标题,避免命中「门户」
      title: "",
      showLink: false,
      public: true
    },
    children: [
      {
        path: "",
        name: "PortalHome",
        component: () => import("@/views/portal/home/index.vue"),
        meta: { title: "首页" }
      },
      {
        path: "/little",
        name: "PortalLittle",
        component: () => import("@/views/portal/little/index.vue"),
        meta: { title: "点点滴滴" }
      },
      {
        path: "/leaving",
        name: "PortalLeaving",
        component: () => import("@/views/portal/leaving/index.vue"),
        meta: { title: "留言板" }
      },
      {
        path: "/about",
        name: "PortalAbout",
        component: () => import("@/views/portal/about/index.vue"),
        meta: { title: "关于我们" }
      },
      {
        path: "/photo",
        name: "PortalPhoto",
        component: () => import("@/views/portal/photo/index.vue"),
        meta: { title: "Love Photo" }
      },
      {
        path: "/list",
        name: "PortalLoveList",
        component: () => import("@/views/portal/list/index.vue"),
        meta: { title: "Love List" }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
