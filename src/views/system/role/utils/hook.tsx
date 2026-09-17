import dayjs from "dayjs";
import editForm from "../form.vue";
import { handleTree } from "@/utils/tree";
import { emphasize, message } from "@/utils/message";
import { getKeyList } from "@pureadmin/utils";
import {
  openFormDialog,
  useBatchDelete,
  useBuiltinTag,
  usePageQuery,
  usePublicHooks,
  useStatusColumn,
  useStatusSwitch
} from "../../hooks";
import { addDialog } from "@/components/ReDialog";
import type { FormItemProps } from "../utils/types";
import type { SysRoleItem } from "@/api/sys-role";
import { deviceDetection } from "@pureadmin/utils";
import { useDict } from "@/hooks/useDict";
import { DICT_CODES } from "@/api/sys-dict";
import {
  assignMenus,
  changeRoleStatus,
  deleteRole,
  getRoleMenuIds,
  getRolePage,
  insertRole,
  updateRole
} from "@/api/sys-role";
import { getMenuList } from "@/api/sys-menu";
import { type Ref, reactive, ref, onMounted, h, toRaw, watch } from "vue";

export function useRole(treeRef: Ref, tableRef: Ref) {
  const form = reactive({
    name: "",
    code: "",
    status: ""
  });
  const curRow = ref();
  const formRef = ref();
  const treeIds = ref<string[]>([]);
  const treeData = ref([]);
  const isShow = ref(false);
  const isLinkage = ref(false);
  const treeSearchValue = ref();
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
  // 分页查询公共骨架:分页状态 + 结果列表 + 加载态 + 序号守卫搜索 + 分页事件写回 + 表单重置
  const {
    pagination,
    dataList,
    loading,
    search,
    handleSizeChange,
    handleCurrentChange,
    resetForm
  } = usePageQuery(query => getRolePage({ ...toRaw(form), ...query }));
  // 状态开关公共骨架:确认 + 提交加载态 + 成功提示 + 取消/失败回滚
  const { switchLoadMap, onChange } = useStatusSwitch<Required<SysRoleItem>>({
    submit: row => changeRoleStatus({ id: row.id, status: row.status }),
    confirmText: row =>
      h("span", [
        "确认要",
        h("strong", row.status === 0 ? enableLabelOf(0) : enableLabelOf(1)),
        emphasize(row.name),
        "吗?"
      ]),
    successText: row =>
      h("span", [`已${enableLabelOf(row.status)}`, emphasize(row.name), "角色"])
  });
  // 状态开关列统一渲染(内置行禁用启停 + 权限门控,加载态来自 useStatusSwitch)
  const statusColumn = useStatusColumn<Required<SysRoleItem>>({
    perms: "system:role:update",
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
  } = useBatchDelete<SysRoleItem>({
    tableRef,
    remove: deleteRole,
    nameOf: row => row.name,
    entity: "角色",
    unit: "个",
    afterDeleted: () => search()
  });
  // 「是否内置」列统一渲染(字典 yes 驱动)
  const builtinTagCell = useBuiltinTag();
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
      cellRenderer: statusColumn,
      minWidth: 90
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

  function openDialog(title = "新增", row?: FormItemProps) {
    openFormDialog({
      title: `${title}角色`,
      editForm,
      formRef,
      formInline: {
        title,
        name: row?.name ?? "",
        code: row?.code ?? "",
        sort: row?.sort ?? 1,
        remark: row?.remark ?? ""
      },
      width: "40%",
      submit: async curData => {
        // 表单规则校验通过
        if (title === "新增") {
          await insertRole(curData);
        } else {
          // 角色编码创建后不可修改,仅提交名称/排序/备注(对齐后端 RoleUpdateRequest)
          await updateRole({
            // 修改分支由既有行打开,row 与其 id 必然存在
            id: row!.id!,
            name: curData.name,
            sort: curData.sort,
            remark: curData.remark
          });
        }
        // 提示风格与用户管理统一(角色名样式加粗 + 主题主色)
        message(
          h("span", [
            `${title === "新增" ? "成功新增" : "成功修改"}`,
            h(
              "strong",
              { style: "color: var(--el-color-primary)" },
              curData.name
            ),
            "角色"
          ]),
          { type: "success" }
        );
        search(); // 刷新表格数据
      }
    });
  }

  /** 菜单权限 */
  async function handleMenu(row?: SysRoleItem) {
    const id = row?.id;
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
  function rowStyle({ row: { id } }: { row: SysRoleItem }) {
    return {
      cursor: "pointer",
      background: id === curRow.value?.id ? "var(--el-fill-color-light)" : ""
    };
  }

  /** 菜单权限-保存 */
  async function handleSave() {
    const { id, name } = curRow.value;
    try {
      await assignMenus({
        roleId: id,
        menuIds: treeRef.value.getCheckedKeys()
      });
    } catch {
      // 保存失败(失败提示由拦截器统一弹出):静默返回
      return;
    }
    message(`角色名称为${name}的菜单权限修改成功`, {
      type: "success"
    });
  }

  /** 数据权限 可自行开发 */
  // function handleDatabase() {}

  const onQueryChanged = (query: string) => {
    treeRef.value!.filter(query);
  };

  const filterMethod = (query: string, node: { title: string }) => {
    return node.title!.includes(query);
  };

  onMounted(async () => {
    search();
    // 复用菜单列表接口:返回全量菜单的一维扁平数组（id + pid）,前端按此键组树
    // (失败提示由拦截器统一弹出:失败时保持空树,不阻塞首屏)
    try {
      const { success, data } = await getMenuList();
      if (success) {
        treeIds.value = getKeyList(data, "id");
        treeData.value = handleTree(data, "id", "pid");
      }
    } catch {
      // 静默降级
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
    onSearch: search,
    resetForm,
    openDialog,
    handleMenu,
    handleSave,
    handleDelete,
    onbatchDel,
    filterMethod,
    onQueryChanged,
    handleSizeChange,
    handleCurrentChange,
    handleSelectionChange
  };
}
