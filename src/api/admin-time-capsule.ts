import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { PageQuery, PageResult } from "@/api/types";

/** 时间胶囊管理-行数据(分页;完整字段) */
export interface TimeCapsulePageItem {
  /** 主键ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 标题 */
  title: string;
  /** 信件内容 */
  content: string;
  /** 解锁时间(yyyy-MM-dd HH:mm:ss;到点后门户可见全文) */
  openTime: string;
  /** 显隐标识: 0-显示, 1-隐藏 */
  hidden: number;
  /** 创建时间(yyyy-MM-dd HH:mm:ss) */
  createTime?: string;
  /** 创建人用户名(服务层批量回填) */
  creatorName?: string;
}

/** 时间胶囊分页查询参数 */
export type TimeCapsuleQuery = PageQuery & {
  /** 标题(模糊匹配) */
  title?: string;
  /** 显隐标识: 0-显示, 1-隐藏 */
  hidden?: number;
};

/** 时间胶囊新增/修改参数(修改时 id 必填;hidden 显隐仅新增传入,修改走 change-hidden) */
export type TimeCapsuleSave = {
  id?: string;
  title: string;
  content: string;
  /** 解锁时间(yyyy-MM-dd HH:mm:ss;到点后门户可见全文) */
  openTime: string;
  hidden?: number;
};

/** 时间胶囊分页查询(GET /admin/time-capsule/page;登录态) */
export const getTimeCapsulePage = (params?: TimeCapsuleQuery) => {
  return http.request<PageResult<TimeCapsulePageItem>>(
    "get",
    "/admin/time-capsule/page",
    {
      params: omitEmpty(params)
    }
  );
};

/** 新增时间胶囊(POST /admin/time-capsule/insert) */
export const insertTimeCapsule = (data: TimeCapsuleSave) => {
  return http.request<null>("post", "/admin/time-capsule/insert", {
    data
  });
};

/** 修改时间胶囊(PUT /admin/time-capsule/update;按 id 覆盖全部可编辑字段,显隐除外) */
export const updateTimeCapsule = (data: TimeCapsuleSave) => {
  return http.request<null>("put", "/admin/time-capsule/update", {
    data
  });
};

/** 修改时间胶囊显隐(PUT /admin/time-capsule/change-hidden;显隐独立端点) */
export const changeTimeCapsuleHidden = (id: string, hidden: number) => {
  return http.request<null>("put", "/admin/time-capsule/change-hidden", {
    data: { id, hidden }
  });
};

/** 批量逻辑删除时间胶囊(DELETE /admin/time-capsule/delete/{ids};单条传 id,批量逗号拼接) */
export const deleteTimeCapsule = (ids: string) => {
  return http.request<null>("delete", `/admin/time-capsule/delete/${ids}`);
};
