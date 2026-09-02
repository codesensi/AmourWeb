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
export type UserResult = ApiResult<{
  /** 访问令牌 */
  accessToken: string;
  /** 访问令牌过期时间（毫秒时间戳） */
  expires: number;
  /** 访问令牌名称 */
  tokenName: string;
  /** 访问令牌前缀 */
  tokenPrefix: string;
}>;

/** 账户设置-个人信息 */
export type UserInfo = {
  /** 头像 */
  avatar: string;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname: string;
  /** 邮箱 */
  email: string;
  /** 联系电话 */
  phone: string;
  /** 简介 */
  description: string;
};

export type UserInfoResult = ApiResult<UserInfo>;

type ResultTable = ApiResult<{
  /** 列表数据 */
  list: Array<any>;
  /** 总条目数 */
  total?: number;
  /** 每页显示条目个数 */
  pageSize?: number;
  /** 当前页数 */
  currentPage?: number;
}>;

/** 登录 */
export const getLogin = (data: LoginRequest) => {
  return http.request<UserResult>("post", "/login", { data });
};

/** 退出系统(通知后端作废当前 token) */
export const logoutApi = () => {
  return http.request<ApiResult<null>>("post", "/logout");
};

/** 账户设置-个人信息 */
export const getMine = (data?: object) => {
  return http.request<UserInfoResult>("get", "/mine", { data });
};

/** 账户设置-个人安全日志 */
export const getMineLogs = (data?: object) => {
  return http.request<ResultTable>("get", "/mine-logs", { data });
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
  return http.request<CurrentUserResult>("get", "/sys/user/getCurrentUser");
};
