import { getLogPage, type SysLogItem } from "@/api/log";
import { DICT_CODES } from "@/api/dict";
import { useDict } from "@/hooks/useDict";
import { usePageQuery, usePublicHooks } from "@/views/system/hooks";
import { computed, reactive, ref, toRaw } from "vue";

export type LogTab = "login" | "operate";

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
    status: string;
    logTypes: number[];
  }>({
    username: "",
    status: "",
    logTypes: []
  });
  const { tagStyle } = usePublicHooks();
  // 登录/操作状态字典:列文案统一由 sys_dict(success) 驱动
  const { labelOf: successLabelOf } = useDict(DICT_CODES.success);
  // 日志类型字典:类型列文案与操作日志筛选项由 sys_dict(log-type) 驱动
  const { labelOf: logTypeLabelOf, options: logTypeDictOptions } = useDict(
    DICT_CODES.logType
  );
  // 操作日志类型筛选项:过滤掉 0-未知/1-登录/2-登出,仅保留操作日志类型范围
  const logTypeOptions = computed(() =>
    logTypeDictOptions.value
      .filter(item => Number(item.dictValue) >= 3)
      .map(item => ({ value: Number(item.dictValue), label: item.dictLabel }))
  );

  // 分页查询公共骨架:分页状态 + 结果列表 + 加载态 + 序号守卫搜索 + 分页事件写回 + 表单重置
  const {
    pagination,
    dataList,
    loading,
    search,
    handleSizeChange,
    handleCurrentChange,
    resetForm
  } = usePageQuery(
    query => getLogPage(tab, { ...toRaw(form), ...query }),
    // 懒加载页签:首次查询在页签激活时触发,激活前不展示加载态
    { loading: false }
  );

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
          {successLabelOf(row.status)}
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
      formatter: ({ logType }) => logTypeLabelOf(logType) || "未知"
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
          {successLabelOf(row.status)}
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
      label: "操作时间",
      prop: "createTime",
      minWidth: 170
    },
    operateSlotColumn()
  ];

  const columns = tab === "login" ? loginColumns : operateColumns;

  // 返回普通对象:解构使用时 ref 保持响应式;
  // 若包一层 reactive,解构出的 ref 会被拆箱成当时的值快照,模板将永远不更新
  return {
    form,
    loading,
    columns,
    dataList,
    pagination,
    logTypeOptions,
    onSearch: search,
    resetForm,
    handleSizeChange,
    handleCurrentChange
  };
}

/**
 * 日志详情 hook —— 与缓存监控一致的"行内详情按钮 + 弹窗深色代码块"模式;
 * 登录/操作两个 Tab 共用一个实例,弹窗由操作列"详情"按钮打开;
 * 代码块的展示与一键复制由 ReCodeBlock 组件承载。
 */
export function useLogDetail() {
  const detail = ref<SysLogItem | null>(null);
  const detailVisible = ref(false);

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
  }

  return {
    detail,
    detailVisible,
    openDetail,
    prettyJson
  };
}
