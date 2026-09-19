import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { ApiResult, PageQuery, PageResult } from "@/api/types";

/** 足迹管理-行数据(分页;完整字段) */
export interface FootprintPageItem {
  /** 主键ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 城市/地点名称 */
  city: string;
  /** 精确地点名称(可空) */
  placeName?: string | null;
  /** 经度(GCJ-02;可空) */
  longitude?: number | null;
  /** 纬度(可空) */
  latitude?: number | null;
  /** 到访日期(格式:yyyy-MM-dd) */
  arrivalDate?: string | null;
  /** 关联照片地址(站内 /file/view/{id} 或外链;无照片为 null) */
  photoUrl?: string | null;
  /** 备注 */
  remark?: string | null;
  /** 创建时间(yyyy-MM-dd HH:mm:ss) */
  createTime?: string;
}

/** 足迹分页查询参数 */
export type FootprintQuery = PageQuery & {
  /** 城市/地点名称(模糊匹配) */
  city?: string;
  /** 到访日期范围起点(含;yyyy-MM-dd) */
  arrivalDateBegin?: string;
  /** 到访日期范围终点(含;yyyy-MM-dd) */
  arrivalDateEnd?: string;
};

/** 足迹分页查询(GET /admin/footprint/page;登录态) */
export const getFootprintPage = (params?: FootprintQuery) => {
  return http.request<ApiResult<PageResult<FootprintPageItem>>>(
    "get",
    "/admin/footprint/page",
    { params: omitEmpty(params) }
  );
};

/** 足迹新增/修改参数(修改时 id 必填;经纬度由地图选点或手动录入;照片以 URL 直存) */
export type FootprintSave = {
  id?: string;
  city: string;
  /** 精确地点名称(地图选点搜索选中的地点,或手动录入;可空) */
  placeName?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  /** 到访日期(yyyy-MM-dd;可空) */
  arrivalDate?: string | null;
  /** 关联照片地址(上传组件返回的 /file/view/{id} 或外链;可空) */
  photoUrl?: string | null;
  remark?: string;
};

/** 新增足迹(POST /admin/footprint/insert) */
export const insertFootprint = (data: FootprintSave) => {
  return http.request<ApiResult<null>>("post", "/admin/footprint/insert", {
    data
  });
};

/** 修改足迹(PUT /admin/footprint/update;按 id 覆盖全部可编辑字段) */
export const updateFootprint = (data: FootprintSave) => {
  return http.request<ApiResult<null>>("put", "/admin/footprint/update", {
    data
  });
};

/** 批量逻辑删除足迹(DELETE /admin/footprint/delete/{ids};单条传 id,批量逗号拼接) */
export const deleteFootprint = (ids: string) => {
  return http.request<ApiResult<null>>(
    "delete",
    `/admin/footprint/delete/${ids}`
  );
};
