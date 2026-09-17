import { computed } from "vue";
import { useQueryClient } from "@tanstack/vue-query";
import { getDictByCodes, type SysDictItem } from "@/api/dict";
import { queryKeys } from "@/hooks/queryKeys";
import { usePortalQuery } from "@/hooks/usePortalQuery";

/**
 * 字典取数 hook —— 供下拉框/标签组件之外的自定义场景
 * (如分段控件选项、筛选面板)按编码取响应式条目列表。
 * <p>
 * 取数统一走查询层:key 携带编码天然去重(多组件同编码共享一次请求),
 * staleTime=Infinity 下常驻缓存,管理侧改动后调用 refresh 失效重拉。
 *
 * @param code 字典编码(如 gender、enable)
 */
export function useDict(code: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = usePortalQuery(
    () => queryKeys.dict(code),
    () => getDictByCodes([code])
  );

  /** 组内条目列表(响应式,首次加载完成后自动更新) */
  const options = computed<Array<SysDictItem>>(() => {
    const groups = data.value;
    return groups?.find(group => group.dictCode === code)?.items ?? [];
  });

  /** 按 value 反查 label,未命中回退为原值字符串 */
  function labelOf(value: string | number | null | undefined): string {
    if (value == null || value === "") return "";
    const item = options.value.find(
      candidate => candidate.dictValue === String(value)
    );
    return item ? item.dictLabel : String(value);
  }

  /** 强制重拉当前编码(管理侧改动后调用) */
  function refresh() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.dict(code).key });
  }

  return { options, labelOf, refresh, loading: isLoading };
}
