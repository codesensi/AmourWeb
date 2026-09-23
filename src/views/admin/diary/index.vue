<script setup lang="ts">
import { ref } from "vue";
import { useDiary } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import MoodSelect from "./components/MoodSelect.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { hasPerms } from "@/utils/auth";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "AdminDiary"
});

const formRef = ref();
const tableRef = ref();

const {
  form,
  loading,
  columns,
  dataList,
  selectedNum,
  pagination,
  onSearch,
  resetForm,
  onbatchDel,
  openDialog,
  handleDelete,
  handleSizeChange,
  onSelectionCancel,
  handleCurrentChange,
  handleSelectionChange
} = useDiary(tableRef);
</script>

<template>
  <div>
    <el-form
      ref="formRef"
      :inline="true"
      label-width="68px"
      :model="form"
      class="search-form bg-bg_color w-full pl-8 pt-3 overflow-auto"
    >
      <el-form-item label="日期：" prop="diaryDate">
        <el-date-picker
          v-model="form.diaryDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择日期"
          clearable
          class="w-45!"
        />
      </el-form-item>
      <el-form-item label="心情：" prop="mood">
        <MoodSelect
          v-model="form.mood"
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
        <el-button @click="resetForm(formRef)"> 重置 </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="情侣日记" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          v-if="hasPerms('admin:diary:insert')"
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增日记
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
            v-if="hasPerms('admin:diary:delete')"
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
              v-if="hasPerms('admin:diary:update')"
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
              v-if="hasPerms('admin:diary:delete')"
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

<style lang="scss">
/* 心情标签语义色:cellRenderer 渲染的标签不带 scoped id,故用非 scoped 块 +
 * mood-tag-- 唯一前缀避免冲突;经 el-tag 的 CSS 变量换肤,深浅色分别取值
 * 保证标签文字对比度 ≥4.5:1。
 * 选择器带 .el-tag 前缀:压过组件默认的 .el-tag.el-tag--primary(默认 type)
 * 对同名 CSS 变量的定义,否则心情色全部回退主色蓝 */

/* 暖阳组:晴天/花开/彩虹/日落 —— 明亮愉悦 */
.el-tag.mood-tag--warm {
  --el-tag-bg-color: #fdf1e3;
  --el-tag-text-color: #9a5b00;
  --el-tag-border-color: #f3d9b5;
}

/* 雨雪组:雨天/细雨/雷阵雨/雨夹雪/冰雹/落雪 —— 湿冷降温 */
.el-tag.mood-tag--rain {
  --el-tag-bg-color: #e9f1fc;
  --el-tag-text-color: #2f6bbf;
  --el-tag-border-color: #c2d7f1;
}

/* 云雾组:多云/阴天/薄雾 —— 低沉含蓄 */
.el-tag.mood-tag--cloud {
  --el-tag-bg-color: #eef1f4;
  --el-tag-text-color: #5a6a7b;
  --el-tag-border-color: #d5dde5;
}

/* 清风组:起风/落叶 —— 轻快疏朗 */
.el-tag.mood-tag--wind {
  --el-tag-bg-color: #e7f5f1;
  --el-tag-text-color: #1f7a66;
  --el-tag-border-color: #bce0d7;
}

/* 夜象组:星夜/月色/流星/极光 —— 深邃浪漫 */
.el-tag.mood-tag--night {
  --el-tag-bg-color: #f1edfb;
  --el-tag-text-color: #6448b8;
  --el-tag-border-color: #d3c8f2;
}

/* 中性组:不标记/未知编码 */
.el-tag.mood-tag--none {
  --el-tag-bg-color: #f3f4f6;
  --el-tag-text-color: #6b7280;
  --el-tag-border-color: #e5e7eb;
}

/* 暗色模式:半透明底 + 提亮文字 */
html.dark {
  .el-tag.mood-tag--warm {
    --el-tag-bg-color: rgb(255 166 60 / 16%);
    --el-tag-text-color: #ffb85c;
    --el-tag-border-color: rgb(255 166 60 / 32%);
  }

  .el-tag.mood-tag--rain {
    --el-tag-bg-color: rgb(96 165 250 / 16%);
    --el-tag-text-color: #8ab8ff;
    --el-tag-border-color: rgb(96 165 250 / 32%);
  }

  .el-tag.mood-tag--cloud {
    --el-tag-bg-color: rgb(148 163 184 / 16%);
    --el-tag-text-color: #a8b7c9;
    --el-tag-border-color: rgb(148 163 184 / 32%);
  }

  .el-tag.mood-tag--wind {
    --el-tag-bg-color: rgb(45 212 191 / 14%);
    --el-tag-text-color: #6fd9c4;
    --el-tag-border-color: rgb(45 212 191 / 30%);
  }

  .el-tag.mood-tag--night {
    --el-tag-bg-color: rgb(167 139 250 / 16%);
    --el-tag-text-color: #b9a2ff;
    --el-tag-border-color: rgb(167 139 250 / 32%);
  }

  .el-tag.mood-tag--none {
    --el-tag-bg-color: rgb(156 163 175 / 14%);
    --el-tag-text-color: #9ca3af;
    --el-tag-border-color: rgb(156 163 175 / 30%);
  }
}
</style>
