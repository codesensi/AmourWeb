// 情侣日记管理 mock(对齐后端 /admin/diary 接口)
// page 契约对齐 DiaryPageResponse:id/userId/username/avatar/diaryDate/mood/content/createTime
// insert/update 契约对齐 DiarySaveRequest:记录人由后端取当前登录人填充,不接收 userId
// delete 契约对齐 DELETE /admin/diary/delete/{ids}:批量逻辑删除(ids 逗号拼接)
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { mockPhoto } from "./portal/mock-photo";
import { fakePageResponse } from "./utils";

/** 对齐 ApiResult<T> 的成功响应 */
const ok = (data: unknown = null, msg = "操作成功") => ({
  success: true,
  code: 200,
  msg,
  timestamp: Date.now(),
  data
});

/** 对齐 ApiResult<T> 的失败响应 */
const fail = (msg: string) => ({
  success: false,
  code: 400,
  msg,
  timestamp: Date.now(),
  data: null
});

/** 两位记录人的展示信息(头像用内联 SVG 占位,保证离线可用;用户名对齐后端 sys_user 种子) */
const writers = [
  {
    userId: 2,
    username: "li",
    avatar: mockPhoto("li", "#fdeef0", "#fbcfe8")
  },
  {
    userId: 3,
    username: "su",
    avatar: mockPhoto("su", "#e8f0fe", "#c7d9f7")
  }
];

/** 心情标识池(与后端 DiaryMoodEnum 对齐;unknown 表示不标记) */
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

/** 日记内容池(与门户 mock 同源) */
const contents = [
  "今天一起去了菜市场,她挑西红柿的样子像在选宝石。晚饭做了番茄牛腩,汤底很浓,是家的味道。",
  "加班到很晚,回家路上看见他在楼下等我,手里的奶茶还是热的。原来被人惦记是这种感觉。",
  "周末把阳台收拾了出来,绿萝又发了新芽。我们约定每周日一起给它浇水。",
  "下雨了,我们窝在沙发里重看了一遍老电影。他说台词比记忆里的更甜。",
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
    avatar: writer.avatar,
    diaryDate: `2025-${month}-${day}`,
    mood: moods[i % moods.length],
    content: contents[i % contents.length],
    createTime: `2025-${month}-${day} 21:00:00`
  };
});

/** 自增主键(内存数据源递增,语义对齐后端雪花字符串) */
let nextId = 5000;

/** 记录人展示信息(新增日记默认取门户男主) */
const writerOf = (userId: number) =>
  writers.find(writer => writer.userId === userId) ?? writers[0];

export default defineFakeRoute([
  // 分页查询(GET /admin/diary/page;全量)
  {
    url: "/admin/diary/page",
    method: "get",
    response: ({ query }) => {
      const { userId, diaryDate, mood, pageNumber = 1, pageSize = 20 } = query;
      const filtered = diaryList.filter(
        item =>
          (userId === undefined ||
            userId === "" ||
            item.userId === Number(userId)) &&
          (!diaryDate || item.diaryDate === diaryDate) &&
          (mood === undefined || mood === "" || item.mood === mood)
      );
      filtered.sort((a, b) => b.diaryDate.localeCompare(a.diaryDate));
      return fakePageResponse(filtered, { pageNumber, pageSize });
    }
  },
  // 新增(POST /admin/diary/insert;记录人默认取门户男主)
  {
    url: "/admin/diary/insert",
    method: "post",
    response: ({ body }) => {
      const writer = writerOf(2);
      diaryList.push({
        id: String(nextId++),
        userId: writer.userId,
        username: writer.username,
        avatar: writer.avatar,
        diaryDate: String(body.diaryDate ?? ""),
        mood: String(body.mood ?? ""),
        content: String(body.content ?? ""),
        createTime: new Date().toISOString().slice(0, 19).replace("T", " ")
      });
      return ok(null, "新增情侣日记成功");
    }
  },
  // 修改(PUT /admin/diary/update;按 id 覆盖可编辑字段,记录人归属不可变)
  {
    url: "/admin/diary/update",
    method: "put",
    response: ({ body }) => {
      const row = diaryList.find(item => item.id === String(body.id));
      if (!row) {
        return fail("日记不存在");
      }
      row.diaryDate = String(body.diaryDate ?? "");
      row.mood = String(body.mood ?? "");
      row.content = String(body.content ?? "");
      return ok(null, "修改情侣日记成功");
    }
  },
  // 批量逻辑删除(DELETE /admin/diary/delete/:ids;任一 id 不存在时整批失败,对齐后端校验)
  {
    url: "/admin/diary/delete/:ids",
    method: "delete",
    response: ({ query }) => {
      const ids = String(query.ids).split(",");
      const missing = ids.some(id => !diaryList.some(item => item.id === id));
      if (missing) {
        return fail("日记不存在");
      }
      ids.forEach(id => {
        const idx = diaryList.findIndex(item => item.id === id);
        if (idx >= 0) diaryList.splice(idx, 1);
      });
      return ok(null, "删除情侣日记成功");
    }
  }
]);
