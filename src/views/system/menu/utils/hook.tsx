import editForm from "../form.vue";
import dayjs from "dayjs";
import { handleTree } from "@/utils/tree";
import { confirmAction, emphasize, message } from "@/utils/message";
import {
  openFormDialog,
  useBuiltinTag,
  useFormReset,
  useStatusColumn,
  useStatusSwitch,
  usePublicHooks
} from "../../hooks";
import {
  deleteMenu,
  getMenuList,
  insertMenu,
  updateMenu,
  changeMenuStatus
} from "@/api/system";
import type { MenuUpsertRequest } from "@/api/system";
import type { FormItemProps } from "../utils/types";
import type { MenuItem } from "@/api/user";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useDict } from "@/hooks/useDict";
import { DICT_CODES } from "@/api/dict";
import { reactive, ref, onMounted, h } from "vue";
import { cloneDeep, isAllEmpty } from "@pureadmin/utils";

/** 树形菜单节点:MenuItem 组树后携带 children(handleTree 输出形状) */
type MenuTreeItem = MenuItem & { children?: MenuTreeItem[] };

export function useMenu() {
  const form = reactive({
    title: "",
    type: "",
    status: "",
    hidden: ""
  });

  const formRef = ref();
  const dataList = ref([]);
  /** 全量菜单树:弹窗"上级菜单"选项的数据源,不受搜索条件过滤影响 */
  const fullTree = ref([]);
  const loading = ref(true);
  /** 树表展开/折叠全部:展开时回填全部节点 id(el-table 的 expand-row-keys 响应式生效) */
  const isExpandAll = ref(false);
  const expandRowKeys = ref<string[]>([]);
  const { switchStyle } = usePublicHooks();
  // 启停状态字典:开关文案与确认弹窗统一由 sys_dict(enable) 驱动
  const { labelOf: enableLabelOf } = useDict(DICT_CODES.enable);
  // 是否字典:隐藏/是否内置列文案由 sys_dict(yes) 驱动
  const { labelOf: yesLabelOf } = useDict(DICT_CODES.yes);
  // 菜单类型字典:类型列文案由 sys_dict(menu-type) 驱动
  const { labelOf: menuTypeLabelOf } = useDict(DICT_CODES.menuType);
  // 状态开关公共骨架:确认 + 提交加载态 + 成功提示 + 取消/失败回滚(加载态以行 id 为键)
  const { switchLoadMap, onChange } = useStatusSwitch<MenuItem>({
    submit: row => changeMenuStatus({ id: row.id, status: row.status }),
    confirmText: row =>
      h("span", [
        "确认要",
        h("strong", row.status === 0 ? enableLabelOf(0) : enableLabelOf(1)),
        emphasize(row.title),
        "菜单吗?"
      ]),
    successText: row =>
      h("span", [
        `已${enableLabelOf(row.status)}`,
        emphasize(row.title),
        "菜单"
      ])
  });
  // 状态开关列统一渲染(内置行禁用启停 + 权限门控,加载态来自 useStatusSwitch)
  const statusColumn = useStatusColumn<MenuItem>({
    perms: "system:menu:update",
    switchLoadMap,
    onChange
  });
  // 「是否内置」列统一渲染(字典 yes 驱动)
  const builtinTagCell = useBuiltinTag();

  const getMenuType = (type: MenuItem["type"], text = false) => {
    switch (type) {
      case "D":
        return text ? menuTypeLabelOf(type) : "primary";
      case "M":
        return text ? menuTypeLabelOf(type) : "success";
      case "B":
        return text ? menuTypeLabelOf(type) : "info";
    }
  };

  const columns: TableColumnList = [
    {
      label: "菜单名称",
      prop: "title",
      align: "left",
      minWidth: 160,
      cellRenderer: ({ row }) => (
        <>
          <span class="inline-block mr-1">
            {h(useRenderIcon(row.icon), {
              style: { paddingTop: "1px" }
            })}
          </span>
          <span>{row.title}</span>
        </>
      )
    },
    {
      label: "菜单类型",
      prop: "type",
      width: 100,
      cellRenderer: ({ row, props }) => (
        <el-tag
          size={props.size}
          type={getMenuType(row.type) as "primary" | "success" | "info"}
          effect="plain"
        >
          {getMenuType(row.type, true)}
        </el-tag>
      )
    },
    {
      label: "路由路径",
      prop: "path",
      minWidth: 180
    },
    {
      label: "组件路径",
      prop: "component",
      minWidth: 180,
      formatter: ({ path, component }) =>
        isAllEmpty(component) ? path : component
    },
    {
      label: "权限标识",
      prop: "perms",
      minWidth: 160
    },
    {
      label: "排序",
      prop: "sort",
      width: 80
    },
    {
      label: "状态",
      prop: "status",
      width: 100,
      cellRenderer: statusColumn
    },
    {
      label: "隐藏",
      prop: "hidden",
      width: 90,
      cellRenderer: ({ row }) => (
        <el-tag size="small" type={row.hidden === 1 ? "warning" : "info"}>
          {yesLabelOf(row.hidden)}
        </el-tag>
      )
    },
    {
      label: "是否内置",
      prop: "builtin",
      width: 90,
      cellRenderer: builtinTagCell
    },
    {
      label: "创建时间",
      prop: "createTime",
      minWidth: 160,
      formatter: ({ createTime }) =>
        createTime ? dayjs(createTime).format("YYYY-MM-DD HH:mm:ss") : ""
    },
    {
      label: "操作",
      fixed: "right",
      width: 210,
      slot: "operation"
    }
  ];

  // 搜索表单重置复用公共骨架(清空校验与表单项后按当前条件重查)
  const resetForm = useFormReset(onSearch);

  /** 按搜索条件过滤扁平菜单数据;命中项沿 pid 保留祖先链,避免树形层级断裂 */
  function filterMenus(flat: MenuItem[]) {
    const matched = flat.filter(
      item =>
        (isAllEmpty(form.title) || item.title.includes(form.title)) &&
        (isAllEmpty(form.type) || item.type === form.type) &&
        (isAllEmpty(form.status) || item.status === Number(form.status)) &&
        (isAllEmpty(form.hidden) || item.hidden === Number(form.hidden))
    );
    const idMap = new Map<string, MenuItem>(
      flat.map(item => [String(item.id), item])
    );
    const keepIds = new Set(matched.map(item => item.id));
    for (const item of matched) {
      let parentId: string | undefined = item.pid;
      while (parentId && parentId !== "0" && !keepIds.has(parentId)) {
        keepIds.add(parentId);
        parentId = idMap.get(parentId)?.pid;
      }
    }
    return flat.filter(item => keepIds.has(item.id));
  }

  async function onSearch() {
    loading.value = true;
    try {
      // 后端返回全量菜单的一维扁平数组（id + pid），前端按此键组树并做条件过滤
      const { success, data } = await getMenuList();
      if (success) {
        // 全量菜单树:弹窗"上级菜单"选项的数据源(深拷贝,避免 handleTree 改写 children 后互相污染)
        fullTree.value = handleTree(cloneDeep(data), "id", "pid");
        dataList.value = handleTree(filterMenus(data), "id", "pid");
        // 刷新后按当前展开态回填展开键,保持"展开/折叠全部"状态一致
        expandRowKeys.value = isExpandAll.value
          ? collectAllIds(dataList.value)
          : [];
      }
    } finally {
      loading.value = false;
    }
  }

  /** 收集树形数据的全部节点 id(展开全部时回填 expand-row-keys) */
  function collectAllIds(nodes: MenuTreeItem[]) {
    const ids: string[] = [];
    const walk = (list: MenuTreeItem[]) => {
      for (const node of list) {
        ids.push(String(node.id));
        if (node.children?.length) walk(node.children);
      }
    };
    walk(nodes);
    return ids;
  }

  /** 切换树表展开/折叠全部 */
  function toggleExpandAll() {
    isExpandAll.value = !isExpandAll.value;
    expandRowKeys.value = isExpandAll.value
      ? collectAllIds(dataList.value)
      : [];
  }

  /** 从菜单树中剔除 excludeId 对应节点及其整棵子树(修改时避免将自身/下级选为上级菜单导致成环) */
  function excludeSubTree(treeList: MenuTreeItem[], excludeId: string) {
    const result: MenuTreeItem[] = [];
    for (const node of treeList) {
      if (node.id === excludeId) continue;
      if (node.children?.length) {
        result.push({
          ...node,
          children: excludeSubTree(node.children, excludeId)
        });
      } else {
        // 无 children 字段时保持原样,避免级联面板出现空展开箭头
        result.push({ ...node });
      }
    }
    return result;
  }

  function openDialog(title = "新增", row?: Partial<FormItemProps>) {
    const higherMenuOptions = row?.id
      ? excludeSubTree(fullTree.value, row.id)
      : fullTree.value;
    openFormDialog({
      title: `${title}菜单`,
      editForm,
      formRef,
      formInline: {
        id: row?.id,
        builtin: row?.builtin ?? 0,
        type: row?.type ?? "D",
        higherMenuOptions: higherMenuOptions,
        pid: row?.pid ?? "0",
        title: row?.title ?? "",
        path: row?.path ?? "",
        component: row?.component ?? "",
        sort: row?.sort ?? 0,
        icon: row?.icon ?? "",
        perms: row?.perms ?? "",
        status: row?.status ?? 0,
        hidden: row?.hidden ?? 0,
        remark: row?.remark ?? ""
      },
      width: "45%",
      submit: async curData => {
        // higherMenuOptions 为 UI 数据,不提交后端
        const { higherMenuOptions: _higherMenuOptions, ...menuData } = curData;
        if (title === "新增") {
          await insertMenu(menuData as MenuUpsertRequest);
        } else {
          await updateMenu(menuData as MenuUpsertRequest);
        }
        message(`您${title}了菜单名称为${curData.title}的这条数据`, {
          type: "success"
        });
        onSearch(); // 刷新表格数据
      }
    });
  }

  async function handleDelete(row: MenuTreeItem) {
    // 确认弹窗与状态开关/修改新增弹窗风格一致;菜单名样式加粗 + 主题主色
    const confirmed = await confirmAction(
      h("span", [
        "确认要删除",
        emphasize(row.title),
        "菜单吗?",
        (row?.children?.length ?? 0) > 0
          ? [h("br"), "注意其下级菜单也会一并删除，请谨慎操作"]
          : ""
      ])
    );
    if (!confirmed) return;
    await deleteMenu(row.id);
    message(h("span", ["成功删除", emphasize(row.title), "菜单"]), {
      type: "success"
    });
    onSearch();
  }

  onMounted(() => {
    onSearch();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    /** 树表展开/折叠全部 */
    isExpandAll,
    expandRowKeys,
    toggleExpandAll,
    /** 搜索 */
    onSearch,
    /** 重置 */
    resetForm,
    /** 新增、修改菜单 */
    openDialog,
    /** 删除菜单 */
    handleDelete
  };
}
