// @ts-nocheck
import { storeToRefs } from "pinia";
import { getConfig, siteTitle } from "@/config";
import { LOGO_FALLBACK, siteLogo } from "@/utils/sys-config";
import { useRouter } from "vue-router";
import { emitter } from "@/utils/mitt";
import { fallbackAvatar, notifyFallbackAvatar } from "@/utils/avatar";
import { getTopMenu } from "@/router/utils";
import { useFullscreen } from "@vueuse/core";
import { router, remainingPaths } from "@/router";
import { computed, ref, type CSSProperties } from "vue";
import { useAppStoreHook } from "@/store/modules/app";
import { useUserStoreHook } from "@/store/modules/user";
import { useGlobal, isAllEmpty } from "@pureadmin/utils";
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

  /** 退出登录 */
  async function logout() {
    const confirmed = await ElMessageBox.confirm(
      "确定要退出登录吗?",
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        draggable: true
      }
    )
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

  /** logo 加载失败标记(useNav 每次调用独立):任一消费点图片失效仅自身回退,
   *  不再置空全局配置态——否则一次瞬时抖动会导致整个会话 logo 永久丢失 */
  const logoBroken = ref(false);

  /** 获取`logo`(统一走站点 logo 配置,未配置/加载失败时回退本地兜底图;配置变更自动生效) */
  function getLogo() {
    return logoBroken.value ? LOGO_FALLBACK : siteLogo.value || LOGO_FALLBACK;
  }

  /** logo 图片加载失败:仅当前消费点回退兜底图 */
  function onLogoError() {
    logoBroken.value = true;
  }

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
    toggleSideBar,
    menuSelect,
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
    toProfile
  };
}
