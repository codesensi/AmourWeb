import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

/** 个人中心-用户资料(对齐 sys_user 资料字段) */
export interface ProfileInfo {
  /** 用户名(只读,不可修改) */
  username: string;
  nickname: string;
  /** 性别:U-未知,M-男,F-女(字典 gender) */
  gender?: string;
  email?: string;
  phone?: string;
  qq?: string;
  /** 备注/简介 */
  remark?: string;
  /** 头像地址 */
  avatar?: string;
}

/** 个人中心-更新基础信息(PUT /sys/user/profile,仅允许操作当前登录用户) */
export const updateProfile = (data: ProfileInfo) => {
  return http.request<ApiResult<null>>("put", "/sys/user/profile", { data });
};

/** 个人中心-修改密码(PUT /sys/user/password) */
export const changePassword = (data: {
  oldPassword: string;
  newPassword: string;
}) => {
  return http.request<ApiResult<null>>("put", "/sys/user/password", { data });
};
