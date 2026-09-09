// QQ 信息 mock(GET /qq-info,免登录;契约对齐后端 QqInfoResponse)
// 返回「后端降级后」的形态:后端 qq-api 失败时已按 qq-avatar 以 QQ 号拼接(qlogo 官方头像),头像恒非空,昵称可空;
// 本地默认返回降级地址 + 空昵称,验证「手动填写昵称」路径;如需验证昵称回填路径,可为 nickname 填入示例值
import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  {
    url: "/qq-info",
    method: "get",
    response: ({ query }) => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          avatarUrl: `https://q.qlogo.cn/headimg_dl?dst_uin=${String(query.qq ?? "")}&spec=640&img_type=jpg`,
          nickname: ""
        }
      };
    }
  }
]);
