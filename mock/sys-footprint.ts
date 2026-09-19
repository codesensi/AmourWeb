// 足迹地图管理 mock(对齐后端 /sys/footprint 接口)
// page 契约对齐 FootprintPageResponse:id(字符串化)/city/placeName/longitude/latitude/arrivalDate/photoUrl/remark/createTime
// insert/update 契约对齐 FootprintInsertRequest/UpdateRequest:照片以 URL 直存(上传后保存记录时绑定)
// delete 契约对齐 DELETE /sys/footprint/delete/{ids}:批量逻辑删除(ids 逗号拼接)
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

/** 内存数据源(photoUrl 直存目标形态;mock 下为内联 SVG 占位,真实后端为 /file/view/{id} 或外链) */
const footprints = [
  {
    id: "1",
    city: "成都",
    placeName: "成都大熊猫繁育研究基地",
    longitude: 104.065735,
    latitude: 30.659462,
    arrivalDate: "2023-02-15",
    photoUrl: mockPhoto("成都 · 足迹照片", "#d3ecff", "#cfe0ff"),
    remark: "第一次一起旅行,锦里的灯笼亮起来的时候,像置身电影里。",
    createTime: "2026-01-01 08:00:00",
    delFlag: 0
  },
  {
    id: "2",
    city: "大理",
    placeName: "大理古城",
    longitude: 100.22504,
    latitude: 25.6065,
    arrivalDate: "2023-07-02",
    photoUrl: mockPhoto("大理 · 足迹照片", "#d3ecff", "#cfe0ff"),
    remark: "在洱海边看了日出,风很轻,时间也很慢。",
    createTime: "2026-01-02 09:30:00",
    delFlag: 0
  },
  {
    id: "3",
    city: "北京",
    placeName: "故宫博物院",
    longitude: 116.407387,
    latitude: 39.904179,
    arrivalDate: "2025-05-21",
    photoUrl: null,
    remark: "在一起纪念日,我们在故宫的城墙下许了愿。",
    createTime: "2026-01-03 10:00:00",
    delFlag: 0
  },
  {
    id: "4",
    city: "青岛",
    placeName: "八大关风景区",
    longitude: 120.382639,
    latitude: 36.067082,
    arrivalDate: "2025-08-20",
    photoUrl: null,
    remark: "喝了袋装啤酒,走了八大关,把夏天留在了海边。",
    createTime: "2026-01-04 14:00:00",
    delFlag: 0
  }
];

/** 当前时间,格式对齐后端 createTime(yyyy-MM-dd HH:mm:ss) */
const formatNow = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** 行数据转响应形态(delFlag 过滤后;photoUrl 原值直传,对齐后端入库即目标形态的契约) */
const toItem = (item: (typeof footprints)[number]) => {
  const { delFlag: _delFlag, ...rest } = item;
  return { ...rest };
};

export default defineFakeRoute([
  // 分页查询(GET /sys/footprint/page;全量,城市模糊 + 到访日期闭区间过滤,按到访日期升序 → id 升序)
  {
    url: "/sys/footprint/page",
    method: "get",
    response: ({ query }) => {
      const city = String(query.city ?? "");
      const begin = String(query.arrivalDateBegin ?? "");
      const end = String(query.arrivalDateEnd ?? "");
      const records = footprints
        .filter(item => item.delFlag === 0)
        .filter(item => !city || item.city.includes(city))
        .filter(
          item => !begin || (item.arrivalDate ?? "") >= begin
        )
        .filter(item => !end || (item.arrivalDate ?? "") <= end)
        .sort((a, b) =>
          (a.arrivalDate ?? "").localeCompare(b.arrivalDate ?? "") ||
          Number(a.id) - Number(b.id)
        )
        .map(toItem);
      return fakePageResponse(records, query);
    }
  },
  // 新增(POST /sys/footprint/insert,落地内存数据)
  {
    url: "/sys/footprint/insert",
    method: "post",
    response: ({ body }) => {
      const city = String(body?.city ?? "").trim();
      if (!city) return fail("城市不能为空");
      const id = String(
        Math.max(...footprints.map(item => Number(item.id))) + 1
      );
      footprints.push({
        id,
        city,
        placeName: body?.placeName || null,
        longitude: body?.longitude ?? null,
        latitude: body?.latitude ?? null,
        arrivalDate: body?.arrivalDate || null,
        photoUrl: body?.photoUrl || null,
        remark: body?.remark || null,
        createTime: formatNow(),
        delFlag: 0
      });
      return ok(null, "新增成功");
    }
  },
  // 修改(PUT /sys/footprint/update;按 id 覆盖全部可编辑字段,显式写入支持清空照片)
  {
    url: "/sys/footprint/update",
    method: "put",
    response: ({ body }) => {
      const target = footprints.find(
        item => item.id === String(body?.id) && item.delFlag === 0
      );
      if (!target) return fail("足迹不存在");
      target.city = String(body?.city ?? target.city);
      target.placeName = body?.placeName || null;
      target.longitude = body?.longitude ?? null;
      target.latitude = body?.latitude ?? null;
      target.arrivalDate = body?.arrivalDate || null;
      target.photoUrl = body?.photoUrl || null;
      target.remark = body?.remark || null;
      return ok(null, "修改成功");
    }
  },
  // 批量逻辑删除(DELETE /sys/footprint/delete/{ids};任一不存在时整批失败)
  {
    url: "/sys/footprint/delete/:ids",
    method: "delete",
    response: ({ params }) => {
      const ids = String(params.ids)
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
      const targets = footprints.filter(
        item => ids.includes(item.id) && item.delFlag === 0
      );
      if (targets.length < ids.length) return fail("足迹不存在");
      targets.forEach(item => {
        item.delFlag = 1;
      });
      return ok(null, "删除成功");
    }
  }
]);
