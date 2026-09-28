// 门户访问统计 mock(GET /portal/visit/total 页脚「已被阅读 N 次」;POST /portal/visit/report 访问上报)
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
  },
  // 访问上报(POST /portal/visit/report;后端静默计数,前端不消费响应体)
  {
    url: "/portal/visit/report",
    method: "post",
    response: () => ({
      success: true,
      code: 200,
      msg: "操作成功",
      timestamp: Date.now(),
      data: null
    })
  }
]);
