<script setup lang="ts">
import { ref } from "vue";
import {
  BIZ_TYPE_LABELS,
  formatSize,
  STORAGE_TYPE_LABELS,
  useFileDetail,
  useFilePage
} from "./hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { FileItem } from "@/api/file";

import Refresh from "~icons/ep/refresh";
import CopyDocument from "~icons/ep/copy-document";
import Check from "~icons/ep/check";

defineOptions({
  name: "SystemFile"
});

const formRef = ref();
const {
  form,
  loading,
  columns,
  dataList,
  pagination,
  onSearch,
  resetForm,
  handleSizeChange,
  handleCurrentChange,
  handleDelete,
  handleDownload
} = useFilePage();

/** 文件详情弹窗(元数据 + 图片预览 + 访问地址复制) */
const { detail, detailVisible, copied, isImage, viewUrl, openDetail, copyUrl } =
  useFileDetail();
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-full pl-8 pt-3 overflow-auto"
    >
      <el-form-item label="文件名" prop="originalName">
        <el-input
          v-model="form.originalName"
          placeholder="请输入文件名"
          clearable
          class="w-45!"
        />
      </el-form-item>
      <el-form-item label="业务类型" prop="bizType">
        <el-select
          v-model="form.bizType"
          placeholder="请选择"
          clearable
          class="w-37.5!"
        >
          <el-option
            v-for="(label, value) in BIZ_TYPE_LABELS"
            :key="value"
            :label="label"
            :value="value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="存储类型" prop="storageType">
        <el-select
          v-model="form.storageType"
          placeholder="请选择"
          clearable
          class="w-37.5!"
        >
          <el-option
            v-for="(label, value) in STORAGE_TYPE_LABELS"
            :key="value"
            :label="label"
            :value="value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="上传人" prop="creatorName">
        <el-input
          v-model="form.creatorName"
          placeholder="请输入上传人"
          clearable
          class="w-37.5!"
        />
      </el-form-item>
      <el-form-item label="上传时间" prop="timeRange">
        <el-date-picker
          v-model="form.timeRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="w-62.5!"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon('ri:search-line')"
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
    <PureTableBar title="文件管理" :columns="columns" @refresh="onSearch">
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          row-key="id"
          align-whole="center"
          table-layout="auto"
          :loading="loading"
          :size="size"
          adaptive
          :adaptiveConfig="{ offsetBottom: 108 }"
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
              class="reset-margin"
              link
              type="primary"
              :size="size"
              @click="openDetail(row)"
            >
              详情
            </el-button>
            <el-button
              class="reset-margin"
              link
              type="primary"
              :size="size"
              @click="handleDownload(row as FileItem)"
            >
              下载
            </el-button>
            <el-button
              class="reset-margin"
              link
              type="danger"
              :size="size"
              @click="handleDelete(row as FileItem)"
            >
              删除
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <!-- 文件详情弹窗:图片类内联预览 + 元数据 + 访问地址复制 -->
    <el-dialog
      v-model="detailVisible"
      :title="`文件详情：${detail?.originalName ?? ''}`"
      width="720px"
    >
      <el-image
        v-if="detail && isImage(detail)"
        :src="viewUrl(detail)"
        :preview-src-list="[viewUrl(detail)]"
        preview-teleported
        fit="contain"
        class="mb-3 max-h-64 w-full"
      />
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="文件名" :span="2">
          {{ detail?.originalName }}
        </el-descriptions-item>
        <el-descriptions-item label="大小">
          {{ detail ? formatSize(detail.size) : "" }}
        </el-descriptions-item>
        <el-descriptions-item label="扩展名">
          {{ detail?.extension?.toUpperCase() }}
        </el-descriptions-item>
        <el-descriptions-item label="业务来源">
          {{ detail ? (BIZ_TYPE_LABELS[detail.bizType] ?? detail.bizType) : "" }}
        </el-descriptions-item>
        <el-descriptions-item label="关联业务ID">
          {{ detail?.bizId ?? "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="存储类型">
          {{
            detail
              ? (STORAGE_TYPE_LABELS[detail.storageType] ?? detail.storageType)
              : ""
          }}
        </el-descriptions-item>
        <el-descriptions-item label="上传人">
          {{ detail?.creatorName ?? "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="Content-Type" :span="2">
          {{ detail?.contentType }}
        </el-descriptions-item>
        <el-descriptions-item label="存储路径" :span="2">
          {{ detail?.path }}
        </el-descriptions-item>
        <el-descriptions-item label="上传时间" :span="2">
          {{ detail?.createTime }}
        </el-descriptions-item>
      </el-descriptions>
      <div class="detail-section">
        <p class="detail-label">访问地址</p>
        <div class="code-block">
          <div class="code-header">
            <span class="code-dot" />
            <span class="text-xs text-[rgba(220,220,242,0.6)]">URL</span>
            <el-button
              text
              size="small"
              class="ml-auto!"
              :style="{
                color: copied
                  ? 'var(--el-color-success)'
                  : 'rgba(220,220,242,0.8)'
              }"
              @click="copyUrl"
            >
              <el-icon class="mr-1">
                <component :is="copied ? Check : CopyDocument" />
              </el-icon>
              {{ copied ? "已复制" : "复制" }}
            </el-button>
          </div>
          <pre class="code-body">{{ detail ? viewUrl(detail) : "" }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.main-content {
  margin: 24px 24px 0 !important;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

.detail-section + .detail-section {
  margin-top: 12px;
}

.detail-label {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.code-block {
  overflow: hidden;
  background: #1e1e1e;
  border-radius: 8px;
}

.code-header {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgb(255 255 255 / 8%);
}

.code-dot {
  width: 8px;
  height: 8px;
  background: var(--el-color-success);
  border-radius: 50%;
}

.code-body {
  padding: 12px 16px;
  margin: 0;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
