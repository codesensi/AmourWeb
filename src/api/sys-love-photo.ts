import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { ApiResult, PageQuery, PageResult } from "@/api/types";

/** 恋爱画册管理-行数据(分页;完整字段) */
export interface LovePhotoPageItem {
  /** 主键ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 照片地址 */
  url: string;
  /** 照片文案 */
  caption?: string;
  /** 照片日期(格式:yyyy-MM-dd) */
  dateText?: string;
  /** 照片标签(后端逗号分隔存储原样下发) */
  tags?: string;
  /** 排序(数字越小越靠前) */
  sort: number;
  /** 显隐标识: 0-显示, 1-隐藏 */
  hidden: number;
  /** 创建时间(yyyy-MM-dd HH:mm:ss) */
  createTime?: string;
}

/** 恋爱画册分页查询参数 */
export type LovePhotoQuery = PageQuery & {
  /** 照片文案(模糊匹配) */
  caption?: string;
  /** 照片标签(逗号集合内精确匹配) */
  tag?: string;
  /** 显隐标识: 0-显示, 1-隐藏 */
  hidden?: number;
};

/** 恋爱画册分页查询(GET /sys/love-photo/page;登录态) */
export const getLovePhotoPage = (params?: LovePhotoQuery) => {
  return http.request<ApiResult<PageResult<LovePhotoPageItem>>>(
    "get",
    "/sys/love-photo/page",
    { params: omitEmpty(params) }
  );
};

/** 恋爱画册照片新增/修改参数(修改时 id 必填;标签集合由后端规范化为逗号分隔存储;显隐仅新增传入,修改走 change-hidden) */
export type LovePhotoSave = {
  id?: string;
  url: string;
  caption?: string;
  dateText?: string;
  tags?: Array<string>;
  sort: number;
  /** 显隐标识: 0-显示, 1-隐藏 */
  hidden?: number;
};

/** 新增照片(POST /sys/love-photo/insert) */
export const insertLovePhoto = (data: LovePhotoSave) => {
  return http.request<ApiResult<null>>("post", "/sys/love-photo/insert", {
    data
  });
};

/** 修改照片(PUT /sys/love-photo/update;按 id 覆盖全部可编辑字段) */
export const updateLovePhoto = (data: LovePhotoSave) => {
  return http.request<ApiResult<null>>("put", "/sys/love-photo/update", {
    data
  });
};

/** 修改照片显隐(PUT /sys/love-photo/change-hidden;显隐独立端点) */
export const changeLovePhotoHidden = (id: string, hidden: number) => {
  return http.request<ApiResult<null>>("put", "/sys/love-photo/change-hidden", {
    data: { id, hidden }
  });
};

/** 批量逻辑删除照片(DELETE /sys/love-photo/delete/{ids};单条传 id,批量逗号拼接) */
export const deleteLovePhoto = (ids: string) => {
  return http.request<ApiResult<null>>(
    "delete",
    `/sys/love-photo/delete/${ids}`
  );
};
