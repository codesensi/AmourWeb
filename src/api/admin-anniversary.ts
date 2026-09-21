import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { PageQuery, PageResult } from "@/api/types";

/** 纪念日类型编码(字典 anniversary-type,与后端 AnniversaryTypeEnum 编码对齐) */
export type AnniversaryType = "birthday" | "anniversary" | "festival";

/** 纪念日管理-行数据(分页;完整字段) */
export interface AnniversaryPageItem {
  /** 主键ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 纪念日名称 */
  name: string;
  /** 纪念日类型(字典 anniversary-type 编码) */
  type: string;
  /** 纪念日日期(格式:yyyy-MM-dd;每年重复时仅月/日生效) */
  anniversaryDate: string;
  /** 是否每年重复 */
  repeatYearly: boolean;
  /** 排序(数字越小越靠前) */
  sort: number;
  /** 显隐标识: 0-显示, 1-隐藏 */
  hidden: number;
  /** 创建时间(yyyy-MM-dd HH:mm:ss) */
  createTime?: string;
}

/** 纪念日分页查询参数 */
export type AnniversaryQuery = PageQuery & {
  /** 纪念日名称(模糊匹配) */
  name?: string;
  /** 显隐标识: 0-显示, 1-隐藏 */
  hidden?: number;
};

/** 纪念日分页查询(GET /admin/anniversary/page;登录态) */
export const getAnniversaryPage = (params?: AnniversaryQuery) => {
  return http.request<PageResult<AnniversaryPageItem>>(
    "get",
    "/admin/anniversary/page",
    { params: omitEmpty(params) }
  );
};

/** 纪念日新增/修改参数(修改时 id 必填;显隐仅新增传入,修改走 change-hidden) */
export type AnniversarySave = {
  id?: string;
  name: string;
  /** 纪念日类型(字典 anniversary-type 编码) */
  type: string;
  /** 纪念日日期(yyyy-MM-dd) */
  anniversaryDate: string;
  /** 是否每年重复 */
  repeatYearly: boolean;
  /** 排序(数字越小越靠前) */
  sort?: number;
  /** 显隐标识: 0-显示, 1-隐藏(仅新增传入) */
  hidden?: number;
};

/** 新增纪念日(POST /admin/anniversary/insert) */
export const insertAnniversary = (data: AnniversarySave) => {
  return http.request<null>("post", "/admin/anniversary/insert", {
    data
  });
};

/** 修改纪念日(PUT /admin/anniversary/update;按 id 覆盖全部可编辑字段) */
export const updateAnniversary = (data: AnniversarySave) => {
  return http.request<null>("put", "/admin/anniversary/update", {
    data
  });
};

/** 修改纪念日显隐(PUT /admin/anniversary/change-hidden;显隐独立端点) */
export const changeAnniversaryHidden = (id: string, hidden: number) => {
  return http.request<null>("put", "/admin/anniversary/change-hidden", {
    data: { id, hidden }
  });
};

/** 批量逻辑删除纪念日(DELETE /admin/anniversary/delete/{ids};单条传 id,批量逗号拼接) */
export const deleteAnniversary = (ids: string) => {
  return http.request<null>(
    "delete",
    `/admin/anniversary/delete/${ids}`
  );
};
