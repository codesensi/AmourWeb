// 字典管理 mock(对齐后端 SysDictController:/sys/dict/*;写接口落地内存数据,刷新页面即还原)
// 行数据契约对齐 DictPageResponse:id/dictCode/dictName/dictValue/dictLabel/sort/status/builtin/remark/createTime
// 组数据契约对齐 DictGroupResponse:dictCode/items(dictValue/dictLabel/sort)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

// 与后端 sys_dict 内置种子同源(9 组 26 条;组内顺序即 sort 升序)
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
    remark: "与 GenderEnum(U/M/F) 对齐",
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
    remark: "与 EnableEnum(0/1) 对齐",
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
    remark: "与 YesEnum(1/0) 对齐",
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
    id: "10302",
    dictCode: "del-flag",
    dictName: "删除标识",
    dictValue: "1",
    dictLabel: "已删除",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "与 DelFlagEnum(1/0) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10301",
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
    id: "10401",
    dictCode: "menu-type",
    dictName: "菜单类型",
    dictValue: "D",
    dictLabel: "目录",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "与 MenuType(D/M/B) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10402",
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
    id: "10403",
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
    id: "10501",
    dictCode: "image-type",
    dictName: "图形验证码类型",
    dictValue: "spec",
    dictLabel: "PNG字符验证码",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "与 ImageType 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10502",
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
    id: "10503",
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
    id: "10504",
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
    id: "10505",
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
    id: "10601",
    dictCode: "success",
    dictName: "成功状态",
    dictValue: "1",
    dictLabel: "成功",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "与 SuccessEnum(1/0) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10602",
    dictCode: "success",
    dictName: "成功状态",
    dictValue: "0",
    dictLabel: "失败",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10701",
    dictCode: "config-group",
    dictName: "配置分组",
    dictValue: "base",
    dictLabel: "基础配置",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "与 sys_config.config_group(base/site/captcha) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10702",
    dictCode: "config-group",
    dictName: "配置分组",
    dictValue: "site",
    dictLabel: "门户配置",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10703",
    dictCode: "config-group",
    dictName: "配置分组",
    dictValue: "captcha",
    dictLabel: "验证码配置",
    sort: 3,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10801",
    dictCode: "config-value-type",
    dictName: "配置值类型",
    dictValue: "STRING",
    dictLabel: "字符串",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "与 sys_config.value_type(STRING/INTEGER/LONG/BOOLEAN) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10802",
    dictCode: "config-value-type",
    dictName: "配置值类型",
    dictValue: "INTEGER",
    dictLabel: "整数",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10803",
    dictCode: "config-value-type",
    dictName: "配置值类型",
    dictValue: "LONG",
    dictLabel: "长整数",
    sort: 3,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10804",
    dictCode: "config-value-type",
    dictName: "配置值类型",
    dictValue: "BOOLEAN",
    dictLabel: "布尔",
    sort: 4,
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
        .map(({ dictValue, dictLabel, sort }) => ({
          dictValue,
          dictLabel,
          sort
        }))
    }))
    .filter(group => group.items.length > 0);
}

/** 当前时间,格式对齐后端 createTime(yyyy-MM-dd HH:mm:ss) */
const formatNow = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** 对齐后端 Result<T> 的成功响应(自动携带 timestamp) */
const ok = (data = null, msg = "操作成功") => ({
  success: true,
  code: 200,
  msg,
  data,
  timestamp: Date.now()
});

/** 对齐后端 Result<T> 的失败响应 */
const fail = (msg: string) => ({
  success: false,
  code: 400,
  msg,
  data: null,
  timestamp: Date.now()
});

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
  // 分页查询(GET /sys/dict/page;过滤与排序对齐后端:编码/名称/值模糊,状态精确,
  // 排序为编码升序 → 组内 sort 升序 → id 升序)
  {
    url: "/sys/dict/page",
    method: "get",
    response: ({ query }) => {
      const pageNumber = Number(query.pageNumber ?? 1);
      const pageSize = Number(query.pageSize ?? 20);
      const dictCode = String(query.dictCode ?? "");
      const dictName = String(query.dictName ?? "");
      const dictValue = String(query.dictValue ?? "");
      const status = query.status == null ? "" : String(query.status);
      const filtered = dicts.filter(item => {
        return (
          (dictCode === "" || item.dictCode.includes(dictCode)) &&
          (dictName === "" || item.dictName.includes(dictName)) &&
          (dictValue === "" || item.dictValue.includes(dictValue)) &&
          (status === "" || String(item.status) === status)
        );
      });
      filtered.sort(
        (a, b) =>
          a.dictCode.localeCompare(b.dictCode) ||
          a.sort - b.sort ||
          Number(a.id) - Number(b.id)
      );
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
  // 新增(POST /sys/dict/insert,落地内存数据;同编码下字典值唯一;字典名称自动继承组内首条,对齐后端校验)
  {
    url: "/sys/dict/insert",
    method: "post",
    response: ({ body }) => {
      const dictCode = String(body?.dictCode ?? "");
      const dictValue = String(body?.dictValue ?? "");
      const exists = dicts.some(
        item => item.dictCode === dictCode && item.dictValue === dictValue
      );
      if (exists) {
        return fail(`字典编码[${dictCode}]下字典值[${dictValue}]已存在`);
      }
      const first = dicts.find(item => item.dictCode === dictCode);
      const maxId = Math.max(...dicts.map(item => Number(item.id)), 0);
      dicts.push({
        id: String(maxId + 1),
        dictCode,
        dictName: first?.dictName ?? dictCode,
        dictValue,
        dictLabel: body?.dictLabel ?? "",
        sort: body?.sort ?? 1,
        status: body?.status ?? 0,
        builtin: 0,
        remark: body?.remark ?? "",
        createTime: formatNow()
      });
      return ok();
    }
  },
  // 修改(PUT /sys/dict/update,落地内存数据;字典编码/字典名称/内置标识/创建时间不可改;
  // 内置条目锁定字典值,对齐后端 DictUpdateRequest 与 builtin 校验)
  {
    url: "/sys/dict/update",
    method: "put",
    response: ({ body }) => {
      const target = dicts.find(item => item.id === String(body?.id));
      if (!target) return fail("字典条目不存在");
      if (
        target.builtin === 1 &&
        target.dictValue !== String(body?.dictValue)
      ) {
        return fail("内置字典条目不允许修改字典值");
      }
      target.dictValue = body?.dictValue ?? target.dictValue;
      target.dictLabel = body?.dictLabel ?? target.dictLabel;
      target.sort = body?.sort ?? target.sort;
      target.remark = body?.remark ?? target.remark;
      return ok();
    }
  },
  // 删除(DELETE /sys/dict/delete/:id,落地内存数据;id 支持英文逗号分隔批量,
  // 内置条目不可删且整批失败,对齐后端校验)
  {
    url: "/sys/dict/delete/:id",
    method: "delete",
    response: ({ params }) => {
      const ids = String(params.id)
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
      const missing = ids.filter(id => !dicts.some(item => item.id === id));
      if (missing.length) {
        return fail(`字典条目不存在：${missing.join("、")}`);
      }
      const containsBuiltin = dicts.some(
        item => ids.includes(item.id) && item.builtin === 1
      );
      if (containsBuiltin) {
        return fail("内置字典条目不允许删除");
      }
      for (const id of ids) {
        const index = dicts.findIndex(item => item.id === id);
        if (index !== -1) dicts.splice(index, 1);
      }
      return ok();
    }
  },
  // 修改状态(PUT /sys/dict/change-status,落地内存数据;内置条目不允许更改状态)
  {
    url: "/sys/dict/change-status",
    method: "put",
    response: ({ body }) => {
      const target = dicts.find(item => item.id === String(body?.id));
      if (!target) return fail("字典条目不存在");
      if (target.builtin === 1) return fail("内置字典条目不允许更改状态");
      target.status = Number(body?.status);
      return ok();
    }
  }
]);
