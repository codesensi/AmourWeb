// mock 公共工具 —— 跨 mock 文件复用的响应构造器
// (mock 目录保持零 src 别名依赖,便于随 mock-only 接口的去留决策整体移除)

/**
 * 分页 mock 响应统一包装(GET 分页接口)。
 * <p>
 * 按 pageNumber/pageSize 对全量列表切片,包装为与后端
 * `Result<PageResult<T>>` 同构的响应契约(success/code/msg/timestamp + 分页五字段);
 * 缺省分页 1/20 对齐后端 BasePage 缺省值。
 * 管理端分页行默认注入 canEdit=true(mock 环境无登录态区分,模拟"本人视角"的全可改,
 * 对齐后端分页行的数据范围回填契约,避免前端按钮门控在 mock 下整体隐藏);
 * 门户分页行与留言簿等无 canEdit 契约的接口,调用时传 { canEdit: false } 保持响应形状。
 *
 * @param list 全量数据列表
 * @param query 请求查询参数(pageNumber/pageSize,缺省 1/20)
 * @param options canEdit:是否为每行注入 canEdit=true(默认 true,管理端口径)
 */
export function fakePageResponse<T>(
  list: T[],
  query?: { pageNumber?: unknown; pageSize?: unknown },
  options?: { canEdit?: boolean }
) {
  const pageNumber = Number(query?.pageNumber ?? 1);
  const pageSize = Number(query?.pageSize ?? 20);
  const injectCanEdit = options?.canEdit ?? true;
  const records = list
    .slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
    .map(record =>
      injectCanEdit ? { canEdit: true, ...record } : { ...record }
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
