// 门户主角 mock(GET /portal/hero,免登录;契约对齐后端 HeroResponse/HeroUserResponse)
// 头像字段为空表示用户表未上传头像:前端按「QQ 头像链路优先,其次上传头像,最后本地兜底图」展示
import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  {
    url: "/portal/hero",
    method: "get",
    response: () => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          male: { nickname: "Li", avatar: null, qq: "2623669948" },
          female: { nickname: "Su", avatar: null, qq: "673822943" }
        }
      };
    }
  }
]);
