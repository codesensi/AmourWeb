import { http } from "@/utils/http";
import { omitEmpty } from "@/utils/params";
import type { PageQuery, PageResult } from "@/api/types";

/** 定时任务-行数据(分页;最近一次执行结果由后端聚合回填) */
export interface JobPageItem {
  /** 主键ID(后端序列化为字符串,避免 JS 精度丢失) */
  id: string;
  /** 任务名称 */
  jobName: string;
  /** 任务分组(与 JobGroupEnum 对齐: default-默认, infra-基础设施) */
  jobGroup?: string | null;
  /** 调用目标(SysTask 实现类的 bean 名称) */
  invokeTarget: string;
  /** cron 表达式 */
  cronExpression: string;
  /** 是否允许并发执行: 0-禁止, 1-允许 */
  concurrent: number;
  /** 任务状态: 0-正常, 1-暂停 */
  status: number;
  /** 是否内置: 0-否, 1-是(内置任务不可删除) */
  builtin: number;
  /** 备注 */
  remark?: string | null;
  /** 最近一次执行状态: 0-失败, 1-成功(从未执行为 null) */
  lastStatus?: number | null;
  /** 最近一次执行耗时(毫秒;可空) */
  lastDuration?: number | null;
  /** 最近一次执行开始时间(yyyy-MM-dd HH:mm:ss;可空) */
  lastStartTime?: string | null;
}

/** 任务分页查询参数 */
export type JobQuery = PageQuery & {
  /** 任务名称(模糊匹配) */
  jobName?: string;
  /** 任务分组(精确匹配, 与 JobGroupEnum 对齐) */
  jobGroup?: string;
  /** 任务状态: 0-正常, 1-暂停 */
  status?: number;
};

/** 任务分页查询(GET /sys/job/page;登录态) */
export const getJobPage = (params?: JobQuery) => {
  return http.request<PageResult<JobPageItem>>("get", "/sys/job/page", {
    params: omitEmpty(params)
  });
};

/** 任务新增参数(对齐后端 SysJobInsertRequest;invokeTarget 必须为已注册的 SysTask bean 名称) */
export type JobInsertRequest = {
  jobName: string;
  jobGroup?: string;
  invokeTarget: string;
  cronExpression: string;
  /** 是否允许并发执行: 0-禁止, 1-允许 */
  concurrent?: number;
  remark?: string;
};

/** 新增任务(POST /sys/job/insert) */
export const insertJob = (data: JobInsertRequest) => {
  return http.request<null>("post", "/sys/job/insert", { data });
};

/** 任务修改参数(对齐后端 SysJobUpdateRequest;状态变更走 change-status 独立端点;
 * 调用目标是任务身份不在修改契约内;任务分组仅内置任务由后端忽略) */
export type JobUpdateRequest = {
  id: string;
  jobName: string;
  /** 任务分组(内置任务忽略此字段) */
  jobGroup?: string;
  cronExpression: string;
  /** 是否允许并发执行: 0-禁止, 1-允许 */
  concurrent?: number;
  remark?: string;
};

/** 修改任务(PUT /sys/job/update;cron 变更时热更新调度) */
export const updateJob = (data: JobUpdateRequest) => {
  return http.request<null>("put", "/sys/job/update", { data });
};

/** 启动/暂停任务(PUT /sys/job/change-status;status: 0-正常, 1-暂停) */
export const changeJobStatus = (id: string, status: number) => {
  return http.request<null>("put", "/sys/job/change-status", {
    data: { id, status }
  });
};

/** 删除任务(DELETE /sys/job/delete/{ids};单条传 id,批量逗号拼接) */
export const deleteJob = (ids: string) => {
  return http.request<null>("delete", `/sys/job/delete/${ids}`);
};

/** 立即手动执行一次任务(PUT /sys/job/run;异步执行,结果见执行日志) */
export const runJob = (id: string) => {
  return http.request<null>("put", "/sys/job/run", { data: { id } });
};

/** 定时任务执行日志-行数据 */
export interface JobLogItem {
  /** 日志ID */
  id: string;
  /** 任务ID */
  jobId: string;
  /** 任务名称 */
  jobName?: string | null;
  /** 触发方式(与 TriggerTypeEnum 对齐: cron-cron调度, manual-手动执行) */
  triggerType: string;
  /** 开始时间(yyyy-MM-dd HH:mm:ss) */
  startTime?: string | null;
  /** 耗时(毫秒) */
  duration?: number | null;
  /** 执行状态: 0-失败, 1-成功 */
  status: number;
  /** 异常信息(成功时为 null) */
  errorMsg?: string | null;
}

/** 执行日志分页查询参数(jobId 可空,空时查全部任务日志) */
export type JobLogQuery = PageQuery & {
  jobId?: string;
  status?: number;
};

/** 执行日志分页查询(GET /sys/job/log/page;登录态) */
export const getJobLogPage = (params?: JobLogQuery) => {
  return http.request<PageResult<JobLogItem>>("get", "/sys/job/log/page", {
    params: omitEmpty(params)
  });
};

/** cron 后续触发时间预览(GET /sys/job/next-trigger-times;最多 5 次) */
export const getNextTriggerTimes = (cron: string) => {
  return http.request<Array<string>>("get", "/sys/job/next-trigger-times", {
    params: { cron }
  });
};
