// 情侣日记 mock(GET /portal/diary/page 分页;双人日记按 user_id 分属两人)
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { mockPhoto } from "./mock-photo";
import { fakePageResponse } from "../utils";

/** 两位记录人的展示信息(头像用内联 SVG 占位,保证离线可用;username/nickname/qq 对齐后端 sys_user 种子) */
const writers = [
  {
    userId: "2",
    username: "li",
    nickname: "Li",
    qq: "2623669948",
    avatar: mockPhoto("li", "#fdeef0", "#fbcfe8")
  },
  {
    userId: "3",
    username: "su",
    nickname: "Su",
    qq: "673822943",
    avatar: mockPhoto("su", "#e8f0fe", "#c7d9f7")
  }
];

/** 心情标识池(与后端 DiaryMoodEnum 对齐;unknown 表示不标记心情) */
const moods = [
  "sunny",
  "cloudy",
  "overcast",
  "rainy",
  "drizzle",
  "thunderstorm",
  "windy",
  "snowy",
  "sleet",
  "hail",
  "starry",
  "bloom",
  "moon",
  "rainbow",
  "fog",
  "leaf",
  "sunset",
  "meteor",
  "aurora",
  "unknown",
  "sunny",
  "drizzle",
  "unknown",
  "starry"
];

/** 日记内容池 */
const contents = [
  "今天一起去了菜市场,她挑西红柿的样子像在选宝石。晚饭做了番茄牛腩,汤底很浓,是家的味道。",
  "加班到很晚,回家路上看见他在楼下等我,手里的奶茶还是热的。原来被人惦记是这种感觉。",
  "周末把阳台收拾了出来,绿萝又发了新芽。我们约定每周日一起给它浇水。",
  "下雨了,我们窝在沙发里重看了一遍老电影。他说台词比记忆里的更甜。一起规划了明年的旅行,第一站是海边。期待是一件让日子发光的事。一起规划了明年的旅行,第一站是海边。期待是一件让日子发光的事。一起规划了明年的旅行,第一站是海边。期待是一件让日子发光的事。",
  "今天吵了一点点架,又和好了。原来磨合不是妥协,是学会把「我」变成「我们」。",
  "他学会了做舒芙蕾,虽然塌了,但是很好吃。认真生活的样子真好看。",
  "一起规划了明年的旅行,第一站是海边。期待是一件让日子发光的事。"
];

/** 批量生成日记(两人的日记交替,凑足多页数据) */
const diaryList = Array.from({ length: 18 }, (_, i) => {
  const writer = writers[i % writers.length];
  const month = String(((i * 5) % 12) + 1).padStart(2, "0");
  const day = String((i % 27) + 1).padStart(2, "0");
  return {
    id: String(i + 1),
    userId: writer.userId,
    username: writer.username,
    nickname: writer.nickname,
    qq: writer.qq,
    avatar: writer.avatar,
    diaryDate: `2025-${month}-${day}`,
    mood: moods[i % moods.length],
    content: contents[i % contents.length]
  };
});

export default defineFakeRoute([
  // 日记分页(GET /portal/diary)
  {
    url: "/portal/diary/page",
    method: "get",
    response: ({ query }) => fakePageResponse(diaryList, query)
  }
]);
