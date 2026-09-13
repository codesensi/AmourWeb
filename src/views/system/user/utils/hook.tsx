import "./reset.css";
import dayjs from "dayjs";
import roleForm from "../form/role.vue";
import editForm from "../form/index.vue";
import { confirmAction, message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { DictTag } from "@/components/DictTag";
import {
  useBuiltinTag,
  usePageQuery,
  usePublicHooks,
  useStatusSwitch
} from "../../hooks";
import { addDialog } from "@/components/ReDialog";
import type { FormItemProps, RoleFormItemProps } from "../utils/types";
import { getKeyList, deviceDetection } from "@pureadmin/utils";
import type { SysRoleOption } from "@/api/system";
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
  const dataList = ref([]);
  const loading = ref(true);
  const { switchStyle } = usePublicHooks();
  // 启停状态字典:开关文案与确认弹窗统一由 sys_dict(enable) 驱动
  const { labelOf: enableLabelOf } = useDict(DICT_CODES.enable);
  const selectedNum = ref(0);
  // 分页查询公共骨架:分页状态 + 分页事件写回 + 查询结果回填 + 搜索表单重置
  const {
    pagination,
    applyPageResult,
    handleSizeChange,
    handleCurrentChange,
    resetForm
  } = usePageQuery(onSearch);
  // 状态开关公共骨架:确认 + 提交加载态 + 成功提示 + 取消/失败回滚
  const { switchLoadMap, onChange } = useStatusSwitch({
    submit: row => changeUserStatus({ id: row.id, status: row.status }),
    confirmText: row =>
      `确认要<strong>${
        row.status === 0 ? enableLabelOf(0) : enableLabelOf(1)
      }</strong><strong style='color:var(--el-color-primary)'>${
        row.username
      }</strong>用户吗?`,
    successText: row =>
      `已${enableLabelOf(row.status)}<strong style='color:var(--el-color-primary)'>${row.username}</strong>用户`
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
          dictCode="gender"
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
      cellRenderer: scope => (
        <el-switch
          size={scope.props.size === "small" ? "small" : "default"}
          loading={switchLoadMap.value[scope.row.id]?.loading}
          v-model={scope.row.status}
          active-value={0}
          inactive-value={1}
          active-text={enableLabelOf(0)}
          inactive-text={enableLabelOf(1)}
          /** 内置账号禁用启停;无修改权限时同步禁用,与操作列门控对齐 */
          disabled={scope.row.builtin === 1 || !hasPerms("system:user:update")}
          inline-prompt
          style={switchStyle.value}
          onChange={() => onChange(scope.row)}
        />
      )
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

  async function handleDelete(row) {
    // 确认弹窗与状态开关/修改新增弹窗风格一致;用户名样式加粗 + 主题主色
    const confirmed = await confirmAction(
      `确认要删除<strong style='color:var(--el-color-primary)'>${row.username}</strong>用户吗?`,
      { html: true }
    );
    if (!confirmed) return;
    await deleteUser(row.id);
    message(
      `成功删除<strong style='color:var(--el-color-primary)'>${row.username}</strong>用户`,
      { type: "success", dangerouslyUseHTMLString: true }
    );
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

  /** 批量删除(复用删除接口,ID 逗号拼接,后端整批校验) */
  async function onbatchDel() {
    // 返回当前选中的行(selectable 已禁用内置用户勾选,选中项不会包含内置用户)
    const curSelected = tableRef.value.getTableRef().getSelectionRows();
    const ids = getKeyList(curSelected, "id");
    const names = getKeyList(curSelected, "username");
    // 超过 3 个折叠展示,避免弹窗内容过长
    const displayNames =
      names.length > 3
        ? `${names.slice(0, 3).join("、")} 等 ${names.length} 位`
        : names.join("、");
    // 确认弹窗与单条删除/状态开关风格一致;用户名加粗 + 主题主色
    const confirmed = await confirmAction(
      `确认要删除<strong style='color:var(--el-color-primary)'>${displayNames}</strong>用户吗?`,
      { html: true }
    );
    if (!confirmed) return;
    await deleteUser(ids.join(","));
    message(
      `成功删除<strong style='color:var(--el-color-primary)'>${displayNames}</strong>用户`,
      { type: "success", dangerouslyUseHTMLString: true }
    );
    tableRef.value.getTableRef().clearSelection();
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    try {
      const { success, data } = await getUserPage({
        ...toRaw(form),
        pageNumber: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (success) {
        dataList.value = applyPageResult(data);
      }
    } finally {
      // 请求失败(业务失败被拦截器 reject)时也复位加载态,避免表格永久转圈
      loading.value = false;
    }
  }

  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}用户`,
      props: {
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
        function chores() {
          if (title === "修改") {
            // 用户名样式与状态开关确认弹窗对齐(加粗 + 主题主色)
            message(
              `成功修改<strong style='color:var(--el-color-primary)'>${curData.username}</strong>用户信息`,
              {
                type: "success",
                dangerouslyUseHTMLString: true
              }
            );
          } else {
            // 用户名样式与状态开关确认弹窗对齐(加粗 + 主题主色)
            message(
              `成功新增<strong style='color:var(--el-color-primary)'>${curData.username}</strong>用户`,
              { type: "success", dangerouslyUseHTMLString: true }
            );
          }
          closeLoading(); // 复位确定按钮加载态(弹窗即将关闭)
          done(); // 关闭弹框
          onSearch(); // 刷新表格数据
        }
        FormRef.validate(async valid => {
          if (!valid) {
            // 校验未通过:复位确定按钮加载态
            closeLoading();
            return;
          }
          try {
            // 表单规则校验通过
            if (title === "新增") {
              await insertUser(curData);
            } else {
              // 修改:仅提交后端 UserUpdateRequest 接收的资料字段(id 定位,用户名/状态禁改)
              await updateUser({
                id: curData.id,
                nickname: curData.nickname,
                avatar: curData.avatar,
                qq: curData.qq,
                email: curData.email,
                gender: curData.gender,
                remark: curData.remark
              });
            }
            chores();
          } catch {
            // 提交失败(失败提示由拦截器统一弹出):复位加载态,弹窗保持打开
            closeLoading();
          }
        });
      }
    });
  }

  /** 重置密码(重置为系统默认密码) */
  async function handleReset(row) {
    const confirmed = await confirmAction(
      `确认要将<strong style='color:var(--el-color-primary)'>${row.username}</strong>用户的密码重置为系统默认密码吗?`,
      { html: true }
    );
    if (!confirmed) return;
    await resetUserPwd(row.id);
    message(`已成功重置 ${row.username} 用户的密码`, {
      type: "success"
    });
  }

  /** 分配角色 */
  async function handleRole(row) {
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
    onSearch();

    // 角色列表
    roleOptions.value = (await getRoleList()).data ?? [];
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
    onSearch,
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
