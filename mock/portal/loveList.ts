// 恋爱清单 mock(GET /love/list 分页;7 条清单,移植原站 PORTAL_MOCK.loveList)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

/** 内联 SVG 占位图(保证离线可用;from/to 为渐变色,缺省为原站蓝粉渐变) */
function mockPhoto(label: string, from?: string, to?: string): string {
  const f = from || "#ffd3d3";
  const t = to || "#cfe8ff";
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    `<stop offset="0" stop-color="${f}"/><stop offset="1" stop-color="${t}"/></linearGradient></defs>` +
    `<rect width="600" height="400" fill="url(#g)"/>` +
    `<text x="300" y="205" font-size="26" fill="#ffffff" text-anchor="middle" font-family="serif">${label}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

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
  // 恋爱清单分页(GET /love/list?page=&limit=)
  {
    url: "/love/list",
    method: "get",
    response: ({ query }) => {
      const page = Number(query.page ?? 1);
      const limit = Number(query.limit ?? 6);
      const records = loveList.slice((page - 1) * limit, page * limit);
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          records,
          pageNumber: page,
          pageSize: limit,
          totalRow: loveList.length,
          totalPages: Math.ceil(loveList.length / limit)
        }
      };
    }
  }
]);
