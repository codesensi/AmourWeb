import type { ApiResult } from "@/api/types";
import { http } from "@/utils/http";

/** 纪念日-纪念日项(GET /portal/anniversary,免登录全量列表) */
export type AnniversaryItem = {
  id: number;
  /** 纪念日名称 */
  name: string;
  /** 纪念日类型: 1-生日, 2-纪念日, 3-节日 */
  type: 1 | 2 | 3;
  /** 纪念日日期(每年重复时仅取月/日) */
  anniversaryDate: string;
  /** 是否每年重复 */
  repeatYearly: boolean;
};

/** 纪念日全量列表(GET /portal/anniversary;倒计时需全量排序,不分页) */
export const getAnniversaryList = () => {
  return http.request<ApiResult<AnniversaryItem[]>>(
    "get",
    "/portal/anniversary"
  );
};
