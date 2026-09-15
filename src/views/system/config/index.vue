<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useConfigPage } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { hasPerms } from "@/utils/auth";

import EditPen from "~icons/ep/edit-pen";
import Refresh from "~icons/ep/refresh";

defineOptions({
  name: "SystemConfig"
});

const formRef = ref();
const tableRef = ref();

const {
  form,
  activeTab,
  groupOptions,
  loading,
  columns,
  dataList,
  pagination,
  onSearch,
  handleTabChange,
  resetForm,
  openEdit,
  handleSizeChange,
  handleCurrentChange
} = useConfigPage();

function onFullscreen() {
  // 重置表格高度
  tableRef.value.setAdaptive();
}

// 分组页签由字典异步渲染:表格挂载计算自适应高度时页签尚未撑开,页签出现后表格顶部
// 位置下移而高度未变,底部留白随之变少;页签渲染完成后重算一次,与其它自适应表格页面对齐
watch(groupOptions, () => {
  nextTick(() => tableRef.value?.setAdaptive());
});
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
      <el-form-item label="配置键：" prop="configKey">
        <el-input
          v-model="form.configKey"
          placeholder="请输入配置键"
          clearable
          class="w-45!"
        />
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
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar
      title="系统配置"
      :columns="columns"
      @refresh="onSearch"
      @fullscreen="onFullscreen"
    >
      <template v-slot="{ size, dynamicColumns }">
        <!-- 分组页签:仅作分组筛选条,内容区由下方表格承载(页签来自 config-group 字典) -->
        <el-tabs
          v-model="activeTab"
          class="config-tabs"
          @tab-change="handleTabChange"
        >
          <el-tab-pane
            v-for="group in groupOptions"
            :key="group.dictValue"
            :label="group.dictLabel"
            :name="group.dictValue"
          />
        </el-tabs>
        <pure-table
          ref="tableRef"
          adaptive
          :adaptiveConfig="{ offsetBottom: 108 }"
          align-whole="center"
          showOverflowTooltip
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
              v-if="hasPerms('system:config:update')"
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(EditPen)"
              @click="openEdit(row)"
            >
              修改
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style lang="scss" scoped>
.search-form {
  :deep(.el-form-item) {
    margin-right: 12px;
    margin-bottom: 12px;
  }

  :deep(.el-input),
  :deep(.el-select) {
    width: 180px;
  }
}

/* 分组页签条:压缩 EP 默认间距,使页签下划线贴近表格 */
.config-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 8px;
  }

  /* 页签仅作分组筛选,无内容区,隐藏空内容占位 */
  :deep(.el-tabs__content) {
    display: none;
  }
}
</style>
