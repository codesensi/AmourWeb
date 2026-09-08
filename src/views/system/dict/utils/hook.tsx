import { message } from "@/utils/message";
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
import { ElMessageBox } from "element-plus";
import type { PaginationProps } from "@pureadmin/table";
import { deviceDetection } from "@pureadmin/utils";
import {
  h,
  ref,
  toRaw,
  reactive,
  computed,
  onMounted
} from "vue";
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
      types.value.find(item => item.dictCode === selectedCode.value)?.dictName ??
      ""
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
  const { switchStyle } = usePublicHooks();
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 20,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
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
          inline-prompt
          style={switchStyle.value}
          onChange={() => onChange(scope as any)}
        />
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
        await changeDictStatus({ id: row.id, status: row.status });
        switchLoadMap.value[index] = Object.assign(
          {},
          switchLoadMap.value[index],
          { loading: false }
        );
        // 状态影响消费端的 list-by-codes 结果,同步刷新字典缓存
        await useDictStoreHook().refresh(row.dictCode);
        message("已成功修改字典状态", { type: "success" });
      })
      .catch(() => {
        row.status === 0 ? (row.status = 1) : (row.status = 0);
      });
  }

  async function handleDelete(row) {
    await deleteDict(row.id);
    message(`您删除了字典标签为${row.dictLabel}的这条数据`, {
      type: "success"
    });
    await useDictStoreHook().refresh(row.dictCode);
    onSearch();
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

  /** 新增/修改弹窗(新增条目时编码固定为当前选中类型) */
  function openDialog(title: string, options: { codeEditable: boolean; row?: any }) {
    const { codeEditable, row } = options;
    addDialog({
      title: title === "新建类型" ? "新建字典类型" : `${title}字典条目`,
      props: {
        formInline: {
          title,
          id: row?.id,
          dictCode: codeEditable ? "" : selectedCode.value,
          dictName: row?.dictName ?? "",
          dictValue: row?.dictValue ?? "",
          dictLabel: row?.dictLabel ?? "",
          sort: row?.sort ?? 1,
          status: row?.status ?? 0,
          builtin: row?.builtin ?? 0,
          remark: row?.remark ?? ""
        },
        typeOptions: types.value,
        codeEditable
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
              title === "新建类型"
                ? `已新建字典类型${curData.dictCode}`
                : `您${title}了字典标签为${curData.dictLabel}的这条数据`,
              { type: "success" }
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
    openDialog("新增", { codeEditable: false });
  }

  /** 新建类型(编码可编辑,同时插入该类型的首条数据) */
  function openCreateType() {
    openDialog("新建类型", { codeEditable: true });
  }

  /** 修改条目 */
  function openEdit(row: any) {
    openDialog("修改", { codeEditable: false, row });
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
    onSearch,
    resetForm,
    openCreate,
    openCreateType,
    openEdit,
    handleDelete,
    handleSizeChange,
    handleCurrentChange
  };
}
