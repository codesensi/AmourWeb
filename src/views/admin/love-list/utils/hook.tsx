import editForm from "../form.vue";
import { emphasize, message } from "@/utils/message";
import {
  openFormDialog,
  useBatchDelete,
  usePageQuery,
  useStatusColumn,
  useStatusSwitch
} from "@/views/system/hooks";
import {
  changeLoveListHidden,
  deleteLoveList,
  getLoveListPage,
  insertLoveList,
  updateLoveList
} from "@/api/admin-love-list";
import type { LoveListPageItem } from "@/api/admin-love-list";
import { DICT_CODES } from "@/api/sys-dict";
import { useDict } from "@/hooks/useDict";
import { queryClient } from "@/plugins/vue-query";
import { queryKeys } from "@/hooks/query-keys";
import { type Ref, h, reactive, ref, onMounted } from "vue";

/** 行数据剔除服务端注入字段后的可编辑形态(与后端 LoveListUpdateRequest 对齐;显隐经 change-hidden 维护) */
type LoveListUpdatePayload = {
  id: string;
  content: string;
  done: number;
  photo: string;
  sort: number;
};

export function useLoveList(tableRef: Ref) {
  const form = reactive({
    content: "",
    done: "",
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
    getLoveListPage({
      ...query,
      content: form.content,
      done:
        form.done === "" || form.done == null ? undefined : Number(form.done),
      hidden:
        form.hidden === "" || form.hidden == null
          ? undefined
          : Number(form.hidden)
    })
  );

  /** 管理端写操作后失效门户恋爱清单缓存 */
  const invalidatePortalLoveList = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.loveList().key });

  // 删除/批量删除/多选三件套(确认弹窗、成功提示与刷新联动由骨架统一)
  const {
    selectedNum,
    handleDelete,
    onbatchDel,
    handleSelectionChange,
    onSelectionCancel
  } = useBatchDelete<LoveListPageItem>({
    tableRef,
    remove: deleteLoveList,
    nameOf: row => row.content,
    entity: "清单项",
    unit: "项",
    afterDeleted: () => {
      search();
      void invalidatePortalLoveList();
    }
  });

  /* ---------------- 完成状态(文案统一取字典 label) ---------------- */

  /** 完成状态字典:列表标签/表单开关文案统一取字典 label */
  const { labelOf: doneLabelOf } = useDict(DICT_CODES.done);

  /* ---------------- 显隐开关(独立 change-hidden 端点,文案取 hidden 字典) ---------------- */

  /** 显隐字典:开关文案/确认提示统一取字典 label */
  const { labelOf: hiddenLabelOf } = useDict(DICT_CODES.hidden);

  // 显隐开关公共骨架:确认 + 提交加载态 + 成功提示 + 取消/失败回滚(对齐画册列表状态开关)
  const { switchLoadMap, onChange } = useStatusSwitch<LoveListPageItem>({
    field: "hidden",
    submit: async row => {
      await changeLoveListHidden(row.id, row.hidden);
      await invalidatePortalLoveList();
    },
    confirmText: row =>
      h("span", [
        "确认要将",
        emphasize(row.content),
        `设为${hiddenLabelOf(row.hidden)}吗?`
      ]),
    successText: row =>
      h("span", [`已${hiddenLabelOf(row.hidden)}`, emphasize(row.content)])
  });

  // 显隐开关列统一渲染(主题色/inline 文案/权限门控与画册列表状态开关对齐)
  const hiddenColumn = useStatusColumn<LoveListPageItem>({
    perms: "admin:love-list:update",
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
      label: "清单内容",
      prop: "content",
      minWidth: 220
    },
    {
      label: "完成状态",
      prop: "done",
      minWidth: 100,
      cellRenderer: ({ row }: { row?: LoveListPageItem }) => (
        <el-tag type={row?.done ? "success" : "info"} size="small">
          {doneLabelOf(String(row?.done ?? 0))}
        </el-tag>
      )
    },
    {
      label: "纪念照",
      prop: "photo",
      cellRenderer: ({ row }) =>
        row.photo ? (
          <el-image
            fit="cover"
            preview-teleported={true}
            hide-on-click-modal={true}
            src={row.photo}
            preview-src-list={Array.of(row.photo)}
            class="size-10 rounded align-middle"
          />
        ) : (
          ""
        ),
      width: 90
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
      cellRenderer: ({ row }: { row?: LoveListPageItem }) =>
        row?.creatorName ?? ""
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

  function openDialog(title = "新增", row?: LoveListPageItem) {
    openFormDialog({
      title: `${title}清单项`,
      editForm,
      formRef,
      formInline: {
        title,
        id: row?.id,
        content: row?.content ?? "",
        done: row?.done ?? 0,
        photo: row?.photo ?? "",
        sort: row?.sort ?? 0,
        hidden: row?.hidden ?? 0
      },
      submit: async curData => {
        if (title === "新增") {
          await insertLoveList({
            content: curData.content,
            done: curData.done,
            photo: curData.photo,
            sort: curData.sort,
            hidden: curData.hidden
          });
        } else {
          await updateLoveList({
            id: curData.id!,
            content: curData.content,
            done: curData.done,
            photo: curData.photo,
            sort: curData.sort
          });
        }
        await invalidatePortalLoveList();
        message(`成功${title}清单项`, { type: "success" });
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
