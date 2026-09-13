// 门户一言 mock(GET /portal/saying,免登录;契约对齐后端 SayingResponse,
// 与 api/portal.ts getPortalSaying 一致:content 可能为空,为空时前端不展示)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  {
    url: "/portal/saying",
    method: "get",
    response: () => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          content: "落俗不可避免,浪漫至死不渝",
          source: "",
          author: ""
        }
      };
    }
  }
]);
