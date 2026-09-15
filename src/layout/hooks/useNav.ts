// @ts-nocheck
import { storeToRefs } from "pinia";
import { getConfig, siteTitle } from "@/config";
import { initSiteLogo, LOGO_FALLBACK, siteLogo } from "@/utils/sysConfig";
import { useRouter } from "vue-router";
import { emitter } from "@/utils/mitt";
import { fallbackAvatar, notifyFallbackAvatar } from "@/utils/avatar";
import { getTopMenu } from "@/router/utils";
import { useFullscreen } from "@vueuse/core";
import type { routeMetaType } from "../types";
import { router, remainingPaths } from "@/router";
import { computed, type CSSProperties } from "vue";
import { useAppStoreHook } from "@/store/modules/app";
import { useUserStoreHook } from "@/store/modules/user";
import { useGlobal, isAllEmpty } from "@pureadmin/utils";
import { useEpThemeStoreHook } from "@/store/modules/epTheme";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { ElMessageBox } from "element-plus";
import ExitFullscreen from "~icons/ri/fullscreen-exit-fill";
import Fullscreen from "~icons/ri/fullscreen-fill";

const errorInfo =
  "The current routing configuration is incorrect, please check the configuration";

export function useNav() {
  const pureApp = useAppStoreHook();
  const routers = useRouter().options.routes;
  const { isFullscreen, toggle } = useFullscreen();
  const { wholeMenus } = storeToRefs(usePermissionStoreHook());
  /** 平台`layout`中所有`el-tooltip`的`effect`配置，默认`light` */
  const tooltipEffect = getConfig()?.TooltipEffect ?? "light";

  const getDivStyle = computed((): CSSProperties => {
    return {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      overflow: "hidden"
    };
  });

  /** 头像（如果头像为空则使用本地兜底图 fallback-avatar.png ） */
  const userAvatar = computed(() => {
    return isAllEmpty(useUserStoreHook()?.avatar)
      ? fallbackAvatar
      : useUserStoreHook()?.avatar;
  });

  /** 头像加载失败:改用本地兜底图 */
  function onUserAvatarError() {
    useUserStoreHook().SET_AVATAR(fallbackAvatar);
    notifyFallbackAvatar();
  }

  /** 昵称（如果昵称为空则显示用户名） */
  const username = computed(() => {
    return isAllEmpty(useUserStoreHook()?.nickname)
      ? useUserStoreHook()?.username
      : useUserStoreHook()?.nickname;
  });

  /** 设置国际化选中后的样式 */
  const getDropdownItemStyle = computed(() => {
    return (locale, t) => {
      return {
        background: locale === t ? useEpThemeStoreHook().epThemeColor : "",
        color: locale === t ? "#f4f4f5" : "#000"
      };
    };
  });

  const getDropdownItemClass = computed(() => {
    return (locale, t) => {
      return locale === t ? "" : "dark:hover:text-primary!";
    };
  });

  const avatarsStyle = computed(() => {
    return username.value ? { marginRight: "10px" } : "";
  });

  const isCollapse = computed(() => {
    return !pureApp.getSidebarStatus;
  });

  const device = computed(() => {
    return pureApp.getDevice;
  });

  const { $storage } = useGlobal<GlobalPropertiesApi>();
  const layout = computed(() => {
    return $storage?.layout?.layout;
  });

  const title = computed(() => siteTitle.value);

  /** 动态title */
  function changeTitle(meta: routeMetaType) {
    if (siteTitle.value) document.title = `${meta.title} | ${siteTitle.value}`;
    else document.title = meta.title;
  }

  /** 退出登录 */
  async function logout() {
    const confirmed = await ElMessageBox.confirm("确定要退出登录吗?", "系统提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      draggable: true
    })
      .then(() => true)
      .catch(() => false);
    if (confirmed) {
      useUserStoreHook().logOutWithServer();
    }
  }

  function backTopMenu() {
    router.push(getTopMenu()?.path);
  }

  function onPanel() {
    emitter.emit("openPanel");
  }

  /** 进入个人中心(动态路由,菜单未配置 name,按路径跳转) */
  function toProfile() {
    router.push("/admin/profile");
  }

  function toggleSideBar() {
    pureApp.toggleSideBar();
  }

  function handleResize(menuRef) {
    menuRef?.handleResize();
  }

  function resolvePath(route) {
    if (!route.children) return console.error(errorInfo);
    const httpReg = /^http(s?):\/\//;
    const routeChildPath = route.children[0]?.path;
    if (httpReg.test(routeChildPath)) {
      return route.path + "/" + routeChildPath;
    } else {
      return routeChildPath;
    }
  }

  function menuSelect(indexPath: string) {
    if (wholeMenus.value.length === 0 || isRemaining(indexPath)) return;
    emitter.emit("changLayoutRoute", indexPath);
  }

  /** 判断路径是否参与菜单 */
  function isRemaining(path: string) {
    return remainingPaths.includes(path);
  }

  /** 获取`logo`(统一走站点 logo 配置,未配置时回退本地兜底图;读取响应式状态,配置变更自动生效) */
  function getLogo() {
    return siteLogo.value || LOGO_FALLBACK;
  }

  /** logo 图片加载失败:清空配置态(与配置为空同路径),统一回落本地兜底图 */
  function onLogoError() {
    siteLogo.value = "";
  }

  /** 站点 Logo 惰性初始化(模块级去重,仅首次调用发起请求) */
  initSiteLogo();

  return {
    title,
    device,
    layout,
    logout,
    routers,
    $storage,
    isFullscreen,
    Fullscreen,
    ExitFullscreen,
    toggle,
    backTopMenu,
    onPanel,
    getDivStyle,
    changeTitle,
    toggleSideBar,
    menuSelect,
    handleResize,
    resolvePath,
    getLogo,
    onLogoError,
    isCollapse,
    pureApp,
    username,
    userAvatar,
    onUserAvatarError,
    avatarsStyle,
    tooltipEffect,
    toProfile,
    getDropdownItemStyle,
    getDropdownItemClass
  };
}
