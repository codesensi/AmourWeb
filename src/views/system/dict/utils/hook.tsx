import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import { usePublicHooks } from "../../hooks";
import editForm from "../form.vue";
import type { FormItemProps } from "./types";
import {
  changeDictStatus,
  deleteDict,
  getDictPage,
  insertDict,
  updateDict
} from "@/api/dict";
import {
  h,
  ref,
  toRaw,
  reactive,
  onMounted
} from "vue";
import { ElMessageBox } from "element-plus";
import type { PaginationProps } from "@pureadmin/table";
import { deviceDetection } from "@pureadmin/utils";

export function useDictPage() {
  const form = reactive({
    dictCode: "",
    dictName: "",
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
      label: "字典编码",
      prop: "dictCode",
      minWidth: 110
    },
    {
      label: "字典名称",
      prop: "dictName",
      minWidth: 110
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
      label: "内置",
      prop: "builtin",
      minWidth: 80,
      cellRenderer: ({ row, props }) =>
        row.builtin === 1 ? (
          <el-tag size={props.size} effect="plain">
            内置
          </el-tag>
        ) : null
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
    loading.value = true;
    const { success, data } = await getDictPage({
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

  /** 新增/修改弹窗 */
  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}字典`,
      props: {
        formInline: {
          title,
          id: row?.id,
          dictCode: row?.dictCode ?? "",
          dictName: row?.dictName ?? "",
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
            if (title === "新增") {
              await insertDict(curData);
            } else {
              await updateDict(curData);
            }
            message(`您${title}了字典标签为${curData.dictLabel}的这条数据`, {
              type: "success"
            });
            done(); // 关闭弹框
            onSearch(); // 刷新表格数据
          }
        });
      }
    });
  }

  onMounted(() => {
    onSearch();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    pagination,
    onSearch,
    resetForm,
    openDialog,
    handleDelete,
    handleSizeChange,
    handleCurrentChange
  };
}
