import type { ApiResult } from "@/api/types";
import { http } from "@/utils/http";

/** 足迹-足迹项(GET /portal/footprint,免登录全量列表) */
export type FootprintItem = {
  id: number;
  /** 城市/地点名称 */
  city: string;
  /** 经纬度(地图组件接入后启用;当前时间轴视图仅作展示) */
  longitude: number | null;
  latitude: number | null;
  /** 到访日期(yyyy-MM-dd) */
  arrivalDate: string | null;
  /** 关联照片地址(无照片为 null) */
  photoUrl: string | null;
  /** 备注 */
  remark: string | null;
};

/** 足迹全量列表(GET /portal/footprint;地图/时间轴需全量点位,不分页) */
export const getFootprintList = () => {
  return http.request<ApiResult<FootprintItem[]>>("get", "/portal/footprint");
};
