import { http } from "@/utils/http";

/** 访问统计-累计(GET /portal/visit/total) */
export type VisitTotal = {
  /** 累计浏览量(PV) */
  pv: number;
  /** 累计独立访客数(UV) */
  uv: number;
};

/** 查询累计访问统计(GET /portal/visit/total;页脚「已被阅读 N 次」) */
export const getVisitTotal = () => {
  return http.request<VisitTotal>("get", "/portal/visit/total");
};
