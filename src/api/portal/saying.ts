import { http } from "@/utils/http";

/** 一言(GET /portal/saying 免登录;后端已降级,三字段均可为 null,由前端判空决定是否展示) */
export type SayingData = {
  /** 一言文案(随机一言正文,降级时为 uapi-saying 文案;两级上游均不可用时为 null) */
  content: string | null;
  /** 出处(仅随机一言解析成功时返回,降级/失败时为 null) */
  source: string | null;
  /** 作者(仅随机一言解析成功时返回,降级/失败时为 null) */
  author: string | null;
};

/** 查询一言(GET /portal/saying,免登录;content 为空时由前端不展示) */
export const getPortalSaying = () => {
  return http.request<SayingData>("get", "/portal/saying");
};
