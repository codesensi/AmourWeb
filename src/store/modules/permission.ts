import { defineStore } from "pinia";
import { type RouteRecordName, type RouteRecordRaw } from "vue-router";
import { type menuType } from "@/layout/types";
import {
  type cacheType,
  store,
  ascending,
  getKeyList,
  filterTree,
  constantMenus,
  filterNoPermissionTree,
  formatFlatteningRoutes
} from "../utils";
import { useMultiTagsStoreHook } from "./multi-tags";

export const usePermissionStore = defineStore("pure-permission", {
  state: () => ({
    // 静态路由生成的菜单
    constantMenus,
    // 整体路由生成的菜单（静态、动态）
    wholeMenus: [] as menuType[],
    // 整体路由（一维数组格式）
    flatteningRoutes: [] as RouteRecordRaw[],
    // 缓存页面keepAlive
    cachePageList: [] as RouteRecordName[],
    // 动态路由装配标记:initRouter 完成（成功或失败）后置位；
    // 守卫据此区分"尚未装配"与"装配完成但无菜单",防止空菜单用户在导航中反复装配
    dynamicRoutesLoaded: false
  }),
  actions: {
    /** 标记动态路由装配完成（无论成功与否,由 initRouter 的 settled 时机调用） */
    markDynamicRoutesLoaded() {
      this.dynamicRoutesLoaded = true;
    },
    /** 组装整体路由生成的菜单 */
    handleWholeMenus(routes: any[]) {
      this.wholeMenus = filterNoPermissionTree(
        filterTree(ascending(this.constantMenus.concat(routes)))
      );
      this.flatteningRoutes = formatFlatteningRoutes(
        this.constantMenus.concat(routes) as any
      );
    },
    /** 监听缓存页面是否存在于标签页，不存在则删除 */
    clearCache() {
      let cacheLength = this.cachePageList.length;
      const nameList = getKeyList(useMultiTagsStoreHook().multiTags, "name");
      while (cacheLength > 0) {
        nameList.findIndex(v => v === this.cachePageList[cacheLength - 1]) ===
          -1 &&
          this.cachePageList.splice(
            this.cachePageList.indexOf(this.cachePageList[cacheLength - 1]),
            1
          );
        cacheLength--;
      }
    },
    cacheOperate({ mode, name }: cacheType) {
      const delIndex = this.cachePageList.findIndex(v => v === name);
      switch (mode) {
        case "refresh":
          this.cachePageList = this.cachePageList.filter(v => v !== name);
          this.clearCache();
          break;
        case "add":
          this.cachePageList.push(name!);
          break;
        case "delete":
          delIndex !== -1 && this.cachePageList.splice(delIndex, 1);
          this.clearCache();
          break;
      }
    },
    /** 清空缓存页面 */
    clearAllCachePage() {
      this.wholeMenus = [];
      this.cachePageList = [];
      // 退出登录重置路由后允许重新装配动态路由
      this.dynamicRoutesLoaded = false;
    }
  }
});

export function usePermissionStoreHook() {
  return usePermissionStore(store);
}
