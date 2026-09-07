// 字典管理 mock(对齐后端 /sys/dict 查询与管理接口)
// 行数据契约对齐 DictPageResponse:id/dictCode/dictName/dictValue/dictLabel/sort/status/builtin/remark/createTime
// 组数据契约对齐 DictGroupResponse:dictCode/items(dictValue/dictLabel/sort)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

// 与后端 sys_dict 内置种子同源(8 组 17 条;组内顺序即 sort 升序)
const dicts = [
  {
    id: "10001",
    dictCode: "gender",
    dictName: "性别",
    dictValue: "U",
    dictLabel: "未知",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "内置字典：与 GenderEnum(U/M/F) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10002",
    dictCode: "gender",
    dictName: "性别",
    dictValue: "M",
    dictLabel: "男",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10003",
    dictCode: "gender",
    dictName: "性别",
    dictValue: "F",
    dictLabel: "女",
    sort: 3,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10101",
    dictCode: "enable",
    dictName: "启用状态",
    dictValue: "0",
    dictLabel: "启用",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "内置字典：与 EnableEnum(0/1) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10102",
    dictCode: "enable",
    dictName: "启用状态",
    dictValue: "1",
    dictLabel: "禁用",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10201",
    dictCode: "yes",
    dictName: "是否",
    dictValue: "1",
    dictLabel: "是",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "内置字典：与 YesEnum(1/0) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10202",
    dictCode: "yes",
    dictName: "是否",
    dictValue: "0",
    dictLabel: "否",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10301",
    dictCode: "builtin",
    dictName: "内置标识",
    dictValue: "1",
    dictLabel: "内置",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "内置字典：与 BuiltinEnum(1/0) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10302",
    dictCode: "builtin",
    dictName: "内置标识",
    dictValue: "0",
    dictLabel: "非内置",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10401",
    dictCode: "del-flag",
    dictName: "删除标识",
    dictValue: "1",
    dictLabel: "已删除",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "内置字典：与 DelFlagEnum(1/0) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10402",
    dictCode: "del-flag",
    dictName: "删除标识",
    dictValue: "0",
    dictLabel: "未删除",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10501",
    dictCode: "menu-type",
    dictName: "菜单类型",
    dictValue: "D",
    dictLabel: "目录",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "内置字典：与 MenuType(D/M/B) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10502",
    dictCode: "menu-type",
    dictName: "菜单类型",
    dictValue: "M",
    dictLabel: "菜单",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10503",
    dictCode: "menu-type",
    dictName: "菜单类型",
    dictValue: "B",
    dictLabel: "按钮",
    sort: 3,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10601",
    dictCode: "image-type",
    dictName: "图形验证码类型",
    dictValue: "spec",
    dictLabel: "PNG字符验证码",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "内置字典：与 ImageType 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10602",
    dictCode: "image-type",
    dictName: "图形验证码类型",
    dictValue: "gif",
    dictLabel: "GIF字符验证码",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10603",
    dictCode: "image-type",
    dictName: "图形验证码类型",
    dictValue: "chinese",
    dictLabel: "中文字符验证码",
    sort: 3,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10604",
    dictCode: "image-type",
    dictName: "图形验证码类型",
    dictValue: "chinese-gif",
    dictLabel: "中文GIF字符验证码",
    sort: 4,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10605",
    dictCode: "image-type",
    dictName: "图形验证码类型",
    dictValue: "arithmetic",
    dictLabel: "算术验证码",
    sort: 5,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10701",
    dictCode: "success",
    dictName: "成功状态",
    dictValue: "1",
    dictLabel: "成功",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "内置字典：与 SuccessEnum(1/0) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10702",
    dictCode: "success",
    dictName: "成功状态",
    dictValue: "0",
    dictLabel: "失败",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  }
];

/** 组装分组结构(仅启用条目,按 sort 升序,入参编码顺序下发) */
function groupByCodes(codes: Array<string>) {
  return codes
    .map(code => ({
      dictCode: code,
      items: dicts
        .filter(item => item.dictCode === code && item.status === 0)
        .sort((a, b) => a.sort - b.sort)
        .map(({ dictValue, dictLabel, sort }) => ({ dictValue, dictLabel, sort }))
    }))
    .filter(group => group.items.length > 0);
}

export default defineFakeRoute([
  // 字典类型列表(GET /sys/dict/type-list,按编码聚合,含条目数)
  {
    url: "/sys/dict/type-list",
    method: "get",
    response: () => {
      const typeMap = new Map<
        string,
        { dictCode: string; dictName: string; count: number }
      >();
      for (const item of dicts) {
        const exist = typeMap.get(item.dictCode);
        if (exist) {
          exist.count += 1;
        } else {
          typeMap.set(item.dictCode, {
            dictCode: item.dictCode,
            dictName: item.dictName,
            count: 1
          });
        }
      }
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: [...typeMap.values()]
      };
    }
  },
  // 批量查询(GET /sys/dict/list-by-codes?codes=逗号分隔编码)
  {
    url: "/sys/dict/list-by-codes",
    method: "get",
    response: ({ query }) => {
      const codes = String(query.codes ?? "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: groupByCodes(codes)
      };
    }
  },
  // 分页查询(GET /sys/dict/page)
  {
    url: "/sys/dict/page",
    method: "get",
    response: ({ query }) => {
      const pageNumber = Number(query.pageNumber ?? 1);
      const pageSize = Number(query.pageSize ?? 20);
      const dictCode = String(query.dictCode ?? "");
      const dictName = String(query.dictName ?? "");
      const status = query.status == null ? "" : String(query.status);
      const filtered = dicts.filter(item => {
        return (
          (dictCode === "" || item.dictCode.includes(dictCode)) &&
          (dictName === "" || item.dictName.includes(dictName)) &&
          (status === "" || String(item.status) === status)
        );
      });
      const records = filtered
        .slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
        .map(({ remark, ...rest }) => ({ ...rest, remark }));
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data: {
          records,
          pageNumber,
          pageSize,
          totalRow: filtered.length,
          totalPage: Math.ceil(filtered.length / pageSize)
        }
      };
    }
  },
  // 新增(POST /sys/dict/insert)
  {
    url: "/sys/dict/insert",
    method: "post",
    response: ({ body }) => {
      const nextId = String(
        Math.max(...dicts.map(item => Number(item.id))) + 1
      );
      dicts.push({ ...(body as object), id: nextId, status: 0 } as never);
      return { success: true, code: 200, msg: "操作成功", timestamp: Date.now() };
    }
  },
  // 修改(PUT /sys/dict/update)
  {
    url: "/sys/dict/update",
    method: "put",
    response: ({ body }) => {
      const cur = body as Record<string, unknown>;
      const item = dicts.find(row => row.id === cur.id);
      if (item) {
        item.dictName = cur.dictName as string;
        item.dictLabel = cur.dictLabel as string;
        item.sort = cur.sort as number;
        item.remark = cur.remark as string;
      }
      return { success: true, code: 200, msg: "操作成功", timestamp: Date.now() };
    }
  },
  // 修改状态(PUT /sys/dict/change-status)
  {
    url: "/sys/dict/change-status",
    method: "put",
    response: ({ body }) => {
      const cur = body as Record<string, unknown>;
      const item = dicts.find(row => row.id === cur.id);
      if (item) {
        item.status = cur.status as number;
      }
      return { success: true, code: 200, msg: "操作成功", timestamp: Date.now() };
    }
  },
  // 删除(DELETE /sys/dict/delete/:id)
  {
    url: "/sys/dict/delete/:id",
    method: "delete",
    response: ({ url }) => {
      const id = url.slice(url.lastIndexOf("/") + 1);
      const index = dicts.findIndex(item => item.id === id);
      if (index >= 0) {
        dicts.splice(index, 1);
      }
      return { success: true, code: 200, msg: "操作成功", timestamp: Date.now() };
    }
  }
]);
