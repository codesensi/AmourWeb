import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { PageQuery, PageResult } from "@/api/types";

/** 恋爱清单管理-行数据(分页;完整字段) */
export interface LoveListPageItem {
  /** 主键ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 清单内容 */
  content: string;
  /** 完成状态: 0-未完成, 1-已完成 */
  done: number;
  /** 纪念照地址(完成项可选) */
  photo?: string;
  /** 排序(数字越小越靠前) */
  sort: number;
  /** 显隐标识: 0-显示, 1-隐藏 */
  hidden: number;
  /** 创建时间(yyyy-MM-dd HH:mm:ss) */
  createTime?: string;
}

/** 恋爱清单分页查询参数 */
export type LoveListQuery = PageQuery & {
  /** 清单内容(模糊匹配) */
  content?: string;
  /** 完成状态: 0-未完成, 1-已完成 */
  done?: number;
  /** 显隐标识: 0-显示, 1-隐藏 */
  hidden?: number;
};

/** 恋爱清单新增/修改参数(修改时 id 必填;hidden 显隐仅新增传入,修改走 change-hidden) */
export type LoveListSave = {
  id?: string;
  content: string;
  done: number;
  photo?: string;
  sort: number;
  hidden?: number;
};

/** 恋爱清单分页查询(GET /admin/love-list/page;登录态) */
export const getLoveListPage = (params?: LoveListQuery) => {
  return http.request<PageResult<LoveListPageItem>>(
    "get",
    "/admin/love-list/page",
    {
      params: omitEmpty(params)
    }
  );
};

/** 新增清单项(POST /admin/love-list/insert) */
export const insertLoveList = (data: LoveListSave) => {
  return http.request<null>("post", "/admin/love-list/insert", {
    data
  });
};

/** 修改清单项(PUT /admin/love-list/update;按 id 覆盖全部可编辑字段,显隐除外) */
export const updateLoveList = (data: LoveListSave) => {
  return http.request<null>("put", "/admin/love-list/update", {
    data
  });
};

/** 修改清单项显隐(PUT /admin/love-list/change-hidden;显隐独立端点) */
export const changeLoveListHidden = (id: string, hidden: number) => {
  return http.request<null>("put", "/admin/love-list/change-hidden", {
    data: { id, hidden }
  });
};

/** 批量逻辑删除清单项(DELETE /admin/love-list/delete/{ids};单条传 id,批量逗号拼接) */
export const deleteLoveList = (ids: string) => {
  return http.request<null>("delete", `/admin/love-list/delete/${ids}`);
};
