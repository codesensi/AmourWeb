import { portalPage } from "./utils";
import type { PageQuery, PageResult } from "@/api/types";
import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";

/** 纪念日类型编码(字典 anniversary-type,与后端 AnniversaryTypeEnum 编码对齐) */
export type AnniversaryType = "birthday" | "anniversary" | "festival";

/** 纪念日-纪念日项(GET /portal/anniversary/page 分页,免登录;按下一次发生日升序) */
export type AnniversaryItem = {
  id: number;
  /** 纪念日名称 */
  name: string;
  /** 纪念日类型(字典 anniversary-type) */
  type: AnniversaryType;
  /** 纪念日日期(每年重复时仅取月/日) */
  anniversaryDate: string;
  /** 是否每年重复 */
  repeatYearly: boolean;
};

/** 纪念日分页(GET /portal/anniversary/page,免登录;按下一次发生日升序,首条即最近纪念日) */
export const getAnniversaryList = portalPage<AnniversaryItem>(
  "/portal/anniversary/page"
);

/** 下一次发生的纪念日(GET /portal/anniversary/next,免登录;
 * 按下一次发生日排序取首条,即首页「下一个纪念日」卡片;无数据时为 null) */
export const getAnniversaryNext = () =>
  http.request<AnniversaryItem | null>("get", "/portal/anniversary/next");

/** 分页查询参数(供门户分页工厂的调用侧透传;此处保留类型引用以便扩展) */
export type { PageQuery, PageResult };
