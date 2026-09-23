import editForm from "../form.vue";
import { emphasize, message } from "@/utils/message";
import {
  openFormDialog,
  useBatchDelete,
  usePageQuery
} from "@/views/system/hooks";
import {
  deleteDiary,
  getDiaryPage,
  insertDiary,
  updateDiary
} from "@/api/admin-diary";
import type { DiaryPageItem } from "@/api/admin-diary";
import { fallbackAvatar } from "@/utils/avatar";
import { DICT_CODES } from "@/api/sys-dict";
import { useDict } from "@/hooks/useDict";
import { queryClient } from "@/plugins/vue-query";
import { queryKeys } from "@/hooks/query-keys";
import { type Ref, h, reactive, ref, onMounted } from "vue";

export function useDiary(tableRef: Ref) {
  const form = reactive({
    diaryDate: "",
    mood: ""
  });
  const formRef = ref();

  /** 心情字典:筛选下拉/表格标签统一取字典 label */
  const { labelOf: moodLabelOf } = useDict(DICT_CODES.diaryMood);

  /** 心情 → 语义色组映射(按情绪温度分 6 组:暖阳/雨雪/云雾/清风/夜象/中性;
   * 色值定义见 index.vue 的 mood-tag 类,深浅色模式分别取值) */
  const MOOD_TAG_CLASS: Record<string, string> = {
    // 暖阳组:明亮愉悦
    sunny: "mood-tag--warm",
    bloom: "mood-tag--warm",
    rainbow: "mood-tag--warm",
    sunset: "mood-tag--warm",
    // 雨雪组:湿冷降温
    rainy: "mood-tag--rain",
    drizzle: "mood-tag--rain",
    thunderstorm: "mood-tag--rain",
    sleet: "mood-tag--rain",
    hail: "mood-tag--rain",
    snowy: "mood-tag--rain",
    // 云雾组:低沉含蓄
    cloudy: "mood-tag--cloud",
    overcast: "mood-tag--cloud",
    fog: "mood-tag--cloud",
    // 清风组:轻快疏朗
    windy: "mood-tag--wind",
    leaf: "mood-tag--wind",
    // 夜象组:深邃浪漫
    starry: "mood-tag--night",
    moon: "mood-tag--night",
    meteor: "mood-tag--night",
    aurora: "mood-tag--night"
  };

  /** 心情标签类(未标记/未知编码归入中性灰) */
  const moodTagClass = (mood: string | undefined) =>
    MOOD_TAG_CLASS[mood ?? ""] ?? "mood-tag--none";

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
    getDiaryPage({
      ...query,
      diaryDate: form.diaryDate,
      mood: form.mood
    })
  );

  /** 管理端写操作后失效门户情侣日记缓存 */
  const invalidatePortalDiary = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.diary().key });

  // 删除/批量删除/多选三件套(确认弹窗、成功提示与刷新联动由骨架统一)
  const {
    selectedNum,
    handleDelete,
    onbatchDel,
    handleSelectionChange,
    onSelectionCancel
  } = useBatchDelete<DiaryPageItem>({
    tableRef,
    remove: deleteDiary,
    nameOf: row => row.diaryDate,
    entity: "日记",
    unit: "篇",
    afterDeleted: () => {
      search();
      void invalidatePortalDiary();
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
      label: "记录日期",
      prop: "diaryDate",
      minWidth: 120
    },
    {
      label: "记录人",
      prop: "username",
      minWidth: 140,
      cellRenderer: ({ row }: { row?: DiaryPageItem }) => (
        <div class="flex items-center justify-center gap-1">
          <el-avatar size={24} src={row?.avatar || fallbackAvatar} />
          <span>{row?.username}</span>
        </div>
      )
    },
    {
      label: "心情",
      prop: "mood",
      minWidth: 80,
      cellRenderer: ({ row }: { row?: DiaryPageItem }) => (
        <el-tag class={moodTagClass(row?.mood)} size="small">
          {moodLabelOf(row?.mood ?? "")}
        </el-tag>
      )
    },
    {
      label: "日记内容",
      prop: "content",
      minWidth: 280,
      cellRenderer: ({ row }: { row?: DiaryPageItem }) => {
        const text = row?.content ?? "";
        return text.length > 40 ? `${text.slice(0, 40)}…` : text;
      }
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

  function openDialog(title = "新增", row?: DiaryPageItem) {
    openFormDialog({
      title: `${title}情侣日记`,
      editForm,
      formRef,
      formInline: {
        id: row?.id,
        diaryDate: row?.diaryDate ?? "",
        mood: row?.mood ?? "unknown",
        content: row?.content ?? ""
      },
      submit: async curData => {
        if (title === "新增") {
          await insertDiary({
            diaryDate: curData.diaryDate,
            mood: curData.mood,
            content: curData.content
          });
        } else {
          await updateDiary({
            id: curData.id!,
            diaryDate: curData.diaryDate,
            mood: curData.mood,
            content: curData.content
          });
        }
        await invalidatePortalDiary();
        message(`成功${title}情侣日记`, { type: "success" });
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
