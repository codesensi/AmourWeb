import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

/** 缓存命中统计(对齐后端 CacheStatsResponse;自缓存实例创建/应用启动起累计) */
export type CacheStatsItem = {
  /** 读取命中次数 */
  hitCount: number;
  /** 读取未命中次数 */
  missCount: number;
  /** 命中率(0~1) */
  hitRate: number;
  /** 驱逐次数(容量驱逐与过期驱逐合计) */
  evictionCount: number;
  /** 回源加载成功次数 */
  loadSuccessCount: number;
  /** 回源加载失败次数 */
  loadFailureCount: number;
  /** 平均回源加载耗时(毫秒) */
  averageLoadPenaltyMillis: number;
};

/** 缓存条目(对齐后端 CacheEntryResponse) */
export type CacheEntryItem = {
  /** 缓存键 */
  key: string;
  /** 缓存值(null 表示该键缓存的是"数据不存在"的空值哨兵占位) */
  value: unknown;
  /** 剩余过期时间(秒);null 表示驻留不过期 */
  remainExpire?: number | null;
};

/** 缓存信息(对齐后端 CacheResponse) */
export type CacheInfo = {
  /** 缓存名(含「项目名_运行环境」前缀,如 amour_dev_config) */
  cacheName: string;
  /** 写入后过期时间(秒);null 表示不限制 */
  expireAfterWrite?: number | null;
  /** 访问后过期时间(秒);null 表示不限制 */
  expireAfterAccess?: number | null;
  /** 最大容量(条数) */
  maximumSize?: number | null;
  /** 缓存条目列表 */
  entries: Array<CacheEntryItem>;
  /** 命中统计 */
  stats?: CacheStatsItem;
};

/** 缓存内容列表(GET /cache/list-all,时点快照) */
export const getCacheList = () => {
  return http.request<ApiResult<Array<CacheInfo>>>("get", "/cache/list-all");
};
