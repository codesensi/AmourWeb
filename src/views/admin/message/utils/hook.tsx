import { emphasize, message } from "@/utils/message";
import { useBatchDelete, usePageQuery } from "@/views/system/hooks";
import {
  auditMessage,
  deleteAdminMessage,
  getAdminMessagePage
} from "@/api/admin-message";
import type { MessageAuditStatus, MessagePageItem } from "@/api/admin-message";
import { DICT_CODES } from "@/api/sys-dict";
import { useDict } from "@/hooks/useDict";
import { queryClient } from "@/plugins/vue-query";
import { queryKeys } from "@/hooks/query-keys";
import { ElMessageBox } from "element-plus";
import { type Ref, h, onMounted, reactive } from "vue";

/** 审核状态 tag 颜色映射(标签文案取字典 message-audit-status,此处仅承载业务语义色) */
const AUDIT_STATUS_TAG: Record<
  MessageAuditStatus,
  "warning" | "success" | "danger"
> = {
  pending: "warning",
  approved: "success",
  rejected: "danger"
};

export function useAdminMessage(tableRef: Ref) {
  const form = reactive({
    nickname: "",
    auditStatus: "" as "" | MessageAuditStatus
  });

  // 审核状态字典:tag 文案/确认提示统一取字典 label(与 sys_dict_data.message-audit-status 对齐)
  const { labelOf: auditLabelOf } = useDict(DICT_CODES.messageAuditStatus);

  // 分页查询公共骨架:分页状态 + 结果列表 + 加载态 + 序号守卫搜索 + 分页事件写回 + 表单重置
  const {
    pagination,
    dataList,
    loading,
    search,
    handleSizeChange,
    handleCurrentChange,
    resetForm
  } = usePageQuery(query =>
    getAdminMessagePage({
      ...query,
      nickname: form.nickname,
      auditStatus: form.auditStatus || undefined
    })
  );

  /** 管理端写操作后失效门户留言缓存(审核状态变化直接影响门户上墙数据) */
  const invalidatePortalMessage = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.message().key });

  // 删除/批量删除/多选三件套(确认弹窗、成功提示与刷新联动由骨架统一)
  const {
    selectedNum,
    handleDelete,
    onbatchDel,
    handleSelectionChange,
    onSelectionCancel
  } = useBatchDelete<MessagePageItem>({
    tableRef,
    remove: deleteAdminMessage,
    nameOf: row => row.nickname,
    entity: "留言",
    unit: "条",
    afterDeleted: () => {
      search();
      void invalidatePortalMessage();
    }
  });

  /**
   * 审核留言(通过/驳回):确认弹窗 + 提交 + 失效门户缓存后刷新。
   * <p>
   * 同状态按钮不渲染(已通过的行不再提供「通过」按钮,驳回同理),取消/失败静默返回。
   */
  function handleAudit(
    row: MessagePageItem,
    auditStatus: Exclude<MessageAuditStatus, "pending">
  ) {
    ElMessageBox.confirm(
      h("span", [
        "确认要将",
        emphasize(row.nickname),
        `的留言审核为「${auditLabelOf(auditStatus)}」吗?`
      ]),
      "审核留言",
      { type: "warning", confirmButtonText: "确定", cancelButtonText: "取消" }
    )
      .then(async () => {
        await auditMessage({ id: row.id, auditStatus });
        void invalidatePortalMessage();
        message(`留言已${auditLabelOf(auditStatus)}`, { type: "success" });
        search(); // 刷新表格数据
      })
      .catch(() => {
        // 用户取消审核,静默返回
      });
  }

  /** 列定义(操作列见 index.vue 的 operation 插槽) */
  const columns: TableColumnList = [
    {
      label: "勾选列", // 如果需要表格多选，此处label必须设置
      type: "selection",
      fixed: "left",
      reserveSelection: true // 数据刷新后保留选项
    },
    {
      label: "昵称",
      prop: "nickname",
      minWidth: 120
    },
    {
      label: "头像",
      prop: "avatar",
      cellRenderer: ({ row }: { row?: MessagePageItem }) =>
        row?.avatar ? (
          <el-image
            fit="cover"
            preview-teleported={true}
            hide-on-click-modal={true}
            src={row.avatar}
            preview-src-list={Array.of(row.avatar)}
            class="size-10 rounded-full align-middle"
          />
        ) : (
          ""
        ),
      width: 90
    },
    {
      label: "留言内容",
      prop: "content",
      minWidth: 220,
      showOverflowTooltip: true
    },
    {
      label: "归属地",
      prop: "region",
      minWidth: 90
    },
    {
      label: "IP",
      prop: "ip",
      minWidth: 130
    },
    {
      label: "审核状态",
      prop: "auditStatus",
      minWidth: 90,
      cellRenderer: ({ row }: { row?: MessagePageItem }) => {
        const tag = AUDIT_STATUS_TAG[row?.auditStatus ?? "pending"];
        return tag ? (
          <el-tag type={tag}>{auditLabelOf(row?.auditStatus)}</el-tag>
        ) : (
          ""
        );
      }
    },
    {
      label: "留言时间",
      prop: "createTime",
      minWidth: 170
    },
    {
      label: "操作",
      fixed: "right",
      width: 150,
      slot: "operation"
    }
  ];

  onMounted(() => {
    search();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    selectedNum,
    pagination,
    onSearch: search,
    resetForm,
    handleAudit,
    onbatchDel,
    handleDelete,
    handleSizeChange,
    onSelectionCancel,
    handleCurrentChange,
    handleSelectionChange
  };
}
