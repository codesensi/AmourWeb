import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

/** 登录请求参数(对齐后端 LoginRequest) */
export interface LoginRequest {
  /** 用户账号 */
  username: string;
  /** 用户密码 */
  password: string;
  /** 验证码唯一标识 */
  captchaKey?: string;
  /** 验证码内容 */
  captchaValue?: string;
}

/** 登录响应(对齐后端 LoginResponse) */
export type LoginResult = ApiResult<{
  /** 访问令牌 */
  accessToken: string;
  /** 访问令牌过期时间（毫秒时间戳） */
  expires: number;
  /** 访问令牌名称 */
  tokenName: string;
  /** 访问令牌前缀 */
  tokenPrefix: string;
}>;

/** 登录 */
export const login = (data: LoginRequest) => {
  return http.request<LoginResult>("post", "/login", { data });
};

/** 退出系统(通知后端作废当前 token) */
export const logout = () => {
  return http.request<ApiResult<null>>("post", "/logout");
};

/** 菜单项(后端扁平 D/M/B 结构) */
export interface MenuItem {
  id: string;
  pid: string;
  title: string;
  type: "D" | "M" | "B";
  path?: string;
  component?: string;
  sort: number;
  icon?: string;
  perms?: string;
  status: number;
  hidden: number;
  builtin: number;
  /** 备注 */
  remark?: string;
  /** 创建时间(yyyy-MM-dd HH:mm:ss,菜单管理列表展示用) */
  createTime?: string;
}

/** 当前登录用户信息(含菜单) */
export type CurrentUserResult = ApiResult<{
  username: string;
  nickname: string;
  avatar: string;
  idCard?: string;
  email?: string;
  phone?: string;
  /** 用户QQ号码(sys_config qq-service 头像解析使用) */
  qq?: string;
  gender?: string;
  remark?: string;
  builtin?: number;
  roles: Array<string>;
  perms: Array<string>;
  menus: Array<MenuItem>;
}>;

/** 获取当前登录用户信息(含菜单) */
export const getCurrentUser = () => {
  return http.request<CurrentUserResult>("get", "/sys/user/current-user");
};
