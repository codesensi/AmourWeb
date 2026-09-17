<script setup lang="ts">
import { reactive, ref } from "vue";
import { formatSize, useFileDetail, useFilePage } from "./utils/hook";
import { DICT_CODES } from "@/api/sys-dict";
import { useDict } from "@/hooks/useDict";
import { useLazyTabs } from "@/views/system/hooks";
import { ReCodeBlock } from "@/components/ReCodeBlock";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { hasPerms } from "@/utils/auth";
import type { FileItem } from "@/api/file";

import Refresh from "~icons/ep/refresh";

defineOptions({
  name: "SystemFile"
});

// 字典驱动:业务来源与存储类型的下拉选项及标签文案
const { labelOf: bizLabelOf, options: bizTypeOptions } = useDict(
  DICT_CODES.bizType
);
const { labelOf: storageLabelOf, options: storageTypeOptions } = useDict(
  DICT_CODES.fileStorageType
);

// reactive 包装:模板经 activeTab.xxx 属性访问,ref 自动拆箱保持响应式
const activeTabState = reactive(useFilePage("active"));
const recycleTab = reactive(useFilePage("recycle"));
const activeTab = ref("active");
const activeFormRef = ref();
const recycleFormRef = ref();

/** 文件详情弹窗(两页签共用:元数据 + 图片预览 + 访问地址展示复制) */
const { detail, detailVisible, isImage, viewUrl, openDetail } = useFileDetail();

/** 页签懒加载:首次激活时才请求对应列表;挂载时自动加载初始页签 */
const handleTabChange = useLazyTabs(
  { active: activeTabState, recycle: recycleTab },
  activeTab.value
);
</script>

<template>
  <div class="main">
    <el-tabs
      v-model="activeTab"
      class="bg-bg_color px-3! pt-1!"
      @tab-change="handleTabChange"
    >
      <el-tab-pane label="文件列表" name="active">
        <el-form
          ref="activeFormRef"
          :inline="true"
          :model="activeTabState.form"
          class="search-form bg-bg_color w-full pl-8 pt-3 overflow-auto"
        >
          <el-form-item label="文件名" prop="originalName">
            <el-input
              v-model="activeTabState.form.originalName"
              placeholder="请输入文件名"
              clearable
              class="w-45!"
            />
          </el-form-item>
          <el-form-item label="业务类型" prop="bizType">
            <el-select
              v-model="activeTabState.form.bizType"
              placeholder="请选择"
              clearable
              class="w-37.5!"
            >
              <el-option
                v-for="item in bizTypeOptions"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="存储类型" prop="storageType">
            <el-select
              v-model="activeTabState.form.storageType"
              placeholder="请选择"
              clearable
              class="w-37.5!"
            >
              <el-option
                v-for="item in storageTypeOptions"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="上传人" prop="creatorName">
            <el-input
              v-model="activeTabState.form.creatorName"
              placeholder="请输入上传人"
              clearable
              class="w-37.5!"
            />
          </el-form-item>
          <el-form-item label="上传时间" prop="timeRange">
            <el-date-picker
              v-model="activeTabState.form.timeRange"
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
              :loading="activeTabState.loading"
              @click="activeTabState.onSearch"
            >
              搜索
            </el-button>
            <el-button
              :icon="useRenderIcon(Refresh)"
              @click="activeTabState.resetForm(activeFormRef)"
            >
              重置
            </el-button>
          </el-form-item>
        </el-form>
        <PureTableBar
          title="文件管理"
          :columns="activeTabState.columns"
          @refresh="activeTabState.onSearch"
        >
          <template v-slot="{ size, dynamicColumns }">
            <pure-table
              row-key="id"
              align-whole="center"
              table-layout="auto"
              :loading="activeTabState.loading"
              :size="size"
              adaptive
              :adaptiveConfig="{ offsetBottom: 108 }"
              :data="activeTabState.dataList"
              :columns="dynamicColumns"
              :pagination="{ ...activeTabState.pagination, size }"
              :header-cell-style="{
                background: 'var(--el-fill-color-light)',
                color: 'var(--el-text-color-primary)'
              }"
              @page-size-change="activeTabState.handleSizeChange"
              @page-current-change="activeTabState.handleCurrentChange"
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
                  @click="activeTabState.handleDownload(row as FileItem)"
                >
                  下载
                </el-button>
                <el-button
                  v-if="hasPerms('system:file:delete')"
                  class="reset-margin"
                  link
                  type="danger"
                  :size="size"
                  @click="activeTabState.handleDelete(row as FileItem)"
                >
                  删除
                </el-button>
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </el-tab-pane>
      <el-tab-pane label="回收站" name="recycle" lazy>
        <el-form
          ref="recycleFormRef"
          :inline="true"
          :model="recycleTab.form"
          class="search-form bg-bg_color w-full pl-8 pt-3 overflow-auto"
        >
          <el-form-item label="文件名" prop="originalName">
            <el-input
              v-model="recycleTab.form.originalName"
              placeholder="请输入文件名"
              clearable
              class="w-45!"
            />
          </el-form-item>
          <el-form-item label="业务类型" prop="bizType">
            <el-select
              v-model="recycleTab.form.bizType"
              placeholder="请选择"
              clearable
              class="w-37.5!"
            >
              <el-option
                v-for="item in bizTypeOptions"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="存储类型" prop="storageType">
            <el-select
              v-model="recycleTab.form.storageType"
              placeholder="请选择"
              clearable
              class="w-37.5!"
            >
              <el-option
                v-for="item in storageTypeOptions"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="上传人" prop="creatorName">
            <el-input
              v-model="recycleTab.form.creatorName"
              placeholder="请输入上传人"
              clearable
              class="w-37.5!"
            />
          </el-form-item>
          <el-form-item label="上传时间" prop="timeRange">
            <el-date-picker
              v-model="recycleTab.form.timeRange"
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
              :loading="recycleTab.loading"
              @click="recycleTab.onSearch"
            >
              搜索
            </el-button>
            <el-button
              :icon="useRenderIcon(Refresh)"
              @click="recycleTab.resetForm(recycleFormRef)"
            >
              重置
            </el-button>
          </el-form-item>
        </el-form>
        <PureTableBar
          title="回收站"
          :columns="recycleTab.columns"
          @refresh="recycleTab.onSearch"
        >
          <template v-slot="{ size, dynamicColumns }">
            <pure-table
              row-key="id"
              align-whole="center"
              table-layout="auto"
              :loading="recycleTab.loading"
              :size="size"
              adaptive
              :adaptiveConfig="{ offsetBottom: 108 }"
              :data="recycleTab.dataList"
              :columns="dynamicColumns"
              :pagination="{ ...recycleTab.pagination, size }"
              :header-cell-style="{
                background: 'var(--el-fill-color-light)',
                color: 'var(--el-text-color-primary)'
              }"
              @page-size-change="recycleTab.handleSizeChange"
              @page-current-change="recycleTab.handleCurrentChange"
            >
              <template #operation="{ row, size }">
                <el-button
                  v-if="hasPerms('system:file:delete')"
                  class="reset-margin"
                  link
                  type="primary"
                  :size="size"
                  @click="recycleTab.handleRestore(row as FileItem)"
                >
                  恢复
                </el-button>
                <el-button
                  v-if="hasPerms('system:file:delete')"
                  class="reset-margin"
                  link
                  type="danger"
                  :size="size"
                  @click="recycleTab.handlePhysicalDelete(row as FileItem)"
                >
                  彻底删除
                </el-button>
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </el-tab-pane>
    </el-tabs>

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
          {{ detail ? bizLabelOf(detail.bizType) : "" }}
        </el-descriptions-item>
        <el-descriptions-item label="关联业务ID">
          {{ detail?.bizId }}
        </el-descriptions-item>
        <el-descriptions-item label="存储类型">
          {{ detail ? storageLabelOf(detail.storageType) : "" }}
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
        <ReCodeBlock :code="detail ? viewUrl(detail) : ''" label="URL" />
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-dropdown-menu__item i) {
  margin: 0;
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
</style>
