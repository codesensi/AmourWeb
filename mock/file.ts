// 文件管理 mock(对齐后端 FileController:/file/*)
// 行数据契约对齐 FileItem:id 为雪花 ID 字符串(避免前端精度丢失);
// delFlag 仅用于 mock 内部区分文件列表/回收站,响应中剔除以对齐 FileItem 展示字段
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { mockPhotoSvg } from "./portal/mock-photo";

/** 当前时间,格式对齐后端 createTime(yyyy-MM-dd HH:mm:ss) */
const formatNow = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** 对齐后端 Result<T> 的成功响应(自动携带 timestamp) */
const ok = (data: unknown = null, msg = "操作成功") => ({
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

type MockFile = {
  id: string;
  originalName: string;
  size: number;
  extension: string;
  contentType: string;
  storageType: string;
  path: string;
  bizType: string;
  bizId: string;
  creator: string;
  creatorName: string;
  createTime: string;
  // mock 内部使用:0-文件列表,1-回收站
  delFlag: number;
};

let files: MockFile[] = [
  {
    id: "2001",
    originalName: "情侣头像.png",
    size: 248_512,
    extension: "png",
    contentType: "image/png",
    storageType: "local",
    path: "avatar/202609/2001.png",
    bizType: "avatar",
    bizId: "1",
    creator: "1",
    creatorName: "admin",
    createTime: "2026-09-01 08:00:00",
    delFlag: 0
  },
  {
    id: "2002",
    originalName: "旅行合影.jpg",
    size: 1_048_576,
    extension: "jpg",
    contentType: "image/jpeg",
    storageType: "local",
    path: "photo/202609/2002.jpg",
    bizType: "photo",
    bizId: "",
    creator: "2",
    creatorName: "li",
    createTime: "2026-09-03 12:30:00",
    delFlag: 0
  },
  {
    id: "2003",
    originalName: "配图-日落.png",
    size: 524_288,
    extension: "png",
    contentType: "image/png",
    storageType: "oss",
    path: "markdown/202609/2003.png",
    bizType: "markdown",
    bizId: "301",
    creator: "3",
    creatorName: "su",
    createTime: "2026-09-05 18:45:00",
    delFlag: 0
  },
  {
    id: "2004",
    originalName: "表情包.gif",
    size: 2_097_152,
    extension: "gif",
    contentType: "image/gif",
    storageType: "local",
    path: "photo/202609/2004.gif",
    bizType: "photo",
    bizId: "",
    creator: "2",
    creatorName: "li",
    createTime: "2026-09-08 09:15:00",
    delFlag: 1
  },
  {
    id: "2005",
    originalName: "旧头像.jpeg",
    size: 131_072,
    extension: "jpeg",
    contentType: "image/jpeg",
    storageType: "local",
    path: "avatar/202609/2005.jpeg",
    bizType: "avatar",
    bizId: "",
    creator: "1",
    creatorName: "admin",
    createTime: "2026-09-10 20:00:00",
    delFlag: 1
  }
];

/** 剔除 mock 内部字段,对齐 FileItem 展示字段 */
const toItem = (file: MockFile) => {
  const { delFlag: _delFlag, ...rest } = file;
  return rest;
};

/** 下一个自增 ID(字符串下发,对齐后端雪花 ID 序列化) */
const nextId = () =>
  String(Math.max(...files.map(item => Number(item.id))) + 1);

export default defineFakeRoute([
  // 文件分页(GET /file/page;delFlag 缺省为 0 即文件列表,1 为回收站)
  {
    url: "/file/page",
    method: "get",
    response: ({ query }) => {
      let records = files.filter(
        item => Number(item.delFlag) === Number(query.delFlag ?? 0)
      );
      // 模糊查询条件(对齐后端 LIKE)
      records = records.filter(item =>
        item.originalName.includes(String(query.originalName ?? ""))
      );
      records = records.filter(item =>
        item.creatorName.includes(String(query.creatorName ?? ""))
      );
      // 精确匹配条件(对齐后端 eq)
      if (query.bizType)
        records = records.filter(item => item.bizType === query.bizType);
      if (query.storageType)
        records = records.filter(
          item => item.storageType === query.storageType
        );
      // 上传时间范围(对齐 yyyy-MM-dd HH:mm:ss 字符串比较)
      if (query.beginTime)
        records = records.filter(item => item.createTime >= query.beginTime);
      if (query.endTime)
        records = records.filter(item => item.createTime <= query.endTime);
      const pageNumber = Number(query.pageNumber ?? 1);
      const pageSize = Number(query.pageSize ?? 20);
      const start = (pageNumber - 1) * pageSize;
      return ok({
        records: records.slice(start, start + pageSize).map(toItem),
        pageNumber,
        pageSize,
        totalRow: records.length,
        totalPage: Math.ceil(records.length / pageSize)
      });
    }
  },
  // 上传(POST /file/upload/:bizType,落地内存数据;multipart 请求体不解析,文件名以生成名兜底)
  {
    url: "/file/upload/:bizType",
    method: "post",
    response: ({ params, body }) => {
      const bizType = String(params.bizType ?? "avatar");
      const id = nextId();
      const originalName = String(body?.originalName ?? `mock-${id}.png`);
      files.push({
        id,
        originalName,
        size: 102_400,
        extension: "png",
        contentType: "image/png",
        storageType: "local",
        path: `${bizType}/202609/${id}.png`,
        bizType,
        bizId: "",
        creator: "1",
        creatorName: "admin",
        createTime: formatNow(),
        delFlag: 0
      });
      return ok({ id, url: `/file/view/${id}`, originalName });
    }
  },
  // 逻辑删除(DELETE /file/:id,移入回收站)
  {
    url: "/file/:id",
    method: "delete",
    response: ({ params }) => {
      const target = files.find(item => item.id === String(params.id));
      if (!target) return fail("文件不存在");
      target.delFlag = 1;
      return ok(null, "删除成功");
    }
  },
  // 恢复回收站文件(PUT /file/:id/restore,移回文件列表)
  {
    url: "/file/:id/restore",
    method: "put",
    response: ({ params }) => {
      const target = files.find(item => item.id === String(params.id));
      if (!target) return fail("文件不存在");
      target.delFlag = 0;
      return ok(null, "恢复成功");
    }
  },
  // 彻底删除回收站文件(DELETE /file/:id/physical,落地内存数据)
  {
    url: "/file/:id/physical",
    method: "delete",
    response: ({ params }) => {
      const index = files.findIndex(item => item.id === String(params.id));
      if (index === -1) return fail("文件不存在");
      files.splice(index, 1);
      return ok(null, "彻底删除成功");
    }
  },
  // 文件预览(GET /file/view/:id,免登录分发;mock 以占位 SVG 直出,非 JSON 响应)
  {
    url: "/file/view/:id",
    method: "get",
    rawResponse: (req, res) => {
      const id = String(req.url ?? "")
        .split("?")[0]
        .split("/")
        .pop();
      const target = files.find(item => item.id === id);
      const svg = mockPhotoSvg(target?.originalName ?? `文件 ${id || "未知"}`);
      res.statusCode = 200;
      res.setHeader("Content-Type", "image/svg+xml;charset=utf-8");
      res.end(svg);
    }
  },
  // 下载(GET /file/download/:id;mock 不产出二进制流,前端按响应 Content-Type 识别降级)
  {
    url: "/file/download/:id",
    method: "get",
    response: () => ok(null, "mock 下不支持流式下载,请走真实后端")
  }
]);
