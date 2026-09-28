// 首页看板 mock(对齐后端 /admin/dashboard 新增聚合接口)
// visit-trend 契约对齐 DashboardVisitTrendItemResponse:statDate(yyyy-MM-dd)/pv/uv
// message-region 契约对齐 DashboardMessageRegionResponse:region/count(审核通过口径)
// annual-review 契约对齐 AnnualReviewResponse:年度计数 + newCities/topMood/pv/uv/highlights
import { defineFakeRoute } from "vite-plugin-fake-server/client";

/** 对齐 ApiResult<T> 的成功响应 */
const ok = (data: unknown = null) => ({
  success: true,
  code: 200,
  msg: "操作成功",
  timestamp: Date.now(),
  data
});

/** 访问趋势条目 */
interface TrendItem {
  statDate: string;
  pv: number;
  uv: number;
}

/** 近 N 天访问趋势(逐日补齐,日期升序;数据量以日期为种子,同日刷新不跳变) */
function buildTrend(days: number): TrendItem[] {
  const result: TrendItem[] = [];
  const today = new Date();
  for (let offset = days - 1; offset >= 0; offset--) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const statDate = day.toISOString().slice(0, 10);
    const pv = 6 + (Number(statDate.replaceAll("-", "")) % 18);
    result.push({ statDate, pv, uv: Math.max(1, Math.round(pv / 2)) });
  }
  return result;
}

export default defineFakeRoute([
  // 访问趋势(GET /admin/dashboard/visit-trend;逐日补齐,日期升序)
  {
    url: "/admin/dashboard/visit-trend",
    method: "get",
    response: ({ query }) => {
      const days = Math.min(Math.max(Number(query.days ?? 30), 7), 365);
      return ok(buildTrend(days));
    }
  },
  // 留言地区分布(GET /admin/dashboard/message-region;审核通过口径,条数降序)
  {
    url: "/admin/dashboard/message-region",
    method: "get",
    response: ({ query }) => {
      const top = Number(query.top ?? 10);
      const regions = [
        { region: "四川成都", count: 12 },
        { region: "云南大理", count: 8 },
        { region: "广东广州", count: 6 },
        { region: "北京", count: 5 },
        { region: "浙江杭州", count: 5 },
        { region: "上海", count: 4 },
        { region: "湖北武汉", count: 3 },
        { region: "未知", count: 2 }
      ];
      return ok(regions.slice(0, top));
    }
  },
  // 年度恋爱回顾(GET /admin/dashboard/annual-review/{year};契约对齐 AnnualReviewResponse)
  {
    url: "/admin/dashboard/annual-review/:year",
    method: "get",
    response: ({ params }) => {
      const year = Number(params.year);
      return ok({
        year,
        diaryCount: 24,
        momentsCount: 36,
        photoCount: 48,
        footprintCount: 7,
        newCities: ["大理", "稻城"],
        topMood: "sunny",
        loveListDone: 12,
        loveListTotal: 30,
        pv: 520,
        uv: 233,
        highlights: [
          {
            type: "moments",
            time: `${year}-05-21 10:00:00`,
            title: "海边的日落",
            content: "我们坐在礁石上,看太阳一点点沉下去。",
            imageUrl: null
          },
          {
            type: "diary",
            time: `${year}-12-31 23:30:00`,
            title: "跨年夜的日记",
            content: "新年愿望:继续和对方一起认真记录生活。",
            imageUrl: null
          }
        ]
      });
    }
  }
]);
