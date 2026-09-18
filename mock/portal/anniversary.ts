// 纪念日 mock(GET /portal/anniversary 分页,按下一次发生日升序,首条即最近纪念日)
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { fakePageResponse } from "../utils";

const anniversaryList = [
  {
    id: 1,
    name: "她的生日",
    type: 1,
    anniversaryDate: "2001-06-18",
    repeatYearly: true
  },
  {
    id: 2,
    name: "他的生日",
    type: 1,
    anniversaryDate: "2000-11-02",
    repeatYearly: true
  },
  {
    id: 3,
    name: "在一起纪念日",
    type: 2,
    anniversaryDate: "2022-05-21",
    repeatYearly: true
  },
  {
    id: 4,
    name: "第一次旅行出发",
    type: 2,
    anniversaryDate: "2023-10-01",
    repeatYearly: false
  },
  {
    id: 5,
    name: "情人节",
    type: 3,
    anniversaryDate: "2000-02-14",
    repeatYearly: true
  },
  {
    id: 6,
    name: "圣诞节",
    type: 3,
    anniversaryDate: "2000-12-25",
    repeatYearly: true
  }
];

/** 下一次发生日排序键(与 src/utils/anniversary 的 nextOccurrenceDays 语义对齐;
 *  mock 目录保持零 src 别名依赖,故在此内联实现:每年重复取今年/明年同月日,一次性日期已过去则排最后) */
function nextOccurrenceKey(item: (typeof anniversaryList)[number]): string {
  const mmdd = item.anniversaryDate.slice(5);
  if (!item.repeatYearly) return `9999-${mmdd}`;
  const now = new Date();
  const todayMmdd = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const year = mmdd >= todayMmdd ? now.getFullYear() : now.getFullYear() + 1;
  return `${year}-${mmdd}`;
}

/** 按下一次发生日升序排列(分页切片顺序即全局顺序) */
const ordered = [...anniversaryList].sort((a, b) =>
  nextOccurrenceKey(a).localeCompare(nextOccurrenceKey(b))
);

export default defineFakeRoute([
  // 纪念日分页(GET /portal/anniversary;按下一次发生日升序)
  {
    url: "/portal/anniversary",
    method: "get",
    response: ({ query }) => fakePageResponse(ordered, query)
  }
]);
