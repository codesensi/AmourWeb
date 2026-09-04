import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { ApiResult, PageQuery, PageResult } from "@/api/types";

/** 用户管理-行数据 */
export type SysUserItem = {
  id: number;
  username: string;
  nickname: string;
  phone?: string;
  email?: string;
  sex?: number;
  avatar?: string;
  status?: number;
  builtin?: number;
  remark?: string;
  createTime?: number;
};

/** 用户分页查询参数 */
export type SysUserQuery = PageQuery & {
  username?: string;
  phone?: string;
  status?: string;
};

/** 用户管理-分页查询(GET /sys/user/page) */
export const getUserList = (params?: SysUserQuery) => {
  return http.request<ApiResult<PageResult<SysUserItem>>>(
    "get",
    "/sys/user/page",
    { params: omitEmpty(params) }
  );
};

/** 用户管理-新增(POST /sys/user/insert) */
export const insertUser = (data?: object) => {
  return http.request<ApiResult<any>>("post", "/sys/user/insert", { data });
};

/** 用户管理-修改(PUT /sys/user/update) */
export const updateUser = (data?: object) => {
  return http.request<ApiResult<any>>("put", "/sys/user/update", { data });
};

/** 用户管理-删除(DELETE /sys/user/delete/{id}) */
export const deleteUser = (id: number | string) => {
  return http.request<ApiResult<any>>("delete", `/sys/user/delete/${id}`);
};

/** 用户管理-分配角色(PUT /sys/user/assignRoles) */
export const assignRoles = (data?: object) => {
  return http.request<ApiResult<any>>("put", "/sys/user/assignRoles", { data });
};

/** 用户管理-获取用户已有角色 id(GET /sys/user/role-ids/{id}) */
export const getUserRoleIds = (id: number | string) => {
  return http.request<ApiResult<Array<number>>>(
    "get",
    `/sys/user/role-ids/${id}`
  );
};

/** 角色分页查询参数 */
export type SysRoleQuery = PageQuery & {
  /** 角色名称 */
  name?: string;
  /** 角色编码 */
  code?: string;
  /** 状态 */
  status?: string;
};

/** 角色管理-分页查询(GET /sys/role/page) */
export const getRoleList = (params?: SysRoleQuery) => {
  return http.request<ApiResult<PageResult<any>>>("get", "/sys/role/page", {
    params: omitEmpty(params)
  });
};

/** 角色管理-新增(POST /sys/role/insert) */
export const insertRole = (data?: object) => {
  return http.request<ApiResult<any>>("post", "/sys/role/insert", { data });
};

/** 角色管理-修改(PUT /sys/role/update) */
export const updateRole = (data?: object) => {
  return http.request<ApiResult<any>>("put", "/sys/role/update", { data });
};

/** 角色管理-删除(DELETE /sys/role/delete/{id}) */
export const deleteRole = (id: number | string) => {
  return http.request<ApiResult<any>>("delete", `/sys/role/delete/${id}`);
};

/** 角色管理-获取全量菜单树(GET /sys/role/menu-tree,授权弹窗用) */
export const getRoleMenuTree = () => {
  return http.request<ApiResult<Array<any>>>("get", "/sys/role/menu-tree");
};

/** 角色管理-获取角色已勾选菜单 id(GET /sys/role/menu-ids/{id}) */
export const getRoleMenuIds = (id: number | string) => {
  return http.request<ApiResult<Array<number>>>(
    "get",
    `/sys/role/menu-ids/${id}`
  );
};

/** 角色管理-保存菜单授权(PUT /sys/role/assignMenus) */
export const assignMenus = (data?: object) => {
  return http.request<ApiResult<any>>("put", "/sys/role/assignMenus", { data });
};

/** 菜单管理-分页查询(GET /sys/menu/page) */
export const getMenuList = (params?: PageQuery) => {
  return http.request<ApiResult<PageResult<any>>>("get", "/sys/menu/page", {
    params: omitEmpty(params)
  });
};

/** 菜单管理-新增(POST /sys/menu/insert) */
export const insertMenu = (data?: object) => {
  return http.request<ApiResult<any>>("post", "/sys/menu/insert", { data });
};

/** 菜单管理-修改(PUT /sys/menu/update) */
export const updateMenu = (data?: object) => {
  return http.request<ApiResult<any>>("put", "/sys/menu/update", { data });
};

/** 菜单管理-删除(DELETE /sys/menu/delete/{id}) */
export const deleteMenu = (id: number | string) => {
  return http.request<ApiResult<any>>("delete", `/sys/menu/delete/${id}`);
};

/** 登录日志分页查询参数 */
export type LoginLogQuery = PageQuery & {
  /** 用户名 */
  username?: string;
  /** 登录状态 */
  status?: string;
  /** 登录时间范围 */
  loginTime?: string;
};

/** 日志管理-登录日志列表(GET,分页参数 pageNumber/pageSize) */
export const getLoginLogsList = (params?: LoginLogQuery) => {
  return http.request<ApiResult<PageResult<any>>>("get", "/login-logs", {
    params: omitEmpty(params)
  });
};

/** 操作日志分页查询参数 */
export type OperationLogQuery = PageQuery & {
  /** 操作模块 */
  module?: string;
  /** 操作状态 */
  status?: string;
  /** 操作时间范围 */
  operatingTime?: string;
};

/** 日志管理-操作日志列表(GET,分页参数 pageNumber/pageSize) */
export const getOperationLogsList = (params?: OperationLogQuery) => {
  return http.request<ApiResult<PageResult<any>>>("get", "/operation-logs", {
    params: omitEmpty(params)
  });
};
