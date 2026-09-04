/**
 * 统一接口契约层 —— 与后端 Result<T> / MyBatis-Flex Page<T> 一一对应。
 * 全项目唯一的响应类型来源:mock、api、页面均以此为准,禁止在各文件内另行定义响应结构。
 */

/**
 * 后端业务状态码(ResultCode),基于 HTTP 语义。
 * 仅收录前端会用到的状态码,与后端 ResultCode 枚举保持同步。
 */
export const Code = {
  /** 操作成功 */
  SUCCESS: 200,
  /** 请求参数错误 */
  BAD_REQUEST: 400,
  /** 未登录或登录已过期 */
  UNAUTHORIZED: 401,
  /** 无权限访问该资源 */
  FORBIDDEN: 403,
  /** 资源不存在 */
  NOT_FOUND: 404,
  /** 请求过于频繁,请稍后重试 */
  TOO_MANY_REQUESTS: 429,
  /** 系统内部错误 */
  INTERNAL_SERVER_ERROR: 500
} as const;

/** 统一响应结构,对齐后端 Result<T> */
export interface ApiResult<T = unknown> {
  /** 是否成功;由 code === {@link Code.SUCCESS} 判定 */
  success: boolean;
  /** 业务状态码,语义同 HTTP */
  code: number;
  /** 面向终端的可读提示信息 */
  msg: string;
  /**
   * 响应数据;失败或无数据时为 null。
   * http 响应拦截器会对失败结果统一 reject,业务代码仅在成功分支接触 data
   */
  data: T;
  /** 响应生成时间戳(毫秒,Unix epoch) */
  timestamp: number;
}

/** 统一分页请求参数;各业务查询参数通过 extends 继承,禁止在各文件内另行定义分页字段 */
export interface PageQuery {
  /** 页码(从 1 开始) */
  pageNumber?: number;
  /** 每页条数 */
  pageSize?: number;
}

/** 分页响应结构,对齐后端 MyBatis-Flex Page<T> 的序列化形状 */
export interface PageResult<T = unknown> {
  /** 当前页数据 */
  records: Array<T>;
  /** 当前页码 */
  pageNumber: number;
  /** 每页条数 */
  pageSize: number;
  /** 总条数 */
  totalRow: number;
  /** 总页数 */
  totalPages: number;
}
