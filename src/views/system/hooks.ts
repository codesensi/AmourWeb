// 抽离可公用的工具函数等用于系统管理页面逻辑
import {
  computed,
  h,
  onMounted,
  reactive,
  ref,
  type Component,
  type Ref,
  type VNode
} from "vue";
import { useDark } from "@pureadmin/utils";
import { ElSwitch, ElTag } from "element-plus";
import type { PaginationProps, TableColumnRenderer } from "@pureadmin/table";
import type { FormInstance } from "element-plus";
import type { ApiResult, PageQuery, PageResult } from "@/api/types";
import { DICT_CODES } from "@/api/sys-dict";
import { useDict } from "@/hooks/useDict";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { confirmAction, emphasize, message } from "@/utils/message";

export function usePublicHooks() {
  const { isDark } = useDark();

  const switchStyle = computed(() => {
    return {
      "--el-switch-on-color": "#6abe39",
      "--el-switch-off-color": "#e84749"
    };
  });

  const tagStyle = computed(() => {
    return (status: number) => {
      return status === 1
        ? {
            "--el-tag-text-color": isDark.value ? "#6abe39" : "#389e0d",
            "--el-tag-bg-color": isDark.value ? "#172412" : "#f6ffed",
            "--el-tag-border-color": isDark.value ? "#274a17" : "#b7eb8f"
          }
        : {
            "--el-tag-text-color": isDark.value ? "#e84749" : "#cf1322",
            "--el-tag-bg-color": isDark.value ? "#2b1316" : "#fff1f0",
            "--el-tag-border-color": isDark.value ? "#58191c" : "#ffa39e"
          };
    };
  });

  return {
    /** 当前网页是否为`dark`模式 */
    isDark,
    /** 表现更鲜明的`el-switch`组件  */
    switchStyle,
    /** 表现更鲜明的`el-tag`组件  */
    tagStyle
  };
}

/**
 * 系统管理分页列表公共骨架 —— 收敛各管理页重复的分页状态机。
 * <p>
 * 包含分页响应状态(pagination)、结果列表(dataList)、加载态(loading)、
 * pure-table 分页事件写回(handleSizeChange/handleCurrentChange)与搜索表单重置(resetForm)。
 * 搜索执行内置请求序号守卫:快速连点搜索/翻页时,仅最新一次搜索的结果允许写入。
 *
 * @param fetchPage 分页接口:入参为骨架统一的分页参数(query),返回统一响应契约;
 *                  返回 undefined 表示当前不满足查询条件(如页签未就绪),跳过本次查询
 * @param options.loading loading 初始值,默认 true(首屏转圈,由首次查询收尾复位);
 *                        懒加载页签等首次查询前不展示表格的场景传 false
 */
export function usePageQuery<T>(
  fetchPage: (
    query: PageQuery
  ) => Promise<ApiResult<PageResult<T>>> | undefined,
  options?: { loading?: boolean }
) {
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 20,
    currentPage: 1,
    background: true
  });

  /** 结果列表与加载态由骨架统一持有:守卫写入与加载态复位不再依赖各页自律 */
  const dataList = ref([]) as Ref<T[]>;
  const loading = ref(options?.loading ?? true);

  /** 搜索请求序号守卫:快速连点搜索/翻页时,仅最新一次搜索的结果允许写入 */
  let searchSeq = 0;

  /** 搜索执行器:统一承载 loading 置位与复位、请求序号守卫与查询结果回填 */
  async function search() {
    loading.value = true;
    const seq = ++searchSeq;
    try {
      const result = await fetchPage({
        pageNumber: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      // 过期响应(新查询已发起)或未满足查询条件(undefined)时丢弃,不回填列表与分页状态
      if (seq === searchSeq && result && result.success && result.data) {
        pagination.total = result.data.totalRow;
        pagination.pageSize = result.data.pageSize;
        pagination.currentPage = result.data.pageNumber;
        dataList.value = result.data.records;
      }
    } finally {
      // 过期请求的收尾不得复位 loading,避免干扰新查询的在途状态
      if (seq === searchSeq) loading.value = false;
    }
  }

  /** pure-table 的分页事件只携带新值(写在其内部分页副本上),需在此写回分页状态后再查询 */
  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    search();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    search();
  }

  /** 搜索表单重置:清空校验与表单项后重新查询(独立导出为 useFormReset 供非分页页复用) */
  const resetForm = useFormReset(search);

  return {
    pagination,
    dataList,
    loading,
    search,
    handleSizeChange,
    handleCurrentChange,
    resetForm
  };
}

/** 搜索表单重置骨架:清空校验与表单项后执行回调重查(非分页页如菜单管理也复用) */
export function useFormReset(refetch: () => void) {
  return (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    formEl.resetFields();
    refetch();
  };
}

/** 批量展示名折叠:超过 3 个折叠为首 3 项 + 总数,避免确认弹窗内容过长 */
export function collapseNames(names: string[], unit: string): string {
  return names.length > 3
    ? `${names.slice(0, 3).join("、")} 等 ${names.length} ${unit}`
    : names.join("、");
}

/**
 * 状态开关列 cellRenderer —— 收敛用户/角色/菜单/字典四页同构的开关列渲染。
 * 开关文案由 sys_dict(enable) 驱动;内置行禁用启停,无权限时与操作列门控对齐同步禁用。
 *
 * @param options.perms 状态修改权限码(无权限时开关禁用)
 * @param options.switchLoadMap 各行开关提交加载态(来自 useStatusSwitch)
 * @param options.onChange 开关切换回调(来自 useStatusSwitch 的 onChange)
 */
export function useStatusColumn<
  /** 行数据类型:各页列表行,公共骨架仅依赖 id/status/builtin 字段 */
  T extends { id: string; status: number; builtin: number }
>(options: {
  perms: string;
  switchLoadMap: Ref<Record<string, { loading: boolean }>>;
  onChange: (row: T) => void;
}) {
  const { switchStyle } = usePublicHooks();
  const { labelOf: enableLabelOf } = useDict(DICT_CODES.enable);
  return (data: TableColumnRenderer) =>
    h(ElSwitch, {
      size: data.props.size === "small" ? "small" : "default",
      loading: options.switchLoadMap.value[data.row.id]?.loading,
      modelValue: data.row.status,
      "onUpdate:modelValue": (value: number) => {
        data.row.status = value;
      },
      activeValue: 0,
      inactiveValue: 1,
      activeText: enableLabelOf(0),
      inactiveText: enableLabelOf(1),
      disabled: data.row.builtin === 1 || !hasPerms(options.perms),
      inlinePrompt: true,
      style: switchStyle.value,
      onChange: () => options.onChange(data.row)
    });
}

/**
 * 删除/批量删除/多选三件套公共骨架 —— 收敛用户/角色/字典三页同构的删除交互。
 * <p>
 * 职责:单条删除与批量删除(复用删除接口,ID 逗号拼接)的确认弹窗、提交、
 * 成功提示、多选状态(selectedNum)与取消选择处理;批量展示名超 3 个自动折叠。
 *
 * @param options.remove 删除接口(单条传 id,批量传逗号拼接)
 * @param options.nameOf 行展示名(确认/成功文案中加粗,批量折叠展示)
 * @param options.entity 实体名(用户/角色/字典条目)
 * @param options.unit 批量折叠计数单位(位/个/条)
 * @param options.afterDeleted 删除成功后的附加联动(如字典页刷新消费端缓存与类型计数),缺省无
 * @param options.resetAdaptive 多选变化时是否重置表格高度(无多选横幅高度的页传 false)
 */
export function useBatchDelete<
  /** 行数据类型:各页列表行,公共骨架仅依赖 id 字段 */
  T extends { id: string }
>(options: {
  tableRef: Ref<any>;
  remove: (ids: string) => Promise<unknown>;
  nameOf: (row: T) => string;
  entity: string;
  unit: string;
  afterDeleted?: (rows: T[]) => unknown;
  resetAdaptive?: boolean;
}) {
  const selectedNum = ref(0);

  /** 当CheckBox选择项发生变化时会触发该事件 */
  function handleSelectionChange(val: T[]) {
    selectedNum.value = val.length;
    // 重置表格高度
    if (options.resetAdaptive !== false) {
      options.tableRef.value.setAdaptive();
    }
  }

  /** 取消选择 */
  function onSelectionCancel() {
    selectedNum.value = 0;
    // 用于多选表格，清空用户的选择
    options.tableRef.value.getTableRef().clearSelection();
  }

  /** 单条删除:确认 → 提交 → 提示 → 附加联动 → 刷新 */
  async function handleDelete(row: T) {
    // 确认弹窗与状态开关/修改新增弹窗风格一致;实体名样式加粗 + 主题主色
    const confirmed = await confirmAction(
      h("span", [
        "确认要删除",
        emphasize(options.nameOf(row)),
        `${options.entity}吗?`
      ])
    );
    if (!confirmed) return;
    try {
      await options.remove(row.id);
    } catch {
      // 删除失败(失败提示由拦截器统一弹出):静默返回
      return;
    }
    message(
      h("span", ["成功删除", emphasize(options.nameOf(row)), options.entity]),
      { type: "success" }
    );
    await options.afterDeleted?.([row]);
  }

  /** 批量删除(复用删除接口,ID 逗号拼接,后端整批校验) */
  async function onbatchDel() {
    // 返回当前选中的行(selectable 已禁用内置行勾选,选中项不会包含内置数据)
    const curSelected: T[] = options.tableRef.value
      .getTableRef()
      .getSelectionRows();
    const ids = curSelected.map(row => row.id);
    const displayNames = collapseNames(
      curSelected.map(options.nameOf),
      options.unit
    );
    // 确认弹窗与单条删除/状态开关风格一致;展示名加粗 + 主题主色
    const confirmed = await confirmAction(
      h("span", ["确认要删除", emphasize(displayNames), `${options.entity}吗?`])
    );
    if (!confirmed) return;
    try {
      await options.remove(ids.join(","));
    } catch {
      // 删除失败(失败提示由拦截器统一弹出):静默返回
      return;
    }
    message(h("span", ["成功删除", emphasize(displayNames), options.entity]), {
      type: "success"
    });
    await options.afterDeleted?.(curSelected);
    options.tableRef.value.getTableRef().clearSelection();
  }

  return {
    selectedNum,
    handleDelete,
    onbatchDel,
    handleSelectionChange,
    onSelectionCancel
  };
}

/**
 * 新增/修改弹窗公共骨架 —— 收敛系统管理五页同构的表单弹窗:
 * ReDialog 参数(width 可覆盖/拖拽/全屏/遮罩不关/确定按钮加载态)、
 * 表单校验 → 提交 → 失败保持打开 → 成功关弹窗的完整桥接。
 * <p>
 * 成功提示与列表刷新由调用方在 submit 内组装(各页文案与联动不同),骨架
 * 只负责弹窗骨架、表单校验、提交加载态与异常处理。
 *
 * @param options.editForm 弹窗内容表单组件(formInline 由 ReDialog 的 options.props 注入)
 * @param options.formRef 表单组件 ref(经 getRef() 取内部 FormInstance)
 * @param options.formInline 弹窗表单初始值(新增传默认值,修改由既有行回填)
 * @param options.submit 表单校验通过后的提交回调(调接口 + 成功提示 + 刷新列表);
 *                       抛出异常时保持弹窗打开(失败提示由 http 拦截器统一弹出)
 */
export function openFormDialog<T>(options: {
  title: string;
  editForm: Component;
  formRef: Ref<any>;
  formInline: T;
  width?: string;
  submit: (curData: T) => Promise<void>;
}) {
  addDialog({
    title: options.title,
    props: {
      formInline: options.formInline
    },
    width: options.width ?? "46%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    // 开启确定按钮提交加载态,防止异步提交期间连点重复提交
    sureBtnLoading: true,
    // formInline 实际取值由 ReDialog 的 options.props 注入,此处仅占位
    contentRenderer: () =>
      h(options.editForm, {
        ref: options.formRef,
        formInline: null as unknown as T
      }),
    beforeSure: (done, { options: dialogOptions, closeLoading }) => {
      const FormRef = options.formRef.value.getRef();
      const curData = dialogOptions.props.formInline as T;
      FormRef.validate(async (valid: boolean) => {
        if (!valid) {
          // 校验未通过:复位确定按钮加载态
          closeLoading();
          return;
        }
        try {
          await options.submit(curData);
          closeLoading(); // 复位确定按钮加载态(弹窗即将关闭)
          done(); // 关闭弹框
        } catch {
          // 提交失败(失败提示由拦截器统一弹出):复位加载态,弹窗保持打开
          closeLoading();
        }
      });
    }
  });
}

/**
 * 状态开关列(启用/禁用)公共骨架 —— 收敛用户/角色/菜单/字典四页同构的开关交互。
 * <p>
 * 职责:确认弹窗(文案由调用方组装)、提交加载态(switchLoadMap,以行 id 为键)、
 * 成功提示与取消/失败回滚(开关显示状态复位)。
 *
 * @param options.submit 状态提交接口
 * @param options.confirmText 确认弹窗内容(VNode 或纯文本,按模块组装;含业务数据的富文本一律走 VNode,由 Vue 转义防注入)
 * @param options.successText 成功提示内容(VNode 或纯文本,按模块组装)
 * @param options.afterSubmit 提交成功后的附加联动(如字典页刷新消费端缓存;同步/异步均可),缺省无
 */
export function useStatusSwitch<
  /** 行数据类型:各页列表行,公共骨架仅依赖 id/status 字段 */
  T extends { id: string; status: number }
>(options: {
  /** 状态提交接口 */
  submit: (row: T) => Promise<unknown>;
  /** 确认弹窗内容(VNode 或纯文本,按模块组装) */
  confirmText: (row: T) => VNode | string;
  /** 成功提示内容(VNode 或纯文本,按模块组装) */
  successText: (row: T) => VNode | string;
  /** 提交成功后的附加联动(如字典页刷新消费端缓存;同步/异步均可),缺省无 */
  afterSubmit?: (row: T) => unknown;
}) {
  /** 各行开关的提交加载态(以行 id 为键:树表行无稳定下标,统一用 id) */
  const switchLoadMap = ref<Record<string, { loading: boolean }>>({});

  /** 开关切换处理:确认 → 提交 → 提示;取消或失败时回滚开关显示状态 */
  function onChange(row: T) {
    // 确认弹窗期间即占用加载态(开关禁用),防止重复打开确认框并发提交两次互相翻转
    switchLoadMap.value[row.id] = { loading: true };
    confirmAction(options.confirmText(row)).then(async confirmed => {
      if (!confirmed) {
        // 取消:释放加载态并回滚开关显示状态
        switchLoadMap.value[row.id] = { loading: false };
        row.status = row.status === 0 ? 1 : 0;
        return;
      }
      try {
        await options.submit(row);
        await options.afterSubmit?.(row);
        message(options.successText(row), { type: "success" });
      } catch {
        // 接口失败回滚开关,与取消回滚共用同一处理
        row.status = row.status === 0 ? 1 : 0;
      } finally {
        switchLoadMap.value[row.id] = { loading: false };
      }
    });
  }

  return { switchLoadMap, onChange };
}

/**
 * 「是否内置」列的统一 cellRenderer —— 文案由 sys_dict(yes) 驱动,内置行告警色。
 */
export function useBuiltinTag() {
  const { labelOf } = useDict(DICT_CODES.yes);
  /** 参数与 pure-table 的 cellRenderer 签名对齐(TableColumnRenderer),仅消费 row.builtin */
  return (data: TableColumnRenderer) =>
    h(
      ElTag,
      { size: "small", type: data.row.builtin === 1 ? "warning" : "info" },
      { default: () => labelOf(data.row.builtin) }
    );
}

/**
 * 双页签懒加载骨架 —— 收敛日志/文件管理页同构的页签按需加载:
 * 首次激活页签时才触发其首次查询,并在挂载时自动加载初始页签。
 *
 * @param tabs 页签名 → 查询执行器
 * @param initial 初始激活页签名
 */
export function useLazyTabs(
  tabs: Record<string, { onSearch: () => void }>,
  initial: string
) {
  const loaded: Record<string, boolean> = {};

  function handleTabChange(name: string) {
    if (!name || loaded[name]) return;
    loaded[name] = true;
    tabs[name]?.onSearch();
  }

  onMounted(() => handleTabChange(initial));
  return handleTabChange;
}
