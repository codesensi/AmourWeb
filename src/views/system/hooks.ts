// 抽离可公用的工具函数等用于系统管理页面逻辑
import { computed, h, onMounted, reactive, ref, type Ref } from "vue";
import { useDark } from "@pureadmin/utils";
import { ElTag } from "element-plus";
import type { PaginationProps, TableColumnRenderer } from "@pureadmin/table";
import type { FormInstance } from "element-plus";
import type { ApiResult, PageQuery, PageResult } from "@/api/types";
import { DICT_CODES } from "@/api/dict";
import { useDict } from "@/hooks/useDict";
import { confirmAction, message } from "@/utils/message";

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
  fetchPage: (query: PageQuery) => Promise<ApiResult<PageResult<T>>> | undefined,
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

  /** 搜索表单重置:清空校验与表单项后重新查询 */
  function resetForm(formEl: FormInstance | undefined) {
    if (!formEl) return;
    formEl.resetFields();
    search();
  }

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

/**
 * 状态开关列(启用/禁用)公共骨架 —— 收敛用户/角色/菜单/字典四页同构的开关交互。
 * <p>
 * 职责:确认弹窗(文案由调用方组装)、提交加载态(switchLoadMap,以行 id 为键)、
 * 成功提示与取消/失败回滚(开关显示状态复位)。
 *
 * @param options.submit 状态提交接口
 * @param options.confirmText 确认弹窗文案(HTML,按模块组装)
 * @param options.successText 成功提示文案(HTML,按模块组装)
 * @param options.afterSubmit 提交成功后的附加联动(如字典页刷新消费端缓存;同步/异步均可),缺省无
 */
export function useStatusSwitch<
  /** 行数据类型:各页列表行,公共骨架仅依赖 id/status 字段 */
  T extends { id: string; status: number }
>(options: {
  /** 状态提交接口 */
  submit: (row: T) => Promise<unknown>;
  /** 确认弹窗文案(HTML,按模块组装) */
  confirmText: (row: T) => string;
  /** 成功提示文案(HTML,按模块组装) */
  successText: (row: T) => string;
  /** 提交成功后的附加联动(如字典页刷新消费端缓存;同步/异步均可),缺省无 */
  afterSubmit?: (row: T) => unknown;
}) {
  /** 各行开关的提交加载态(以行 id 为键:树表行无稳定下标,统一用 id) */
  const switchLoadMap = ref<Record<string, { loading: boolean }>>({});

  /** 开关切换处理:确认 → 提交 → 提示;取消或失败时回滚开关显示状态 */
  function onChange(row: T) {
    confirmAction(options.confirmText(row), { html: true }).then(
      async confirmed => {
        if (!confirmed) {
          // 取消:回滚开关显示状态
          row.status = row.status === 0 ? 1 : 0;
          return;
        }
        switchLoadMap.value[row.id] = { loading: true };
        try {
          await options.submit(row);
          await options.afterSubmit?.(row);
          message(options.successText(row), {
            type: "success",
            dangerouslyUseHTMLString: true
          });
        } catch {
          // 接口失败回滚开关,与取消回滚共用同一处理
          row.status = row.status === 0 ? 1 : 0;
        } finally {
          switchLoadMap.value[row.id] = { loading: false };
        }
      }
    );
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
