// 纪念日 mock(GET /portal/anniversary 全量列表,门户蓝图接口)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

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

export default defineFakeRoute([
  // 纪念日全量(GET /portal/anniversary)
  {
    url: "/portal/anniversary",
    method: "get",
    response: () => ({
      success: true,
      code: 200,
      msg: "操作成功",
      timestamp: Date.now(),
      data: anniversaryList
    })
  }
]);
