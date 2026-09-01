import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

/** 登录响应 */
export type UserResult = ApiResult<{
  /** 头像 */
  avatar: string;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname: string;
  /** 当前登录用户的角色 */
  roles: Array<string>;
  /** 按钮级别权限 */
  permissions: Array<string>;
  /** 访问令牌 */
  accessToken: string;
  /** 访问令牌过期时间（毫秒时间戳） */
  expires: number;
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
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", "/login", { data });
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
}

/** 当前登录用户信息(含菜单) */
export type CurrentUserResult = ApiResult<{
  username: string;
  nickname: string;
  avatar: string;
  email?: string;
  phone?: string;
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
