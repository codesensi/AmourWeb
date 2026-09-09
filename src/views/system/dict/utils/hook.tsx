import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { usePublicHooks } from "../../hooks";
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
import { ElMessageBox } from "element-plus";
import type { PaginationProps } from "@pureadmin/table";
import { deviceDetection, getKeyList } from "@pureadmin/utils";
import { h, ref, toRaw, reactive, computed, onMounted } from "vue";
import type { SysDictTypeItem } from "@/api/dict";

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
    onSearch();
  }

  // ===== 右侧:选中类型下的字典数据 =====
  const form = reactive({
    dictValue: "",
    status: ""
  });
  const formRef = ref();
  const dataList = ref([]);
  const loading = ref(true);
  const switchLoadMap = ref({});
  const tableRef = ref();
  const selectedNum = ref(0);
  const { switchStyle } = usePublicHooks();
  // 是否字典:是否内置列文案由 sys_dict(yes) 驱动
  const { labelOf: yesLabelOf } = useDict(DICT_CODES.yes);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 20,
    currentPage: 1,
    background: true
  });

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
      cellRenderer: scope => (
        <el-switch
          size={scope.props.size === "small" ? "small" : "default"}
          loading={switchLoadMap.value[scope.index]?.loading}
          v-model={scope.row.status}
          active-value={0}
          inactive-value={1}
          active-text="启用"
          inactive-text="禁用"
          /** 内置条目不允许更改状态;无修改权限时同样禁用,与操作列门控对齐 */
          disabled={scope.row.builtin === 1 || !hasPerms("system:dict:update")}
          inline-prompt
          style={switchStyle.value}
          onChange={() => onChange(scope as any)}
        />
      )
    },
    {
      label: "是否内置",
      prop: "builtin",
      minWidth: 90,
      cellRenderer: ({ row }) => (
        <el-tag size="small" type={row.builtin === 1 ? "warning" : "info"}>
          {yesLabelOf(row.builtin)}
        </el-tag>
      )
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

  /** 状态开关确认 */
  function onChange({ row, index }) {
    ElMessageBox.confirm(
      `确认要<strong>${
        row.status === 0 ? "启用" : "禁用"
      }</strong>字典标签为<strong style='color:var(--el-color-primary)'>${
        row.dictLabel
      }</strong>的条目吗?`,
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: true,
        draggable: true
      }
    )
      .then(async () => {
        switchLoadMap.value[index] = Object.assign(
          {},
          switchLoadMap.value[index],
          { loading: true }
        );
        try {
          await changeDictStatus({ id: row.id, status: row.status });
          // 状态影响消费端的 list-by-codes 结果,同步刷新字典缓存
          await useDictStoreHook().refresh(row.dictCode);
          message(
            `已${row.status === 0 ? "启用" : "禁用"}<strong style='color:var(--el-color-primary)'>${row.dictLabel}</strong>字典条目`,
            { type: "success", dangerouslyUseHTMLString: true }
          );
        } catch {
          // 接口失败回滚开关,与取消回滚共用同一处理
          row.status = row.status === 0 ? 1 : 0;
        } finally {
          switchLoadMap.value[index] = Object.assign(
            {},
            switchLoadMap.value[index],
            { loading: false }
          );
        }
      })
      .catch(() => {
        row.status === 0 ? (row.status = 1) : (row.status = 0);
      });
  }

  async function handleDelete(row) {
    // 确认弹窗与状态开关/修改新增弹窗风格一致;字典标签样式加粗 + 主题主色
    ElMessageBox.confirm(
      `确认要删除<strong style='color:var(--el-color-primary)'>${row.dictLabel}</strong>字典条目吗?`,
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: true,
        draggable: true
      }
    )
      .then(async () => {
        await deleteDict(row.id);
        message(
          `成功删除<strong style='color:var(--el-color-primary)'>${row.dictLabel}</strong>字典条目`,
          { type: "success", dangerouslyUseHTMLString: true }
        );
        await useDictStoreHook().refresh(row.dictCode);
        await loadTypes();
        onSearch();
      })
      .catch(() => {});
  }

  /** 当CheckBox选择项发生变化时会触发该事件 */
  function handleSelectionChange(val) {
    selectedNum.value = val.length;
  }

  /** 取消选择 */
  function onSelectionCancel() {
    selectedNum.value = 0;
    // 用于多选表格，清空用户的选择
    tableRef.value.getTableRef().clearSelection();
  }

  /** 批量删除(复用删除接口,ID 逗号拼接,后端整批校验) */
  function onbatchDel() {
    // 返回当前选中的行(selectable 已禁用内置条目勾选,选中项不会包含内置条目)
    const curSelected = tableRef.value.getTableRef().getSelectionRows();
    const ids = getKeyList(curSelected, "id");
    const names = getKeyList(curSelected, "dictLabel");
    // 超过 3 个折叠展示,避免弹窗内容过长
    const displayNames =
      names.length > 3
        ? `${names.slice(0, 3).join("、")} 等 ${names.length} 条`
        : names.join("、");
    // 确认弹窗与单条删除/状态开关风格一致;字典标签加粗 + 主题主色
    ElMessageBox.confirm(
      `确认要删除<strong style='color:var(--el-color-primary)'>${displayNames}</strong>字典条目吗?`,
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: true,
        draggable: true
      }
    )
      .then(async () => {
        await deleteDict(ids.join(","));
        // 批量删除可能涉及多个编码,统一刷新消费端字典缓存
        for (const code of new Set(getKeyList(curSelected, "dictCode"))) {
          await useDictStoreHook().refresh(code);
        }
        message(
          `成功删除<strong style='color:var(--el-color-primary)'>${displayNames}</strong>字典条目`,
          { type: "success", dangerouslyUseHTMLString: true }
        );
        tableRef.value.getTableRef().clearSelection();
        await loadTypes();
        onSearch();
      })
      .catch(() => {});
  }

  /** pure-table 已回写 pagination.currentPage/pageSize,此处重新拉取分页数据 */
  function handleSizeChange() {
    onSearch();
  }

  function handleCurrentChange() {
    onSearch();
  }

  async function onSearch() {
    // 未选中类型时右侧无数据
    if (!selectedCode.value) {
      dataList.value = [];
      pagination.total = 0;
      return;
    }
    loading.value = true;
    const { success, data } = await getDictPage({
      dictCode: selectedCode.value,
      ...toRaw(form),
      pageNumber: pagination.currentPage,
      pageSize: pagination.pageSize
    });
    if (success) {
      dataList.value = data.records;
      pagination.total = data.totalRow;
      pagination.pageSize = data.pageSize;
      pagination.currentPage = data.pageNumber;
    }
    loading.value = false;
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  /** 新增/修改弹窗(字典编码固定为当前选中类型) */
  function openDialog(title: string, row?: any) {
    addDialog({
      title: `${title}字典条目`,
      props: {
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
        }
      },
      width: "46%",
      draggable: true,
      fullscreen: deviceDetection(),
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        FormRef.validate(async valid => {
          if (valid) {
            // 表单规则校验通过
            if (title === "修改") {
              await updateDict(curData);
            } else {
              await insertDict(curData);
            }
            // 写后联动:刷新消费端字典缓存 + 左侧类型计数 + 右侧表格
            await useDictStoreHook().refresh(curData.dictCode);
            await loadTypes();
            onSearch();
            message(
              `${title === "新增" ? "成功新增" : "成功修改"}<strong style='color:var(--el-color-primary)'>${curData.dictLabel}</strong>字典条目`,
              { type: "success", dangerouslyUseHTMLString: true }
            );
            done(); // 关闭弹框
          }
        });
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
  function openEdit(row: any) {
    openDialog("修改", row);
  }

  onMounted(async () => {
    await loadTypes();
    onSearch();
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
    onSearch,
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
