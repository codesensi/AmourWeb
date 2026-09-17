/**
 * 门户服务端数据查询层 —— 基于 @tanstack/vue-query 的薄适配。
 * <p>
 * 统一承载三类横切关注点,页面代码只声明「key + 拉取函数」:
 * 1. Result 契约解包:success=false 或 data 为空视为查询失败,抛出后由
 *    vue-query 保留上一次成功数据(静默降级,与门户既有空态风格一致);
 * 2. KeepAlive 激活校验:门户路由出口使用 <KeepAlive>,组件只 mount 一次,
 *    vue-query 的 refetchOnMount 不会在再次进入时生效——此处补挂 onActivated,
 *    数据过期(staleTime 之外)或被失效标记时静默重拉;
 * 3. 追加式分页(usePortalList):对齐原 usePagedList 的消费形状
 *    (items/totalRow/loading/hasMore/loadMore),底层改由 useInfiniteQuery
 *    承载页码推进与在途请求去重。
 */
import { computed, onActivated, watch, type ComputedRef } from "vue";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient
} from "@tanstack/vue-query";
import type { ApiResult, PageQuery, PageResult } from "@/api/types";
import type { PortalResource } from "@/hooks/query-keys";

/** 未显式声明 staleTime 时的新鲜度窗口,与 main.ts 的 QueryClient 默认值一致 */
const DEFAULT_STALE_TIME = 60_000;

/** 解析资源描述:支持 getter 形式(路由参数等响应式 key) */
function resolveResource(
  resource: PortalResource | (() => PortalResource)
): ComputedRef<PortalResource> {
  return computed(() => (typeof resource === "function" ? resource() : resource));
}

/**
 * KeepAlive 激活校验:数据过期或被失效标记时重拉。
 * staleTime=0 表示每次激活都校验;Infinity 表示永不重拉。
 */
function useKeepAliveRefetch(
  resource: ComputedRef<PortalResource>,
  refetch: () => void
) {
  const queryClient = useQueryClient();
  onActivated(() => {
    const { key, staleTime } = resource.value;
    const state = queryClient.getQueryState(key);
    // 首次拉取由查询自身在 mount 时负责;从无成功数据时不在此补拉
    if (!state || state.dataUpdatedAt === 0) return;
    if (
      state.isInvalidated ||
      Date.now() - state.dataUpdatedAt > (staleTime ?? DEFAULT_STALE_TIME)
    ) {
      refetch();
    }
  });
}

/**
 * 单资源查询:接口数据缓存、新鲜度与 KeepAlive 激活校验的一站式入口。
 * queryFn 内完成 Result 契约解包:success=false 或 data 为 null 视为失败,
 * 抛出后 vue-query 保留上一次成功数据,页面模板以空态兜底。
 */
export function usePortalQuery<T>(
  resource: PortalResource | (() => PortalResource),
  fetcher: () => Promise<ApiResult<T>>
) {
  const queryClient = useQueryClient();
  const resourceRef = resolveResource(resource);

  const query = useQuery({
    queryKey: computed(() => resourceRef.value.key),
    queryFn: async () => {
      const res = await fetcher();
      if (!res.success || res.data == null) {
        throw new Error("PORTAL_QUERY_EMPTY");
      }
      return res.data;
    },
    staleTime: computed(() => resourceRef.value.staleTime)
  });

  useKeepAliveRefetch(resourceRef, () => void query.refetch());

  return query;
}

/**
 * 追加式分页查询:门户「加载更多」列表的统一入口。
 * 返回形状与消费习惯对齐既有分页状态机(items/totalRow/loading/hasMore/loadMore),
 * 另提供 refresh():标记缓存失效并重拉已加载的全部页(提交留言等写后重载场景)。
 */
export function usePortalList<T>(
  resource: PortalResource | (() => PortalResource),
  fetcher: (params: PageQuery) => Promise<ApiResult<PageResult<T>>>,
  options?: {
    /** 每页条数,缺省 6(与原分页状态机一致) */
    pageSize?: number;
    /** 每批数据写入后的钩子(如相册逐张浮现动画);startIndex 为本批在 items 中的起始下标 */
    onLoaded?: (records: T[], startIndex: number) => void;
  }
) {
  const pageSize = options?.pageSize ?? 6;
  const queryClient = useQueryClient();
  const resourceRef = resolveResource(resource);

  const query = useInfiniteQuery({
    queryKey: computed(() => resourceRef.value.key),
    queryFn: ({ pageParam }) => fetcher({ pageNumber: pageParam, pageSize }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (!lastPage.success || !lastPage.data) return undefined;
      const { pageNumber, totalRow } = lastPage.data;
      return pageNumber * pageSize < totalRow ? pageNumber + 1 : undefined;
    },
    staleTime: computed(() => resourceRef.value.staleTime)
  });

  /** 追加式扁平列表:全部已加载页的 records 依序合并 */
  const items = computed<T[]>(() => {
    const pages = query.data.value?.pages ?? [];
    return pages.flatMap(page => page.data?.records ?? []);
  });

  /** 总条数(取最后已加载页的 totalRow,接口每次返回最新值) */
  const totalRow = computed(() => {
    const pages = query.data.value?.pages ?? [];
    return pages.length ? (pages[pages.length - 1].data?.totalRow ?? 0) : 0;
  });

  /** 任意拉取进行中(首屏/加载更多/激活校验),驱动骨架屏与按钮防重入 */
  const loading = computed(() => query.isFetching.value);

  const hasMore = computed(() => query.hasNextPage.value ?? false);

  /** 加载下一页;在途时防重入 */
  function loadMore() {
    if (loading.value) return;
    void query.fetchNextPage();
  }

  /** 失效重载:标记缓存过期并重拉已加载的全部页(写后重载场景) */
  function refresh() {
    queryClient.invalidateQueries({ queryKey: resourceRef.value.key });
  }

  // 新批次写入钩子:监听长度推进,切片传出本批记录与起始下标
  watch(
    () => items.value.length,
    (len, prev = 0) => {
      if (len > prev) options?.onLoaded?.(items.value.slice(prev), prev);
    }
  );

  useKeepAliveRefetch(resourceRef, () => void query.refetch());

  return { items, totalRow, loading, hasMore, loadMore, refresh };
}
