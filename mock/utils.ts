// mock 公共工具 —— 跨 mock 文件复用的响应构造器
// (mock 目录保持零 src 别名依赖,便于随 mock-only 接口的去留决策整体移除)

/**
 * 分页 mock 响应统一包装(GET 分页接口)。
 * <p>
 * 按 pageNumber/pageSize 对全量列表切片,包装为与后端
 * `Result<PageResult<T>>` 同构的响应契约(success/code/msg/timestamp + 分页五字段)。
 *
 * @param list 全量数据列表
 * @param query 请求查询参数(pageNumber/pageSize,缺省 1/6)
 */
export function fakePageResponse<T>(
  list: T[],
  query?: { pageNumber?: unknown; pageSize?: unknown }
) {
  const pageNumber = Number(query?.pageNumber ?? 1);
  const pageSize = Number(query?.pageSize ?? 6);
  const records = list.slice(
    (pageNumber - 1) * pageSize,
    pageNumber * pageSize
  );
  return {
    success: true,
    code: 200,
    msg: "操作成功",
    timestamp: Date.now(),
    data: {
      records,
      pageNumber,
      pageSize,
      totalRow: list.length,
      totalPage: Math.ceil(list.length / pageSize)
    }
  };
}
