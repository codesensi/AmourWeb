import { portalPage } from "./utils";

/** 情侣日记-日记项(GET /portal/diary/page 分页) */
export type DiaryItem = {
  /** 主键ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 记录人 ID(双人日记按人分栏) */
  userId: number;
  /** 记录人用户名(展示链路兜底用) */
  username: string;
  /** 记录人昵称(展示链路:QQ 昵称 → 昵称 → 用户名) */
  nickname: string | null;
  /** 记录人 QQ 号(已维护时走 QQ 头像链路) */
  qq: string | null;
  /** 记录人头像(空则前端兜底图) */
  avatar: string;
  /** 记录日期(yyyy-MM-dd) */
  diaryDate: string;
  /** 心情标识(unknown-不标记,与 DiaryMoodEnum 对齐;其余展示为线描图标) */
  mood: string | null;
  /** 日记内容 */
  content: string;
};

/** 情侣日记分页(GET /portal/diary/page,每页 6 篇) */
export const getDiary = portalPage<DiaryItem>("/portal/diary/page");
