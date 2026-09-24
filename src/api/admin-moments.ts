import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { PageQuery, PageResult } from "@/api/types";

/** 点点滴滴管理-行数据(分页;完整字段) */
export interface MomentsPageItem {
  /** 主键ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 文章标题 */
  title: string;
  /** 作者ID(后端序列化为字符串,避免 JS 精度丢失) */
  userId: string;
  /** 作者用户名(服务层批量回填) */
  username: string;
  /** 文章内容(富文本 HTML) */
  content: string;
  /** 记录日期(yyyy-MM-dd) */
  recordDate: string;
  /** 排序(数字越小越靠前) */
  sort: number;
  /** 文章分类(自由文本) */
  category?: string;
  /** 文章标签(逗号分隔,自由文本) */
  tags?: string;
  /** 状态(0-显示,1-隐藏) */
  status: number;
  /** 创建时间(yyyy-MM-dd HH:mm:ss) */
  createTime?: string;
  /** 创建人用户名(服务层批量回填) */
  creatorName?: string;
}

/** 点点滴滴分页查询参数 */
export type MomentsQuery = PageQuery & {
  /** 文章标题(模糊匹配) */
  title?: string;
  /** 文章分类(精确匹配) */
  category?: string;
  /** 状态(精确匹配) */
  status?: number;
};

/** 点点滴滴新增/修改公共参数(作者由后端取当前登录人填充,不接收 userId) */
export type MomentsSave = {
  id?: string;
  /** 文章标题 */
  title: string;
  /** 记录日期(yyyy-MM-dd) */
  recordDate: string;
  /** 文章内容(富文本 HTML) */
  content: string;
  /** 文章分类(自由输入) */
  category?: string;
  /** 文章标签(逗号分隔,自由输入) */
  tags?: string;
  /** 排序(数字越小越靠前) */
  sort?: number;
  /** 状态(0-显示,1-隐藏) */
  status?: number;
};

/** 点点滴滴新增参数(状态仅新增时随表单传入) */
export type MomentsInsert = MomentsSave & {
  /** 状态(0-显示,1-隐藏) */
  status: number;
};

/** 点点滴滴修改参数(状态不经本接口维护,单独走 change-status 端点) */
export type MomentsUpdate = Omit<MomentsSave, "status" | "id"> & {
  /** 主键ID */
  id: string;
};

/** 历史分类/标签建议(表单自动补全) */
export type MomentsHistory = {
  categories: string[];
  tags: string[];
};

/** 点点滴滴分页查询(GET /admin/moments/page;登录态) */
export const getMomentsPage = (params?: MomentsQuery) => {
  return http.request<PageResult<MomentsPageItem>>(
    "get",
    "/admin/moments/page",
    {
      params: omitEmpty(params)
    }
  );
};

/** 历史分类/标签建议(GET /admin/moments/history;登录态) */
export const getMomentsHistory = () => {
  return http.request<MomentsHistory>("get", "/admin/moments/history");
};

/** 新增点点滴滴文章(POST /admin/moments/insert;作者取当前登录人) */
export const insertMoments = (data: MomentsInsert) => {
  return http.request<null>("post", "/admin/moments/insert", {
    data
  });
};

/** 修改点点滴滴文章(PUT /admin/moments/update;按 id 覆盖可编辑字段,作者归属不可变) */
export const updateMoments = (data: MomentsUpdate) => {
  return http.request<null>("put", "/admin/moments/update", {
    data
  });
};

/** 修改文章状态(PUT /admin/moments/change-status;显隐独立端点) */
export const changeMomentsStatus = (id: string, status: number) => {
  return http.request<null>("put", "/admin/moments/change-status", {
    data: { id, status }
  });
};

/** 批量逻辑删除点点滴滴文章(DELETE /admin/moments/delete/{ids};单条传 id,批量逗号拼接) */
export const deleteMoments = (ids: string) => {
  return http.request<null>("delete", `/admin/moments/delete/${ids}`);
};
