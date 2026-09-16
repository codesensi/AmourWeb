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
  },
  {
    id: 7,
    city: "西安",
    longitude: 108.9402,
    latitude: 34.3416,
    arrivalDate: "2025-10-03",
    photoUrl: mockPhoto("西安 · 大唐不夜城", "#ffd9c0", "#ffbf9f"),
    remark: "城墙上一整圈,灯把半个长安都点亮了。"
  },
  {
    id: 8,
    city: "三亚",
    longitude: 109.5119,
    latitude: 18.2528,
    arrivalDate: "2025-12-30",
    photoUrl: mockPhoto("三亚 · 跨年的海", "#c9f0ff", "#b8e2ff"),
    remark: "在海边跨年,烟花落在海上,我们说好了每年都出来走一走。"
  },
  {
    id: 9,
    city: "哈尔滨",
    longitude: 126.642464,
    latitude: 45.756967,
    arrivalDate: "2026-01-15",
    photoUrl: mockPhoto("哈尔滨 · 冰雪大世界", "#d9f3ff", "#a9dcff"),
    remark: "零下二十度,手里的糖葫芦比冰雕还甜。"
  },
  {
    id: 10,
    city: "杭州",
    longitude: 120.15507,
    latitude: 30.274085,
    arrivalDate: "2026-03-22",
    photoUrl: mockPhoto("杭州 · 西湖春雨", "#d8ffd9", "#c2f0d8"),
    remark: "断桥没断,雨也没停,苏堤走了一半就撑伞笑了一路。"
  },
  {
    id: 11,
    city: "丽江",
    longitude: 100.227752,
    latitude: 26.855174,
    arrivalDate: "2026-04-12",
    photoUrl: mockPhoto("丽江 · 玉龙雪山", "#d9f3ff", "#cfe9ff"),
    remark: "在雪山脚下晒太阳,古城的石板路被我们走得慢慢的。"
  },
  {
    id: 12,
    city: "东京",
    longitude: 139.6917,
    latitude: 35.6895,
    arrivalDate: "2026-05-17",
    photoUrl: mockPhoto("东京 · 目黑川黄昏", "#ffd6e0", "#ffc4d6"),
    remark: "追着樱花尾巴跑了三条街,在居酒屋干杯到深夜。"
  },
  {
    id: 13,
    city: "巴黎",
    longitude: 2.3522,
    latitude: 48.8566,
    arrivalDate: "2026-06-14",
    photoUrl: mockPhoto("巴黎 · 塞纳河畔", "#e0d6ff", "#c9bfff"),
    remark: "塞纳河的风和铁塔的灯,都替我们保管了这个傍晚。"
  },
  {
    id: 14,
    city: "圣托里尼",
    longitude: 25.4322,
    latitude: 36.3932,
    arrivalDate: "2026-07-08",
    photoUrl: mockPhoto("圣托里尼 · 蓝顶教堂", "#c9e8ff", "#b3dcff"),
    remark: "蓝顶教堂和白墙之间,藏着我们看过最美的日落。"
  },
  {
    id: 15,
    city: "雷克雅未克",
    longitude: -21.9266,
    latitude: 64.1466,
    arrivalDate: "2026-09-20",
    photoUrl: mockPhoto("冰岛 · 极光之夜", "#d0ffe8", "#b0f0dd"),
    remark: "等了三个小时,极光出现的那一刻,连呼吸都想定格。"
  },
  {
    id: 16,
    city: "纽约",
    longitude: -74.006,
    latitude: 40.7128,
    arrivalDate: "2026-11-26",
    photoUrl: null,
    remark: "时代广场的人潮里,我们只看得见彼此。"
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
