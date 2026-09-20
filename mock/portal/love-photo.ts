// 恋爱相册 mock(GET /portal/love-photo 分页;48 张渐变占位照片,移植原站 PORTAL_MOCK.photos)
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { mockPhoto } from "./mock-photo";
import { fakePageResponse } from "../utils";

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

/** 标签池:与后端 portal_love_photo.tags 逗号分隔多值语义对齐(响应为数组) */
const PHOTO_TAGS = ["旅行", "日常", "节日"];

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
    id: String(1000 + i),
    img: mockPhoto(label, gradient[0], gradient[1]),
    text: label,
    date: `2025-${month}-${day}`,
    // 每 6 张追加一个「节日」标签,演示一张照片归入多个分册的效果
    tags:
      i % 6 === 5
        ? [PHOTO_TAGS[i % PHOTO_TAGS.length], "节日"]
        : [PHOTO_TAGS[i % PHOTO_TAGS.length]]
  };
});

export default defineFakeRoute([
  // 相册分页(GET /portal/love-photo/page;对齐后端 PortalLovePhotoController 路由)
  {
    url: "/portal/love-photo/page",
    method: "get",
    response: ({ query }) => fakePageResponse(photos, query)
  },
  // 画册封面(GET /portal/love-photo/cover;sort 首位即 photos[0],画册为空时 data 为 null)
  {
    url: "/portal/love-photo/cover",
    method: "get",
    response: () => ({
      success: true,
      code: 200,
      msg: "操作成功",
      timestamp: Date.now(),
      data: photos[0] ?? null
    })
  }
]);
