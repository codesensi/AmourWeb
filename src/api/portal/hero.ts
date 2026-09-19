import type { ApiResult } from "@/api/types";
import { http } from "@/utils/http";

/** 门户主角-单个主角信息(对齐后端 HeroUserResponse) */
export type HeroInfoData = {
  /** 用户昵称(用户未维护时为 null,由前端兜底为空串) */
  nickname: string | null;
  /** 用户名称(昵称为空时的展示兜底;未维护时为 null) */
  username: string | null;
  /** 用户上传头像地址(未维护时为 null,由前端兜底为本地兜底图) */
  avatar: string | null;
  /** 用户QQ号码(未维护时为 null,由前端兜底) */
  qq: string | null;
};

/** 门户主角(GET /portal/hero 免登录;对齐后端 HeroResponse) */
export type HeroData = {
  /** 男主信息(暂无启用的男性主角用户时为 null) */
  male: HeroInfoData | null;
  /** 女主信息(暂无启用的女性主角用户时为 null) */
  female: HeroInfoData | null;
};

/** 查询门户男女主(GET /portal/hero,免登录;字段可能为空,由前端兜底) */
export const getHeroes = () => {
  return http.request<ApiResult<HeroData>>("get", "/portal/hero");
};
