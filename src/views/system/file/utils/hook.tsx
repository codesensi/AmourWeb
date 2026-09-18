import { reactive, ref, toRaw } from "vue";
import { usePageQuery } from "../../hooks";
import { DICT_CODES } from "@/api/sys-dict";
import { useDict } from "@/hooks/useDict";
import { DictTag } from "@/components/DictTag";
import {
  deleteFile,
  downloadFile,
  getFilePage,
  physicalDeleteFile,
  restoreFile,
  type FileItem
} from "@/api/file";
import type { ApiResult } from "@/api/types";
import { confirmAction, message } from "@/utils/message";

/** 页签模式: active-文件列表(未删除), recycle-回收站(已逻辑删除) */
export type FilePageMode = "active" | "recycle";

/** 字节数人性化展示(B/KB/MB/GB) */
export function formatSize(size: number) {
  if (size == null) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/**
 * 文件分页 hook —— 搜索、分页、列表数据与删除确认。
 * 页面骨架对齐日志管理页(搜索表单 + PureTableBar + 自适应表格);
 * mode 区分文件列表(active, delFlag=0)与回收站(recycle, delFlag=1)两个数据域。
 */
export function useFilePage(mode: FilePageMode = "active") {
  // 业务类型/存储类型字典:列文案统一由 sys_dict(biz-type/file-storage-type) 驱动
  const { labelOf: bizLabelOf } = useDict(DICT_CODES.bizType);
  const { labelOf: storageLabelOf } = useDict(DICT_CODES.fileStorageType);
  const form = reactive<{
    originalName: string;
    bizType: string;
    storageType: string;
    creatorName: string;
    /** 上传时间范围(日期选择器产出,查询时拆为 beginTime/endTime) */
    timeRange: string[];
  }>({
    originalName: "",
    bizType: "",
    storageType: "",
    creatorName: "",
    timeRange: []
  });

  // 分页查询公共骨架:分页状态 + 结果列表 + 加载态 + 序号守卫搜索 + 分页事件写回 + 表单重置
  const {
    pagination,
    dataList,
    loading,
    search,
    handleSizeChange,
    handleCurrentChange,
    resetForm
  } = usePageQuery<FileItem>(query => {
    const { timeRange, ...rest } = toRaw(form);
    return getFilePage({
      ...rest,
      delFlag: mode === "recycle" ? 1 : 0,
      beginTime: timeRange?.[0],
      endTime: timeRange?.[1],
      ...query
    });
  });

  const columns: TableColumnList = [
    {
      label: "预览",
      prop: "preview",
      // 与用户列表头像列同构:图片文件显示缩略图(点击放大),非图片文件留空
      cellRenderer: ({ row }) =>
        row.contentType?.startsWith("image/") ? (
          <el-image
            fit="cover"
            preview-teleported={true}
            hide-on-click-modal={true}
            src={`/file/view/${row.id}`}
            preview-src-list={Array.of(`/file/view/${row.id}`)}
            class="size-6 rounded-full align-middle"
          />
        ) : (
          ""
        ),
      width: 90
    },
    {
      label: "文件名",
      prop: "originalName",
      minWidth: 220
    },
    {
      label: "业务类型",
      prop: "bizType",
      minWidth: 110,
      cellRenderer: ({ row, props }) => (
        <el-tag size={props.size} effect="light">
          {bizLabelOf(row.bizType) || "未知"}
        </el-tag>
      )
    },
    {
      label: "业务关联",
      prop: "bizId",
      minWidth: 90,
      // 接入 yes 字典(0-否,1-是):bizId 有值归一化为 1,文案与样式由字典统一驱动;
      // tagMap 区分配色:已关联-绿色(success),未关联-灰色(info)
      cellRenderer: ({ row, props }) => (
        <DictTag
          dictCode="yes"
          value={row.bizId == null ? 0 : 1}
          size={props.size}
          effect="light"
          tagMap={{ "1": "success", "0": "info" }}
        />
      )
    },
    {
      label: "存储类型",
      prop: "storageType",
      minWidth: 100,
      // local 为默认主流程(primary 蓝),oss 为外部依赖(warning 橙)提示区分
      cellRenderer: ({ row, props }) => (
        <el-tag
          size={props.size}
          type={row.storageType === "oss" ? "warning" : "primary"}
          effect="light"
        >
          {storageLabelOf(row.storageType) || "未知"}
        </el-tag>
      )
    },
    {
      label: "大小",
      prop: "size",
      minWidth: 100,
      formatter: ({ size }) => formatSize(size)
    },
    {
      label: "扩展名",
      prop: "extension",
      minWidth: 90
    },
    {
      label: "上传人",
      prop: "creatorName",
      minWidth: 110
    },
    {
      label: "上传时间",
      prop: "createTime",
      minWidth: 170
    },
    {
      label: "操作",
      fixed: "right",
      width: 150,
      slot: "operation"
    }
  ];

  /** 删除文件到回收站:仅逻辑删除,物理文件保留,可在回收站恢复或彻底删除 */
  async function handleDelete(row: FileItem) {
    // 文件名按纯文本渲染,不走 HTML 片段,避免业务数据被当作 HTML 解析;
    // 关联业务的文件采用两段确认:第一段确认删除,第二段提示关联业务后再次确认
    const confirmed = await confirmAction(
      `确认删除文件「${row.originalName}」吗?删除后可在回收站恢复。`
    );
    if (!confirmed) return;
    if (row.bizId != null && row.bizId !== "") {
      const bizLabel = bizLabelOf(row.bizType);
      const bizConfirmed = await confirmAction(
        `该文件关联业务「${bizLabel}」,删除后业务展示不受影响,可在回收站恢复。是否继续删除?`,
        { confirmButtonText: "继续删除" }
      );
      if (!bizConfirmed) return;
    }
    const { success } = await deleteFile(row.id);
    if (success) {
      message("删除成功", { type: "success" });
      search();
    }
  }

  /** 恢复回收站文件:确认后仅恢复文件记录本身,不自动回滚业务引用(如头像仍指向现文件) */
  async function handleRestore(row: FileItem) {
    // 文件名按纯文本渲染,不走 HTML 片段,避免业务数据被当作 HTML 解析
    const confirmed = await confirmAction(
      `确认恢复文件「${row.originalName}」吗?恢复后将重新出现在文件列表。`
    );
    if (!confirmed) return;
    const { success } = await restoreFile(row.id);
    if (success) {
      message("已恢复至文件列表", { type: "success" });
      if (row.bizId != null && row.bizId !== "") {
        message(
          `该文件曾作为「${bizLabelOf(row.bizType)}」使用,恢复后不会自动重新生效`,
          { type: "info" }
        );
      }
      search();
    }
  }

  /** 彻底删除回收站文件:物理删除记录并兜底清理残留物理文件,不可恢复 */
  async function handlePhysicalDelete(row: FileItem) {
    // 文件名按纯文本渲染,不走 HTML 片段,避免业务数据被当作 HTML 解析;
    // 关联业务的文件采用两段确认:第一段确认彻底删除,第二段提示关联业务后再次确认
    const confirmed = await confirmAction(
      `确认彻底删除文件「${row.originalName}」吗?删除后不可恢复。`,
      { confirmButtonText: "彻底删除" }
    );
    if (!confirmed) return;
    if (row.bizId != null && row.bizId !== "") {
      const bizLabel = bizLabelOf(row.bizType);
      const bizConfirmed = await confirmAction(
        `该文件关联业务「${bizLabel}」,删除后相关业务将无法展示该文件,且不可恢复。是否继续彻底删除?`,
        { confirmButtonText: "继续彻底删除" }
      );
      if (!bizConfirmed) return;
    }
    const { success } = await physicalDeleteFile(row.id);
    if (success) {
      message("已彻底删除", { type: "success" });
      // 本页仅剩该条且非首页时回退一页,避免停留在空页
      if (dataList.value.length === 1 && pagination.currentPage > 1) {
        pagination.currentPage -= 1;
      }
      search();
    }
  }
  /** 下载文件:二进制流原样透传,按原始文件名触发另存为 */
  async function handleDownload(row: FileItem) {
    let res: Blob;
    try {
      res = await downloadFile(row.id);
    } catch {
      // 网络层失败(失败提示由拦截器统一弹出):静默返回
      return;
    }
    // 异常以 JSON 形式返回时降级为文本读取后提示(响应契约对齐 ApiResult);
    // 非 JSON 的错误页(如网关 HTML 错误页)按通用文案提示,不让 JSON.parse 抛异常
    if (res instanceof Blob && res.type.includes("application/json")) {
      const text = await res.text();
      try {
        const result = JSON.parse(text) as ApiResult;
        message(result.msg || "下载失败", { type: "error" });
      } catch {
        message("下载失败", { type: "error" });
      }
      return;
    }
    const url = URL.createObjectURL(res);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = row.originalName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  // 返回普通对象:解构使用时 ref 保持响应式;
  // 若包一层 reactive,解构出的 ref 会被拆箱成当时的值快照,模板将永远不更新
  return {
    form,
    loading,
    columns,
    dataList,
    pagination,
    onSearch: search,
    resetForm,
    handleSizeChange,
    handleCurrentChange,
    handleDelete,
    handleDownload,
    handleRestore,
    handlePhysicalDelete
  };
}

/**
 * 文件详情 hook —— 弹窗元数据展示 + 图片预览;
 * 访问地址为免登录分发地址(/file/view/{id}),可直接用于 img 标签渲染;
 * 访问地址的展示与复制由 ReCodeBlock 组件承载。
 */
export function useFileDetail() {
  const detail = ref<FileItem | null>(null);
  const detailVisible = ref(false);

  /** 图片类文件(content-type 以 image/ 开头)在详情弹窗内预览 */
  function isImage(row: FileItem) {
    return row.contentType?.startsWith("image/");
  }

  /** 免登录分发地址,可直接用于 img 标签与新窗口打开 */
  function viewUrl(row: FileItem) {
    return `/file/view/${row.id}`;
  }

  function openDetail(row: FileItem) {
    detail.value = row;
    detailVisible.value = true;
  }

  return {
    detail,
    detailVisible,
    isImage,
    viewUrl,
    openDetail
  };
}
