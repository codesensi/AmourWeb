import { defineStore } from "pinia";
import {
  type userType,
  store,
  router,
  resetRouter,
  routerArrays
} from "../utils";
import { type LoginRequest, type LoginResult, login, logout } from "@/api/auth";
import { queryClient } from "@/plugins/vue-query";
import { useMultiTagsStoreHook } from "./multi-tags";
import { setToken, removeToken, getStoredUserInfo } from "@/utils/auth";

export const useUserStore = defineStore("pure-user", {
  state: (): userType => {
    // 登录快照统一从 auth 工具单点读取(不存在时各字段按空值兜底)
    const storedUserInfo = getStoredUserInfo();
    return {
      // 头像
      avatar: storedUserInfo?.avatar ?? "",
      // 用户名
      username: storedUserInfo?.username ?? "",
      // 昵称
      nickname: storedUserInfo?.nickname ?? "",
      // 页面级别权限
      roles: storedUserInfo?.roles ?? [],
      // 按钮级别权限
      permissions: storedUserInfo?.permissions ?? [],
      // 判断登录页面显示哪个组件（0：登录（默认）、1：手机登录、2：二维码登录、3：注册、4：忘记密码）
      currentPage: 0,
      // 是否勾选了登录页的「记住密码」
      isRemembered: false
    };
  },
  actions: {
    /** 存储头像 */
    SET_AVATAR(avatar: string) {
      this.avatar = avatar;
    },
    /** 存储用户名 */
    SET_USERNAME(username: string) {
      this.username = username;
    },
    /** 存储昵称 */
    SET_NICKNAME(nickname: string) {
      this.nickname = nickname;
    },
    /** 存储角色 */
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
    },
    /** 存储按钮级别权限 */
    SET_PERMS(permissions: Array<string>) {
      this.permissions = permissions;
    },
    /** 存储页面显示哪个组件 */
    SET_CURRENTPAGE(value: number) {
      this.currentPage = value;
    },
    /** 存储是否勾选了登录页的「记住密码」 */
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
    },
    /** 登入 */
    async loginByUsername(data: LoginRequest) {
      return new Promise<LoginResult>((resolve, reject) => {
        login(data)
          .then(res => {
            if (res.success) {
              setToken(res.data);
              resolve(res);
            } else {
              reject(res.msg);
            }
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    /** 前端登出（不调用接口） */
    logOut() {
      this.username = "";
      this.roles = [];
      this.permissions = [];
      removeToken();
      // 清空 vue-query 查询缓存:登出后同浏览器换账号时,避免上一账号视角的
      // 查询结果在 staleTime 窗口内被命中展示(缓存命中不发起请求,无 401 兜底);
      // 公共配置(如 sys-config)一并清除,下次进入页面自动重新回源
      queryClient.clear();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    },
    /** 退出系统:先通知后端作废 token(尽力而为,失败不阻塞本地清理),再做前端登出 */
    async logOutWithServer() {
      try {
        await logout();
      } catch {
        /* 后端不可用或 token 已失效时忽略,本地清理不受阻 */
      }
      this.logOut();
    },
    /** 同步当前登录用户信息（来自 getCurrentUser 接口） */
    syncUserInfo(userInfo: {
      avatar?: string;
      username?: string;
      nickname?: string;
      roles?: Array<string>;
      permissions?: Array<string>;
    }) {
      this.SET_AVATAR(userInfo.avatar ?? "");
      this.SET_USERNAME(userInfo.username ?? "");
      this.SET_NICKNAME(userInfo.nickname ?? "");
      this.SET_ROLES(userInfo.roles ?? []);
      this.SET_PERMS(userInfo.permissions ?? []);
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
