// QQ 信息 mock(GET /qq-info,免登录;契约对齐后端 QqInfoResponse)
// 默认返回空值:本地验证 avatar-service 兜底与「手动填写昵称」路径;
// 如需验证接口头像/昵称回填路径,可为 avatarUrl/nickname 填入示例值
import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  {
    url: "/qq-info",
    method: "get",
    response: () => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          avatarUrl: "https://q.qlogo.cn/g?b=qq&nk=2623669948&s=640",
          nickname: "龙猫"
        }
      };
    }
  }
]);
