import type { ApiResult } from "@/api/types";
import { http } from "@/utils/http";
import { portalPage } from "./utils";

/** 点点滴滴-文章项 */
export type MomentsItem = {
  /**
   * 文章 ID。当前为 mock 自增数字(后端 /portal/moments 尚未落地);
   * 管理端主键经后端序列化为 string(JS Number 精度丢失防护),后端实现该接口时需对齐
   */
  id: number;
  title: string;
  /** 富文本正文(HTML 片段;mock 为本地静态内容,后端落地后渲染前建议过 DOMPurify 净化) */
  content: string;
  author: string;
  date: string;
};

/** 点点滴滴-文章分页(GET /portal/moments,每页 6 条) */
export const getMoments = portalPage<MomentsItem>("/portal/moments");

/** 点点滴滴-文章详情(GET /portal/moments/detail,免登录;未命中返回 data null) */
export const getMoment = (id: number) =>
  http.request<ApiResult<MomentsItem>>("get", "/portal/moments/detail", {
    params: { id }
  });
