import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { ApiResult, PageQuery, PageResult } from "@/api/types";

/** 字典项(后端 sys_dict 下发,仅展示字段) */
export type SysDictItem = {
  /** 字典值(统一字符串;数字型枚举由组件按 value-type 转换) */
  dictValue: string;
  /** 字典标签 */
  dictLabel: string;
  /** 排序号(升序) */
  sort: number;
};

/** 字典分组(单个字典编码及其组内条目) */
export type SysDictGroup = {
  /** 字典编码(如 gender、enable) */
  dictCode: string;
  /** 组内条目(按 sort 升序) */
  items: Array<SysDictItem>;
};

/** 字典编码注册表 —— 前端唯一编码来源,避免散落魔法字符串(与后端 sys_dict.dict_code 对齐) */
export const DICT_CODES = {
  /** 性别 */
  gender: "gender",
  /** 通用启停状态 */
  enable: "enable",
  /** 是否 */
  yes: "yes",
  /** 菜单类型 */
  menuType: "menu-type",
  /** 图形验证码类型 */
  imageType: "image-type",
  /** 配置分组(与 sys_config.config_group 对齐) */
  configGroup: "config-group",
  /** 存储类型(与 StorageTypeEnum 对齐) */
  fileStorageType: "file-storage-type"
} as const;

/** 字典批量查询(GET /sys/dict/list-by-codes,免登录;codes 逗号分隔) */
export const getDictByCodes = (codes: Array<string>) => {
  return http.request<ApiResult<Array<SysDictGroup>>>(
    "get",
    "/sys/dict/list-by-codes",
    { params: { codes: codes.join(",") } }
  );
};

/** 字典类型(后端按 dict_code 聚合的类型概要,管理页左侧列表数据源) */
export type SysDictTypeItem = {
  /** 字典编码 */
  dictCode: string;
  /** 字典名称 */
  dictName: string;
  /** 该编码下的条目数 */
  count: number;
};

/** 字典类型列表(GET /sys/dict/type-list,管理端) */
export const getDictTypeList = () => {
  return http.request<ApiResult<Array<SysDictTypeItem>>>(
    "get",
    "/sys/dict/type-list"
  );
};

/** 字典管理-行数据(分页) */
export type SysDictPageItem = {
  /** 主键ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 字典编码 */
  dictCode: string;
  /** 字典名称 */
  dictName: string;
  /** 字典值(统一字符串存储) */
  dictValue: string;
  /** 字典标签 */
  dictLabel: string;
  /** 排序(升序) */
  sort: number;
  /** 状态:0-启用,1-禁用 */
  status: number;
  /** 是否内置:0-否,1-是(内置条目仅允许改标签/排序/备注) */
  builtin: number;
  remark?: string;
  /** 创建时间(yyyy-MM-dd HH:mm:ss) */
  createTime?: string;
};

/** 字典分页查询参数 */
export type SysDictQuery = PageQuery & {
  /** 字典编码 */
  dictCode?: string;
  /** 字典名称(模糊匹配) */
  dictName?: string;
  /** 字典值(模糊匹配) */
  dictValue?: string;
  /** 状态 */
  status?: string;
};

/** 字典管理-分页查询(GET /sys/dict/page) */
export const getDictPage = (params?: SysDictQuery) => {
  return http.request<ApiResult<PageResult<SysDictPageItem>>>(
    "get",
    "/sys/dict/page",
    { params: omitEmpty(params) }
  );
};

/** 字典管理-新增(POST /sys/dict/insert) */
export const insertDict = (data?: object) => {
  return http.request<ApiResult<null>>("post", "/sys/dict/insert", { data });
};

/** 字典管理-修改(PUT /sys/dict/update) */
export const updateDict = (data?: object) => {
  return http.request<ApiResult<null>>("put", "/sys/dict/update", { data });
};

/** 字典管理-修改状态(PUT /sys/dict/change-status) */
export const changeDictStatus = (data?: object) => {
  return http.request<ApiResult<null>>("put", "/sys/dict/change-status", {
    data
  });
};

/** 字典管理-删除(DELETE /sys/dict/delete/{id},内置条目后端禁删) */
export const deleteDict = (id: number | string) => {
  return http.request<ApiResult<null>>("delete", `/sys/dict/delete/${id}`);
};
