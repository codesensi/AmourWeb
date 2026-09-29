<script setup lang="ts">
import { reactive, watch } from "vue";
import { getJobLogPage } from "@/api/sys-job";
import type { JobLogItem } from "@/api/sys-job";
import { DICT_CODES } from "@/api/sys-dict";
import { useDict } from "@/hooks/useDict";

// 任务执行日志抽屉:标题为任务名,默认按任务过滤,清空任务过滤可看全部任务日志
const props = defineProps<{
  visible: boolean;
  /** 任务ID(字符串化;空时展示全部任务日志) */
  jobId: string;
  jobName: string;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
}>();

// 触发方式/执行结果文案走内置字典(与 TriggerTypeEnum/SuccessEnum 对齐)
const { labelOf: triggerLabelOf } = useDict(DICT_CODES.triggerType);
const { labelOf: resultLabelOf } = useDict(DICT_CODES.success);

const state = reactive({
  loading: false,
  records: [] as Array<JobLogItem>,
  pageNumber: 1,
  pageSize: 10,
  totalRow: 0,
  /** 执行状态过滤:空字符串表示全部 */
  status: "" as "" | number
});

async function load() {
  if (!props.visible) return;
  state.loading = true;
  try {
    const result = await getJobLogPage({
      pageNumber: state.pageNumber,
      pageSize: state.pageSize,
      jobId: props.jobId || undefined,
      status: state.status === "" ? undefined : state.status
    });
    state.records = result.data.records;
    state.totalRow = result.data.totalRow;
  } finally {
    state.loading = false;
  }
}

watch(
  () => props.visible,
  visible => {
    if (visible) {
      state.pageNumber = 1;
      state.status = "";
      load();
    }
  }
);
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="`执行日志 · ${jobName || '全部任务'}`"
    size="720px"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="mb-2 flex-bc gap-3">
      <el-radio-group
        v-model="state.status"
        size="small"
        @change="
          () => {
            state.pageNumber = 1;
            load();
          }
        "
      >
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="1">成功</el-radio-button>
        <el-radio-button label="0">失败</el-radio-button>
      </el-radio-group>
    </div>
    <el-table
      v-loading="state.loading"
      :data="state.records"
      align-whole="center"
      table-layout="auto"
      size="small"
      :header-cell-style="{
        background: 'var(--el-fill-color-light)',
        color: 'var(--el-text-color-primary)'
      }"
    >
      <el-table-column label="开始时间" prop="startTime" min-width="150" />
      <el-table-column label="耗时" width="90">
        <template #default="{ row }">
          {{ row.duration != null ? `${row.duration}ms` : "" }}
        </template>
      </el-table-column>
      <el-table-column label="触发方式" width="90">
        <template #default="{ row }">{{
          triggerLabelOf(row.triggerType)
        }}</template>
      </el-table-column>
      <el-table-column
        label="链路ID"
        prop="traceId"
        min-width="110"
        show-overflow-tooltip
      >
        <template #default="{ row }">{{ row.traceId || "-" }}</template>
      </el-table-column>
      <el-table-column label="结果" width="80">
        <template #default="{ row }">
          <el-tag
            :type="Number(row.status) === 1 ? 'success' : 'danger'"
            effect="light"
            size="small"
          >
            {{ resultLabelOf(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="异常信息" prop="errorMsg" min-width="220">
        <template #default="{ row }">
          <el-tooltip
            v-if="row.errorMsg"
            :content="row.errorMsg"
            placement="top"
            raw-content
          >
            <span class="text-(--el-color-danger)">
              {{ row.errorMsg?.split("\n")[0] }}
            </span>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>
    <div class="mt-2 flex justify-end">
      <el-pagination
        v-model:current-page="state.pageNumber"
        v-model:page-size="state.pageSize"
        :total="state.totalRow"
        layout="total, prev, pager, next, sizes"
        @current-change="load"
        @size-change="
          () => {
            state.pageNumber = 1;
            load();
          }
        "
      />
    </div>
  </el-drawer>
</template>
