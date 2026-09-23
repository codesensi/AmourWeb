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
  changeTimeCapsuleHidden,
  deleteTimeCapsule,
  getTimeCapsulePage,
  insertTimeCapsule,
  updateTimeCapsule
} from "@/api/admin-time-capsule";
import type { TimeCapsulePageItem } from "@/api/admin-time-capsule";
import { DICT_CODES } from "@/api/sys-dict";
import { useDict } from "@/hooks/useDict";
import { queryClient } from "@/plugins/vue-query";
import { queryKeys } from "@/hooks/query-keys";
import { type Ref, h, reactive, ref, onMounted } from "vue";

/** 行数据剔除服务端注入字段后的可编辑形态(与后端 TimeCapsuleUpdateRequest 对齐;显隐经 change-hidden 维护) */
type TimeCapsuleUpdatePayload = {
  id: string;
  title: string;
  content: string;
  openTime: string;
};

export function useTimeCapsule(tableRef: Ref) {
  const form = reactive({
    title: "",
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
    getTimeCapsulePage({
      ...query,
      title: form.title,
      hidden:
        form.hidden === "" || form.hidden == null
          ? undefined
          : Number(form.hidden)
    })
  );

  /** 管理端写操作后失效门户时间胶囊缓存 */
  const invalidatePortalTimeCapsule = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.timeCapsule().key });

  // 删除/批量删除/多选三件套(确认弹窗、成功提示与刷新联动由骨架统一)
  const {
    selectedNum,
    handleDelete,
    onbatchDel,
    handleSelectionChange,
    onSelectionCancel
  } = useBatchDelete<TimeCapsulePageItem>({
    tableRef,
    remove: deleteTimeCapsule,
    nameOf: row => row.title,
    entity: "胶囊",
    unit: "封",
    afterDeleted: () => {
      search();
      void invalidatePortalTimeCapsule();
    }
  });

  /* ---------------- 显隐开关(独立 change-hidden 端点,文案取 hidden 字典) ---------------- */

  /** 显隐字典:开关文案/确认提示统一取字典 label */
  const { labelOf: hiddenLabelOf } = useDict(DICT_CODES.hidden);

  // 显隐开关公共骨架:确认 + 提交加载态 + 成功提示 + 取消/失败回滚(对齐画册/清单列表状态开关)
  const { switchLoadMap, onChange } = useStatusSwitch<TimeCapsulePageItem>({
    field: "hidden",
    submit: async row => {
      await changeTimeCapsuleHidden(row.id, row.hidden);
      await invalidatePortalTimeCapsule();
    },
    confirmText: row =>
      h("span", [
        "确认要将",
        emphasize(row.title),
        `设为${hiddenLabelOf(row.hidden)}吗?`
      ]),
    successText: row =>
      h("span", [`已${hiddenLabelOf(row.hidden)}`, emphasize(row.title)])
  });

  // 显隐开关列统一渲染(主题色/inline 文案/权限门控与画册列表状态开关对齐)
  const hiddenColumn = useStatusColumn<TimeCapsulePageItem>({
    perms: "admin:time-capsule:update",
    switchLoadMap,
    onChange,
    field: "hidden",
    labelOf: hiddenLabelOf
  });

  /** 解锁判定:解锁时间早于当前时间即已解锁(与后端口径一致;补 T 后解析,Safari 兼容) */
  const isUnlocked = (openTime: string) =>
    new Date(openTime.replace(" ", "T")) <= new Date();

  /** 列定义(显隐列见 hiddenColumn) */
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
      minWidth: 220
    },
    {
      label: "解锁时间",
      prop: "openTime",
      minWidth: 170
    },
    {
      label: "解锁状态",
      prop: "unlocked",
      minWidth: 100,
      cellRenderer: ({ row }: { row?: TimeCapsulePageItem }) => {
        const unlocked = row ? isUnlocked(row.openTime) : false;
        return (
          <el-tag type={unlocked ? "success" : "warning"} size="small">
            {unlocked ? "已解锁" : "封存中"}
          </el-tag>
        );
      }
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
      cellRenderer: ({ row }: { row?: TimeCapsulePageItem }) =>
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

  function openDialog(title = "新增", row?: TimeCapsulePageItem) {
    openFormDialog({
      title: `${title}时间胶囊`,
      editForm,
      formRef,
      formInline: {
        id: row?.id,
        title: row?.title ?? "",
        content: row?.content ?? "",
        openTime: row?.openTime ?? "",
        hidden: row?.hidden ?? 0
      },
      submit: async curData => {
        if (title === "新增") {
          await insertTimeCapsule({
            title: curData.title,
            content: curData.content,
            openTime: curData.openTime,
            hidden: curData.hidden
          });
        } else {
          await updateTimeCapsule({
            id: curData.id!,
            title: curData.title,
            content: curData.content,
            openTime: curData.openTime
          });
        }
        await invalidatePortalTimeCapsule();
        message(`成功${title}时间胶囊`, { type: "success" });
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
