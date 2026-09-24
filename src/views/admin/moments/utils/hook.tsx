import editForm from "../form.vue";
import { emphasize, message } from "@/utils/message";
import {
  openFormDialog,
  useBatchDelete,
  usePageQuery,
  useStatusColumn,
  useStatusSwitch
} from "@/views/system/hooks";
import { DICT_CODES } from "@/api/sys-dict";
import {
  changeMomentsStatus,
  deleteMoments,
  getMomentsPage,
  insertMoments,
  updateMoments
} from "@/api/admin-moments";
import type { MomentsPageItem } from "@/api/admin-moments";
import { useDict } from "@/hooks/useDict";
import { queryClient } from "@/plugins/vue-query";
import { queryKeys } from "@/hooks/query-keys";
import { type Ref, reactive, ref, h, onMounted } from "vue";

export function useMoments(tableRef: Ref) {
  const form = reactive({
    title: "",
    category: "",
    status: ""
  });
  const formRef = ref();

  // 分页查询公共骨架:分页状态 + 结果列表 + 加载态 + 序号守卫搜索 + 分页事件写回 + 表单重置
  const {
    pagination,
    dataList,
    loading,
    search,
    handleSizeChange,
    handleCurrentChange,
    resetForm
  } = usePageQuery(query =>
    getMomentsPage({
      ...query,
      title: form.title,
      category: form.category,
      status:
        form.status === "" || form.status == null
          ? undefined
          : Number(form.status)
    })
  );

  /** 管理端写操作后失效门户点点滴滴缓存(列表 + 按文章参数化的详情键) */
  const invalidatePortalMoments = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.moments().key });
    queryClient.invalidateQueries({ queryKey: ["moment"] });
  };

  // 删除/批量删除/多选三件套(确认弹窗、成功提示与刷新联动由骨架统一)
  const {
    selectedNum,
    handleDelete,
    onbatchDel,
    handleSelectionChange,
    onSelectionCancel
  } = useBatchDelete<MomentsPageItem>({
    tableRef,
    remove: deleteMoments,
    nameOf: row => row.title,
    entity: "文章",
    unit: "篇",
    afterDeleted: () => {
      search();
      void invalidatePortalMoments();
    }
  });

  /** 富文本摘要:去标签取纯文本并截断,用于表格正文列预览 */
  const excerptOf = (html: string, max = 40): string => {
    const text = html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > max ? `${text.slice(0, max)}…` : text;
  };

  /* ---------------- 状态开关(独立 change-status 端点,文案取 hidden 字典) ---------------- */

  /** 状态字典:开关文案/确认提示统一取字典 label(hidden 字典与文章状态同语义:0-显示,1-隐藏) */
  const { labelOf: statusLabelOf } = useDict(DICT_CODES.hidden);

  // 状态开关公共骨架:确认 + 提交加载态 + 成功提示 + 取消/失败回滚(对齐纪念日/足迹列表状态开关)
  const { switchLoadMap, onChange } = useStatusSwitch<MomentsPageItem>({
    field: "status",
    submit: async row => {
      await changeMomentsStatus(row.id, row.status);
      await invalidatePortalMoments();
    },
    confirmText: row =>
      h("span", [
        "确认要将",
        emphasize(row.title),
        `设为${statusLabelOf(row.status)}吗?`
      ]),
    successText: row =>
      h("span", [`已${statusLabelOf(row.status)}`, emphasize(row.title)])
  });

  // 状态开关列统一渲染(主题色/inline 文案/权限门控与足迹列表状态开关对齐)
  const statusColumn = useStatusColumn<MomentsPageItem>({
    perms: "admin:moments:update",
    switchLoadMap,
    onChange,
    field: "status",
    labelOf: statusLabelOf
  });

  /** 列定义 */
  const columns: TableColumnList = [
    {
      label: "勾选列", // 如果需要表格多选，此处label必须设置
      type: "selection",
      fixed: "left",
      reserveSelection: true // 数据刷新后保留选项
    },
    {
      label: "标题",
      prop: "title",
      minWidth: 220,
      cellRenderer: ({ row }: { row?: MomentsPageItem }) => (
        <span class="font-medium">{row?.title ?? ""}</span>
      )
    },
    {
      label: "分类",
      prop: "category",
      minWidth: 90,
      cellRenderer: ({ row }: { row?: MomentsPageItem }) =>
        row?.category ? (
          <el-tag size="small">{row.category}</el-tag>
        ) : (
          <span class="text-(--el-text-color-placeholder)">-</span>
        )
    },
    {
      label: "标签",
      prop: "tags",
      minWidth: 140,
      cellRenderer: ({ row }: { row?: MomentsPageItem }) => {
        const tags = (row?.tags ?? "")
          .split(",")
          .map(tag => tag.trim())
          .filter(Boolean);
        return tags.length ? (
          <div class="flex flex-wrap gap-1">
            {tags.map(tag => (
              <el-tag size="small" type="info">
                {tag}
              </el-tag>
            ))}
          </div>
        ) : (
          <span class="text-(--el-text-color-placeholder)">-</span>
        );
      }
    },
    {
      label: "记录日期",
      prop: "recordDate",
      minWidth: 120
    },
    {
      label: "作者",
      prop: "username",
      minWidth: 90
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 80,
      cellRenderer: statusColumn
    },
    {
      label: "正文预览",
      prop: "content",
      minWidth: 240,
      cellRenderer: ({ row }: { row?: MomentsPageItem }) =>
        excerptOf(row?.content ?? "")
    },
    {
      label: "创建时间",
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

  function openDialog(title = "新增", row?: MomentsPageItem) {
    openFormDialog({
      title: `${title}点点滴滴文章`,
      editForm,
      formRef,
      formInline: {
        id: row?.id,
        title: row?.title ?? "",
        recordDate: row?.recordDate ?? "",
        category: row?.category ?? "",
        tags: row?.tags ?? "",
        sort: row?.sort ?? 0,
        status: row?.status ?? 0,
        content: row?.content ?? ""
      },
      submit: async curData => {
        if (title === "新增") {
          // 状态仅新增时随表单传入,修改经列表状态开关走 change-status 独立端点
          await insertMoments({ ...curData, status: curData.status });
        } else {
          await updateMoments({
            id: curData.id!,
            title: curData.title,
            recordDate: curData.recordDate,
            category: curData.category,
            tags: curData.tags,
            sort: curData.sort,
            content: curData.content
          });
        }
        await invalidatePortalMoments();
        message(`成功${title}点点滴滴文章`, { type: "success" });
        search(); // 刷新表格数据
      }
    });
  }

  onMounted(() => {
    search();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    selectedNum,
    pagination,
    onSearch: search,
    resetForm,
    onbatchDel,
    openDialog,
    handleDelete,
    handleSizeChange,
    onSelectionCancel,
    handleCurrentChange,
    handleSelectionChange
  };
}
