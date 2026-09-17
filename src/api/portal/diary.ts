import { portalPage } from "./utils";

/** 情侣日记-日记项(GET /portal/diary 分页) */
export type DiaryItem = {
  id: number;
  /** 记录人 ID(双人日记按人分栏) */
  userId: number;
  /** 记录人昵称(展示用) */
  nickname: string;
  /** 记录人头像(空则前端兜底图) */
  avatar: string;
  /** 记录日期(yyyy-MM-dd) */
  diaryDate: string;
  /** 心情标识(sunny/rainy/starry 等枚举,空则不展示) */
  mood: string | null;
  /** 日记内容 */
  content: string;
};

/** 情侣日记分页(GET /portal/diary,每页 6 篇) */
export const getDiary = portalPage<DiaryItem>("/portal/diary");
