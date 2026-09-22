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
  changeLovePhotoHidden,
  deleteLovePhoto,
  getLovePhotoPage,
  insertLovePhoto,
  updateLovePhoto
} from "@/api/admin-love-photo";
import type { LovePhotoPageItem } from "@/api/admin-love-photo";
import { useDict } from "@/hooks/useDict";
import { queryClient } from "@/plugins/vue-query";
import { queryKeys } from "@/hooks/query-keys";
import { type Ref, h, ref, reactive, onMounted } from "vue";

/** 行数据剔除服务端注入字段后的可编辑形态(与后端 LovePhotoUpdateRequest 对齐) */
type LovePhotoUpdatePayload = {
  id: string;
  url: string;
  caption: string;
  dateText: string;
  tags: Array<string>;
  sort: number;
};

export function useLovePhoto(tableRef: Ref) {
  const form = reactive({
    caption: "",
    tag: "",
    hidden: ""
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
    getLovePhotoPage({
      ...query,
      caption: form.caption,
      tag: form.tag,
      hidden:
        form.hidden === "" || form.hidden == null
          ? undefined
          : Number(form.hidden)
    })
  );

  /** 管理端写操作后失效门户画册缓存(key 前缀同时覆盖画册分页与首页最新一张两个子资源) */
  const invalidatePortalLovePhoto = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.lovePhoto().key });

  // 删除/批量删除/多选三件套(确认弹窗、成功提示与刷新联动由骨架统一)
  const {
    selectedNum,
    handleDelete,
    onbatchDel,
    handleSelectionChange,
    onSelectionCancel
  } = useBatchDelete<LovePhotoPageItem>({
    tableRef,
    remove: deleteLovePhoto,
    nameOf: row => row.caption || "未命名照片",
    entity: "照片",
    unit: "张",
    afterDeleted: () => {
      search();
      void invalidatePortalLovePhoto();
    }
  });

  /* ---------------- 显隐开关(独立 change-hidden 端点,文案取 hidden 字典) ---------------- */

  /** 显隐字典:开关文案/确认提示统一取字典 label */
  const { labelOf: hiddenLabelOf } = useDict(DICT_CODES.hidden);

  // 显隐开关公共骨架:确认 + 提交加载态 + 成功提示 + 取消/失败回滚(对齐用户列表状态开关)
  const { switchLoadMap, onChange } = useStatusSwitch<LovePhotoPageItem>({
    field: "hidden",
    submit: async row => {
      await changeLovePhotoHidden(row.id, row.hidden);
      await invalidatePortalLovePhoto();
    },
    confirmText: row =>
      h("span", [
        "确认要将",
        emphasize(row.caption || "未命名照片"),
        `设为${hiddenLabelOf(row.hidden)}吗?`
      ]),
    successText: row =>
      h("span", [
        `已${hiddenLabelOf(row.hidden)}`,
        emphasize(row.caption || "未命名照片")
      ])
  });

  // 显隐开关列统一渲染(主题色/inline 文案/权限门控与用户列表状态开关对齐)
  const hiddenColumn = useStatusColumn<LovePhotoPageItem>({
    perms: "admin:love-photo:update",
    switchLoadMap,
    onChange,
    field: "hidden",
    labelOf: hiddenLabelOf
  });

  /** 列定义(显隐列见 hiddenColumn) */
  const columns: TableColumnList = [
    {
      label: "勾选列", // 如果需要表格多选，此处label必须设置
      type: "selection",
      fixed: "left",
      reserveSelection: true // 数据刷新后保留选项
    },
    {
      label: "排序",
      prop: "sort",
      width: 70
    },
    {
      label: "照片",
      prop: "url",
      cellRenderer: ({ row }) =>
        row.url ? (
          <el-image
            fit="cover"
            preview-teleported={true}
            hide-on-click-modal={true}
            src={row.url}
            preview-src-list={Array.of(row.url)}
            class="size-10 rounded align-middle"
          />
        ) : (
          ""
        ),
      width: 90
    },
    {
      label: "文案",
      prop: "caption",
      minWidth: 160
    },
    {
      label: "标签",
      prop: "tags",
      minWidth: 140,
      cellRenderer: ({ row }: { row?: LovePhotoPageItem }) => (
        <>
          {(row?.tags ?? "")
            .split(",")
            .filter(tag => tag !== "")
            .map(tag => (
              <el-tag key={tag} size="small" class="mr-1!">
                {tag}
              </el-tag>
            ))}
        </>
      )
    },
    {
      label: "日期",
      prop: "dateText",
      minWidth: 110
    },
    {
      label: "显隐",
      prop: "hidden",
      minWidth: 90,
      cellRenderer: hiddenColumn
    },
    {
      label: "创建人",
      prop: "creatorName",
      width: 110,
      cellRenderer: ({ row }) => row.creatorName ?? ""
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

  function openDialog(title = "新增", row?: LovePhotoPageItem) {
    openFormDialog({
      title: `${title}照片`,
      editForm,
      formRef,
      formInline: {
        title,
        id: row?.id,
        url: row?.url ?? "",
        caption: row?.caption ?? "",
        dateText: row?.dateText ?? "",
        tags: (row?.tags ?? "")
          .split(",")
          .map(tag => tag.trim())
          .filter(tag => tag !== ""),
        sort: row?.sort ?? 0,
        hidden: row?.hidden ?? 0
      },
      submit: async curData => {
        const payload: LovePhotoUpdatePayload = {
          id: curData.id!,
          url: curData.url,
          caption: curData.caption,
          dateText: curData.dateText,
          tags: curData.tags,
          sort: curData.sort
        };
        if (title === "新增") {
          await insertLovePhoto({ ...payload, hidden: curData.hidden });
        } else {
          await updateLovePhoto(payload);
        }
        await invalidatePortalLovePhoto();
        message(`成功${title}照片`, { type: "success" });
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
