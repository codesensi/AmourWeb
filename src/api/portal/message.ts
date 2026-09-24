import { http } from "@/utils/http";
import { portalPage } from "./utils";

/** 留言-留言项(avatar/location 后端均可为 null:头像快照 fail-soft、归属地未知) */
export type MessageItem = {
  nickname: string;
  avatar: string | null;
  content: string;
  date: string;
  location: string | null;
};

/** 留言分页(GET /portal/message,仅审核通过的留言) */
export const getMessage = portalPage<MessageItem>("/portal/message");

/** 提交留言(POST /portal/message,字段 {qq, name, text};头像/IP 由后端采集,落库即待审核) */
export const sendMessage = (data: {
  qq: string;
  name: string;
  text: string;
}) => {
  return http.request<null>("post", "/portal/message", { data });
};
