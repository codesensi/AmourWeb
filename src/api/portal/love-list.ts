import { portalPage } from "./utils";

/** 恋爱清单-清单项 */
export type LoveListItem = {
  /** 清单文案 */
  text: string;
  /** 是否已完成 */
  done: boolean;
  /** 可选照片(已完成项可带纪念照) */
  img?: string;
};

/** 恋爱清单分页(GET /portal/love-list,每页 6 条) */
export const getLoveList = portalPage<LoveListItem>("/portal/love-list");
