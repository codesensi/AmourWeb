// 定时任务管理 mock(对齐后端 /sys/job 接口)
// page 契约对齐 SysJobPageResponse:id(字符串化)/jobName/jobGroup/invokeTarget/cronExpression/concurrent/status/builtin/remark + lastStatus/lastDuration/lastStartTime(最近一次执行聚合)
// insert/update 契约对齐 SysJobInsertRequest/UpdateRequest;change-status 仅覆盖 status;delete 校验内置任务拒绝
// run 在 mock 下直接追加一条手动执行日志(真实后端异步执行后由调度容器落库)
// next-trigger-times 返回后续 5 次触发时间(假数据按整点递推)
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { fakePageResponse } from "./utils";
/** 对齐 ApiResult<T> 的成功响应 */
const ok = (data: unknown = null, msg = "操作成功") => ({
  success: true,
  code: 200,
  msg,
  timestamp: Date.now(),
  data
});

/** 对齐 ApiResult<T> 的失败响应 */
const fail = (msg: string) => ({
  success: false,
  code: 400,
  msg,
  timestamp: Date.now(),
  data: null
});

/** 内存任务数据(内置任务种子与后端 init_dml 对齐) */
const jobs = [
  {
    id: "1",
    jobName: "文件回收站清理",
    jobGroup: "infra",
    invokeTarget: "fileRecycleCleanTask",
    cronExpression: "0 30 3 * * ?",
    concurrent: 0,
    status: 0,
    builtin: 1,
    remark: "清空回收站中删除超过 30 天的文件（磁盘文件与记录一并物理删除）"
  },
  {
    id: "2",
    jobName: "系统日志清理",
    jobGroup: "infra",
    invokeTarget: "sysLogCleanTask",
    cronExpression: "0 0 4 * * ?",
    concurrent: 0,
    status: 0,
    builtin: 1,
    remark: "物理删除超过 180 天的登录与操作日志，控制库文件膨胀"
  }
];

/** 内存执行日志(样例:两条成功一条失败) */
const jobLogs = [
  {
    id: "101",
    jobId: "1",
    jobName: "文件回收站清理",
    triggerType: 0,
    startTime: "2026-09-27 03:30:00",
    duration: 86,
    status: 1,
    errorMsg: null
  },
  {
    id: "102",
    jobId: "2",
    jobName: "系统日志清理",
    triggerType: 0,
    startTime: "2026-09-27 04:00:00",
    duration: 132,
    status: 1,
    errorMsg: null
  },
  {
    id: "103",
    jobId: "1",
    jobName: "文件回收站清理",
    triggerType: 1,
    startTime: "2026-09-27 10:12:33",
    duration: 42,
    status: 0,
    errorMsg: "java.nio.file.FileSystemException: data/files/photo/202605/9.bin"
  }
];

/** 自增日志ID */
let logIdSeed = 104;

export default defineFakeRoute([
  {
    url: "/sys/job/page",
    method: "get",
    response: ({ query }) => {
      const filtered = jobs.filter(job => {
        const nameMatch =
          !query.jobName || job.jobName.includes(String(query.jobName));
        const groupMatch =
          !query.jobGroup || job.jobGroup.includes(String(query.jobGroup));
        const statusMatch =
          query.status === undefined ||
          query.status === null ||
          query.status === "" ||
          job.status === Number(query.status);
        return nameMatch && groupMatch && statusMatch;
      });
      return fakePageResponse(filtered, query);
    }
  },
  {
    url: "/sys/job/insert",
    method: "post",
    response: ({ body }) => {
      const nextId = String(Math.max(...jobs.map(job => Number(job.id))) + 1);
      jobs.push({
        id: nextId,
        jobName: body.jobName,
        jobGroup: body.jobGroup ?? "",
        invokeTarget: body.invokeTarget,
        cronExpression: body.cronExpression,
        concurrent: body.concurrent ?? 0,
        status: 0,
        builtin: 0,
        remark: body.remark ?? ""
      });
      return ok();
    }
  },
  {
    url: "/sys/job/update",
    method: "put",
    response: ({ body }) => {
      const target = jobs.find(job => job.id === body.id);
      if (!target) return fail("任务不存在或已被删除");
      Object.assign(target, {
        jobName: body.jobName,
        jobGroup: body.jobGroup ?? "",
        invokeTarget: body.invokeTarget,
        cronExpression: body.cronExpression,
        concurrent: body.concurrent ?? 0,
        remark: body.remark ?? ""
      });
      return ok();
    }
  },
  {
    url: "/sys/job/change-status",
    method: "put",
    response: ({ body }) => {
      const target = jobs.find(job => job.id === body.id);
      if (!target) return fail("任务不存在或已被删除");
      target.status = Number(body.status);
      return ok();
    }
  },
  {
    url: "/sys/job/delete/:ids",
    method: "delete",
    response: ({ url }) => {
      const ids = url.split("/").pop()?.split(",") ?? [];
      if (ids.some(id => jobs.find(job => job.id === id)?.builtin === 1)) {
        return fail("内置任务不允许删除");
      }
      for (const id of ids) {
        const index = jobs.findIndex(job => job.id === id);
        if (index >= 0) jobs.splice(index, 1);
      }
      return ok();
    }
  },
  {
    url: "/sys/job/run",
    method: "put",
    response: ({ body }) => {
      const target = jobs.find(job => job.id === body.id);
      if (!target) return fail("任务不存在或已被删除");
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      jobLogs.unshift({
        id: String(logIdSeed++),
        jobId: target.id,
        jobName: target.jobName,
        triggerType: 1,
        startTime: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
        duration: Math.floor(Math.random() * 200) + 10,
        status: 1,
        errorMsg: null
      });
      return ok(null, "任务已提交执行");
    }
  },
  {
    url: "/sys/job/log/page",
    method: "get",
    response: ({ query }) => {
      const filtered = jobLogs.filter(log => {
        const jobMatch = !query.jobId || log.jobId === query.jobId;
        const statusMatch =
          query.status === undefined ||
          query.status === null ||
          query.status === "" ||
          log.status === Number(query.status);
        return jobMatch && statusMatch;
      });
      return fakePageResponse(filtered, query, { canEdit: false });
    }
  },
  {
    url: "/sys/job/next-trigger-times",
    method: "get",
    response: () => {
      const times: string[] = [];
      const base = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      for (let i = 0; i < 5; i++) {
        base.setHours(base.getHours() + 1);
        times.push(
          `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())} ${pad(base.getHours())}:00:00`
        );
      }
      return ok(times);
    }
  }
]);
