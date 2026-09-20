import { http } from "@/utils/http";
import type { MenuItem } from "./auth";

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
  return http.request<Array<MenuItem>>("get", "/sys/menu/list");
};

/** 菜单管理-新增(POST /sys/menu/insert) */
export const insertMenu = (data: MenuUpsertRequest) => {
  return http.request<null>("post", "/sys/menu/insert", { data });
};

/** 菜单管理-修改(PUT /sys/menu/update) */
export const updateMenu = (data: MenuUpsertRequest) => {
  return http.request<null>("put", "/sys/menu/update", { data });
};

/** 菜单管理-修改状态(PUT /sys/menu/change-status) */
export const changeMenuStatus = (data: { id: string; status: number }) => {
  return http.request<null>("put", "/sys/menu/change-status", {
    data
  });
};

/** 菜单管理-删除(DELETE /sys/menu/delete/{id},级联删除其全部下级菜单) */
export const deleteMenu = (id: string) => {
  return http.request<null>("delete", `/sys/menu/delete/${id}`);
};
