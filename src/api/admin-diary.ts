import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { PageQuery, PageResult } from "@/api/types";

/** 情侣日记管理-行数据(分页;完整字段) */
export interface DiaryPageItem {
  /** 主键ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 记录人ID */
  userId: number;
  /** 记录人用户名(服务层批量回填) */
  username: string;
  /** 记录人头像(服务层批量回填;空则前端兜底图) */
  avatar: string;
  /** 记录日期(yyyy-MM-dd) */
  diaryDate: string;
  /** 心情标识(sunny/rainy/starry;空为未标记) */
  mood: string;
  /** 日记内容 */
  content: string;
  /** 创建时间(yyyy-MM-dd HH:mm:ss) */
  createTime?: string;
  /** 创建人用户名(服务层批量回填) */
  creatorName?: string;
}

/** 情侣日记分页查询参数 */
export type DiaryQuery = PageQuery & {
  /** 记录人ID(精确匹配) */
  userId?: number;
  /** 记录日期(yyyy-MM-dd;精确匹配) */
  diaryDate?: string;
  /** 心情标识(精确匹配) */
  mood?: string;
};

/** 情侣日记新增/修改参数(记录人由后端取当前登录人填充,不接收 userId) */
export type DiarySave = {
  id?: string;
  /** 记录日期(yyyy-MM-dd) */
  diaryDate: string;
  /** 心情标识(unknown-不标记,与 DiaryMoodEnum 对齐) */
  mood?: string;
  content: string;
};

/** 情侣日记分页查询(GET /admin/diary/page;登录态) */
export const getDiaryPage = (params?: DiaryQuery) => {
  return http.request<PageResult<DiaryPageItem>>("get", "/admin/diary/page", {
    params: omitEmpty(params)
  });
};

/** 新增情侣日记(POST /admin/diary/insert;记录人取当前登录人) */
export const insertDiary = (data: DiarySave) => {
  return http.request<null>("post", "/admin/diary/insert", {
    data
  });
};

/** 修改情侣日记(PUT /admin/diary/update;按 id 覆盖可编辑字段,记录人归属不可变) */
export const updateDiary = (data: DiarySave) => {
  return http.request<null>("put", "/admin/diary/update", {
    data
  });
};

/** 批量逻辑删除情侣日记(DELETE /admin/diary/delete/{ids};单条传 id,批量逗号拼接) */
export const deleteDiary = (ids: string) => {
  return http.request<null>("delete", `/admin/diary/delete/${ids}`);
};
