<script setup lang="ts">
import { ref } from "vue";
import { useMenu } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { DictSelect } from "@/components/DictSelect";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { hasPerms } from "@/utils/auth";
import { typeOptions } from "./utils/enums";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import Refresh from "~icons/ep/refresh";
import Expand from "~icons/ep/expand";
import Fold from "~icons/ep/fold";
import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SystemMenu"
});

// el-option 的 value 仅接受字符串/数字,ReSegmented 的 OptionsType.value 含函数分支,此处收敛为字符串
const menuTypeOptions = typeOptions as Array<{ label: string; value: string }>;

const formRef = ref();
const tableRef = ref();
const {
  form,
  loading,
  columns,
  dataList,
  isExpandAll,
  expandRowKeys,
  toggleExpandAll,
  onSearch,
  resetForm,
  openDialog,
  handleDelete
} = useMenu();

function onFullscreen() {
  // 重置表格高度
  tableRef.value.setAdaptive();
}
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-full pl-8 pt-3 overflow-auto"
    >
      <el-form-item label="菜单名称：" prop="title">
        <el-input
          v-model="form.title"
          placeholder="请输入菜单名称"
          clearable
          class="w-45!"
        />
      </el-form-item>
      <el-form-item label="菜单类型：" prop="type">
        <el-select
          v-model="form.type"
          placeholder="请选择"
          clearable
          class="w-45!"
        >
          <el-option
            v-for="item in menuTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态：" prop="status">
        <DictSelect
          v-model="form.status"
          dict-code="enable"
          placeholder="请选择"
          clearable
          class="w-45!"
        />
      </el-form-item>
      <el-form-item label="隐藏：" prop="hidden">
        <DictSelect
          v-model="form.hidden"
          dict-code="yes"
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
      title="菜单管理"
      :columns="columns"
      :isExpandAll="false"
      :tableRef="tableRef?.getTableRef()"
      @refresh="onSearch"
      @fullscreen="onFullscreen"
    >
      <template #title>
        <div class="flex items-center">
          <span class="font-bold truncate">菜单管理</span>
          <el-button
            class="ml-2!"
            link
            type="primary"
            :icon="useRenderIcon(isExpandAll ? Fold : Expand)"
            @click="toggleExpandAll"
          >
            {{ isExpandAll ? "折叠" : "展开" }}
          </el-button>
        </div>
      </template>
      <template #buttons>
        <el-button
          v-if="hasPerms('system:menu:insert')"
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增菜单
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          ref="tableRef"
          adaptive
          :adaptiveConfig="{ offsetBottom: 45 }"
          align-whole="center"
          row-key="id"
          :expand-row-keys="expandRowKeys"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
        >
          <template #operation="{ row }">
            <el-button
              v-if="hasPerms('system:menu:update')"
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
              v-if="hasPerms('system:menu:insert') && row.type !== 'B'"
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(AddFill)"
              @click="openDialog('新增', { pid: row.id } as any)"
            >
              新增
            </el-button>
            <el-button
              v-if="hasPerms('system:menu:delete') && row.builtin === 0"
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
</template>

<style lang="scss" scoped>
:deep(.el-table__inner-wrapper::before) {
  height: 0;
}

.main-content {
  margin: 24px 24px 0 !important;
}

.search-form {
  :deep(.el-form-item) {
    margin-right: 12px;
    margin-bottom: 12px;
  }
}
</style>
