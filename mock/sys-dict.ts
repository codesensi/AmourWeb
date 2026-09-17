// 字典管理 mock(对齐后端 SysDictController:/sys/dict/*;写接口落地内存数据,刷新页面即还原)
// 行数据契约对齐 DictPageResponse:id/dictCode/dictName/dictValue/dictLabel/sort/status/builtin/remark/createTime
// 组数据契约对齐 DictGroupResponse:dictCode/items(dictValue/dictLabel/sort)
import { defineFakeRoute } from "vite-plugin-fake-server/client";

// 与后端 sys_dict 内置种子同源(12 组 41 条;组内顺序即 sort 升序)
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
    id: "10301",
    dictCode: "del-flag",
    dictName: "删除标识",
    dictValue: "0",
    dictLabel: "未删除",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "与 DelFlagEnum(1/0) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10302",
    dictCode: "del-flag",
    dictName: "删除标识",
    dictValue: "1",
    dictLabel: "已删除",
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
    remark: "与 ImageType(spec/gif/chinese/chinese-gif/arithmetic) 对齐",
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
    id: "10704",
    dictCode: "config-group",
    dictName: "配置分组",
    dictValue: "file",
    dictLabel: "文件配置",
    sort: 4,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10705",
    dictCode: "config-group",
    dictName: "配置分组",
    dictValue: "rate-limit",
    dictLabel: "接口限流",
    sort: 5,
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
  },
  {
    id: "10805",
    dictCode: "config-value-type",
    dictName: "配置值类型",
    dictValue: "DATETIME",
    dictLabel: "日期时间",
    sort: 5,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10901",
    dictCode: "file-storage-type",
    dictName: "存储类型",
    dictValue: "local",
    dictLabel: "本地存储",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "与 StorageTypeEnum(local/oss) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "10902",
    dictCode: "file-storage-type",
    dictName: "存储类型",
    dictValue: "oss",
    dictLabel: "对象存储",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  // biz-type(文件业务类型,对应 FileBizTypeEnum:infra/avatar/photo/markdown;11000 段)
  {
    id: "11001",
    dictCode: "biz-type",
    dictName: "文件业务类型",
    dictValue: "infra",
    dictLabel: "基础设施",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "与 FileBizTypeEnum(infra/avatar/photo/markdown) 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "11002",
    dictCode: "biz-type",
    dictName: "文件业务类型",
    dictValue: "avatar",
    dictLabel: "用户头像",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "11003",
    dictCode: "biz-type",
    dictName: "文件业务类型",
    dictValue: "photo",
    dictLabel: "相册照片",
    sort: 3,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "11004",
    dictCode: "biz-type",
    dictName: "文件业务类型",
    dictValue: "markdown",
    dictLabel: "点滴配图",
    sort: 4,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  // log-type(日志类型,对应 LogTypeEnum:0-未知,1-登录,2-登出,3-查询,4-新增,5-修改,6-删除,7-授权,8-上传,9-下载;11100 段)
  {
    id: "11101",
    dictCode: "log-type",
    dictName: "日志类型",
    dictValue: "0",
    dictLabel: "未知",
    sort: 1,
    status: 0,
    builtin: 1,
    remark: "与 LogTypeEnum 对齐",
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "11102",
    dictCode: "log-type",
    dictName: "日志类型",
    dictValue: "1",
    dictLabel: "登录",
    sort: 2,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "11103",
    dictCode: "log-type",
    dictName: "日志类型",
    dictValue: "2",
    dictLabel: "登出",
    sort: 3,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "11104",
    dictCode: "log-type",
    dictName: "日志类型",
    dictValue: "3",
    dictLabel: "查询",
    sort: 4,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "11105",
    dictCode: "log-type",
    dictName: "日志类型",
    dictValue: "4",
    dictLabel: "新增",
    sort: 5,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "11106",
    dictCode: "log-type",
    dictName: "日志类型",
    dictValue: "5",
    dictLabel: "修改",
    sort: 6,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "11107",
    dictCode: "log-type",
    dictName: "日志类型",
    dictValue: "6",
    dictLabel: "删除",
    sort: 7,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "11108",
    dictCode: "log-type",
    dictName: "日志类型",
    dictValue: "7",
    dictLabel: "授权",
    sort: 8,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "11109",
    dictCode: "log-type",
    dictName: "日志类型",
    dictValue: "8",
    dictLabel: "上传",
    sort: 9,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  },
  {
    id: "11110",
    dictCode: "log-type",
    dictName: "日志类型",
    dictValue: "9",
    dictLabel: "下载",
    sort: 10,
    status: 0,
    builtin: 1,
    remark: null,
    createTime: "2026-01-01 00:00:00"
  }
];

// 字典类型种子(对齐后端 sys_dict_type 99000 段种子:12 个内置类型)
const dictTypes = [
  {
    id: "99001",
    dictCode: "gender",
    dictName: "性别",
    builtin: 1,
    remark: "与 GenderEnum(U/M/F) 对齐"
  },
  {
    id: "99002",
    dictCode: "enable",
    dictName: "启用状态",
    builtin: 1,
    remark: "与 EnableEnum(0/1) 对齐"
  },
  {
    id: "99003",
    dictCode: "yes",
    dictName: "是否",
    builtin: 1,
    remark: "与 YesEnum(1/0) 对齐"
  },
  {
    id: "99004",
    dictCode: "del-flag",
    dictName: "删除标识",
    builtin: 1,
    remark: "与 DelFlagEnum(1/0) 对齐"
  },
  {
    id: "99005",
    dictCode: "menu-type",
    dictName: "菜单类型",
    builtin: 1,
    remark: "与 MenuType(D/M/B) 对齐"
  },
  {
    id: "99006",
    dictCode: "image-type",
    dictName: "图形验证码类型",
    builtin: 1,
    remark: "与 ImageType(spec/gif/chinese/chinese-gif/arithmetic) 对齐"
  },
  {
    id: "99007",
    dictCode: "success",
    dictName: "成功状态",
    builtin: 1,
    remark: "与 SuccessEnum(1/0) 对齐"
  },
  {
    id: "99008",
    dictCode: "config-group",
    dictName: "配置分组",
    builtin: 1,
    remark: "与 sys_config.config_group(base/site/captcha/file/rate-limit) 对齐"
  },
  {
    id: "99009",
    dictCode: "config-value-type",
    dictName: "配置值类型",
    builtin: 1,
    remark:
      "与 sys_config.value_type(STRING/INTEGER/LONG/BOOLEAN/DATETIME) 对齐"
  },
  {
    id: "99010",
    dictCode: "file-storage-type",
    dictName: "存储类型",
    builtin: 1,
    remark: "与 StorageTypeEnum(local/oss) 对齐"
  },
  {
    id: "99011",
    dictCode: "biz-type",
    dictName: "文件业务类型",
    builtin: 1,
    remark: "与 FileBizTypeEnum(infra/avatar/photo/markdown) 对齐"
  },
  {
    id: "99012",
    dictCode: "log-type",
    dictName: "日志类型",
    builtin: 1,
    remark: "与 LogTypeEnum 对齐"
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
  // 字典类型列表(GET /sys/dict/type/list,类型表 + 组内条目数,含禁用条目)
  {
    url: "/sys/dict/type/list",
    method: "get",
    response: () => {
      const data = dictTypes.map(type => ({
        id: type.id,
        dictCode: type.dictCode,
        dictName: type.dictName,
        builtin: type.builtin,
        count: dicts.filter(item => item.dictCode === type.dictCode).length,
        remark: type.remark
      }));
      return {
        success: true,
        code: 200,
        msg: "操作成功",
        timestamp: Date.now(),
        data
      };
    }
  },
  // 批量查询(GET /portal/dict/list-by-codes?codes=逗号分隔编码;对齐 api/sys-dict.ts getDictByCodes)
  {
    url: "/portal/dict/list-by-codes",
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
  // 分页查询(GET /sys/dict/data/page;过滤与排序对齐后端:编码/名称/值模糊,状态精确,
  // 排序为编码升序 → 组内 sort 升序 → id 升序)
  {
    url: "/sys/dict/data/page",
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
  // 新增(POST /sys/dict/data/insert,落地内存数据;类型必须存在 + 同编码下字典值唯一,对齐后端校验)
  {
    url: "/sys/dict/data/insert",
    method: "post",
    response: ({ body }) => {
      const dictCode = String(body?.dictCode ?? "");
      const dictValue = String(body?.dictValue ?? "");
      const type = dictTypes.find(item => item.dictCode === dictCode);
      if (!type) {
        return fail(`字典类型[${dictCode}]不存在，请先创建字典类型`);
      }
      const exists = dicts.some(
        item => item.dictCode === dictCode && item.dictValue === dictValue
      );
      if (exists) {
        return fail(`字典编码[${dictCode}]下字典值[${dictValue}]已存在`);
      }
      const maxId = Math.max(...dicts.map(item => Number(item.id)), 0);
      dicts.push({
        id: String(maxId + 1),
        dictCode,
        dictName: type.dictName,
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
  // 修改(PUT /sys/dict/data/update,落地内存数据;字典编码/字典名称/内置标识/创建时间不可改;
  // 内置条目锁定字典值,对齐后端 DictDataUpdateRequest 与 builtin 校验)
  {
    url: "/sys/dict/data/update",
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
  // 删除(DELETE /sys/dict/data/delete/:id,落地内存数据;id 支持英文逗号分隔批量,
  // 内置条目不可删且整批失败,对齐后端校验)
  {
    url: "/sys/dict/data/delete/:id",
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
  },
  // 新增类型(POST /sys/dict/type/insert,落地内存数据;编码全生命周期唯一,对齐后端校验)
  {
    url: "/sys/dict/type/insert",
    method: "post",
    response: ({ body }) => {
      const dictCode = String(body?.dictCode ?? "");
      if (dictTypes.some(type => type.dictCode === dictCode)) {
        return fail(`字典编码[${dictCode}]已存在`);
      }
      const maxId = Math.max(...dictTypes.map(type => Number(type.id)), 0);
      dictTypes.push({
        id: String(maxId + 1),
        dictCode,
        dictName: body?.dictName ?? "",
        builtin: 0,
        remark: body?.remark ?? ""
      });
      return ok();
    }
  },
  // 修改类型(PUT /sys/dict/type/update,落地内存数据;编码与内置标识不可改;
  // 类型名同步组内条目的展示字段,对齐后端 page 的 dictName 回填)
  {
    url: "/sys/dict/type/update",
    method: "put",
    response: ({ body }) => {
      const target = dictTypes.find(type => type.id === String(body?.id));
      if (!target) return fail("字典类型不存在");
      target.dictName = body?.dictName ?? target.dictName;
      target.remark = body?.remark ?? target.remark;
      for (const item of dicts) {
        if (item.dictCode === target.dictCode) {
          item.dictName = target.dictName;
        }
      }
      return ok();
    }
  },
  // 删除类型(DELETE /sys/dict/type/delete/:id,落地内存数据;内置禁删、存在条目禁删,整批失败)
  {
    url: "/sys/dict/type/delete/:id",
    method: "delete",
    response: ({ params }) => {
      const ids = String(params.id)
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
      const targets = dictTypes.filter(type => ids.includes(type.id));
      if (targets.length < ids.length) return fail("字典类型不存在");
      if (targets.some(type => type.builtin === 1)) {
        return fail("内置字典类型不允许删除");
      }
      const hasItems = targets.filter(type =>
        dicts.some(item => item.dictCode === type.dictCode)
      );
      if (hasItems.length) {
        return fail("字典类型下存在字典条目，请先删除条目");
      }
      for (const target of targets) {
        const index = dictTypes.indexOf(target);
        if (index !== -1) dictTypes.splice(index, 1);
      }
      return ok();
    }
  }
]);
