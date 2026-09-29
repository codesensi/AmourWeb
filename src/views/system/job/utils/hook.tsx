import editForm from "../form.vue";
import { emphasize, message } from "@/utils/message";
import {
  openFormDialog,
  useBatchDelete,
  usePageQuery,
  useStatusColumn,
  useStatusSwitch
} from "@/views/system/hooks";
import {
  changeJobStatus,
  deleteJob,
  getJobPage,
  insertJob,
  runJob,
  updateJob
} from "@/api/sys-job";
import type { JobPageItem } from "@/api/sys-job";
import { DICT_CODES } from "@/api/sys-dict";
import { useDict } from "@/hooks/useDict";
import type { TableColumnRenderer, TableColumns } from "@pureadmin/table";
import { type Ref, h, onMounted, reactive, ref } from "vue";

/** 行数据剔除服务端注入字段后的可编辑形态(与后端 SysJobUpdateRequest 对齐;
 * 调用目标是任务身份不在修改契约内,jobGroup 仅内置任务由后端忽略) */
type JobUpdatePayload = {
  id: string;
  jobName: string;
  jobGroup?: string;
  cronExpression: string;
  concurrent: number;
  remark: string;
};

export function useJob(tableRef: Ref) {
  const formRef = ref();
  const form = reactive({
    jobName: "",
    /** 任务分组过滤(与 JobGroupEnum 对齐), 空串表示全部 */
    jobGroup: "" as "" | string,
    status: "" as "" | number
  });

  // 分组/内置标签取字典(与 JobGroupEnum/YesEnum 对齐)
  const { labelOf: groupLabelOf } = useDict(DICT_CODES.jobGroup);
  const { labelOf: builtinLabelOf } = useDict(DICT_CODES.yes);

  // 分页查询公共骨架:分页状态 + 结果列表 + 加载态 + 序号守卫搜索 + 分页事件写回 + 表单重置
  const {
    pagination,
    dataList,
    loading,
    search,
    handleSizeChange,
    handleCurrentChange,
    resetForm
  } = usePageQuery(query =>
    getJobPage({
      ...query,
      jobName: form.jobName,
      jobGroup:
        form.jobGroup === "" || form.jobGroup == null
          ? undefined
          : String(form.jobGroup),
      status:
        form.status === "" || form.status == null
          ? undefined
          : Number(form.status)
    })
  );

  // 删除骨架(确认弹窗、成功提示与刷新联动由骨架统一;本页仅用单条删除)
  const { handleDelete } = useBatchDelete<JobPageItem>({
    tableRef,
    remove: deleteJob,
    nameOf: row => row.jobName,
    entity: "任务",
    unit: "个",
    afterDeleted: () => {
      search();
    }
  });

  /* ---------------- 启停开关(独立 change-status 端点) ---------------- */

  // 状态开关公共骨架:确认 + 提交加载态 + 成功提示 + 取消/失败回滚
  const { switchLoadMap, onChange } = useStatusSwitch<JobPageItem>({
    field: "status",
    submit: async row => {
      await changeJobStatus(row.id, row.status);
    },
    confirmText: row =>
      h("span", [
        "确认要将任务",
        emphasize(row.jobName),
        row.status === 0 ? "恢复调度吗?" : "暂停调度吗?"
      ]),
    successText: row =>
      h("span", [
        `任务已${row.status === 0 ? "恢复" : "暂停"}`,
        emphasize(row.jobName)
      ])
  });

  // 状态开关列统一渲染(权限门控与批量删除等操作对齐;内置任务允许启停)
  const statusColumn = useStatusColumn<JobPageItem>({
    perms: "system:job:update",
    switchLoadMap,
    onChange,
    field: "status",
    builtinEditable: true,
    labelOf: status => (Number(status) === 0 ? "正常" : "暂停")
  });

  /** 最近一次执行结果列(失败标红,便于首页一屏发现异常任务) */
  const lastResultColumn: TableColumns = {
    label: "最近执行",
    prop: "lastStatus",
    minWidth: 170,
    cellRenderer: ({ row }: TableColumnRenderer) => {
      if (row.lastStatus == null) {
        return h(
          "span",
          { class: "text-[var(--el-text-color-secondary)]" },
          "从未执行"
        );
      }
      return h("span", [
        h(
          "span",
          {
            class:
              Number(row.lastStatus) === 1
                ? "text-[var(--el-color-success)]"
                : "text-[var(--el-color-danger)]"
          },
          Number(row.lastStatus) === 1 ? "成功" : "失败"
        ),
        h(
          "span",
          { class: "ml-1 text-xs text-[var(--el-text-color-secondary)]" },
          `${row.lastDuration ?? 0}ms`
        )
      ]);
    }
  };

  /** 列定义(状态列见 statusColumn) */
  const columns: TableColumnList = [
    { label: "任务名称", prop: "jobName", minWidth: 150 },
    {
      label: "分组",
      prop: "jobGroup",
      minWidth: 90,
      cellRenderer: ({ row }: TableColumnRenderer) => groupLabelOf(row.jobGroup)
    },
    { label: "调用目标", prop: "invokeTarget", minWidth: 170 },
    { label: "cron 表达式", prop: "cronExpression", minWidth: 130 },
    {
      label: "内置",
      prop: "builtin",
      minWidth: 70,
      cellRenderer: ({ row }: TableColumnRenderer) =>
        builtinLabelOf(row.builtin)
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 90,
      cellRenderer: statusColumn
    },
    lastResultColumn,
    {
      label: "备注",
      prop: "remark",
      minWidth: 180,
      cellRenderer: ({ row }: TableColumnRenderer) => row.remark ?? ""
    },
    {
      label: "操作",
      fixed: "right",
      width: 230,
      slot: "operation"
    }
  ];

  function openDialog(title = "新增", row?: JobPageItem) {
    const formInline = reactive({
      title,
      id: row?.id,
      jobName: row?.jobName ?? "",
      jobGroup: row?.jobGroup,
      invokeTarget: row?.invokeTarget ?? "",
      cronExpression: row?.cronExpression ?? "",
      concurrent: row?.concurrent ?? 0,
      builtin: row?.builtin ?? 0,
      remark: row?.remark ?? ""
    });
    openFormDialog({
      title: `${title}定时任务`,
      editForm,
      formRef,
      formInline,
      submit: async curData => {
        const payload: JobUpdatePayload = {
          id: curData.id!,
          jobName: curData.jobName,
          jobGroup: curData.jobGroup ?? undefined,
          cronExpression: curData.cronExpression,
          concurrent: curData.concurrent,
          remark: curData.remark
        };
        if (title === "新增") {
          const { id: _ignored, ...insertPayload } = payload;
          await insertJob({
            ...insertPayload,
            invokeTarget: curData.invokeTarget
          });
        } else {
          await updateJob(payload);
        }
        message(`成功${title}定时任务`, { type: "success" });
        search(); // 刷新表格数据
      }
    });
  }

  /** 手动执行一次(异步提交,结果见执行日志抽屉) */
  function handleRun(row: JobPageItem) {
    runJob(row.id).then(() => {
      message(`任务 ${row.jobName} 已提交执行`, { type: "success" });
    });
  }

  onMounted(() => {
    search();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    pagination,
    onSearch: search,
    resetForm,
    openDialog,
    handleDelete,
    handleRun,
    handleSizeChange,
    handleCurrentChange
  };
}
