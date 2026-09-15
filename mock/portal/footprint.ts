// 足迹地图 mock(GET /portal/footprint 全量列表;photoUrl 为内联 SVG 占位图)
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { mockPhoto } from "./mockPhoto";

const footprints = [
  {
    id: 1,
    city: "成都",
    longitude: 104.065735,
    latitude: 30.659462,
    arrivalDate: "2023-02-15",
    photoUrl: mockPhoto("成都 · 火锅与宽窄巷子", "#ffe3d3", "#ffd6c0"),
    remark: "第一次一起旅行,锦里的灯笼亮起来的时候,像置身电影里。"
  },
  {
    id: 2,
    city: "大理",
    longitude: 100.22504,
    latitude: 25.6065,
    arrivalDate: "2023-07-02",
    photoUrl: mockPhoto("大理 · 洱海日出", "#d3ecff", "#cfe0ff"),
    remark: "在洱海边看了日出,风很轻,时间也很慢。"
  },
  {
    id: 3,
    city: "重庆",
    longitude: 106.504962,
    latitude: 29.533155,
    arrivalDate: "2024-04-05",
    photoUrl: mockPhoto("重庆 · 山城夜色", "#f3e3ff", "#d9c7f7"),
    remark: "8D 魔幻城市,我们迷路了三次,笑了一路。"
  },
  {
    id: 4,
    city: "厦门",
    longitude: 118.089425,
    latitude: 24.479833,
    arrivalDate: "2024-10-01",
    photoUrl: mockPhoto("厦门 · 环岛路骑行", "#d3ffe3", "#c8f7dc"),
    remark: "环岛路骑了整个下午,海风把头发吹得很乱,心里很静。"
  },
  {
    id: 5,
    city: "北京",
    longitude: 116.407387,
    latitude: 39.904179,
    arrivalDate: "2025-05-21",
    photoUrl: null,
    remark: "在一起纪念日,我们在故宫的城墙下许了愿。"
  },
  {
    id: 6,
    city: "青岛",
    longitude: 120.382639,
    latitude: 36.067082,
    arrivalDate: "2025-08-20",
    photoUrl: mockPhoto("青岛 · 八大关", "#fff3d3", "#ffe0b8"),
    remark: "喝了袋装啤酒,走了八大关,把夏天留在了海边。"
  }
];

export default defineFakeRoute([
  // 足迹全量(GET /portal/footprint)
  {
    url: "/portal/footprint",
    method: "get",
    response: () => ({
      success: true,
      code: 200,
      msg: "操作成功",
      timestamp: Date.now(),
      data: footprints
    })
  }
]);
