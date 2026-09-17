import type { ApiResult } from "@/api/types";
import { http } from "@/utils/http";
import { portalPage } from "./utils";

/** 留言-留言项 */
export type MessageItem = {
  qq: string;
  nickname: string;
  avatar: string;
  content: string;
  date: string;
  location: string;
};

/** 留言分页(GET /portal/message) */
export const getMessage = portalPage<MessageItem>("/portal/message");

/** 提交留言(POST /portal/message,字段 {qq, name, text}) */
export const sendMessage = (data: {
  qq: string;
  name: string;
  text: string;
}) => {
  return http.request<ApiResult<null>>("post", "/portal/message", { data });
};
