import { computed, ref, type Ref } from "vue";
import type { ApiResult, PageQuery, PageResult } from "@/api/types";

/**
 * 门户「加载更多」分页加载 hook —— 追加式分页的通用骨架。
 * <p>
 * 收敛门户各列表页(点滴/清单/相册/留言)重复的分页状态机:
 * loading 防重入、页码推进、追加写入、hasMore 判定与清空重建。
 *
 * @param fetcher 分页接口(如 getMoments);命中 success 后由本 hook 追加数据
 * @param options.pageSize 每页条数,缺省 6(与原站 PAGE_SIZE 一致)
 * @param options.onLoaded 每批数据写入后的钩子(如相册页逐张浮现动画);
 *                         startIndex 为本批记录在 items 中的起始下标
 */
export function usePagedList<T>(
  fetcher: (params: PageQuery) => Promise<ApiResult<PageResult<T>>>,
  options?: {
    pageSize?: number;
    onLoaded?: (records: T[], startIndex: number) => void;
  }
) {
  const pageSize = options?.pageSize ?? 6;

  const items = ref([]) as Ref<T[]>;
  const totalRow = ref(0);
  const pageNumber = ref(0);
  const loading = ref(false);

  /** 是否还有更多数据(到底后隐藏「加载更多」) */
  const hasMore = computed(() => items.value.length < totalRow.value);

  /** 加载下一页并追加到 items 尾部;请求失败(如后端接口未就绪)静默降级为空态,不向调用方抛出异常 */
  async function loadMore() {
    if (loading.value) return;
    loading.value = true;
    try {
      const { success, data } = await fetcher({
        pageNumber: pageNumber.value + 1,
        pageSize
      });
      if (success) {
        const startIndex = items.value.length;
        items.value.push(...data.records);
        totalRow.value = data.totalRow;
        pageNumber.value = data.pageNumber;
        options?.onLoaded?.(data.records, startIndex);
      }
    } catch {
      // 静默降级:门户列表页以「加载更多」按钮触发,失败保持当前列表内容
    } finally {
      loading.value = false;
    }
  }

  /** 清空重建:回到第一页重新加载(提交留言等重载场景) */
  function reset() {
    items.value = [];
    totalRow.value = 0;
    pageNumber.value = 0;
    loadMore();
  }

  return { items, totalRow, pageNumber, loading, hasMore, loadMore, reset };
}
