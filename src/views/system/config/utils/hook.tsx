import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import { DictTag } from "@/components/DictTag";
import editForm from "../form.vue";
import type { FormItemProps } from "./types";
import {
  getConfigPage,
  refreshConfigCache,
  updateConfig
} from "@/api/sysConfig";
import type { SysConfigPageItem } from "@/api/sysConfig";
import type { PaginationProps } from "@pureadmin/table";
import { deviceDetection } from "@pureadmin/utils";
import { h, ref, toRaw, reactive, onMounted } from "vue";

export function useConfigPage() {
  const form = reactive({
    configKey: "",
    configGroup: ""
  });
  const formRef = ref();
  const dataList = ref<Array<SysConfigPageItem>>([]);
  const loading = ref(true);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 20,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    {
      label: "配置键",
      prop: "configKey",
      minWidth: 170
    },
    {
      label: "配置值",
      prop: "configValue",
      minWidth: 200
    },
    {
      label: "值类型",
      prop: "valueType",
      minWidth: 100,
      cellRenderer: ({ row, props }) => (
        <DictTag
          dictCode="config-value-type"
          value={row.valueType}
          size={props.size}
          effect="light"
        />
      )
    },
    {
      label: "分组",
      prop: "configGroup",
      minWidth: 90,
      cellRenderer: ({ row, props }) => (
        <DictTag
          dictCode="config-group"
          value={row.configGroup}
          size={props.size}
          effect="light"
        />
      )
    },
    {
      label: "备注",
      prop: "remark",
      minWidth: 150
    },
    {
      label: "更新时间",
      minWidth: 160,
      prop: "updateTime"
    },
    {
      label: "操作",
      fixed: "right",
      width: 100,
      slot: "operation"
    }
  ];

  async function onSearch() {
    loading.value = true;
    const { success, data } = await getConfigPage({
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

  /** 修改配置弹窗(仅配置值可改;保存后后端失效 config 缓存,新值即时生效) */
  function openEdit(row: SysConfigPageItem) {
    addDialog({
      title: "修改系统配置",
      props: {
        formInline: {
          title: "修改",
          id: row.id,
          configKey: row.configKey,
          configValue: row.configValue,
          valueType: row.valueType,
          configGroup: row.configGroup,
          remark: row.remark ?? ""
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
            await updateConfig({
              id: curData.id,
              configValue: curData.configValue
            });
            message(`已修改配置${curData.configKey}，新值即时生效`, {
              type: "success"
            });
            onSearch();
            done(); // 关闭弹框
          }
        });
      }
    });
  }

  /** pure-table 已回写 pagination.currentPage/pageSize,此处重新拉取分页数据 */
  function handleSizeChange() {
    onSearch();
  }

  function handleCurrentChange() {
    onSearch();
  }

  /** 清空全部 config 缓存,下次读取时回源查库(清空动作在后端完成) */
  async function handleRefreshCache() {
    await refreshConfigCache();
    message("配置缓存已刷新", { type: "success" });
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
    openEdit,
    handleRefreshCache,
    handleSizeChange,
    handleCurrentChange
  };
}
