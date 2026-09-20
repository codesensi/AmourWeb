import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { PageQuery, PageResult } from "@/api/types";

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
  return http.request<PageResult<SysRoleItem>>(
    "get",
    "/sys/role/page",
    { params: omitEmpty(params) }
  );
};

/** 角色管理-全量列表(GET /sys/role/list,分配角色等场景的选项数据源) */
export const getRoleList = () => {
  return http.request<Array<SysRoleOption>>("get", "/sys/role/list");
};

/** 角色管理-新增请求参数(对齐后端 RoleInsertRequest) */
export type RoleInsertRequest = {
  /** 角色名称 */
  name: string;
  /** 角色编码 */
  code: string;
  /** 角色排序 */
  sort?: number;
  /** 备注 */
  remark?: string;
};

/** 角色管理-修改请求参数(对齐后端 RoleUpdateRequest;角色编码创建后不可修改) */
export type RoleUpdateRequest = {
  /** 角色ID(后端 Long 序列化为字符串) */
  id: string;
  /** 角色名称 */
  name: string;
  /** 角色排序 */
  sort?: number;
  /** 备注 */
  remark?: string;
};

/** 角色管理-修改状态请求参数(对齐后端 RoleChangeStatusRequest) */
export type RoleChangeStatusRequest = {
  /** 角色ID(后端 Long 序列化为字符串) */
  id: string;
  /** 角色状态:0-启用,1-禁用 */
  status: number;
};

/** 角色管理-分配菜单请求参数(对齐后端 AssignMenusRequest) */
export type AssignMenusRequest = {
  /** 角色ID(后端 Long 序列化为字符串) */
  roleId: string;
  /** 菜单ID列表 */
  menuIds?: Array<string>;
};

/** 角色管理-新增(POST /sys/role/insert) */
export const insertRole = (data: RoleInsertRequest) => {
  return http.request<null>("post", "/sys/role/insert", { data });
};

/** 角色管理-修改(PUT /sys/role/update) */
export const updateRole = (data: RoleUpdateRequest) => {
  return http.request<null>("put", "/sys/role/update", { data });
};

/** 角色管理-修改角色状态(PUT /sys/role/change-status) */
export const changeRoleStatus = (data: RoleChangeStatusRequest) => {
  return http.request<null>("put", "/sys/role/change-status", {
    data
  });
};

/** 角色管理-删除(DELETE /sys/role/delete/{ids},id 支持英文逗号分隔批量删除) */
export const deleteRole = (id: string) => {
  return http.request<null>("delete", `/sys/role/delete/${id}`);
};

/** 角色管理-获取角色已勾选菜单 id(GET /sys/role/menu-ids/{id}) */
export const getRoleMenuIds = (id: string) => {
  return http.request<Array<string>>(
    "get",
    `/sys/role/menu-ids/${id}`
  );
};

/** 角色管理-保存菜单授权(PUT /sys/role/assign-menus) */
export const assignMenus = (data: AssignMenusRequest) => {
  return http.request<null>("put", "/sys/role/assign-menus", {
    data
  });
};
