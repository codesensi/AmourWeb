import { onMounted, reactive, ref, toRaw } from "vue";
import { ElMessageBox } from "element-plus";
import { useClipboard } from "@vueuse/core";
import type { PaginationProps } from "@pureadmin/table";
import { deleteFile, getFilePage, type FileItem } from "@/api/file";
import { http } from "@/utils/http";
import { message } from "@/utils/message";

/** 业务类型标签映射(与后端 FileBizTypeEnum 对齐) */
export const BIZ_TYPE_LABELS: Record<string, string> = {
  avatar: "用户头像",
  photo: "相册照片",
  markdown: "点滴配图"
};

/** 存储类型标签映射 */
export const STORAGE_TYPE_LABELS: Record<string, string> = {
  local: "本地",
  oss: "对象存储"
};

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
 * 页面骨架对齐日志管理页(搜索表单 + PureTableBar + 自适应表格)。
 */
export function useFilePage() {
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
  const dataList = ref<FileItem[]>([]);
  const loading = ref(true);

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 20,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
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
          {BIZ_TYPE_LABELS[row.bizType] ?? row.bizType ?? "未知"}
        </el-tag>
      )
    },
    {
      label: "存储类型",
      prop: "storageType",
      minWidth: 100,
      cellRenderer: ({ row, props }) => (
        <el-tag
          size={props.size}
          type={row.storageType === "oss" ? "warning" : "info"}
          effect="light"
        >
          {STORAGE_TYPE_LABELS[row.storageType] ?? row.storageType ?? "未知"}
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

  /** pure-table 的分页事件只携带新值(写在其内部分页副本上),需在此写回分页状态后再查询 */
  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    try {
      const { timeRange, ...rest } = toRaw(form);
      const { success, data } = await getFilePage({
        ...rest,
        beginTime: timeRange?.[0],
        endTime: timeRange?.[1],
        pageNumber: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (success) {
        dataList.value = data.records;
        pagination.total = data.totalRow;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.pageNumber;
      }
    } finally {
      // 请求失败(业务失败被拦截器 reject)时也复位加载态,避免表格永久转圈
      loading.value = false;
    }
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  /**
   * 删除文件:已被业务采纳(bizId 非空)时升级为强警示确认,
   * 确认后携带 force=true 强制删除;普通文件常规确认即可。
   */
  async function handleDelete(row: FileItem) {
    const referenced = row.bizId != null && row.bizId !== "";
    const tip = referenced
      ? `该文件已被业务「${BIZ_TYPE_LABELS[row.bizType] ?? row.bizType}」引用(关联ID ${row.bizId}),删除后相关业务将无法展示,是否继续?`
      : `确认删除文件「${row.originalName}」吗?删除后不可恢复。`;
    const confirmed = await ElMessageBox.confirm(tip, "系统提示", {
      confirmButtonText: referenced ? "强制删除" : "确定",
      cancelButtonText: "取消",
      type: "warning",
      draggable: true
    })
      .then(() => true)
      .catch(() => false);
    if (!confirmed) return;
    const { success } = await deleteFile(row.id, referenced);
    if (success) {
      message("删除成功", { type: "success" });
      onSearch();
    }
  }

  /** 下载文件:二进制流原样透传,按原始文件名触发另存为 */
  async function handleDownload(row: FileItem) {
    const res = await http.request<Blob>(
      "get",
      `/file/download/${row.id}`,
      { responseType: "blob", timeout: 0 }
    );
    // 异常以 JSON 形式返回时降级为文本读取后提示
    if (res instanceof Blob && res.type.includes("application/json")) {
      const text = await res.text();
      const result = JSON.parse(text) as { msg?: string };
      message(result.msg || "下载失败", { type: "error" });
      return;
    }
    const url = URL.createObjectURL(res);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = row.originalName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  /** 进入页面即加载第一页数据(对齐用户管理页 hook 内自动加载) */
  onMounted(() => onSearch());

  // 返回普通对象:解构使用时 ref 保持响应式;
  // 若包一层 reactive,解构出的 ref 会被拆箱成当时的值快照,模板将永远不更新
  return {
    form,
    loading,
    columns,
    dataList,
    pagination,
    onSearch,
    resetForm,
    handleSizeChange,
    handleCurrentChange,
    handleDelete,
    handleDownload
  };
}

/**
 * 文件详情 hook —— 弹窗元数据展示 + 图片预览 + 访问地址复制;
 * 访问地址为免登录分发地址(/file/view/{id}),可直接用于 img 标签渲染。
 */
export function useFileDetail() {
  const detail = ref<FileItem | null>(null);
  const detailVisible = ref(false);
  /** 访问地址复制态,1.5s 后还原按钮态 */
  const copied = ref(false);
  /** legacy 模式:非安全上下文(http)自动降级 execCommand 复制 */
  const { copy: copyText } = useClipboard({ legacy: true });

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
    copied.value = false;
  }

  /** 复制访问地址到剪贴板,1.5s 后还原按钮态 */
  async function copyUrl() {
    if (!detail.value) return;
    try {
      await copyText(viewUrl(detail.value));
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 1500);
    } catch {
      ElMessageBox.alert("复制失败,请手动选择文本复制", "系统提示");
    }
  }

  return {
    detail,
    detailVisible,
    copied,
    isImage,
    viewUrl,
    openDetail,
    copyUrl
  };
}

