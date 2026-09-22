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
  changeAnniversaryHidden,
  deleteAnniversary,
  getAnniversaryPage,
  insertAnniversary,
  updateAnniversary
} from "@/api/admin-anniversary";
import type { AnniversaryPageItem } from "@/api/admin-anniversary";
import { useDict } from "@/hooks/useDict";
import { queryClient } from "@/plugins/vue-query";
import { queryKeys } from "@/hooks/query-keys";
import { type Ref, reactive, ref, h, onMounted } from "vue";

/** 行数据剔除服务端注入字段后的可编辑形态(与后端 AnniversaryUpdateRequest 对齐) */
type AnniversaryUpdatePayload = {
  id: string;
  name: string;
  type: string;
  anniversaryDate: string;
  repeatYearly: boolean;
  sort: number;
};

export function useAnniversary(tableRef: Ref) {
  const form = reactive({
    name: "",
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
    getAnniversaryPage({
      ...query,
      name: form.name,
      hidden:
        form.hidden === "" || form.hidden == null
          ? undefined
          : Number(form.hidden)
    })
  );

  /** 管理端写操作后失效门户纪念日缓存(key 前缀同时覆盖纪念日页分页与首页卡片两个子资源) */
  const invalidatePortalAnniversary = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.anniversaryList().key
    });

  // 删除/批量删除/多选三件套(确认弹窗、成功提示与刷新联动由骨架统一)
  const {
    selectedNum,
    handleDelete,
    onbatchDel,
    handleSelectionChange,
    onSelectionCancel
  } = useBatchDelete<AnniversaryPageItem>({
    tableRef,
    remove: deleteAnniversary,
    nameOf: row => row.name,
    entity: "纪念日",
    unit: "条",
    afterDeleted: () => {
      search();
      void invalidatePortalAnniversary();
    }
  });

  /** 类型字典:表格类型列文案取字典 label */
  const { labelOf: typeLabelOf } = useDict(DICT_CODES.anniversaryType);

  /* ---------------- 显隐开关(独立 change-hidden 端点,文案取 hidden 字典) ---------------- */

  /** 显隐字典:开关文案/确认提示统一取字典 label */
  const { labelOf: hiddenLabelOf } = useDict(DICT_CODES.hidden);

  // 显隐开关公共骨架:确认 + 提交加载态 + 成功提示 + 取消/失败回滚(对齐足迹列表状态开关)
  const { switchLoadMap, onChange } = useStatusSwitch<AnniversaryPageItem>({
    field: "hidden",
    submit: async row => {
      await changeAnniversaryHidden(row.id, row.hidden);
      await invalidatePortalAnniversary();
    },
    confirmText: row =>
      h("span", [
        "确认要将",
        emphasize(row.name),
        `设为${hiddenLabelOf(row.hidden)}吗?`
      ]),
    successText: row =>
      h("span", [`已${hiddenLabelOf(row.hidden)}`, emphasize(row.name)])
  });

  // 显隐开关列统一渲染(主题色/inline 文案/权限门控与足迹列表状态开关对齐)
  const hiddenColumn = useStatusColumn<AnniversaryPageItem>({
    perms: "admin:anniversary:update",
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
      label: "名称",
      prop: "name",
      minWidth: 140
    },
    {
      label: "类型",
      prop: "type",
      minWidth: 110,
      cellRenderer: ({ row }) => typeLabelOf(row.type)
    },
    {
      label: "日期",
      prop: "anniversaryDate",
      minWidth: 110
    },
    {
      label: "每年重复",
      prop: "repeatYearly",
      minWidth: 90,
      cellRenderer: ({ row }) => (row.repeatYearly ? "是" : "否")
    },
    {
      label: "排序",
      prop: "sort",
      minWidth: 80
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

  function openDialog(title = "新增", row?: AnniversaryPageItem) {
    // 响应式表单数据:与 form.vue 表单控件共享同一代理
    const formInline = reactive({
      title,
      id: row?.id,
      name: row?.name ?? "",
      type: row?.type ?? "",
      anniversaryDate: row?.anniversaryDate ?? "",
      repeatYearly: row?.repeatYearly ?? true,
      sort: row?.sort ?? 0,
      hidden: row?.hidden ?? 0
    });
    openFormDialog({
      title: `${title}纪念日`,
      editForm,
      formRef,
      formInline,
      submit: async curData => {
        // 显隐以 URL 直存口径对齐足迹:仅新增传入,修改走 change-hidden 独立端点
        const payload: AnniversaryUpdatePayload = {
          id: curData.id!,
          name: curData.name,
          type: curData.type,
          anniversaryDate: curData.anniversaryDate,
          repeatYearly: curData.repeatYearly,
          sort: curData.sort
        };
        if (title === "新增") {
          await insertAnniversary({ ...payload, hidden: curData.hidden });
        } else {
          await updateAnniversary(payload);
        }
        await invalidatePortalAnniversary();
        message(`成功${title}纪念日`, { type: "success" });
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
