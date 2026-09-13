import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { ApiResult, PageQuery, PageResult } from "@/api/types";

/** 日志行数据(后端 sys_log 下发,仅展示字段;登录/操作日志共用) */
export type SysLogItem = {
  /** 日志ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 用户名称 */
  username: string;
  /** 操作模块(如 用户管理、登录) */
  module: string;
  /** 操作描述 */
  operation: string;
  /** 日志类型:1-登录,2-登出,3-查询,4-新增,5-修改,6-删除,7-授权,8-上传,9-下载 */
  logType: number;
  /** 操作IP */
  ip: string;
  /** IP归属地 */
  region: string;
  /** 耗时(毫秒) */
  elapsed: number;
  /** 操作状态:0-失败,1-成功 */
  status: number;
  /** 描述/失败原因 */
  msg: string;
  /** 请求接口地址 */
  url: string;
  /** 请求参数(JSON,脱敏后截断存储) */
  param: string;
  /** 响应结果(JSON,脱敏后截断存储) */
  result: string;
  /** 操作时间(yyyy-MM-dd HH:mm:ss) */
  createTime: string;
};

/** 日志分页查询参数 */
export type LogQuery = PageQuery & {
  /** 用户名称(模糊匹配) */
  username?: string;
  /** 操作状态:0-失败,1-成功 */
  status?: string;
  /** 日志类型集合(多选过滤,空则不过滤) */
  logTypes?: number[];
};

/** 日志分页查询(GET /sys/log/login/page、/sys/log/operate/page;登录态;logTypes 多选时逗号分隔下发,对齐 dict codes 惯例) */
export const getLogPage = (type: "login" | "operate", params?: LogQuery) => {
  const { logTypes, ...rest } = params ?? {};
  return http.request<ApiResult<PageResult<SysLogItem>>>(
    "get",
    `/sys/log/${type}/page`,
    {
      params: omitEmpty({
        ...rest,
        ...(logTypes?.length ? { logTypes: logTypes.join(",") } : {})
      })
    }
  );
};
