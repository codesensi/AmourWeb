// 门户纪念日 mock(对齐后端 /portal/anniversary 接口,免登录)
// page/next 契约对齐 PortalAnniversaryResponse:id(字符串化)/name/type/anniversaryDate/repeatYearly
// 口径对齐后端:仅显示记录,按下一次发生日升序 → id 升序;next 取首条,无数据为 null
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { fakePageResponse } from "../utils";

/** 内存数据源(门户固定仅下发显示记录,行字段与 PortalAnniversaryResponse 一致) */
const anniversaries = [
  {
    id: "1",
    name: "小满的生日",
    type: "birthday",
    anniversaryDate: "1998-05-20",
    repeatYearly: true
  },
  {
    id: "2",
    name: "在一起的纪念日",
    type: "anniversary",
    anniversaryDate: "2020-02-14",
    repeatYearly: true
  },
  {
    id: "3",
    name: "第一次旅行",
    type: "anniversary",
    anniversaryDate: "2026-10-01",
    repeatYearly: false
  },
  {
    id: "4",
    name: "元旦",
    type: "festival",
    anniversaryDate: "2027-01-01",
    repeatYearly: true
  }
];

/** 下一次发生日排序键(对齐后端 nextOccurrenceColumn:每年重复取今年/明年的同月日,一次性日期已过去垫底) */
const nextOccurrenceKey = (item: (typeof anniversaries)[number]) => {
  const today = new Date();
  const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const mmdd = item.anniversaryDate.slice(5);
  if (item.repeatYearly) {
    const candidate = `${today.getFullYear()}-${mmdd}`;
    return candidate >= isoToday
      ? candidate
      : `${today.getFullYear() + 1}-${mmdd}`;
  }
  return item.anniversaryDate >= isoToday ? item.anniversaryDate : "9999-12-31";
};

/** 对齐 ApiResult<T> 的成功响应 */
const ok = (data: unknown = null, msg = "操作成功") => ({
  success: true,
  code: 200,
  msg,
  timestamp: Date.now(),
  data
});

/** 按下一次发生日升序 → id 升序的展示序列 */
const sortedVisible = () =>
  [...anniversaries].sort(
    (a, b) =>
      nextOccurrenceKey(a).localeCompare(nextOccurrenceKey(b)) ||
      Number(a.id) - Number(b.id)
  );

export default defineFakeRoute([
  // 纪念日分页(GET /portal/anniversary/page,免登录;门户响应无 canEdit 字段)
  {
    url: "/portal/anniversary/page",
    method: "get",
    response: ({ query }) =>
      fakePageResponse(sortedVisible(), query, { canEdit: false })
  },
  // 下一个纪念日(GET /portal/anniversary/next;首页「下一个纪念日」卡片,无数据为 null)
  {
    url: "/portal/anniversary/next",
    method: "get",
    response: () => ok(sortedVisible()[0] ?? null)
  }
]);
