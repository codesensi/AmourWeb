// 头像上传
import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  {
    url: "/file/upload/avatar",
    method: "post",
    response: () => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        // 占位图 URL，模拟上传成功后的文件地址
        data: {
          url: "https://avatars.githubusercontent.com/u/44761321"
        }
      };
    }
  }
]);
