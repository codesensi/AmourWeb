import { QueryClient } from "@tanstack/vue-query";

/**
 * 全局唯一 QueryClient 单例。
 * <p>
 * main.ts 经 VueQueryPlugin 注册本实例供组件内 useQuery/usePortalQuery 使用;
 * utils/sys-config 等非组件上下文直接 import 本实例调 fetchQuery,
 * 两类入口共享同一份查询缓存与在途请求(同 key 并发只发一次网络请求)。
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 门户数据以"按钮/激活驱动刷新"为主,关闭自动重试与窗口聚焦重拉,
      // 避免与手写刷新语义冲突;接口不可用一律静默降级为空态/旧值
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 60_000
    }
  }
});
