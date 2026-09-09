<script setup lang="ts">
import { ref } from "vue";
import { useConfigPage } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { DictSelect } from "@/components/DictSelect";
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
  loading,
  columns,
  dataList,
  pagination,
  onSearch,
  resetForm,
  openEdit,
  handleSizeChange,
  handleCurrentChange
} = useConfigPage();

function onFullscreen() {
  // 重置表格高度
  tableRef.value.setAdaptive();
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
      <el-form-item label="配置键：" prop="configKey">
        <el-input
          v-model="form.configKey"
          placeholder="请输入配置键"
          clearable
          class="w-45!"
        />
      </el-form-item>
      <el-form-item label="分组：" prop="configGroup">
        <DictSelect
          v-model="form.configGroup"
          dict-code="config-group"
          placeholder="请选择"
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
</style>
