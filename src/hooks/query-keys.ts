/**
 * 门户资源查询 key 注册表 —— 缓存与失效的统一粒度来源。
 * <p>
 * 每个资源声明唯一的 queryKey 与新鲜度(staleTime,毫秒):
 * - staleTime 内再次进入页面直接复用缓存,不发请求;
 * - 过期后(KeepAlive 激活或失效标记)由查询层自动静默重拉;
 * - `Infinity` 表示缓存后永不重拉(如纪念日列表,倒计时由前端本地时钟驱动)。
 * 写操作后通过 `queryClient.invalidateQueries({ queryKey })` 使对应资源失效,
 * 管理端建设 CRUD 后沿用同一机制打通两端数据一致性。
 */
import type { QueryKey } from "@tanstack/vue-query";

/** 门户资源描述:key 缓存粒度 + 新鲜度;数据形状由查询层的 fetcher 决定,不参与泛型推断 */
export interface PortalResource {
  key: QueryKey;
  /** 新鲜度窗口(毫秒);缺省时使用 QueryClient 全局默认值 */
  staleTime?: number;
}

export const queryKeys = {
  /** 情侣头像(封面) */
  heroes: (): PortalResource => ({
    key: ["heroes"],
    staleTime: 60_000
  }),
  /** 足迹分页(到访城市,按到访日期升序) */
  footprint: () =>
    ({ key: ["footprint"], staleTime: 5 * 60_000 }) as PortalResource,
  /** 足迹地图全量点(首页卡片,单一大页一次拉取;数据形状与足迹分页不同,必须独立 key) */
  footprintMap: () =>
    ({ key: ["footprint", "map"], staleTime: 5 * 60_000 }) as PortalResource,
  /** 纪念日分页(按下一次发生日升序;倒计时由前端本地时钟驱动) */
  anniversaryList: () =>
    ({ key: ["anniversary"], staleTime: Infinity }) as PortalResource,
  /** 最近纪念日(首页封面焦点,取首条;数据形状与纪念日分页不同,必须独立 key) */
  anniversaryFocus: () =>
    ({ key: ["anniversary", "focus"], staleTime: Infinity }) as PortalResource,
  /** 点滴文章分页 */
  moments: () => ({ key: ["moments"], staleTime: 30_000 }) as PortalResource,
  /** 点滴文章详情(按 id 参数化) */
  moment: (id: number) =>
    ({ key: ["moment", id], staleTime: 30_000 }) as PortalResource,
  /** 恋爱日记分页 */
  diary: () => ({ key: ["diary"], staleTime: 60_000 }) as PortalResource,
  /** 恋爱画册分页 */
  lovePhoto: () =>
    ({ key: ["love-photo"], staleTime: 5 * 60_000 }) as PortalResource,
  /** 恋爱清单分页 */
  loveList: () =>
    ({ key: ["love-list"], staleTime: 5 * 60_000 }) as PortalResource,
  /** 留言板分页(访客可写,每次激活都校验) */
  message: () => ({ key: ["message"], staleTime: 0 }) as PortalResource,
  /** 时间胶囊分页 */
  timeCapsule: () =>
    ({ key: ["time-capsule"], staleTime: 60_000 }) as PortalResource,
  /** 画册最新一张(首页封面卡,独立于画册分页缓存) */
  latestPhoto: () =>
    ({ key: ["love-photo", "latest"], staleTime: 60_000 }) as PortalResource,
  /** 字典分组(key 携带编码,同编码多组件共享缓存;staleTime=Infinity 常驻,管理侧改动后失效重拉) */
  dict: (code: string) =>
    ({ key: ["dict", code], staleTime: Infinity }) as PortalResource,
  /** 站点公共配置(全键单次拉取;门户布局/登录页/站点标题经 fetchSysConfig 共享同一缓存,staleTime=Infinity 常驻) */
  sysConfig: () =>
    ({ key: ["sys-config"], staleTime: Infinity }) as PortalResource
};
