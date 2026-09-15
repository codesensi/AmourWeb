// 门户访问统计 mock(GET /portal/visit/total,页脚「已被阅读 N 次」)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  // 累计访问统计(GET /portal/visit/total)
  {
    url: "/portal/visit/total",
    method: "get",
    response: () => ({
      success: true,
      code: 200,
      msg: "操作成功",
      timestamp: Date.now(),
      data: { pv: 520131, uv: 1314 }
    })
  }
]);
