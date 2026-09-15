import dayjs from "dayjs";
import roleForm from "../form/role.vue";
import editForm from "../form/index.vue";
import { confirmAction, emphasize, message } from "@/utils/message";
import { DictTag } from "@/components/DictTag";
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
import type { FormItemProps, RoleFormItemProps } from "../utils/types";
import { deviceDetection } from "@pureadmin/utils";
import type { SysRoleOption, SysUserItem } from "@/api/system";
import { useDict } from "@/hooks/useDict";
import { DICT_CODES } from "@/api/dict";
import {
  deleteUser,
  getRoleList,
  getUserPage,
  getUserRoleIds,
  insertUser,
  updateUser,
  resetUserPwd,
  changeUserStatus,
  assignRoles
} from "@/api/system";
import { type Ref, h, ref, toRaw, computed, reactive, onMounted } from "vue";

export function useUser(tableRef: Ref) {
  const form = reactive({
    username: "",
    nickname: "",
    email: "",
    qq: "",
    gender: "",
    status: ""
  });
  const formRef = ref();
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
  } = usePageQuery(query => getUserPage({ ...toRaw(form), ...query }));
  // 状态开关公共骨架:确认 + 提交加载态 + 成功提示 + 取消/失败回滚
  const { switchLoadMap, onChange } = useStatusSwitch<Required<SysUserItem>>({
    submit: row => changeUserStatus({ id: row.id, status: row.status }),
    confirmText: row =>
      h("span", [
        "确认要",
        h("strong", row.status === 0 ? enableLabelOf(0) : enableLabelOf(1)),
        emphasize(row.username),
        "用户吗?"
      ]),
    successText: row =>
      h("span", [
        `已${enableLabelOf(row.status)}`,
        emphasize(row.username),
        "用户"
      ])
  });
  // 状态开关列统一渲染(内置行禁用启停 + 权限门控,加载态来自 useStatusSwitch)
  const statusColumn = useStatusColumn<Required<SysUserItem>>({
    perms: "system:user:update",
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
  } = useBatchDelete<SysUserItem>({
    tableRef,
    remove: deleteUser,
    nameOf: row => row.username,
    entity: "用户",
    unit: "位",
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
      /** 内置用户禁用勾选,全选时自动跳过(删除入口与后端校验对齐) */
      selectable: row => row.builtin === 0
    },
    {
      label: "用户名称",
      prop: "username",
      minWidth: 130
    },
    {
      label: "用户昵称",
      prop: "nickname",
      minWidth: 130
    },
    {
      label: "邮箱",
      prop: "email",
      minWidth: 160
    },
    {
      label: "性别",
      prop: "gender",
      minWidth: 90,
      cellRenderer: ({ row, props }) => (
        <DictTag
          dictCode={DICT_CODES.gender}
          value={row.gender}
          tagMap={{ F: "danger" }}
          size={props.size}
          effect="plain"
        />
      )
    },
    {
      label: "QQ号码",
      prop: "qq",
      minWidth: 90
    },
    {
      label: "用户头像",
      prop: "avatar",
      cellRenderer: ({ row }) =>
        row.avatar ? (
          <el-image
            fit="cover"
            preview-teleported={true}
            src={row.avatar}
            preview-src-list={Array.of(row.avatar)}
            class="size-6 rounded-full align-middle"
          />
        ) : (
          ""
        ),
      width: 90
    },
    {
      label: "备注",
      prop: "remark",
      minWidth: 130
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
      label: "创建时间",
      minWidth: 90,
      prop: "createTime",
      formatter: ({ createTime }) =>
        dayjs(createTime).format("YYYY-MM-DD HH:mm:ss")
    },
    {
      label: "操作",
      fixed: "right",
      width: 180,
      slot: "operation"
    }
  ];
  const buttonClass = computed(() => {
    return [
      "h-5!",
      "reset-margin",
      "text-gray-500!",
      "dark:text-white!",
      "dark:hover:text-primary!"
    ];
  });
  const roleOptions = ref<SysRoleOption[]>([]);

  function openDialog(title = "新增", row?: FormItemProps) {
    openFormDialog({
      title: `${title}用户`,
      editForm,
      formRef,
      formInline: {
        title,
        id: row?.id ?? "",
        nickname: row?.nickname ?? "",
        username: row?.username ?? "",
        avatar: row?.avatar ?? "",
        qq: row?.qq ?? "",
        email: row?.email ?? "",
        gender: row?.gender || "U",
        status: row?.status ?? 0,
        remark: row?.remark ?? ""
      },
      submit: async curData => {
        // 表单规则校验通过
        if (title === "新增") {
          await insertUser(curData);
        } else {
          // 修改:仅提交后端 UserUpdateRequest 接收的资料字段(id 定位,用户名/状态禁改)
          await updateUser({
            // 修改分支由既有行打开,id 必然存在
            id: curData.id!,
            nickname: curData.nickname,
            avatar: curData.avatar,
            qq: curData.qq,
            email: curData.email,
            gender: curData.gender,
            remark: curData.remark
          });
        }
        // 成功提示:用户名样式与状态开关确认弹窗对齐(加粗 + 主题主色)
        message(
          h("span", [
            `成功${title}`,
            h(
              "strong",
              { style: "color: var(--el-color-primary)" },
              curData.username
            ),
            title === "新增" ? "用户" : "用户信息"
          ]),
          { type: "success" }
        );
        search(); // 刷新表格数据
      }
    });
  }

  /** 重置密码(重置为系统默认密码) */
  async function handleReset(row: SysUserItem) {
    const confirmed = await confirmAction(
      h("span", [
        "确认要将",
        emphasize(row.username),
        "用户的密码重置为系统默认密码吗?"
      ])
    );
    if (!confirmed) return;
    try {
      await resetUserPwd(row.id);
    } catch {
      // 重置失败(失败提示由拦截器统一弹出):静默返回
      return;
    }
    message(`已成功重置 ${row.username} 用户的密码`, {
      type: "success"
    });
  }

  /** 分配角色 */
  async function handleRole(row: SysUserItem) {
    // 选中的角色列表
    const ids = (await getUserRoleIds(row.id)).data ?? [];
    addDialog({
      title: `分配 ${row.username} 用户的角色`,
      props: {
        formInline: {
          username: row?.username ?? "",
          nickname: row?.nickname ?? "",
          roleOptions: roleOptions.value ?? [],
          ids
        }
      },
      width: "400px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      // 开启确定按钮提交加载态,防止异步提交期间连点重复提交
      sureBtnLoading: true,
      contentRenderer: () => h(roleForm),
      beforeSure: async (done, { options, closeLoading }) => {
        const curData = options.props.formInline as RoleFormItemProps;
        try {
          await assignRoles({ userId: row.id, roleIds: curData.ids });
        } catch {
          // 提交失败(失败提示由拦截器统一弹出):复位加载态,弹窗保持打开
          closeLoading();
          return;
        }
        message(`角色名称为${row.username}的用户角色分配成功`, {
          type: "success"
        });
        closeLoading(); // 复位确定按钮加载态(弹窗即将关闭)
        done(); // 关闭弹框
      }
    });
  }

  onMounted(async () => {
    search();

    // 角色列表(失败提示由拦截器统一弹出:失败时保持空列表,不阻塞首屏)
    try {
      roleOptions.value = (await getRoleList()).data ?? [];
    } catch {
      // 静默降级
    }
  });

  return {
    form,
    loading,
    columns,
    dataList,
    selectedNum,
    pagination,
    buttonClass,
    deviceDetection,
    onSearch: search,
    resetForm,
    onbatchDel,
    openDialog,
    handleDelete,
    handleReset,
    handleRole,
    handleSizeChange,
    onSelectionCancel,
    handleCurrentChange,
    handleSelectionChange
  };
}
