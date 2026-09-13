import { getLogPage, type SysLogItem } from "@/api/log";
import { usePublicHooks } from "@/views/system/hooks";
import type { PaginationProps } from "@pureadmin/table";
import { reactive, ref, toRaw } from "vue";
import { ElMessageBox } from "element-plus";
import { useClipboard } from "@vueuse/core";

export type LogTab = "login" | "operate";

/** 日志类型 code → 文案(与后端 LogTypeEnum 对齐) */
const LOG_TYPE_LABELS: Record<number, string> = {
  1: "登录",
  2: "登出",
  3: "查询",
  4: "新增",
  5: "修改",
  6: "删除",
  7: "授权",
  8: "上传",
  9: "下载"
};

/** 操作日志类型筛选项(与后端操作日志端点的固定类型范围对齐:查询/新增/修改/删除/授权/上传/下载) */
export const LOG_TYPE_OPTIONS = (Object.keys(LOG_TYPE_LABELS) as unknown[])
  .map(Number)
  .filter(code => code >= 3)
  .map(code => ({ value: code, label: LOG_TYPE_LABELS[code] }));

/** 操作列(两 Tab 共用,固定右侧,详情弹窗由页面层注入) */
function operateSlotColumn(): TableColumnList[number] {
  return {
    label: "操作",
    fixed: "right",
    width: 80,
    slot: "operation"
  };
}
/**
 * 日志分页 hook —— 登录日志/操作日志两个 Tab 共用同一骨架,
 * 按 tab 参数区分列定义与请求端点(/sys/log/login/page、/sys/log/operate/page)。
 *
 * @param tab 日志类型:login-登录日志,operate-操作日志
 */
export function useLogPage(tab: LogTab) {
  const form = reactive<{
    username: string;
    status: number | "";
    logTypes: number[];
  }>({
    username: "",
    status: "",
    logTypes: []
  });
  const dataList = ref([]);
  const loading = ref(false);
  const { tagStyle } = usePublicHooks();

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 20,
    currentPage: 1,
    background: true
  });

  /** 登录日志列:用户名/IP/归属地/状态/描述/时间/操作 */
  const loginColumns: TableColumnList = [
    {
      label: "用户名",
      prop: "username",
      minWidth: 110
    },
    {
      label: "登录 IP",
      prop: "ip",
      minWidth: 140
    },
    {
      label: "登录地点",
      prop: "region",
      minWidth: 140
    },
    {
      label: "登录状态",
      prop: "status",
      minWidth: 90,
      cellRenderer: ({ row, props }) => (
        <el-tag size={props.size} style={tagStyle.value(row.status)}>
          {row.status === 1 ? "成功" : "失败"}
        </el-tag>
      )
    },
    {
      label: "描述",
      prop: "msg",
      minWidth: 160,
      showOverflowTooltip: true
    },
    {
      label: "登录时间",
      prop: "createTime",
      minWidth: 170
    },
    operateSlotColumn()
  ];

  /** 操作日志列:用户名/模块/操作/类型/IP/归属地/耗时/状态/时间/操作 */
  const operateColumns: TableColumnList = [
    {
      label: "用户名",
      prop: "username",
      minWidth: 110
    },
    {
      label: "操作模块",
      prop: "module",
      minWidth: 110
    },
    {
      label: "操作描述",
      prop: "operation",
      minWidth: 130,
      showOverflowTooltip: true
    },
    {
      label: "类型",
      prop: "logType",
      minWidth: 80,
      formatter: ({ logType }) => LOG_TYPE_LABELS[logType] ?? "未知"
    },
    {
      label: "操作 IP",
      prop: "ip",
      minWidth: 140
    },
    {
      label: "操作地点",
      prop: "region",
      minWidth: 140
    },
    {
      label: "耗时",
      prop: "elapsed",
      minWidth: 90,
      formatter: ({ elapsed }) => (elapsed == null ? "" : `${elapsed} ms`)
    },
    {
      label: "操作状态",
      prop: "status",
      minWidth: 90,
      cellRenderer: ({ row, props }) => (
        <el-tag size={props.size} style={tagStyle.value(row.status)}>
          {row.status === 1 ? "成功" : "失败"}
        </el-tag>
      )
    },
    {
      label: "操作时间",
      prop: "createTime",
      minWidth: 170
    },
    operateSlotColumn()
  ];

  const columns = tab === "login" ? loginColumns : operateColumns;

  /** pure-table 的分页事件只携带新值(写在其内部分页副本上),需在此写回分页状态后再查询 */
  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    try {
      const { success, data } = await getLogPage(tab, {
        ...toRaw(form),
        pageNumber: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (success) {
        dataList.value = data.records;
        pagination.total = data.totalRow;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.pageNumber;
      }
    } finally {
      loading.value = false;
    }
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  // 返回普通对象:解构使用时 ref 保持响应式;
  // 若包一层 reactive,解构出的 ref 会被拆箱成当时的值快照,模板将永远不更新
  return {
    form,
    loading,
    columns,
    dataList,
    pagination,
    onSearch,
    resetForm,
    handleSizeChange,
    handleCurrentChange
  };
}

/**
 * 日志详情 hook —— 与缓存监控一致的"行内详情按钮 + 弹窗深色代码块"模式;
 * 登录/操作两个 Tab 共用一个实例,弹窗由操作列"详情"按钮打开。
 */
export function useLogDetail() {
  const detail = ref<SysLogItem | null>(null);
  const detailVisible = ref(false);
  /** 当前已复制的代码块:param-请求参数,result-响应结果,1.5s 后还原按钮态 */
  const copiedBlock = ref<"param" | "result" | "">("");
  /** legacy 模式:非安全上下文(http)自动降级 execCommand 复制 */
  const { copy: copyText } = useClipboard({ legacy: true });

  /** 详情展示:JSON 可解析时格式化缩进;截断等不完整内容解析失败,原样展示 */
  function prettyJson(text: unknown) {
    if (typeof text !== "string") {
      return JSON.stringify(text, null, 2);
    }
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }

  /** 详情弹窗(pre 文本插值展示,不渲染 HTML 防注入) */
  function openDetail(row: SysLogItem) {
    detail.value = row;
    detailVisible.value = true;
    copiedBlock.value = "";
  }

  /** 复制指定代码块到剪贴板,1.5s 后还原按钮态 */
  async function copyBlock(block: "param" | "result") {
    const raw = detail.value?.[block];
    const text = raw == null ? "" : prettyJson(raw);
    if (!text) return;
    try {
      await copyText(text);
      copiedBlock.value = block;
      setTimeout(() => {
        copiedBlock.value = "";
      }, 1500);
    } catch {
      ElMessageBox.alert("复制失败,请手动选择文本复制", "系统提示");
    }
  }

  return {
    detail,
    detailVisible,
    copiedBlock,
    openDetail,
    copyBlock,
    prettyJson
  };
}



