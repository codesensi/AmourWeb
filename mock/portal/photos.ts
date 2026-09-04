// 恋爱相册 mock(GET /love/photo 分页;48 张渐变占位照片,移植原站 PORTAL_MOCK.photos)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

/** 占位图渐变色池:批量生成的示例照片循环取色,视觉上区分页与页 */
const PHOTO_GRADIENTS = [
  ["#ffd3d3", "#cfe8ff"],
  ["#d3ffe3", "#cfe0ff"],
  ["#fff3d3", "#ffd6e0"],
  ["#e3d3ff", "#cfeaff"],
  ["#d3e8ff", "#e8ffd3"]
];

/** 批量生成示例照片的文案池 */
const PHOTO_LABELS = [
  "海边漫步",
  "山顶日出",
  "巷口的猫",
  "一起逛的夜市",
  "雨后的彩虹",
  "冬天的初雪",
  "游乐园的一天",
  "深夜的电影院",
  "郊外的野餐",
  "咖啡馆的下午",
  "花田里的合影",
  "车站的告别"
];

/** 内联 SVG 占位图(保证离线可用;from/to 为渐变色) */
function mockPhoto(label: string, from: string, to: string): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="600" height="400" fill="url(#g)"/>` +
    `<text x="300" y="205" font-size="26" fill="#ffffff" text-anchor="middle" font-family="serif">${label}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/** 批量生成示例照片(凑足多页数据,便于查看「加载更多」的分页效果) */
const photos = Array.from({ length: 48 }, (_, i) => {
  const label =
    PHOTO_LABELS[i % PHOTO_LABELS.length] +
    " · " +
    (Math.floor(i / PHOTO_LABELS.length) + 1);
  const gradient = PHOTO_GRADIENTS[i % PHOTO_GRADIENTS.length];
  const month = String((i % 12) + 1).padStart(2, "0");
  const day = String((i % 27) + 1).padStart(2, "0");
  return {
    img: mockPhoto(label, gradient[0], gradient[1]),
    text: label,
    date: `2025-${month}-${day}`
  };
});

export default defineFakeRoute([
  // 相册分页(GET /love/photo)
  {
    url: "/love/photo",
    method: "get",
    response: ({ query }) => {
      const pageNumber = Number(query?.pageNumber ?? 1);
      const pageSize = Number(query?.pageSize ?? 6);
      const records = photos.slice(
        (pageNumber - 1) * pageSize,
        pageNumber * pageSize
      );
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          records,
          pageNumber,
          pageSize,
          totalRow: photos.length,
          totalPage: Math.ceil(photos.length / pageSize)
        }
      };
    }
  }
]);
