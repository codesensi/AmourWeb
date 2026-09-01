// 部门管理 mock(后端暂无部门表,mock 供数,第 3 期定去留)
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { faker } from "@faker-js/faker/locale/zh_CN";

const depts = [
  {
    name: "杭州总公司",
    parentId: 0,
    id: 100,
    sort: 0,
    phone: "15888888888",
    principal: faker.person.firstName(),
    email: faker.internet.email(),
    status: 1, // 状态 1 启用 0 停用
    type: 1, // 1 公司 2 分公司 3 部门
    createTime: 1605456000000,
    remark: "这里是备注信息这里是备注信息这里是备注信息这里是备注信息"
  },
  {
    name: "郑州分公司",
    parentId: 100,
    id: 101,
    sort: 1,
    phone: "15888888888",
    principal: faker.person.firstName(),
    email: faker.internet.email(),
    status: 1,
    type: 2,
    createTime: 1605456000000,
    remark: "这里是备注信息这里是备注信息这里是备注信息这里是备注信息"
  },
  {
    name: "研发部门",
    parentId: 101,
    id: 103,
    sort: 1,
    phone: "15888888888",
    principal: faker.person.firstName(),
    email: faker.internet.email(),
    status: 1,
    type: 3,
    createTime: 1605456000000,
    remark: "这里是备注信息这里是备注信息这里是备注信息这里是备注信息"
  },
  {
    name: "市场部门",
    parentId: 101,
    id: 104,
    sort: 2,
    phone: "15888888888",
    principal: faker.person.firstName(),
    email: faker.internet.email(),
    status: 1,
    type: 3,
    createTime: 1605456000000,
    remark: "这里是备注信息这里是备注信息这里是备注信息这里是备注信息"
  },
  {
    name: "测试部门",
    parentId: 101,
    id: 105,
    sort: 3,
    phone: "15888888888",
    principal: faker.person.firstName(),
    email: faker.internet.email(),
    status: 1,
    type: 3,
    createTime: 1605456000000,
    remark: "这里是备注信息这里是备注信息这里是备注信息这里是备注信息"
  },
  {
    name: "深圳分公司",
    parentId: 100,
    id: 102,
    sort: 2,
    phone: "15888888888",
    principal: faker.person.firstName(),
    email: faker.internet.email(),
    status: 1,
    type: 2,
    createTime: 1605456000000,
    remark: "这里是备注信息这里是备注信息这里是备注信息这里是备注信息"
  },
  {
    name: "市场部门",
    parentId: 102,
    id: 108,
    sort: 1,
    phone: "15888888888",
    principal: faker.person.firstName(),
    email: faker.internet.email(),
    status: 1,
    type: 3,
    createTime: 1605456000000,
    remark: "这里是备注信息这里是备注信息这里是备注信息这里是备注信息"
  },
  {
    name: "财务部门",
    parentId: 102,
    id: 109,
    sort: 2,
    phone: "15888888888",
    principal: faker.person.firstName(),
    email: faker.internet.email(),
    status: 0,
    type: 3,
    createTime: 1605456000000,
    remark: "这里是备注信息这里是备注信息这里是备注信息这里是备注信息"
  }
];

export default defineFakeRoute([
  // 部门列表(POST /dept)
  {
    url: "/dept",
    method: "post",
    response: () => {
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        data: depts
      };
    }
  }
]);
