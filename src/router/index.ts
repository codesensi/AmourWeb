import Cookies from "js-cookie";
import { siteTitle } from "@/config";
import NProgress from "@/utils/progress";
import { buildHierarchyTree } from "@/utils/tree";
import remainingRouter from "./modules/remaining";
import { useMultiTagsStoreHook } from "@/store/modules/multi-tags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { isUrl, openLink, cloneDeep, isAllEmpty } from "@pureadmin/utils";
import {
  ascending,
  getTopMenu,
  initRouter,
  isOneOfArray,
  getHistoryMode,
  findRouteByPath,
  handleAliveRoute,
  formatTwoStageRoutes,
  formatFlatteningRoutes
} from "./utils";
import {
  type Router,
  type RouteRecordRaw,
  type RouteComponent,
  createRouter
} from "vue-router";
import { removeToken, multipleTabsKey, getStoredUserInfo } from "@/utils/auth";

/** 自动导入全部静态路由，无需再手动引入！匹配 src/router/modules 目录（任何嵌套级别）中具有 .ts 扩展名的所有文件，除了 remaining.ts 文件
 * 如何匹配所有文件请看：https://github.com/mrmlnc/fast-glob#basic-syntax
 * 如何排除文件请看：https://cn.vitejs.dev/guide/features.html#negative-patterns
 */
const modules: Record<string, any> = import.meta.glob(
  ["./modules/**/*.ts", "!./modules/**/remaining.ts"],
  {
    eager: true
  }
);

/** 原始静态路由（未做任何处理） */
const routes: Array<RouteRecordRaw> = [];

Object.keys(modules).forEach(key => {
  routes.push(modules[key].default);
});

/** 导出处理后的静态路由（三级及以上的路由全部拍成二级） */
export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(
  formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
);

/** 初始的静态路由，用于退出登录时重置路由 */
const initConstantRoutes: Array<RouteRecordRaw> = cloneDeep(constantRoutes);

/** 用于渲染菜单，保持原始层级 */
export const constantMenus: Array<RouteComponent> = ascending(
  routes.flat(Infinity)
).concat(...remainingRouter);

/** 不参与菜单的路由 */
export const remainingPaths = remainingRouter.map(v => v.path);

/** 创建路由实例 */
export const router: Router = createRouter({
  history: getHistoryMode(import.meta.env.VITE_ROUTER_HISTORY),
  routes: constantRoutes.concat(...(remainingRouter as any)),
  strict: true,
  scrollBehavior(to, from, savedPosition) {
    // 门户公开路由:滚动由 PortalLayout 的滚动记忆统一管理,router 不干预
    if (to.matched.some(record => record.name === "Portal")) {
      return false;
    }
    // 浏览器前进/后退:恢复原滚动位置
    if (savedPosition) return savedPosition;
    // 页面声明 saveScrollTop 时保持当前滚动(管理端既有机制不变)
    if (from.meta.saveScrollTop) {
      const top: number =
        document.documentElement.scrollTop || document.body.scrollTop;
      return { left: 0, top };
    }
    // 其余(管理端路由):从最顶部加载
    return { top: 0 };
  }
});

// 禁用浏览器原生的历史滚动恢复:前进/后退的定位由 scrollBehavior 与门户滚动记忆
// 显式管理,避免原生恢复叠加导致位置不可预期
history.scrollRestoration = "manual";

/** 记录已经加载的页面路径 */
const loadedPaths = new Set<string>();

/** 重置已加载页面记录 */
export function resetLoadedPaths() {
  loadedPaths.clear();
}

/** 重置路由 */
export function resetRouter() {
  router.clearRoutes();
  for (const route of initConstantRoutes.concat(...(remainingRouter as any))) {
    router.addRoute(route);
  }
  router.options.routes = formatTwoStageRoutes(
    formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
  );
  usePermissionStoreHook().clearAllCachePage();
  resetLoadedPaths();
}

/** 路由白名单 */
const whiteList = ["/login"];

const { VITE_HIDE_HOME } = import.meta.env;

router.beforeEach((to: ToRouteType, _from) => {
  to.meta.loaded = loadedPaths.has(to.path);

  if (!to.meta.loaded) {
    NProgress.start();
  }

  if (to.meta?.keepAlive) {
    handleAliveRoute(to, "add");
    // 页面整体刷新和点击标签页刷新
    if (_from.name === undefined || _from.name === "Redirect") {
      handleAliveRoute(to);
    }
  }
  /** 浏览器标题:门户与管理端共用 —— 取路由链上最深的非空 meta.title,拼接站点名(sys_config name) */
  const externalLink = isUrl(to?.name as string);
  if (!externalLink) {
    const deepest = to.matched.findLast(item => item.meta.title);
    if (deepest) {
      document.title = siteTitle.value
        ? `${deepest.meta.title} | ${siteTitle.value}`
        : deepest.meta.title;
    }
  }
  /** 门户公开路由(meta.public):免登录直接放行,不进入登录校验分支(第二期门户) */
  if (to.meta?.public) {
    return true;
  }
  const userInfo = getStoredUserInfo();
  /** 如果已经登录并存在登录信息后不能跳转到路由白名单，而是继续保持在当前页面 */
  function toCorrectRoute() {
    return whiteList.includes(to.fullPath) ? _from.fullPath : undefined;
  }
  if ((Cookies.get(multipleTabsKey) || userInfo?.remembered) && userInfo) {
    // 无权限跳转403页面
    if (to.meta?.roles && !isOneOfArray(to.meta?.roles, userInfo?.roles ?? [])) {
      return { path: "/error/403" };
    }
    // 开启隐藏首页后在浏览器地址栏手动输入首页welcome路由则跳转到404页面
    if (VITE_HIDE_HOME === "true" && to.fullPath === "/admin/welcome") {
      return { path: "/error/404" };
    }
    if (_from?.name) {
      // name为超链接
      if (externalLink) {
        openLink(to?.name as string);
        NProgress.done();
        return false;
      } else {
        // 动态路由未装配的兜底:登录回调中 initRouter 失败(current-user 401 被登出)后,
        // SPA 内跳转管理端页面会命中未注册路由(仅渲染注释节点),造成整页空白
        // 且后续导航全部无响应;此处先补装配再重进目标页,装配失败则由登出逻辑接管跳登录
        if (
          !usePermissionStoreHook().dynamicRoutesLoaded &&
          to.path !== "/login"
        ) {
          initRouter().then((router: Router) => {
            if (isAllEmpty(to.name)) router.push(to.fullPath);
          });
        }
        return toCorrectRoute();
      }
    } else {
      // 刷新
      // dynamicRoutesLoaded 防重入:装配失败(瞬时故障)后重复导航不再重试,
      // 停留在错误页等待用户手动刷新,避免错误页触发 initRouter 的连锁循环
      if (
        !usePermissionStoreHook().dynamicRoutesLoaded &&
        usePermissionStoreHook().wholeMenus.length === 0 &&
        to.path !== "/login"
      ) {
        initRouter().then((router: Router) => {
          if (!useMultiTagsStoreHook().getMultiTagsCache) {
            const { path } = to;
            let route = findRouteByPath(
              path,
              router.options.routes[0].children ?? []
            );
            // 无 name 的目录级父路由(如"个人中心"父子同路径)时下钻取带 name 的子级,
            // 保证恢复的页签 name 与当前路由一致,选中态才能正确高亮
            while (route && !route.name && route.children?.length) {
              route = findRouteByPath(path, route.children);
            }
            getTopMenu(true);
            // query、params模式路由传参数的标签页不在此处处理
            if (route && route.meta?.title) {
              if (isAllEmpty(route.parentId) && route.meta?.backstage) {
                // 此处为动态顶级路由（目录）：目录取第一个子级作为页签；
                // 无子级的顶级菜单（如"个人中心"）直接用自身
                const target = route.children?.length
                  ? route.children[0]
                  : route;
                const { path, name, meta } = target;
                useMultiTagsStoreHook().handleTags("push", {
                  path,
                  name,
                  meta
                });
              } else {
                const { path, name, meta } = route;
                useMultiTagsStoreHook().handleTags("push", {
                  path,
                  name,
                  meta
                });
              }
            }
          }
          // 确保动态路由完全加入路由列表并且不影响静态路由（注意：动态路由刷新时router.beforeEach可能会触发两次，第一次触发动态路由还未完全添加，第二次动态路由才完全添加到路由列表，如果需要在router.beforeEach做一些判断可以在to.name存在的条件下去判断，这样就只会触发一次）
          if (isAllEmpty(to.name)) router.push(to.fullPath);
        });
      }
      return toCorrectRoute();
    }
  } else {
    if (to.path !== "/login") {
      if (whiteList.indexOf(to.path) !== -1) {
        return true;
      } else {
        removeToken();
        // 回跳原页:未登录直接访问/刷新受限页的场景与 401 登出同口径,登录后回到目标路由
        return { path: "/login", query: { redirect: to.fullPath } };
      }
    } else {
      return true;
    }
  }
});

router.afterEach(to => {
  loadedPaths.add(to.path);
  NProgress.done();
});

export default router;
