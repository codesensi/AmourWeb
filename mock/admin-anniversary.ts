// 纪念日管理 mock(对齐后端 /admin/anniversary 接口)
// page 契约对齐 AnniversaryPageResponse:id(字符串化)/name/type/anniversaryDate/repeatYearly/sort/hidden/createTime
// insert/update 契约对齐 AnniversaryInsertRequest/UpdateRequest:类型编码经 anniversary-type 字典(birthday/anniversary/festival)校验
// change-hidden 契约对齐 AnniversaryChangeHiddenRequest:仅覆盖 hidden 字段
// delete 契约对齐 DELETE /admin/anniversary/delete/{ids}:任一不存在时整批失败
import { defineFakeRoute } from "vite-plugin-fake-server/client";
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

/** 纪念日类型合法编码(对齐后端 AnniversaryTypeEnum) */
const TYPES = ["birthday", "anniversary", "festival"];

/** 内存数据源(hidden: 0-显示,1-隐藏;delFlag 模拟逻辑删除) */
const anniversaries = [
  {
    id: "1",
    name: "小满的生日",
    type: "birthday",
    anniversaryDate: "1998-05-20",
    repeatYearly: true,
    sort: 1,
    hidden: 0,
    createTime: "2026-01-01 08:00:00",
    delFlag: 0
  },
  {
    id: "2",
    name: "在一起的纪念日",
    type: "anniversary",
    anniversaryDate: "2020-02-14",
    repeatYearly: true,
    sort: 2,
    hidden: 0,
    createTime: "2026-01-02 09:30:00",
    delFlag: 0
  },
  {
    id: "3",
    name: "第一次旅行",
    type: "anniversary",
    anniversaryDate: "2026-10-01",
    repeatYearly: false,
    sort: 3,
    hidden: 0,
    createTime: "2026-01-03 10:00:00",
    delFlag: 0
  },
  {
    id: "4",
    name: "元旦",
    type: "festival",
    anniversaryDate: "2027-01-01",
    repeatYearly: true,
    sort: 4,
    hidden: 1,
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

/** 行数据转响应形态(delFlag 过滤后) */
const toItem = (item: (typeof anniversaries)[number]) => {
  const { delFlag: _delFlag, ...rest } = item;
  return { ...rest };
};

export default defineFakeRoute([
  // 分页查询(GET /admin/anniversary/page;名称模糊 + 显隐精确过滤,按下一次发生日升序 → id 升序)
  {
    url: "/admin/anniversary/page",
    method: "get",
    response: ({ query }) => {
      const { pageNumber = 1, pageSize = 20 } = query;
      const name = String(query.name ?? "");
      const hidden =
        query.hidden === undefined || query.hidden === ""
          ? null
          : Number(query.hidden);
      const records = anniversaries
        .filter(item => item.delFlag === 0)
        .filter(item => !name || item.name.includes(name))
        .filter(item => hidden === null || item.hidden === hidden)
        .sort(
          (a, b) =>
            nextOccurrenceKey(a).localeCompare(nextOccurrenceKey(b)) ||
            Number(a.id) - Number(b.id)
        )
        .map(toItem);
      return fakePageResponse(records, { pageNumber, pageSize });
    }
  },
  // 新增(POST /admin/anniversary/insert;必填与类型编码校验对齐后端)
  {
    url: "/admin/anniversary/insert",
    method: "post",
    response: ({ body }) => {
      const name = String(body?.name ?? "").trim();
      if (!name) return fail("纪念日名称不能为空");
      const type = String(body?.type ?? "");
      if (!type) return fail("纪念日类型不能为空");
      if (!TYPES.includes(type)) return fail("纪念日类型不合法");
      const anniversaryDate = String(body?.anniversaryDate ?? "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(anniversaryDate)) {
        return fail("纪念日日期格式须为yyyy-MM-dd");
      }
      if (body?.repeatYearly === undefined || body?.repeatYearly === null) {
        return fail("是否每年重复不能为空");
      }
      const id = String(
        Math.max(...anniversaries.map(item => Number(item.id))) + 1
      );
      anniversaries.push({
        id,
        name,
        type,
        anniversaryDate,
        repeatYearly: Boolean(body?.repeatYearly),
        sort: body?.sort ?? 0,
        hidden: body?.hidden ?? 0,
        createTime: formatNow(),
        delFlag: 0
      });
      return ok(null, "新增成功");
    }
  },
  // 修改(PUT /admin/anniversary/update;按 id 覆盖全部可编辑字段,显隐走 change-hidden 独立端点)
  {
    url: "/admin/anniversary/update",
    method: "put",
    response: ({ body }) => {
      const target = anniversaries.find(
        item => item.id === String(body?.id) && item.delFlag === 0
      );
      if (!target) return fail("纪念日不存在");
      if (!TYPES.includes(String(body?.type ?? ""))) {
        return fail("纪念日类型不合法");
      }
      target.name = String(body?.name ?? target.name);
      target.type = String(body?.type ?? target.type);
      target.anniversaryDate = String(
        body?.anniversaryDate ?? target.anniversaryDate
      );
      target.repeatYearly = Boolean(body?.repeatYearly ?? target.repeatYearly);
      target.sort = body?.sort ?? target.sort;
      return ok(null, "修改成功");
    }
  },
  // 修改显隐(PUT /admin/anniversary/change-hidden;仅覆盖 hidden 字段)
  {
    url: "/admin/anniversary/change-hidden",
    method: "put",
    response: ({ body }) => {
      const target = anniversaries.find(
        item => item.id === String(body?.id) && item.delFlag === 0
      );
      if (!target) return fail("纪念日不存在");
      target.hidden = Number(body?.hidden ?? target.hidden);
      return ok(null, "修改成功");
    }
  },
  // 批量逻辑删除(DELETE /admin/anniversary/delete/{ids};任一不存在时整批失败)
  {
    url: "/admin/anniversary/delete/:ids",
    method: "delete",
    response: ({ params }) => {
      const ids = String(params.ids)
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
      const targets = anniversaries.filter(
        item => ids.includes(item.id) && item.delFlag === 0
      );
      if (targets.length < ids.length) return fail("纪念日不存在");
      targets.forEach(item => {
        item.delFlag = 1;
      });
      return ok(null, "删除成功");
    }
  }
]);
