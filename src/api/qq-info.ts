import { http } from "@/utils/http";

/** QQ 信息(GET /qq-info 免登录;后端已降级,头像恒非空,仅后端 qq-avatar 未配置时为空) */
export type QqInfoData = {
  /** QQ 头像地址(qq-api 解析的真实图片地址,强制 https;降级时为 qq-avatar 按 QQ 号拼接地址) */
  avatarUrl: string;
  /** QQ 昵称(仅 qq-api 解析成功时返回,降级时后端输出 null) */
  nickname: string | null;
};

/** 查询 QQ 信息(GET /qq-info,免登录;昵称可能为空,由前端提示手动填写) */
export const getQqInfo = (qq: string) => {
  return http.request<QqInfoData>("get", "/qq-info", {
    params: { qq }
  });
};
