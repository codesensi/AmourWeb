import { http } from "@/utils/http";
import type { PageResult } from "@/api/types";

/** 下一个纪念日(节选自门户口径的最近一条) */
export interface DashboardNextAnniversary {
  /** 主键ID(后端序列化为字符串) */
  id: string;
  /** 纪念日名称 */
  name: string;
  /** 纪念日类型(字典 anniversary-type 编码) */
  type: string;
  /** 纪念日日期(格式:yyyy-MM-dd;每年重复时仅月/日生效) */
  anniversaryDate: string;
  /** 是否每年重复 */
  repeatYearly: boolean;
}

/** 各模块条目计数 */
export interface DashboardModuleCounts {
  /** 纪念日条数 */
  anniversaries: number;
  /** 点点滴滴文章数 */
  moments: number;
  /** 恋爱画册照片数 */
  photos: number;
  /** 留言簿留言数 */
  messages: number;
  /** 情侣日志篇数 */
  diaries: number;
  /** 时间胶囊数 */
  timeCapsules: number;
  /** 足迹条数 */
  footprints: number;
}

/** 恋爱清单进度 */
export interface DashboardLoveListProgress {
  /** 清单总条数 */
  total: number;
  /** 已完成数 */
  done: number;
}

/** 最新留言 */
export interface DashboardLatestMessage {
  /** 访客昵称 */
  nickname: string;
  /** 留言内容 */
  content: string;
  /** 留言时间(yyyy-MM-dd HH:mm:ss) */
  createTime: string;
}

/** 首页数据聚合(各字段均可为 null,按空状态渲染) */
export interface DashboardSummary {
  /** 在一起天数(最早一条每年重复纪念日的间隔天数) */
  togetherDays: number | null;
  /** 下一个纪念日(无纪念日时为 null) */
  nextAnniversary: DashboardNextAnniversary | null;
  /** 各模块条目计数 */
  counts: DashboardModuleCounts;
  /** 恋爱清单进度 */
  loveListProgress: DashboardLoveListProgress | null;
  /** 最新一条留言(无留言时为 null) */
  latestMessage: DashboardLatestMessage | null;
  /** 足迹到访城市数(去重,仅显示状态) */
  footprintsCityCount: number | null;
  /** 恋爱画册最近照片地址(最多 9 张;无照片时为 null) */
  recentPhotos: string[] | null;
  /** 待审核留言数 */
  pendingMessages: number | null;
}

/** 时间线条目类型(与来源表对应) */
export type DashboardTimelineItemType = "photos" | "moments" | "diary";

/** 最近回忆时间线条目 */
export interface DashboardTimelineItem {
  /** 条目类型 */
  type: DashboardTimelineItemType;
  /** 时间(yyyy-MM-dd HH:mm:ss) */
  time: string;
  /** 标题 */
  title: string;
  /** 内容摘要(照片类型为 null) */
  content: string | null;
  /** 照片地址(仅画册条目有) */
  imageUrl: string | null;
}

/** 首页数据聚合(GET /admin/dashboard/summary;登录态) */
export const getDashboardSummary = () => {
  return http.request<DashboardSummary>("get", "/admin/dashboard/summary");
};

/** 最近回忆时间线(GET /admin/dashboard/timeline;登录态,固定返回最新条数) */
export const getDashboardTimeline = () => {
  return http.request<PageResult<DashboardTimelineItem>>(
    "get",
    "/admin/dashboard/timeline"
  );
};

/** 访问趋势条目(日期区间逐日补齐,无访问的日期计 0) */
export interface DashboardVisitTrendItem {
  /** 统计日期(yyyy-MM-dd) */
  statDate: string;
  /** 当日访问量(PV) */
  pv: number;
  /** 当日独立访客数(UV) */
  uv: number;
}

/** 留言地区分布条目(审核通过口径,无法识别归并为「未知」) */
export interface DashboardMessageRegion {
  /** IP 归属地 */
  region: string;
  /** 留言条数 */
  count: number;
}

/** 年度恋爱回顾(各字段均可为 null,按空状态渲染) */
export interface AnnualReview {
  /** 统计年份 */
  year: number;
  /** 当年情侣日志篇数 */
  diaryCount: number;
  /** 当年点点滴滴文章数 */
  momentsCount: number;
  /** 当年恋爱画册照片数 */
  photoCount: number;
  /** 当年足迹到访次数 */
  footprintCount: number;
  /** 当年首次到访的城市 */
  newCities: string[] | null;
  /** 出现次数最多的心情标识(sunny/rainy/starry 等;当年无日志时为 null) */
  topMood: string | null;
  /** 恋爱清单完成数(当前累计值) */
  loveListDone: number | null;
  /** 恋爱清单总条数(当前累计值) */
  loveListTotal: number | null;
  /** 当年访问量合计(PV) */
  pv: number | null;
  /** 当年独立访客数合计(UV) */
  uv: number | null;
  /** 当年精选回忆(最多 6 条) */
  highlights: DashboardTimelineItem[] | null;
}

/** 访问趋势(GET /admin/dashboard/visit-trend;登录态,按日期升序逐日补齐) */
export const getDashboardVisitTrend = (days = 30) => {
  return http.request<DashboardVisitTrendItem[]>(
    "get",
    "/admin/dashboard/visit-trend",
    { params: { days } }
  );
};

/** 留言地区分布(GET /admin/dashboard/message-region;审核通过口径,按条数降序) */
export const getDashboardMessageRegion = (top = 10) => {
  return http.request<DashboardMessageRegion[]>(
    "get",
    "/admin/dashboard/message-region",
    { params: { top } }
  );
};

/** 年度恋爱回顾(GET /admin/dashboard/annual-review/{year};登录态) */
export const getAnnualReview = (year: number) => {
  return http.request<AnnualReview>(
    "get",
    `/admin/dashboard/annual-review/${year}`
  );
};
