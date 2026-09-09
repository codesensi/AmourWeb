import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { ApiResult, PageQuery, PageResult } from "@/api/types";
import type { MenuItem } from "./user";

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
export const getUserList = (params?: SysUserQuery) => {
  return http.request<ApiResult<PageResult<SysUserItem>>>(
    "get",
    "/sys/user/page",
    { params: omitEmpty(params) }
  );
};

/** 用户管理-新增(POST /sys/user/insert) */
export const insertUser = (data?: object) => {
  return http.request<ApiResult<null>>("post", "/sys/user/insert", { data });
};

/** 用户管理-修改(PUT /sys/user/update) */
export const updateUser = (data?: object) => {
  return http.request<ApiResult<null>>("put", "/sys/user/update", { data });
};

/** 用户管理-删除(DELETE /sys/user/delete/{ids},id 支持英文逗号分隔批量删除) */
export const deleteUser = (id: number | string) => {
  return http.request<ApiResult<null>>("delete", `/sys/user/delete/${id}`);
};

/** 用户管理-重置密码为系统默认密码(PUT /sys/user/reset-password/{id}) */
export const resetUserPwd = (id: number | string) => {
  return http.request<ApiResult<null>>("put", `/sys/user/reset-password/${id}`);
};

/** 用户管理-修改用户状态(PUT /sys/user/change-status) */
export const changeUserStatus = (data?: object) => {
  return http.request<ApiResult<null>>("put", "/sys/user/change-status", {
    data
  });
};

/** 用户管理-分配角色(PUT /sys/user/assign-roles) */
export const assignRoles = (data?: object) => {
  return http.request<ApiResult<null>>("put", "/sys/user/assign-roles", {
    data
  });
};

/** 用户管理-获取用户已有角色 id(GET /sys/user/role-ids/{id}) */
export const getUserRoleIds = (id: number | string) => {
  return http.request<ApiResult<Array<string>>>(
    "get",
    `/sys/user/role-ids/${id}`
  );
};

/** 角色管理-行数据(分页) */
export type SysRoleItem = {
  /** 角色ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  name: string;
  code: string;
  sort?: number;
  /** 角色状态:0-启用,1-禁用 */
  status?: number;
  /** 是否内置:0-否,1-是 */
  builtin?: number;
  remark?: string;
  /** 创建时间(yyyy-MM-dd HH:mm:ss) */
  createTime?: string;
};

/** 角色全量列表-选项数据(对齐后端 RoleResponse) */
export type SysRoleOption = {
  /** 角色ID(后端序列化为字符串) */
  id: string;
  name: string;
  code: string;
  /** 角色状态:0-启用,1-禁用 */
  status?: number;
  /** 是否内置:0-否,1-是 */
  builtin?: number;
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
export const getRolePage = (params?: SysRoleQuery) => {
  return http.request<ApiResult<PageResult<SysRoleItem>>>(
    "get",
    "/sys/role/page",
    { params: omitEmpty(params) }
  );
};

/** 角色管理-全量列表(GET /sys/role/list,分配角色等场景的选项数据源) */
export const getRoleList = () => {
  return http.request<ApiResult<Array<SysRoleOption>>>("get", "/sys/role/list");
};

/** 角色管理-新增(POST /sys/role/insert) */
export const insertRole = (data?: object) => {
  return http.request<ApiResult<null>>("post", "/sys/role/insert", { data });
};

/** 角色管理-修改(PUT /sys/role/update) */
export const updateRole = (data?: object) => {
  return http.request<ApiResult<null>>("put", "/sys/role/update", { data });
};

/** 角色管理-修改角色状态(PUT /sys/role/change-status) */
export const changeRoleStatus = (data?: object) => {
  return http.request<ApiResult<null>>("put", "/sys/role/change-status", {
    data
  });
};

/** 角色管理-删除(DELETE /sys/role/delete/{ids},id 支持英文逗号分隔批量删除) */
export const deleteRole = (id: number | string) => {
  return http.request<ApiResult<null>>("delete", `/sys/role/delete/${id}`);
};

/** 角色管理-获取角色已勾选菜单 id(GET /sys/role/menu-ids/{id}) */
export const getRoleMenuIds = (id: number | string) => {
  return http.request<ApiResult<Array<string>>>(
    "get",
    `/sys/role/menu-ids/${id}`
  );
};

/** 角色管理-保存菜单授权(PUT /sys/role/assign-menus) */
export const assignMenus = (data?: object) => {
  return http.request<ApiResult<null>>("put", "/sys/role/assign-menus", {
    data
  });
};

/** 菜单管理-新增/修改请求参数(对齐后端 MenuInsertRequest/MenuUpdateRequest) */
export type MenuUpsertRequest = {
  /** 菜单ID(修改时必传;后端 Long 序列化为字符串) */
  id?: string;
  /** 父级菜单ID(0 表示根节点) */
  pid: string;
  title: string;
  /** 菜单类型:D-目录,M-菜单,B-按钮 */
  type: "D" | "M" | "B";
  path?: string;
  component?: string;
  sort: number;
  icon?: string;
  perms?: string;
  /** 菜单状态:0-启用,1-禁用 */
  status: number;
  /** 显隐标识:0-显示,1-隐藏 */
  hidden: number;
  remark?: string;
};

/** 菜单管理-列表查询(GET /sys/menu/list,返回全量菜单,前端自行组树) */
export const getMenuList = () => {
  return http.request<ApiResult<Array<MenuItem>>>("get", "/sys/menu/list");
};

/** 菜单管理-新增(POST /sys/menu/insert) */
export const insertMenu = (data: MenuUpsertRequest) => {
  return http.request<ApiResult<null>>("post", "/sys/menu/insert", { data });
};

/** 菜单管理-修改(PUT /sys/menu/update) */
export const updateMenu = (data: MenuUpsertRequest) => {
  return http.request<ApiResult<null>>("put", "/sys/menu/update", { data });
};

/** 菜单管理-修改状态(PUT /sys/menu/change-status) */
export const changeMenuStatus = (data: { id: string; status: number }) => {
  return http.request<ApiResult<null>>("put", "/sys/menu/change-status", {
    data
  });
};

/** 菜单管理-删除(DELETE /sys/menu/delete/{id},级联删除其全部下级菜单) */
export const deleteMenu = (id: number | string) => {
  return http.request<ApiResult<null>>("delete", `/sys/menu/delete/${id}`);
};

/** 登录日志-行数据 */
export type LoginLogItem = {
  id: number;
  username: string;
  ip: string;
  /** 登录地点 */
  address: string;
  /** 操作系统 */
  system: string;
  /** 浏览器类型 */
  browser: string;
  /** 登录状态:1-成功,0-失败 */
  status: number;
  /** 登录行为(如"账号登录") */
  behavior: string;
  /** 登录时间 */
  loginTime: string;
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
  return http.request<ApiResult<PageResult<LoginLogItem>>>(
    "get",
    "/login-logs",
    {
      params: omitEmpty(params)
    }
  );
};

/** 操作日志-行数据 */
export type OperationLogItem = {
  id: number;
  username: string;
  ip: string;
  /** 登录地点 */
  address: string;
  /** 操作系统 */
  system: string;
  /** 浏览器类型 */
  browser: string;
  /** 操作状态:1-成功,0-失败 */
  status: number;
  /** 操作概要 */
  summary: string;
  /** 所属模块 */
  module: string;
  /** 操作时间 */
  operatingTime: string;
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
  return http.request<ApiResult<PageResult<OperationLogItem>>>(
    "get",
    "/operation-logs",
    {
      params: omitEmpty(params)
    }
  );
};
