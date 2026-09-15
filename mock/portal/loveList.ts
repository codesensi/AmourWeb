// 恋爱清单 mock(GET /portal/love-list 分页;7 条清单,移植原站 PORTAL_MOCK.loveList)
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { mockPhoto } from "./mockPhoto";
import { fakePageResponse } from "../utils";

const loveList = [
  { text: "一起期待未来甜蜜小生活💑", done: false },
  { text: "一起为我们的小家添置东西🏠", done: false },
  { text: "一起挑选婚纱👗", done: false },
  { text: "一起去见父母👨‍👩‍👧‍👦", done: false },
  { text: "一起听一次演唱会🎤", done: true, img: mockPhoto("演唱会的回忆") },
  { text: "一起去看樱花🌸", done: false },
  { text: "一起存钱💰", done: false }
];

export default defineFakeRoute([
  // 恋爱清单分页(GET /portal/love-list)
  {
    url: "/portal/love-list",
    method: "get",
    response: ({ query }) => fakePageResponse(loveList, query)
  }
]);
