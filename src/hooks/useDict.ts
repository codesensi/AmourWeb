import { computed } from "vue";
import type { SysDictItem } from "@/api/dict";
import { useDictStoreHook } from "@/store/modules/dict";

/**
 * 字典取数 hook —— 供下拉框/标签组件之外的自定义场景
 * (如分段控件选项、筛选面板)按编码取响应式条目列表。
 *
 * @param code 字典编码(如 gender、enable)
 */
export function useDict(code: string) {
  const store = useDictStoreHook();
  store.load([code]);

  /** 组内条目列表(响应式,首次加载完成后自动更新) */
  const options = computed<Array<SysDictItem>>(() => store.group(code));

  /** 按 value 反查 label,未命中回退为原值字符串 */
  function labelOf(value: string | number | null | undefined): string {
    if (value == null || value === "") return "";
    const item = store
      .group(code)
      .find(candidate => candidate.dictValue === String(value));
    return item ? item.dictLabel : String(value);
  }

  /** 强制重拉当前编码 */
  function refresh() {
    return store.refresh(code);
  }

  return { options, labelOf, refresh };
}
