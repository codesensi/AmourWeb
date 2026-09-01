// 静态路由 rank 集中维护（动态菜单 rank 由后端 getCurrentUser 下发）

/** 平台规定只有 home 路由的 rank 才能为 0，所以后端在返回 rank 的时候需要从非 0 开始 */
const home = 0;

/** 错误页为功能性基础设施，仅隐藏菜单，路由保留 */
const error = 10;

const about = 17;

export { home, error, about };
