// 抽离可公用的工具函数等用于系统管理页面逻辑
import { computed, h, onMounted, reactive, ref } from "vue";
import { useDark } from "@pureadmin/utils";
import { ElTag } from "element-plus";
import type { PaginationProps } from "@pureadmin/table";
import type { FormInstance } from "element-plus";
import type { PageResult } from "@/api/types";
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
 * 包含分页响应状态(pagination)、pure-table 分页事件写回(handleSizeChange/handleCurrentChange)、
 * 查询结果回填(applyPageResult)与搜索表单重置(resetForm);调用方仅保留差异化的查询参数构造。
 *
 * @param onSearch 查询执行函数(分页事件写回后由本骨架回调)
 */
export function usePageQuery(onSearch: () => Promise<void> | void) {
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 20,
    currentPage: 1,
    background: true
  });

  /** 将分页接口响应回填到分页状态,返回当前页记录供调用方写入 dataList */
  function applyPageResult<T>(data: PageResult<T>) {
    pagination.total = data.totalRow;
    pagination.pageSize = data.pageSize;
    pagination.currentPage = data.pageNumber;
    return data.records;
  }

  /** pure-table 的分页事件只携带新值(写在其内部分页副本上),需在此写回分页状态后再查询 */
  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  /** 搜索表单重置:清空校验与表单项后重新查询 */
  function resetForm(formEl: FormInstance | undefined) {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  }

  return {
    pagination,
    applyPageResult,
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
export function useStatusSwitch(options: {
  /** 行数据形状由各页自行约定,公共骨架仅依赖 id/status 字段 */
  submit: (row: any) => Promise<unknown>;
  confirmText: (row: any) => string;
  successText: (row: any) => string;
  afterSubmit?: (row: any) => unknown;
}) {
  /** 各行开关的提交加载态(以行 id 为键:树表行无稳定下标,统一用 id) */
  const switchLoadMap = ref<Record<string, { loading: boolean }>>({});

  /** 开关切换处理:确认 → 提交 → 提示;取消或失败时回滚开关显示状态 */
  function onChange(row: any) {
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
  // 参数与 pure-table 的 cellRenderer 签名对齐(TableColumnRenderer),仅消费 row
  return (data: any) =>
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
