import dayjs from "dayjs";
import editForm from "../form.vue";
import { handleTree } from "@/utils/tree";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { usePublicHooks } from "../../hooks";
import { addDialog } from "@/components/ReDialog";
import type { FormItemProps } from "../utils/types";
import type { PaginationProps } from "@pureadmin/table";
import { getKeyList, deviceDetection } from "@pureadmin/utils";
import { useDict } from "@/hooks/useDict";
import { DICT_CODES } from "@/api/dict";
import {
  assignMenus,
  changeRoleStatus,
  deleteRole,
  getMenuList,
  getRolePage,
  getRoleMenuIds,
  insertRole,
  updateRole
} from "@/api/system";
import { type Ref, reactive, ref, onMounted, h, toRaw, watch } from "vue";

export function useRole(treeRef: Ref, tableRef: Ref) {
  const form = reactive({
    name: "",
    code: "",
    status: ""
  });
  const curRow = ref();
  const formRef = ref();
  const dataList = ref([]);
  const selectedNum = ref(0);
  const treeIds = ref([]);
  const treeData = ref([]);
  const isShow = ref(false);
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref();
  const switchLoadMap = ref({});
  const isExpandAll = ref(false);
  const isSelectAll = ref(false);
  const { switchStyle } = usePublicHooks();
  // 启停状态字典:开关文案与确认弹窗统一由 sys_dict(enable) 驱动
  const { labelOf: enableLabelOf } = useDict(DICT_CODES.enable);
  const treeProps = {
    value: "id",
    label: "title",
    children: "children"
  };
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
      /** 内置角色禁用勾选,全选时自动跳过(删除入口与后端校验对齐) */
      selectable: row => row.builtin === 0
    },
    {
      label: "角色名称",
      prop: "name"
    },
    {
      label: "角色标识",
      prop: "code"
    },
    {
      label: "状态",
      cellRenderer: scope => (
        <el-switch
          size={scope.props.size === "small" ? "small" : "default"}
          loading={switchLoadMap.value[scope.index]?.loading}
          v-model={scope.row.status}
          active-value={0}
          inactive-value={1}
          active-text={enableLabelOf(0)}
          inactive-text={enableLabelOf(1)}
          disabled={scope.row.builtin === 1}
          inline-prompt
          style={switchStyle.value}
          onChange={() => onChange(scope as any)}
        />
      ),
      minWidth: 90
    },
    {
      label: "备注",
      prop: "remark",
      minWidth: 160
    },
    {
      label: "创建时间",
      prop: "createTime",
      minWidth: 160,
      formatter: ({ createTime }) =>
        dayjs(createTime).format("YYYY-MM-DD HH:mm:ss")
    },
    {
      label: "操作",
      fixed: "right",
      width: 210,
      slot: "operation"
    }
  ];
  // const buttonClass = computed(() => {
  //   return [
  //     "h-5!",
  //     "reset-margin",
  //     "text-gray-500!",
  //     "dark:text-white!",
  //     "dark:hover:text-primary!"
  //   ];
  // });

  function onChange({ row, index }) {
    ElMessageBox.confirm(
      `确认要<strong>${
        row.status === 0 ? enableLabelOf(0) : enableLabelOf(1)
      }</strong><strong style='color:var(--el-color-primary)'>${
        row.name
      }</strong>吗?`,
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
          {
            loading: true
          }
        );
        try {
          await changeRoleStatus({ id: row.id, status: row.status });
          message(
            `已${enableLabelOf(row.status)}<strong style='color:var(--el-color-primary)'>${row.name}</strong>角色`,
            { type: "success", dangerouslyUseHTMLString: true }
          );
        } catch (error) {
          // 接口失败(含内置角色禁用被拒)时回滚开关状态
          row.status === 0 ? (row.status = 1) : (row.status = 0);
          throw error;
        } finally {
          switchLoadMap.value[index] = Object.assign(
            {},
            switchLoadMap.value[index],
            {
              loading: false
            }
          );
        }
      })
      .catch(() => {
        row.status === 0 ? (row.status = 1) : (row.status = 0);
      });
  }

  async function handleDelete(row) {
    // 确认弹窗与用户管理风格一致;角色名样式加粗 + 主题主色
    ElMessageBox.confirm(
      `确认要删除<strong style='color:var(--el-color-primary)'>${row.name}</strong>角色吗?`,
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
        await deleteRole(row.id);
        message(
          `成功删除<strong style='color:var(--el-color-primary)'>${row.name}</strong>角色`,
          { type: "success", dangerouslyUseHTMLString: true }
        );
        onSearch();
      })
      .catch(() => {});
  }

  /** 批量删除(复用删除接口,ID 逗号拼接,后端整批校验) */
  function onbatchDel() {
    // 返回当前选中的行(selectable 已禁用内置角色勾选,选中项不会包含内置角色)
    const curSelected = tableRef.value.getTableRef().getSelectionRows();
    const ids = getKeyList(curSelected, "id");
    const names = getKeyList(curSelected, "name");
    // 超过 3 个折叠展示,避免弹窗内容过长
    const displayNames =
      names.length > 3
        ? `${names.slice(0, 3).join("、")} 等 ${names.length} 个`
        : names.join("、");
    // 确认弹窗与单条删除/状态开关风格一致;角色名加粗 + 主题主色
    ElMessageBox.confirm(
      `确认要删除<strong style='color:var(--el-color-primary)'>${displayNames}</strong>角色吗?`,
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
        await deleteRole(ids.join(","));
        message(
          `成功删除<strong style='color:var(--el-color-primary)'>${displayNames}</strong>角色`,
          { type: "success", dangerouslyUseHTMLString: true }
        );
        tableRef.value.getTableRef().clearSelection();
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

  /** 当CheckBox选择项发生变化时会触发该事件 */
  function handleSelectionChange(val) {
    selectedNum.value = val.length;
    // 重置表格高度
    tableRef.value.setAdaptive();
  }

  /** 取消选择 */
  function onSelectionCancel() {
    selectedNum.value = 0;
    // 用于多选表格，清空用户的选择
    tableRef.value.getTableRef().clearSelection();
  }

  async function onSearch() {
    loading.value = true;
    const { success, data } = await getRolePage({
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

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}角色`,
      props: {
        formInline: {
          title,
          name: row?.name ?? "",
          code: row?.code ?? "",
          sort: row?.sort ?? 1,
          remark: row?.remark ?? ""
        }
      },
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        function chores() {
          // 提示风格与用户管理统一(角色名样式加粗 + 主题主色)
          message(
            `${title === "新增" ? "成功新增" : "成功修改"}<strong style='color:var(--el-color-primary)'>${curData.name}</strong>角色`,
            { type: "success", dangerouslyUseHTMLString: true }
          );
          done(); // 关闭弹框
          onSearch(); // 刷新表格数据
        }
        FormRef.validate(async valid => {
          if (valid) {
            // 表单规则校验通过
            if (title === "新增") {
              await insertRole(curData);
            } else {
              // 角色编码创建后不可修改,仅提交名称/排序/备注(对齐后端 RoleUpdateRequest)
              await updateRole({
                id: row.id,
                name: curData.name,
                sort: curData.sort,
                remark: curData.remark
              });
            }
            chores();
          }
        });
      }
    });
  }

  /** 菜单权限 */
  async function handleMenu(row?: any) {
    const { id } = row;
    if (id) {
      curRow.value = row;
      isShow.value = true;
      const { success, data } = await getRoleMenuIds(id);
      if (success) {
        treeRef.value.setCheckedKeys(data);
      }
    } else {
      curRow.value = null;
      isShow.value = false;
    }
  }

  /** 高亮当前权限选中行 */
  function rowStyle({ row: { id } }) {
    return {
      cursor: "pointer",
      background: id === curRow.value?.id ? "var(--el-fill-color-light)" : ""
    };
  }

  /** 菜单权限-保存 */
  async function handleSave() {
    const { id, name } = curRow.value;
    await assignMenus({ id, menuIds: treeRef.value.getCheckedKeys() });
    message(`角色名称为${name}的菜单权限修改成功`, {
      type: "success"
    });
  }

  /** 数据权限 可自行开发 */
  // function handleDatabase() {}

  const onQueryChanged = (query: string) => {
    treeRef.value!.filter(query);
  };

  const filterMethod = (query: string, node) => {
    return node.title!.includes(query);
  };

  onMounted(async () => {
    onSearch();
    // 复用菜单列表接口:返回全量菜单的一维扁平数组（id + pid）,前端按此键组树
    const { success, data } = await getMenuList();
    if (success) {
      treeIds.value = getKeyList(data, "id");
      treeData.value = handleTree(data, "id", "pid");
    }
  });

  watch(isExpandAll, val => {
    val
      ? treeRef.value.setExpandedKeys(treeIds.value)
      : treeRef.value.setExpandedKeys([]);
  });

  watch(isSelectAll, val => {
    val
      ? treeRef.value.setCheckedKeys(treeIds.value)
      : treeRef.value.setCheckedKeys([]);
  });

  return {
    form,
    isShow,
    curRow,
    loading,
    columns,
    rowStyle,
    dataList,
    treeData,
    treeProps,
    isLinkage,
    pagination,
    isExpandAll,
    isSelectAll,
    treeSearchValue,
    selectedNum,
    onSelectionCancel,
    // buttonClass,
    onSearch,
    resetForm,
    openDialog,
    handleMenu,
    handleSave,
    handleDelete,
    onbatchDel,
    filterMethod,
    onQueryChanged,
    // handleDatabase,
    handleSizeChange,
    handleCurrentChange,
    handleSelectionChange
  };
}
