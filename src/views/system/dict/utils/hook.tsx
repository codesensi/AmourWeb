import { emphasize, message } from "@/utils/message";
import {
  openFormDialog,
  useBatchDelete,
  useBuiltinTag,
  usePageQuery,
  usePublicHooks,
  useStatusColumn,
  useStatusSwitch
} from "../../hooks";
import editForm from "../form.vue";
import type { FormItemProps } from "./types";
import {
  changeDictStatus,
  deleteDict,
  getDictPage,
  getDictTypeList,
  insertDict,
  updateDict
} from "@/api/dict";
import { useDictStoreHook } from "@/store/modules/dict";
import { useDict } from "@/hooks/useDict";
import { DICT_CODES } from "@/api/dict";
import { h, ref, toRaw, reactive, computed, onMounted } from "vue";
import type { SysDictPageItem, SysDictTypeItem } from "@/api/dict";

export function useDictPage() {
  // ===== 左侧:字典类型列表 =====
  const types = ref<Array<SysDictTypeItem>>([]);
  const typeKeyword = ref("");
  const typeLoading = ref(false);
  /** 当前选中的字典编码(主从联动的"主") */
  const selectedCode = ref("");
  const selectedName = computed(
    () =>
      types.value.find(item => item.dictCode === selectedCode.value)
        ?.dictName ?? ""
  );

  /** 类型关键字前端过滤(编码/名称) */
  const filteredTypes = computed(() => {
    const keyword = typeKeyword.value.trim().toLowerCase();
    if (!keyword) return types.value;
    return types.value.filter(
      item =>
        item.dictCode.toLowerCase().includes(keyword) ||
        item.dictName.toLowerCase().includes(keyword)
    );
  });

  /** 拉取左侧类型列表;原选中项失效时回退到第一项 */
  async function loadTypes() {
    typeLoading.value = true;
    const { success, data } = await getDictTypeList();
    if (success) {
      types.value = data;
      if (!data.some(item => item.dictCode === selectedCode.value)) {
        selectedCode.value = data[0]?.dictCode ?? "";
      }
    }
    typeLoading.value = false;
  }

  /** 切换左侧选中类型:重置右侧搜索并重新加载数据 */
  function handleSelect(code: string) {
    if (selectedCode.value === code) return;
    selectedCode.value = code;
    form.dictValue = "";
    form.status = "";
    pagination.currentPage = 1;
    search();
  }

  // ===== 右侧:选中类型下的字典数据 =====
  const form = reactive({
    dictValue: "",
    status: ""
  });
  const formRef = ref();
  const tableRef = ref();
  const { switchStyle } = usePublicHooks();
  // 启停状态字典:开关文案与确认弹窗统一由 sys_dict(enable) 驱动
  const { labelOf: enableLabelOf } = useDict(DICT_CODES.enable);
  // 分页查询公共骨架:分页状态 + 结果列表 + 加载态 + 序号守卫搜索 + 分页事件写回 + 表单重置
  const {
    pagination,
    dataList,
    loading,
    search,
    handleSizeChange,
    handleCurrentChange,
    resetForm
  } = usePageQuery(query => {
    // 未选中类型时右侧无数据:跳过本次查询,不回填列表与分页状态
    if (!selectedCode.value) return undefined;
    return getDictPage({
      dictCode: selectedCode.value,
      ...toRaw(form),
      ...query
    });
  });
  // 状态开关公共骨架:确认 + 提交加载态 + 成功提示 + 取消/失败回滚
  const { switchLoadMap, onChange } = useStatusSwitch<
    Required<SysDictPageItem>
  >({
    submit: row => changeDictStatus({ id: row.id, status: row.status }),
    confirmText: row =>
      h("span", [
        "确认要",
        h("strong", row.status === 0 ? enableLabelOf(0) : enableLabelOf(1)),
        "字典标签为",
        emphasize(row.dictLabel),
        "的条目吗?"
      ]),
    successText: row =>
      h("span", [
        `已${enableLabelOf(row.status)}`,
        emphasize(row.dictLabel),
        "字典条目"
      ]),
    // 状态影响消费端的 list-by-codes 结果,提交成功后同步刷新字典缓存
    afterSubmit: row => useDictStoreHook().refresh(row.dictCode)
  });
  // 状态开关列统一渲染(内置行禁用启停 + 权限门控,加载态来自 useStatusSwitch)
  const statusColumn = useStatusColumn<Required<SysDictPageItem>>({
    perms: "system:dict:update",
    switchLoadMap,
    onChange
  });
  // 删除/批量删除/多选三件套(确认弹窗、成功提示与刷新联动由骨架统一)
  const {
    selectedNum,
    handleDelete,
    onbatchDel,
    handleSelectionChange,
    onSelectionCancel
  } = useBatchDelete<SysDictPageItem>({
    tableRef,
    remove: deleteDict,
    nameOf: row => row.dictLabel,
    entity: "字典条目",
    unit: "条",
    // 删除影响消费端的 list-by-codes 结果,同步刷新涉及编码的字典缓存与左侧类型计数
    afterDeleted: async rows => {
      for (const code of new Set(rows.map(item => item.dictCode))) {
        await useDictStoreHook().refresh(code);
      }
      await loadTypes();
      search();
    },
    // 多选横幅不重置表格高度(与原页实现一致)
    resetAdaptive: false
  });
  // 「是否内置」列统一渲染(字典 yes 驱动)
  const builtinTagCell = useBuiltinTag();

  const columns: TableColumnList = [
    {
      label: "勾选列", // 如果需要表格多选，此处label必须设置
      type: "selection",
      fixed: "left",
      reserveSelection: true, // 数据刷新后保留选项
      /** 内置条目禁用勾选,全选时自动跳过(删除入口与后端校验对齐) */
      selectable: row => row.builtin === 0
    },
    {
      label: "字典值",
      prop: "dictValue",
      minWidth: 90
    },
    {
      label: "字典标签",
      prop: "dictLabel",
      minWidth: 110
    },
    {
      label: "排序",
      prop: "sort",
      width: 70
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 90,
      cellRenderer: statusColumn
    },
    {
      label: "是否内置",
      prop: "builtin",
      minWidth: 90,
      cellRenderer: builtinTagCell
    },
    {
      label: "备注",
      prop: "remark",
      minWidth: 130
    },
    {
      label: "创建时间",
      minWidth: 160,
      prop: "createTime"
    },
    {
      label: "操作",
      fixed: "right",
      width: 160,
      slot: "operation"
    }
  ];

  /** 新增/修改弹窗(字典编码固定为当前选中类型) */
  function openDialog(title: string, row?: SysDictPageItem) {
    openFormDialog({
      title: `${title}字典条目`,
      editForm,
      formRef,
      formInline: {
        title,
        id: row?.id,
        dictCode: selectedCode.value,
        // 新增时"字典名称"即类型名,预填当前类型中文名,避免填入不一致值改写类型名
        dictName: row?.dictName ?? selectedName.value,
        dictValue: row?.dictValue ?? "",
        dictLabel: row?.dictLabel ?? "",
        sort: row?.sort ?? 1,
        status: row?.status ?? 0,
        builtin: row?.builtin ?? 0,
        remark: row?.remark ?? ""
      },
      submit: async curData => {
        // 表单规则校验通过
        if (title === "修改") {
          // 修改场景针对已有行,id 必然存在(非空断言安全)
          await updateDict({ ...curData, id: curData.id! });
        } else {
          await insertDict(curData);
        }
        // 写后联动:刷新消费端字典缓存 + 左侧类型计数 + 右侧表格
        await useDictStoreHook().refresh(curData.dictCode);
        await loadTypes();
        search();
        message(
          h("span", [
            `${title === "新增" ? "成功新增" : "成功修改"}`,
            h(
              "strong",
              { style: "color: var(--el-color-primary)" },
              curData.dictLabel
            ),
            "字典条目"
          ]),
          { type: "success" }
        );
      }
    });
  }

  /** 新增条目(编码 = 当前选中类型) */
  function openCreate() {
    if (!selectedCode.value) {
      message("请先在左侧选择字典类型", { type: "warning" });
      return;
    }
    openDialog("新增");
  }

  /** 修改条目 */
  function openEdit(row: SysDictPageItem) {
    openDialog("修改", row);
  }

  onMounted(async () => {
    await loadTypes();
    search();
  });

  return {
    // 左侧
    typeKeyword,
    typeLoading,
    filteredTypes,
    selectedCode,
    selectedName,
    handleSelect,
    loadTypes,
    // 右侧
    form,
    loading,
    columns,
    dataList,
    pagination,
    tableRef,
    selectedNum,
    onSearch: search,
    resetForm,
    openCreate,
    openEdit,
    handleDelete,
    handleSelectionChange,
    onSelectionCancel,
    onbatchDel,
    handleSizeChange,
    handleCurrentChange
  };
}
