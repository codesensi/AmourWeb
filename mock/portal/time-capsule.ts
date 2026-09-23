// 时间胶囊 mock(GET /portal/time-capsule/page 分页;锁定中的信 content 为 null,模拟服务端到期裁剪)
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { fakePageResponse } from "../utils";

const capsules = [
  {
    id: "1",
    title: "在一起一周年写给彼此",
    content:
      "今天是我们的第一年。想对你说:谢谢你把平凡的日子过成了值得收藏的杂志。往后的每一年,我们都要像今天一样,认真记录,好好相爱。",
    openTime: "2025-05-21 00:00:00"
  },
  {
    id: "2",
    title: "写给二十五岁的她",
    content: null,
    openTime: "2026-06-18 00:00:00"
  },
  {
    id: "3",
    title: "跨年夜的约定",
    content: null,
    openTime: "2026-01-01 00:00:00"
  },
  {
    id: "4",
    title: "三十岁再打开",
    content: null,
    openTime: "2030-06-18 00:00:00"
  },
  {
    id: "5",
    title: "写给十年后的我们",
    content: null,
    openTime: "2032-05-21 00:00:00"
  }
];

export default defineFakeRoute([
  // 时间胶囊分页(GET /portal/time-capsule/page)
  {
    url: "/portal/time-capsule/page",
    method: "get",
    response: ({ query }) => fakePageResponse(capsules, query)
  }
]);
