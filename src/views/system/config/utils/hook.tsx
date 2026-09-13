import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import { DictTag } from "@/components/DictTag";
import { usePageQuery } from "../../hooks";
import editForm from "../form.vue";
import type { FormItemProps } from "./types";
import { getConfigPage, updateConfig } from "@/api/sysConfig";
import type { SysConfigPageItem } from "@/api/sysConfig";
import { DICT_CODES } from "@/api/dict";
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
  // 分页查询公共骨架:分页状态 + 分页事件写回 + 查询结果回填 + 搜索表单重置
  const {
    pagination,
    applyPageResult,
    handleSizeChange,
    handleCurrentChange,
    resetForm
  } = usePageQuery(onSearch);

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
          dictCode={DICT_CODES.configValueType}
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
      label: "是否敏感",
      prop: "sensitive",
      minWidth: 90,
      cellRenderer: ({ row, props }) => (
        <DictTag
          dictCode="yes"
          value={row.sensitive}
          size={props.size}
          effect="light"
          /** 敏感条目醒目提示:该类配置不经过免登录的门户配置下发接口 */
          tagMap={{ "1": "danger" }}
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
    try {
      const { success, data } = await getConfigPage({
        ...toRaw(form),
        pageNumber: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (success) {
        dataList.value = applyPageResult(data);
      }
    } finally {
      loading.value = false;
    }
  }

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
      fullscreenIcon: true,
      closeOnClickModal: false,
      // 开启确定按钮提交加载态,防止异步提交期间连点重复提交
      sureBtnLoading: true,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options, closeLoading }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        FormRef.validate(async valid => {
          if (!valid) {
            // 校验未通过:复位确定按钮加载态
            closeLoading();
            return;
          }
          try {
            await updateConfig({
              id: curData.id,
              configValue: curData.configValue
            });
            message(`已修改配置${curData.configKey}，新值即时生效`, {
              type: "success"
            });
            onSearch();
            closeLoading(); // 复位确定按钮加载态(弹窗即将关闭)
            done(); // 关闭弹框
          } catch {
            // 提交失败(失败提示由拦截器统一弹出):复位加载态,弹窗保持打开
            closeLoading();
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
    openEdit,
    handleSizeChange,
    handleCurrentChange
  };
}
