<script setup lang="ts">
import ReCol from "@/components/ReCol";
import { getNextTriggerTimes } from "@/api/sys-job";
import { DICT_CODES } from "@/api/sys-dict";
import { useDict } from "@/hooks/useDict";
import type { FormInstance } from "element-plus";
import { ref, watch } from "vue";

/** 表单数据形态(hook.openDialog 构造的 formInline 同构) */
interface FormInline {
  title: string;
  id?: string;
  jobName: string;
  jobGroup?: string;
  invokeTarget: string;
  cronExpression: string;
  concurrent: number;
  builtin: number;
  remark: string;
}

interface FormProps {
  formInline?: FormInline;
}

// 定时任务表单(新增/修改共用):任务名/分组/调用目标/cron + 触发时间预览/并发开关/备注
const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    title: "新增",
    id: undefined,
    jobName: "",
    jobGroup: "",
    invokeTarget: "",
    cronExpression: "",
    concurrent: 0,
    builtin: 0,
    remark: ""
  })
});

const ruleFormRef = ref<FormInstance>();
const newFormInline = ref(props.formInline);

// 任务分组选项走内置字典(与 JobGroupEnum 对齐)
const { options: groupOptions } = useDict(DICT_CODES.jobGroup);

/** 修改态:调用目标是任务身份一律禁用;分组仅内置任务为部署期约定 */
const isEdit = newFormInline.value.id != null;
const isBuiltin = newFormInline.value.builtin === 1;

/** cron 后续触发时间预览(输入稳定 500ms 后刷新) */
const nextTimes = ref<Array<string>>([]);
let previewTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => newFormInline.value.cronExpression,
  cron => {
    if (previewTimer) clearTimeout(previewTimer);
    nextTimes.value = [];
    if (!cronExpressionValid(cron)) return;
    previewTimer = setTimeout(() => {
      getNextTriggerTimes(cron)
        .then(result => {
          nextTimes.value = result.data;
        })
        .catch(() => {
          nextTimes.value = [];
        });
    }, 500);
  },
  { immediate: true }
);

/** 前端快速校验 cron 形态(5/6 段),合法性与预览以后端 CronExpression 解析为准 */
function cronExpressionValid(cron: string): boolean {
  const parts = cron.trim().split(/\s+/);
  return (parts.length === 5 || parts.length === 6) && cron.trim().length > 0;
}

const rules = {
  jobName: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
  invokeTarget: [
    { required: true, message: "请选择调用目标", trigger: "change" }
  ],
  cronExpression: [
    { required: true, message: "请输入 cron 表达式", trigger: "blur" }
  ]
};

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form ref="ruleFormRef" :model="newFormInline" label-width="92px">
    <el-row :gutter="30">
      <re-col>
        <el-form-item label="任务名称" prop="jobName">
          <el-input
            v-model="newFormInline.jobName"
            maxlength="64"
            clearable
            placeholder="请输入任务名称"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="任务分组" prop="jobGroup">
          <el-select
            v-model="newFormInline.jobGroup"
            :disabled="isEdit && isBuiltin"
            filterable
            placeholder="请选择任务分组"
            class="w-full"
          >
            <el-option
              v-for="item in groupOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
          <span
            v-if="isEdit && isBuiltin"
            class="ml-2 text-xs text-(--el-text-color-secondary)"
          >
            内置任务的分组为部署期约定，不可修改
          </span>
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="调用目标" prop="invokeTarget">
          <el-select
            v-model="newFormInline.invokeTarget"
            :disabled="isEdit"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入 SysTask bean 名称"
            class="w-full"
          >
            <el-option
              label="fileRecycleCleanTask（文件回收站清理）"
              value="fileRecycleCleanTask"
            />
            <el-option
              label="sysLogCleanTask（系统日志清理）"
              value="sysLogCleanTask"
            />
          </el-select>
          <span
            v-if="isEdit"
            class="ml-2 text-xs text-(--el-text-color-secondary)"
          >
            调用目标创建后不可修改
          </span>
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="cron 表达式" prop="cronExpression">
          <el-input
            v-model="newFormInline.cronExpression"
            maxlength="64"
            clearable
            placeholder="如 0 30 3 * * ?（每日 03:30）"
          />
        </el-form-item>
      </re-col>
      <re-col v-if="nextTimes.length">
        <el-form-item label="下次触发">
          <div class="text-xs/6 text-(--el-text-color-secondary)">
            <div
              v-for="(time, index) in nextTimes"
              :key="time"
              class="whitespace-nowrap"
            >
              {{ index + 1 }}. {{ time }}
            </div>
          </div>
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="允许并发">
          <el-switch
            v-model="newFormInline.concurrent"
            :active-value="1"
            :inactive-value="0"
            inline-prompt
            active-text="允许"
            inactive-text="禁止"
          />
          <span class="ml-2 text-xs text-(--el-text-color-secondary)">
            禁止时上一次执行未结束会跳过本次触发
          </span>
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="newFormInline.remark"
            maxlength="255"
            type="textarea"
            :rows="2"
            placeholder="请输入任务备注"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
