<script setup lang="ts">
import { computed, ref } from "vue";
import { useJob } from "./utils/hook";
import JobLogDrawer from "./components/JobLogDrawer.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { hasPerms } from "@/utils/auth";
import { DICT_CODES } from "@/api/sys-dict";
import { useDict } from "@/hooks/useDict";
import type { JobPageItem } from "@/api/sys-job";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import VideoPlay from "~icons/ep/video-play";
import Document from "~icons/ep/document";
import More from "~icons/ep/more-filled";

defineOptions({
  name: "AdminSystemJob"
});

const formRef = ref();
const tableRef = ref();

// 分组过滤下拉走内置字典(与 JobGroupEnum 对齐)
const { options: groupOptions } = useDict(DICT_CODES.jobGroup);

/** 日志下拉项样式(与用户列表的"更多"菜单一致) */
const buttonClass = computed(() => [
  "h-5!",
  "reset-margin",
  "text-gray-500!",
  "dark:text-white!",
  "dark:hover:text-primary!"
]);

/** 日志抽屉状态(打开即按当前任务过滤;清空 jobId 后为全量日志视图) */
const logDrawer = ref({
  visible: false,
  jobId: "",
  jobName: ""
});

const {
  form,
  loading,
  columns,
  dataList,
  pagination,
  onSearch,
  resetForm,
  openDialog,
  handleDelete,
  handleRun,
  handleSizeChange,
  handleCurrentChange
} = useJob(tableRef);

/** 打开执行日志抽屉(默认仅看当前任务的日志) */
function openLogDrawer(row: JobPageItem) {
  logDrawer.value = {
    visible: true,
    jobId: row.id,
    jobName: row.jobName
  };
}
</script>

<template>
  <div>
    <el-form
      ref="formRef"
      :inline="true"
      label-width="82px"
      :model="form"
      class="search-form bg-bg_color w-full pl-8 pt-3 overflow-auto"
    >
      <el-form-item label="任务名称：" prop="jobName">
        <el-input
          v-model="form.jobName"
          placeholder="请输入任务名称"
          clearable
          class="w-45!"
        />
      </el-form-item>
      <el-form-item label="任务分组：" prop="jobGroup">
        <el-select
          v-model="form.jobGroup"
          placeholder="请选择"
          clearable
          class="w-45!"
        >
          <el-option
            v-for="item in groupOptions"
            :key="item.dictValue"
            :label="item.dictLabel"
            :value="item.dictValue"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态：" prop="status">
        <el-select
          v-model="form.status"
          placeholder="请选择"
          clearable
          class="w-45!"
        >
          <el-option label="正常" :value="0" />
          <el-option label="暂停" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon('ri/search-line')"
          :loading="loading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button @click="resetForm(formRef)"> 重置 </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="定时任务" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          v-if="hasPerms('system:job:insert')"
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增任务
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          ref="tableRef"
          row-key="id"
          adaptive
          :adaptiveConfig="{ offsetBottom: 108 }"
          align-whole="center"
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="{ ...pagination, size }"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <template #operation="{ row, size }">
            <el-button
              v-if="hasPerms('system:job:run')"
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(VideoPlay)"
              @click="handleRun(row)"
            >
              执行
            </el-button>
            <el-button
              v-if="hasPerms('system:job:update')"
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(EditPen)"
              @click="openDialog('修改', row)"
            >
              修改
            </el-button>
            <el-button
              v-if="hasPerms('system:job:delete') && row.builtin !== 1"
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(Delete)"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
            <el-dropdown>
              <el-button
                class="ml-3! mt-0.5!"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(More)"
              />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="hasPerms('system:job:page')">
                    <el-button
                      :class="buttonClass"
                      link
                      type="primary"
                      :size="size"
                      :icon="useRenderIcon(Document)"
                      @click="openLogDrawer(row)"
                    >
                      日志
                    </el-button>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
    <JobLogDrawer
      v-model:visible="logDrawer.visible"
      :job-id="logDrawer.jobId"
      :job-name="logDrawer.jobName"
    />
  </div>
</template>
