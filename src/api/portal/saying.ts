import type { ApiResult } from "@/api/types";
import { http } from "@/utils/http";

/** 一言(GET /portal/saying 免登录;后端已降级,content 可能为空) */
export type SayingData = {
  /** 一言文案(随机一言正文,降级时为 uapi-saying 文案;两级上游均不可用时为空) */
  content: string;
  /** 出处(仅随机一言解析成功时返回,降级时为空) */
  source: string;
  /** 作者(仅随机一言解析成功时返回,降级时为空) */
  author: string;
};

/** 查询一言(GET /portal/saying,免登录;content 为空时由前端不展示) */
export const getPortalSaying = () => {
  return http.request<ApiResult<SayingData>>("get", "/portal/saying");
};
