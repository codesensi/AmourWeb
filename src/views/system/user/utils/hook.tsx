import "./reset.css";
import dayjs from "dayjs";
import roleForm from "../form/role.vue";
import editForm from "../form/index.vue";
import { message } from "@/utils/message";
import { DictTag } from "@/components/DictTag";
import { usePublicHooks } from "../../hooks";
import { addDialog } from "@/components/ReDialog";
import type { PaginationProps } from "@pureadmin/table";
import type { FormItemProps, RoleFormItemProps } from "../utils/types";
import { getKeyList, deviceDetection } from "@pureadmin/utils";
import type { SysRoleOption } from "@/api/system";
import { useDict } from "@/hooks/useDict";
import { DICT_CODES } from "@/api/dict";
import {
  deleteUser,
  getRoleList,
  getUserList,
  getUserRoleIds,
  insertUser,
  updateUser,
  resetUserPwd,
  changeUserStatus,
  assignRoles
} from "@/api/system";
import {
  ElMessageBox
} from "element-plus";
import {
  type Ref,
  h,
  ref,
  toRaw,
  computed,
  reactive,
  onMounted
} from "vue";

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
  const switchLoadMap = ref({});
  const { switchStyle } = usePublicHooks();
  // 启停状态字典:开关文案与确认弹窗统一由 sys_dict(enable) 驱动
  const { labelOf: enableLabelOf } = useDict(DICT_CODES.enable);
  const selectedNum = ref(0);
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
      )
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

  function onChange({ row, index }) {
    ElMessageBox.confirm(
      `确认要<strong>${
        row.status === 0 ? enableLabelOf(0) : enableLabelOf(1)
      }</strong><strong style='color:var(--el-color-primary)'>${
        row.username
      }</strong>用户吗?`,
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
          await changeUserStatus({ id: row.id, status: row.status });
          message(
            `已${enableLabelOf(row.status)}<strong style='color:var(--el-color-primary)'>${row.username}</strong>用户`,
            {
              type: "success",
              dangerouslyUseHTMLString: true
            }
          );
        } catch (e) {
          // 接口失败回滚开关,与取消回滚共用同一处理
          row.status = row.status === 0 ? 1 : 0;
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
    // 确认弹窗与状态开关/修改新增弹窗风格一致;用户名样式加粗 + 主题主色
    ElMessageBox.confirm(
      `确认要删除<strong style='color:var(--el-color-primary)'>${row.username}</strong>用户吗?`,
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
        await deleteUser(row.id);
        message(
          `成功删除<strong style='color:var(--el-color-primary)'>${row.username}</strong>用户`,
          { type: "success", dangerouslyUseHTMLString: true }
        );
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

  /** 批量删除(复用删除接口,ID 逗号拼接,后端整批校验) */
  function onbatchDel() {
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
    ElMessageBox.confirm(
      `确认要删除<strong style='color:var(--el-color-primary)'>${displayNames}</strong>用户吗?`,
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
        await deleteUser(ids.join(","));
        message(
          `成功删除<strong style='color:var(--el-color-primary)'>${displayNames}</strong>用户`,
          { type: "success", dangerouslyUseHTMLString: true }
        );
        tableRef.value.getTableRef().clearSelection();
        onSearch();
      })
      .catch(() => {});
  }

  async function onSearch() {
    loading.value = true;
    const { success, data } = await getUserList({
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
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
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
          done(); // 关闭弹框
          onSearch(); // 刷新表格数据
        }
        FormRef.validate(async valid => {
          if (valid) {
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
          }
        });
      }
    });
  }

  /** 重置密码(重置为系统默认密码) */
  function handleReset(row) {
    ElMessageBox.confirm(
      `确认要将<strong style='color:var(--el-color-primary)'>${row.username}</strong>用户的密码重置为系统默认密码吗?`,
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
        await resetUserPwd(row.id);
        message(`已成功重置 ${row.username} 用户的密码`, {
          type: "success"
        });
      })
      .catch(() => {});
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
      contentRenderer: () => h(roleForm),
      beforeSure: async (done, { options }) => {
        const curData = options.props.formInline as RoleFormItemProps;
        await assignRoles({ userId: row.id, roleIds: curData.ids });
        message(`角色名称为${row.username}的用户角色分配成功`, {
          type: "success"
        });
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
