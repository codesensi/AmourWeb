import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

/** 个人中心-用户资料(对齐 sys_user 资料字段) */
export interface ProfileInfo {
  /** 用户名(登录账号,只读,经「更改名称」页签单独修改) */
  username: string;
  nickname: string;
  /** 性别:U-未知,M-男,F-女(字典 gender) */
  gender?: string;
  email?: string;
  qq?: string;
  /** 备注/简介 */
  remark?: string;
  /** 头像地址 */
  avatar?: string;
}

/** 个人中心-更新基础信息(PUT /sys/user/update-profile,仅允许操作当前登录用户) */
export const updateProfile = (data: Omit<ProfileInfo, "username">) => {
  return http.request<ApiResult<null>>("put", "/sys/user/update-profile", {
    data
  });
};

/** 个人中心-修改用户名(PUT /sys/user/rename,成功后服务端踢出会话,需重新登录) */
export const renameUser = (data: { username: string }) => {
  return http.request<ApiResult<null>>("put", "/sys/user/rename", { data });
};

/** 个人中心-修改密码(PUT /sys/user/update-password,成功后服务端踢出会话,需重新登录) */
export const updatePassword = (data: {
  oldPassword: string;
  newPassword: string;
}) => {
  return http.request<ApiResult<null>>("put", "/sys/user/update-password", {
    data
  });
};
