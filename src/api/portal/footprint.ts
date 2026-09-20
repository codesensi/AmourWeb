import type { ApiResult } from "@/api/types";
import { http } from "@/utils/http";
import { portalPage } from "./utils";

/** 足迹-足迹项(GET /portal/footprint/page 分页,免登录;按到访日期升序) */
export type FootprintItem = {
  id: string;
  /** 城市/地点名称 */
  city: string;
  /** 精确地点名称(地图选点搜索选中的地点,或手动录入;可空) */
  placeName: string | null;
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

/** 足迹分页(GET /portal/footprint/page,免登录;按到访日期升序,时间轴依旅程推进) */
export const getFootprintList = portalPage<FootprintItem>("/portal/footprint/page");

/** 足迹地图全量点集(GET /portal/footprint/list/map-points,免登录;按到访日期升序,后端防御性上限 1000) */
export const getFootprintMapPoints = () =>
  http.request<ApiResult<FootprintItem[]>>(
    "get",
    "/portal/footprint/list/map-points"
  );
