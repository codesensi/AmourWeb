import editForm from "../form.vue";
import { h } from "vue";
import { message } from "@/utils/message";
import {
  openFormDialog,
  useBatchDelete,
  usePageQuery
} from "@/views/system/hooks";
import {
  deleteFootprint,
  getFootprintPage,
  insertFootprint,
  updateFootprint
} from "@/api/admin-footprint";
import type { FootprintPageItem } from "@/api/admin-footprint";
import { queryClient } from "@/plugins/vue-query";
import { queryKeys } from "@/hooks/query-keys";
import { type Ref, reactive, ref, onMounted } from "vue";

/** 行数据剔除服务端注入字段后的可编辑形态(与后端 FootprintUpdateRequest 对齐) */
type FootprintUpdatePayload = {
  id: string;
  city: string;
  placeName: string | null;
  longitude: number | null;
  latitude: number | null;
  arrivalDate: string | null;
  photoUrl: string | null;
  remark: string;
};

export function useFootprint(tableRef: Ref) {
  const form = reactive({
    city: "",
    arrivalDateRange: [] as Array<string>
  });
  const formRef = ref();

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
    getFootprintPage({
      ...query,
      city: form.city,
      arrivalDateBegin: form.arrivalDateRange?.[0],
      arrivalDateEnd: form.arrivalDateRange?.[1]
    })
  );

  // 删除/批量删除/多选三件套(确认弹窗、成功提示与刷新联动由骨架统一)
  /** 管理端写操作后失效门户足迹缓存(key 前缀同时覆盖分页与地图点两个子资源) */
  const invalidatePortalFootprint = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.footprint().key });

  const {
    selectedNum,
    handleDelete,
    onbatchDel,
    handleSelectionChange,
    onSelectionCancel
  } = useBatchDelete<FootprintPageItem>({
    tableRef,
    remove: deleteFootprint,
    nameOf: row => row.city,
    entity: "足迹",
    unit: "条",
    afterDeleted: () => {
      search();
      void invalidatePortalFootprint();
    }
  });

  /** 列定义 */
  const columns: TableColumnList = [
    {
      label: "勾选列", // 如果需要表格多选，此处label必须设置
      type: "selection",
      fixed: "left",
      reserveSelection: true // 数据刷新后保留选项
    },
    {
      label: "照片",
      prop: "photoUrl",
      cellRenderer: ({ row }) =>
        row.photoUrl ? (
          <el-image
            fit="cover"
            preview-teleported={true}
            hide-on-click-modal={true}
            src={row.photoUrl}
            preview-src-list={Array.of(row.photoUrl)}
            class="size-10 rounded align-middle"
          />
        ) : (
          ""
        ),
      width: 90
    },
    {
      label: "城市",
      prop: "city",
      minWidth: 140
    },
    {
      label: "精确地点",
      prop: "placeName",
      minWidth: 140
    },
    {
      label: "到访日期",
      prop: "arrivalDate",
      minWidth: 110
    },
    {
      label: "备注",
      prop: "remark",
      minWidth: 200
    },
    {
      label: "创建时间",
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

  function openDialog(title = "新增", row?: FootprintPageItem) {
    // 响应式表单数据:headerRenderer 与表单控件共享同一代理,降级状态联动标题胶囊
    const formInline = reactive({
      title,
      id: row?.id,
      city: row?.city ?? "",
      placeName: row?.placeName ?? "",
      longitude: row?.longitude ?? null,
      latitude: row?.latitude ?? null,
      arrivalDate: row?.arrivalDate ?? "",
      photoUrl: row?.photoUrl ?? "",
      remark: row?.remark ?? "",
      /** 高德服务降级标记(仅驱动标题行胶囊显隐,不参与提交) */
      degraded: false
    });
    openFormDialog({
      title: `${title}足迹`,
      headerRenderer: ({ titleId, titleClass }) =>
        h(
          "span",
          {
            id: titleId,
            class: [titleClass, "relative flex flex-1 items-center"]
          },
          [
            h("span", `${title}足迹`),
            formInline.degraded
              ? h(
                  "span",
                  {
                    class:
                      "bg-(--el-color-warning) text-white absolute left-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-normal -translate-x-1/2"
                  },
                  "高德地图暂不可用，已启用系统内置地图"
                )
              : null
          ]
        ),
      editForm,
      formRef,
      formInline,
      submit: async curData => {
        // 照片以 URL 直存:上传组件返回的站内地址或外链,保存记录时直接绑定
        const payload: FootprintUpdatePayload = {
          id: curData.id!,
          city: curData.city,
          placeName: curData.placeName || null,
          longitude: curData.longitude,
          latitude: curData.latitude,
          arrivalDate: curData.arrivalDate || null,
          photoUrl: curData.photoUrl || null,
          remark: curData.remark
        };
        if (title === "新增") {
          await insertFootprint(payload);
        } else {
          await updateFootprint(payload);
        }
        await invalidatePortalFootprint();
        message(`成功${title}足迹`, { type: "success" });
        search(); // 刷新表格数据
      }
    });
  }

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
    onbatchDel,
    openDialog,
    handleDelete,
    handleSizeChange,
    onSelectionCancel,
    handleCurrentChange,
    handleSelectionChange
  };
}
