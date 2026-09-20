import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { PageQuery, PageResult } from "@/api/types";

/** 用户管理-行数据 */
export type SysUserItem = {
  /** 用户ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  username: string;
  nickname: string;
  /** 用户身份证号码 */
  idCard?: string;
  phone?: string;
  email?: string;
  /** 用户QQ号码 */
  qq?: string;
  /** 用户性别:U-未知,M-男,F-女 */
  gender?: string;
  avatar?: string;
  /** 用户状态:0-启用,1-禁用 */
  status?: number;
  builtin?: number;
  remark?: string;
  /** 创建时间(yyyy-MM-dd HH:mm:ss) */
  createTime?: string;
};

/** 用户分页查询参数 */
export type SysUserQuery = PageQuery & {
  username?: string;
  /** 用户昵称(模糊匹配) */
  nickname?: string;
  /** 身份证号(模糊匹配) */
  idCard?: string;
  /** QQ号(模糊匹配) */
  qq?: string;
  /** 邮箱(模糊匹配) */
  email?: string;
  /** 用户性别:U-未知,M-男,F-女 */
  gender?: string;
  phone?: string;
  status?: string;
};

/** 用户管理-分页查询(GET /sys/user/page) */
export const getUserPage = (params?: SysUserQuery) => {
  return http.request<PageResult<SysUserItem>>(
    "get",
    "/sys/user/page",
    { params: omitEmpty(params) }
  );
};

/** 用户管理-新增请求参数(对齐后端 UserInsertRequest) */
export type UserInsertRequest = {
  /** 用户名称 */
  username: string;
  /** 用户昵称 */
  nickname?: string;
  /** 用户身份证号码 */
  idCard?: string;
  /** 用户邮箱 */
  email?: string;
  /** 用户手机号码 */
  phone?: string;
  /** 用户QQ号码 */
  qq?: string;
  /** 用户性别:U-未知,M-男,F-女 */
  gender?: string;
  /** 用户头像地址 */
  avatar?: string;
  /** 用户状态:0-启用,1-禁用(缺省视为启用) */
  status?: number;
  /** 备注 */
  remark?: string;
};

/** 用户管理-修改请求参数(对齐后端 UserUpdateRequest;用户名称、状态与密码不在可修改范围) */
export type UserUpdateRequest = {
  /** 用户ID(后端 Long 序列化为字符串) */
  id: string;
  /** 用户昵称 */
  nickname?: string;
  /** 用户身份证号码 */
  idCard?: string;
  /** 用户邮箱 */
  email?: string;
  /** 用户手机号码 */
  phone?: string;
  /** 用户QQ号码 */
  qq?: string;
  /** 用户性别:U-未知,M-男,F-女 */
  gender?: string;
  /** 用户头像地址 */
  avatar?: string;
  /** 备注 */
  remark?: string;
};

/** 用户管理-修改状态请求参数(对齐后端 UserChangeStatusRequest) */
export type UserChangeStatusRequest = {
  /** 用户ID(后端 Long 序列化为字符串) */
  id: string;
  /** 用户状态:0-启用,1-禁用 */
  status: number;
};

/** 用户管理-分配角色请求参数(对齐后端 AssignRolesRequest) */
export type AssignRolesRequest = {
  /** 用户ID(后端 Long 序列化为字符串) */
  userId: string;
  /** 角色ID列表(空列表表示移除所有角色) */
  roleIds?: Array<string>;
};

/** 用户管理-新增(POST /sys/user/insert) */
export const insertUser = (data: UserInsertRequest) => {
  return http.request<null>("post", "/sys/user/insert", { data });
};

/** 用户管理-修改(PUT /sys/user/update) */
export const updateUser = (data: UserUpdateRequest) => {
  return http.request<null>("put", "/sys/user/update", { data });
};

/** 用户管理-删除(DELETE /sys/user/delete/{ids},id 支持英文逗号分隔批量删除) */
export const deleteUser = (id: string) => {
  return http.request<null>("delete", `/sys/user/delete/${id}`);
};

/** 用户管理-重置密码为系统默认密码(PUT /sys/user/reset-password/{id}) */
export const resetUserPwd = (id: string) => {
  return http.request<null>("put", `/sys/user/reset-password/${id}`);
};

/** 用户管理-修改用户状态(PUT /sys/user/change-status) */
export const changeUserStatus = (data: UserChangeStatusRequest) => {
  return http.request<null>("put", "/sys/user/change-status", {
    data
  });
};

/** 用户管理-分配角色(PUT /sys/user/assign-roles) */
export const assignRoles = (data: AssignRolesRequest) => {
  return http.request<null>("put", "/sys/user/assign-roles", {
    data
  });
};

/** 用户管理-获取用户已有角色 id(GET /sys/user/role-ids/{id}) */
export const getUserRoleIds = (id: string) => {
  return http.request<Array<string>>(
    "get",
    `/sys/user/role-ids/${id}`
  );
};
