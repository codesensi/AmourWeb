import { http } from "@/utils/http";
import type { ApiResult } from "@/api/types";

/** 系统公共配置条目(后端 sys_config 键值原样下发) */
export interface SysConfigItem {
  /** 配置键(如 name、copyright-year、site.slogan、captcha.enabled) */
  configKey: string;
  /** 配置值(统一字符串存储) */
  configValue: string;
  /** 值类型:STRING,INTEGER,LONG,BOOLEAN */
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
