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
  /** 留言时间(yyyy-MM-dd HH:mm) */
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
}

/** 时间线条目类型(与来源表对应) */
export type DashboardTimelineItemType = "photos" | "moments" | "diary";

/** 最近回忆时间线条目 */
export interface DashboardTimelineItem {
  /** 条目类型 */
  type: DashboardTimelineItemType;
  /** 时间(yyyy-MM-dd HH:mm) */
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
