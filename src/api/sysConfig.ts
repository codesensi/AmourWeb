import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { ApiResult, PageQuery, PageResult } from "@/api/types";

/** 系统公共配置条目(后端 sys_config 键值原样下发) */
export interface SysConfigItem {
  /** 配置键(如 name、copyright-year、site.love-start-date、captcha.enabled) */
  configKey: string;
  /** 配置值(统一字符串存储) */
  configValue: string;
  /** 值类型:STRING,INTEGER,LONG,BOOLEAN,DATETIME */
  valueType: string;
  /** 分组(base/site/captcha) */
  configGroup: string;
}

/** 系统公共配置响应(GET /sys/config/list-by-keys;免登录,键值数组由 utils/sysConfig 归一化后供组件消费) */
export type SysConfigResult = ApiResult<Array<SysConfigItem>>;

/** 获取系统公共配置
 *
 * @param keys 需要下发的配置键集合(必传;不传后端返回空列表)
 */
export const getSysConfig = (keys: Array<string>) => {
  return http.request<SysConfigResult>("get", "/sys/config/list-by-keys", {
    // 逗号分隔传输(?keys=name,icp),Spring 默认按逗号拆分为 List<String>
    params: { keys: keys.join(",") }
  });
};

/** 系统配置管理-行数据(分页;完整字段) */
export type SysConfigPageItem = {
  /** 主键ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 配置键(如 name、copyright-year、site.love-start-date、captcha.enabled) */
  configKey: string;
  /** 配置值(统一字符串存储) */
  configValue: string;
  /** 值类型:STRING,INTEGER,LONG,BOOLEAN,DATETIME */
  valueType: string;
  /** 分组(base/site/captcha) */
  configGroup: string;
  remark?: string;
  /** 更新时间(yyyy-MM-dd HH:mm:ss) */
  updateTime?: string;
};

/** 系统配置分页查询参数 */
export type SysConfigQuery = PageQuery & {
  /** 配置键(模糊匹配) */
  configKey?: string;
  /** 分组(精确匹配) */
  configGroup?: string;
};

/** 系统配置管理-分页查询(GET /sys/config/page;登录态) */
export const getConfigPage = (params?: SysConfigQuery) => {
  return http.request<ApiResult<PageResult<SysConfigPageItem>>>(
    "get",
    "/sys/config/page",
    { params: omitEmpty(params) }
  );
};

/** 系统配置管理-修改参数(仅允许修改配置值;键、类型、分组与状态由代码侧约定) */
export type SysConfigUpdate = {
  /** 主键ID */
  id: string;
  /** 配置值(统一字符串存储) */
  configValue: string;
};

/** 修改系统配置(PUT /sys/config/update;更新后后端失效 config 缓存,热更新即时生效) */
export const updateConfig = (data: SysConfigUpdate) => {
  return http.request<ApiResult<null>>("put", "/sys/config/update", { data });
};
