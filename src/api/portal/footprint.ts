import { portalPage } from "./utils";

/** 足迹-足迹项(GET /portal/footprint 分页,免登录;按到访日期升序) */
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

/** 足迹分页(GET /portal/footprint,免登录;按到访日期升序,时间轴依旅程推进) */
export const getFootprintList = portalPage<FootprintItem>("/portal/footprint");
