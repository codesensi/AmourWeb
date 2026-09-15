// 通知中心 mock(对齐后端 /sys/notice 接口)
// list 契约对齐 NoticeResponse:id(字符串化雪花ID,避免前端精度丢失)/title/content/createTime/read
// read 契约:请求体为通知ID字符串数组(单条/批量),缺省请求体=全部未读;按唯一键幂等,重复提交不报错
import { defineFakeRoute } from "vite-plugin-fake-server/client";

// 通知样例(id 沿用后端 12000 分段惯例;read 为 mock 内存态,dev server 重启即重置)
const notices = [
  {
    id: "12004",
    title: "例行维护预告",
    content:
      "小站将于近期进行例行维护,期间可能出现短暂无法访问的情况。维护完成后所有功能将恢复正常,感谢理解与支持。",
    createTime: "2026-02-14 18:00:00",
    read: false
  },
  {
    id: "12003",
    title: "留言板已开放",
    content:
      "留言板功能已正式开放,欢迎留下你们的甜蜜瞬间与建议,让小站更加温暖。",
    createTime: "2026-02-14 09:00:00",
    read: false
  },
  {
    id: "12002",
    title: "系统配置使用指引",
    content:
      "可在「系统管理 > 系统配置」中调整站点名称、ICP 备案、恋爱计时起点等配置项;敏感配置仅服务端内部使用,不会下发至门户。",
    createTime: "2026-01-01 12:00:00",
    read: true
  },
  {
    id: "12001",
    title: "欢迎使用爱慕情侣小站",
    content:
      "小站已部署完成,这里会记录你们的点滴时光。通知中心将推送系统事件与重要提醒,记得常来看看。",
    createTime: "2026-01-01 09:00:00",
    read: true
  }
];

/** 统一响应包装 */
function ok(data: unknown) {
  return {
    success: true,
    code: 200,
    msg: "操作成功",
    timestamp: Date.now(),
    data
  };
}

export default defineFakeRoute([
  // 通知列表(GET /sys/notice/list?limit=;按创建时间倒序,limit 截断)
  {
    url: "/sys/notice/list",
    method: "get",
    response: ({ query }) => {
      const limit = Number(query.limit ?? 20);
      const sorted = [...notices].sort((a, b) =>
        b.createTime.localeCompare(a.createTime)
      );
      return ok(sorted.slice(0, Math.max(limit, 0)));
    }
  },
  // 标记已读(POST /sys/notice/read;请求体为通知ID数组,缺省=全部未读;幂等)
  {
    url: "/sys/notice/read",
    method: "post",
    response: ({ body }) => {
      // 请求体直传数组(单条/批量);无请求体=全部未读
      const ids = Array.isArray(body) ? body.map(String) : null;
      notices.forEach(item => {
        if (ids === null || ids.includes(item.id)) {
          item.read = true;
        }
      });
      return ok(null);
    }
  }
]);
