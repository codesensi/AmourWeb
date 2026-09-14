import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import { DictTag } from "@/components/DictTag";
import { usePageQuery } from "../../hooks";
import editForm from "../form.vue";
import type { FormItemProps } from "./types";
import { getConfigPage, updateConfig } from "@/api/sysConfig";
import type { SysConfigPageItem } from "@/api/sysConfig";
import { DICT_CODES } from "@/api/dict";
import { useDict } from "@/hooks/useDict";
import { deviceDetection } from "@pureadmin/utils";
import { h, ref, toRaw, reactive, watch } from "vue";

export function useConfigPage() {
  const form = reactive({
    configKey: ""
  });
  /** 当前激活的分组页签(config-group 字典值;字典就绪后默认选中第一个分组) */
  const activeTab = ref("");
  const formRef = ref();

  /** 分组页签数据源(响应式;字典到达后页签自动渲染,新增分组免改前端) */
  const { options: groupOptions } = useDict(DICT_CODES.configGroup);

  // 分页查询公共骨架:分页状态 + 结果列表 + 加载态 + 序号守卫搜索 + 分页事件写回 + 表单重置
  const {
    pagination,
    dataList,
    loading,
    search,
    handleSizeChange,
    handleCurrentChange,
    resetForm
  } = usePageQuery<SysConfigPageItem>(query => {
    // 页签未就绪(分组字典尚未加载)时不查询,避免回落为跨组平铺列表
    if (!activeTab.value) return undefined;
    return getConfigPage({
      ...toRaw(form),
      configGroup: activeTab.value,
      ...query
    });
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
          dictCode={DICT_CODES.configValueType}
          value={row.valueType}
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

  /** 页签切换:复位到第 1 页后按新分组重查(激活页签已由 v-model 写回 activeTab) */
  function handleTabChange(name: string | number) {
    if (!name) return;
    pagination.currentPage = 1;
    search();
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
      // formInline 实际取值由 ReDialog 的 options.props 注入,此处仅占位
      contentRenderer: () =>
        h(editForm, { ref: formRef, formInline: null as unknown as FormItemProps }),
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
              // 编辑弹窗由既有行打开,id 必然存在
              id: curData.id!,
              configValue: curData.configValue
            });
            message(`已修改配置${curData.configKey}，新值即时生效`, {
              type: "success"
            });
            search();
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

  // 字典就绪后默认选中第一个分组页签并发起首查(仅一次;后续切换由页签事件驱动)
  watch(
    groupOptions,
    options => {
      if (!activeTab.value && options.length) {
        activeTab.value = options[0].dictValue;
        search();
      }
    },
    { immediate: true }
  );

  return {
    form,
    activeTab,
    groupOptions,
    loading,
    columns,
    dataList,
    pagination,
    onSearch: search,
    handleTabChange,
    resetForm,
    openEdit,
    handleSizeChange,
    handleCurrentChange
  };
}
