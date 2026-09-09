<script setup lang="ts">
import { ref } from "vue";
import { useDictPage } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { DictSelect } from "@/components/DictSelect";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { hasPerms } from "@/utils/auth";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SystemDict"
});

const formRef = ref();

const {
  typeKeyword,
  typeLoading,
  filteredTypes,
  selectedCode,
  selectedName,
  handleSelect,
  form,
  loading,
  columns,
  dataList,
  pagination,
  tableRef,
  selectedNum,
  onSearch,
  resetForm,
  openCreate,
  openEdit,
  handleDelete,
  handleSelectionChange,
  onSelectionCancel,
  onbatchDel,
  handleSizeChange,
  handleCurrentChange
} = useDictPage();
</script>

<template>
  <div class="flex items-start">
    <!-- 左侧:字典类型列表(主) -->
    <div
      class="bg-bg_color w-[220px] flex-none px-2 pt-3 pb-2 overflow-hidden flex flex-col self-stretch"
    >
      <el-input v-model="typeKeyword" placeholder="搜索字典类型" clearable />
      <el-scrollbar class="flex-1 mt-2" max-height="calc(100vh - 250px)">
        <div
          v-for="item in filteredTypes"
          :key="item.dictCode"
          :class="[
            'flex items-center justify-between gap-1 rounded-sm px-3 py-2 cursor-pointer select-none transition-colors',
            item.dictCode === selectedCode
              ? 'bg-(--el-color-primary-light-9) text-primary'
              : 'hover:bg-[#0000000f] dark:hover:bg-[#ffffff1f]'
          ]"
          @click="handleSelect(item.dictCode)"
        >
          <div class="flex-1 min-w-0">
            <p class="truncate text-sm font-medium">{{ item.dictName }}</p>
            <p
              class="truncate text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
            >
              {{ item.dictCode }}
            </p>
          </div>
          <el-tag size="small" effect="plain">{{ item.count }}</el-tag>
        </div>
        <el-empty
          v-if="filteredTypes.length === 0"
          :image-size="60"
          description="暂无字典类型"
        />
      </el-scrollbar>
    </div>

    <!-- 右侧:选中类型下的字典数据(从) -->
    <div class="flex-1 min-w-0 ml-2">
      <el-form
        ref="formRef"
        :inline="true"
        label-width="82px"
        :model="form"
        class="search-form bg-bg_color w-full pl-8 pt-3 overflow-auto"
      >
        <el-form-item label="字典值：">
          <el-input
            v-model="form.dictValue"
            placeholder="请输入字典值"
            clearable
            class="w-45!"
          />
        </el-form-item>
        <el-form-item label="状态：">
          <DictSelect
            v-model="form.status"
            dict-code="enable"
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
        :title="`「${selectedName}」字典数据`"
        :columns="columns"
        @refresh="onSearch"
      >
        <template #buttons>
          <el-button
            v-if="hasPerms('system:dict:insert')"
            type="primary"
            :icon="useRenderIcon(AddFill)"
            :disabled="!selectedCode"
            @click="openCreate"
          >
            新增条目
          </el-button>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <div
            v-if="selectedNum > 0"
            v-motion-fade
            class="bg-(--el-fill-color-light) w-full h-11.5 mb-2 pl-4 flex items-center"
          >
            <div class="flex-auto">
              <span
                style="font-size: var(--el-font-size-base)"
                class="text-[rgba(42,46,54,0.5)] dark:text-[rgba(220,220,242,0.5)]"
              >
                已选 {{ selectedNum }} 项
              </span>
              <el-button type="primary" text @click="onSelectionCancel">
                取消选择
              </el-button>
            </div>
            <el-button
              v-if="hasPerms('system:dict:delete')"
              type="danger"
              text
              class="mr-1!"
              @click="onbatchDel"
            >
              批量删除
            </el-button>
          </div>
          <pure-table
            ref="tableRef"
            row-key="id"
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
            @selection-change="handleSelectionChange"
            @page-size-change="handleSizeChange"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                v-if="hasPerms('system:dict:update')"
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(EditPen)"
                @click="openEdit(row)"
              >
                修改
              </el-button>
              <el-button
                v-if="hasPerms('system:dict:delete') && row.builtin === 0"
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(Delete)"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>
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
