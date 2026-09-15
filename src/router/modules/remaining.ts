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
        path: "/moments",
        name: "PortalMoments",
        component: () => import("@/views/portal/moments/index.vue"),
        meta: { title: "点点滴滴" }
      },
      {
        path: "/message",
        name: "PortalMessage",
        component: () => import("@/views/portal/message/index.vue"),
        meta: { title: "留言簿" }
      },
      {
        path: "/love-photo",
        name: "PortalLovePhoto",
        component: () => import("@/views/portal/love-photo/index.vue"),
        meta: { title: "恋爱画册" }
      },
      {
        path: "/love-list",
        name: "PortalLoveList",
        component: () => import("@/views/portal/love-list/index.vue"),
        meta: { title: "恋爱清单" }
      },
      {
        path: "/anniversary",
        name: "PortalAnniversary",
        component: () => import("@/views/portal/anniversary/index.vue"),
        meta: { title: "纪念日" }
      },
      {
        path: "/time-capsule",
        name: "PortalTimeCapsule",
        component: () => import("@/views/portal/time-capsule/index.vue"),
        meta: { title: "时间胶囊" }
      },
      {
        path: "/diary",
        name: "PortalDiary",
        component: () => import("@/views/portal/diary/index.vue"),
        meta: { title: "情侣日记" }
      },
      {
        path: "/footprint",
        name: "PortalFootprint",
        component: () => import("@/views/portal/footprint/index.vue"),
        meta: { title: "足迹" }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
