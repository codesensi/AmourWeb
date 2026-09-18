import { portalPage } from "./utils";

/** 纪念日-纪念日项(GET /portal/anniversary 分页,免登录;按下一次发生日升序) */
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

/** 纪念日分页(GET /portal/anniversary,免登录;按下一次发生日升序,首条即最近纪念日) */
export const getAnniversaryList = portalPage<AnniversaryItem>(
  "/portal/anniversary"
);
