<script setup lang="ts">
import { reactive, ref } from "vue";
import { DICT_CODES } from "@/api/dict";
import { hasPerms } from "@/utils/auth";
import { useLazyTabs } from "@/views/system/hooks";
import { useLogPage, useLogDetail } from "./utils/hook";
import { DictSelect } from "@/components/DictSelect";
import { ReCodeBlock } from "@/components/ReCodeBlock";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Refresh from "~icons/ep/refresh";

defineOptions({
  name: "SystemLog"
});

/** 登录/操作两个 Tab 的定义(按权限过滤显隐,粒度与后端接口权限码一一对应) */
const tabDefs = [
  { name: "login", label: "登录日志", perm: "log:login:page" },
  { name: "operate", label: "操作日志", perm: "log:operate:page" }
].filter(tab => hasPerms(tab.perm));

const activeTab = ref(tabDefs[0]?.name ?? "");
const loginFormRef = ref();
const operateFormRef = ref();

// reactive 包装:模板经 loginTab.xxx 属性访问,ref 自动拆箱保持响应式
const loginTab = reactive(useLogPage("login"));
const operateTab = reactive(useLogPage("operate"));

/** 日志详情弹窗(两 Tab 共用) */
const { detail, detailVisible, openDetail, prettyJson } = useLogDetail();

/** Tab 懒加载:首次激活时才请求对应日志,避免不可见页签的无谓请求;挂载时自动加载初始 Tab */
const handleTabChange = useLazyTabs(
  { login: loginTab, operate: operateTab },
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
      <el-tab-pane
        v-if="hasPerms('log:login:page')"
        label="登录日志"
        name="login"
      >
        <el-form
          ref="loginFormRef"
          :inline="true"
          :model="loginTab.form"
          class="search-form bg-bg_color w-full pl-8 pt-3 overflow-auto"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="loginTab.form.username"
              placeholder="请输入用户名"
              clearable
              class="w-37.5!"
            />
          </el-form-item>
          <el-form-item label="登录状态" prop="status">
            <DictSelect
              v-model="loginTab.form.status"
              :dict-code="DICT_CODES.success"
              placeholder="请选择"
              clearable
              class="w-37.5!"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :icon="useRenderIcon('ri:search-line')"
              :loading="loginTab.loading"
              @click="loginTab.onSearch"
            >
              搜索
            </el-button>
            <el-button
              :icon="useRenderIcon(Refresh)"
              @click="loginTab.resetForm(loginFormRef)"
            >
              重置
            </el-button>
          </el-form-item>
        </el-form>
        <PureTableBar
          title="登录日志"
          :columns="loginTab.columns"
          @refresh="loginTab.onSearch"
        >
          <template v-slot="{ size, dynamicColumns }">
            <pure-table
              align-whole="center"
              :loading="loginTab.loading"
              :size="size"
              adaptive
              :adaptiveConfig="{ offsetBottom: 108 }"
              :data="loginTab.dataList"
              :columns="dynamicColumns"
              :pagination="{ ...loginTab.pagination, size }"
              :header-cell-style="{
                background: 'var(--el-fill-color-light)',
                color: 'var(--el-text-color-primary)'
              }"
              @page-size-change="loginTab.handleSizeChange"
              @page-current-change="loginTab.handleCurrentChange"
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
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </el-tab-pane>
      <!-- lazy:首次激活时才渲染,保证表格在可见状态下计算自适应高度(隐藏态 top=0 会撑大页面) -->
      <el-tab-pane
        v-if="hasPerms('log:operate:page')"
        label="操作日志"
        name="operate"
        lazy
      >
        <el-form
          ref="operateFormRef"
          :inline="true"
          :model="operateTab.form"
          class="search-form bg-bg_color w-full pl-8 pt-3 overflow-auto"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="operateTab.form.username"
              placeholder="请输入用户名"
              clearable
              class="w-37.5!"
            />
          </el-form-item>
          <el-form-item label="操作状态" prop="status">
            <DictSelect
              v-model="operateTab.form.status"
              :dict-code="DICT_CODES.success"
              placeholder="请选择"
              clearable
              class="w-37.5!"
            />
          </el-form-item>
          <el-form-item label="操作类型" prop="logTypes">
            <el-select
              v-model="operateTab.form.logTypes"
              placeholder="请选择"
              clearable
              multiple
              collapse-tags
              :max-collapse-tags="3"
              class="w-70!"
            >
              <el-option
                v-for="item in operateTab.logTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :icon="useRenderIcon('ri:search-line')"
              :loading="operateTab.loading"
              @click="operateTab.onSearch"
            >
              搜索
            </el-button>
            <el-button
              :icon="useRenderIcon(Refresh)"
              @click="operateTab.resetForm(operateFormRef)"
            >
              重置
            </el-button>
          </el-form-item>
        </el-form>
        <PureTableBar
          title="操作日志"
          :columns="operateTab.columns"
          @refresh="operateTab.onSearch"
        >
          <template v-slot="{ size, dynamicColumns }">
            <pure-table
              align-whole="center"
              :loading="operateTab.loading"
              :size="size"
              adaptive
              :adaptiveConfig="{ offsetBottom: 108 }"
              :data="operateTab.dataList"
              :columns="dynamicColumns"
              :pagination="{ ...operateTab.pagination, size }"
              :header-cell-style="{
                background: 'var(--el-fill-color-light)',
                color: 'var(--el-text-color-primary)'
              }"
              @page-size-change="operateTab.handleSizeChange"
              @page-current-change="operateTab.handleCurrentChange"
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
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </el-tab-pane>
    </el-tabs>

    <!-- 日志详情弹窗:请求参数/响应结果深色代码块 + 复制(对齐缓存监控详情) -->
    <el-dialog
      v-model="detailVisible"
      :title="`日志详情：${detail?.username ?? ''} ${detail?.createTime ?? ''}`"
      width="720px"
    >
      <div class="detail-section">
        <p class="detail-label">请求参数</p>
        <div
          v-if="detail?.param == null || detail?.param === ''"
          class="py-2 text-center"
        >
          <el-tag type="info" effect="light">无请求参数记录</el-tag>
        </div>
        <ReCodeBlock
          v-else
          :code="prettyJson(detail?.param)"
          label="JSON"
          :max-height="320"
        />
      </div>
      <div class="detail-section">
        <p class="detail-label">响应结果</p>
        <div
          v-if="detail?.result == null || detail?.result === ''"
          class="py-2 text-center"
        >
          <el-tag type="info" effect="light">无响应结果记录</el-tag>
        </div>
        <ReCodeBlock
          v-else
          :code="prettyJson(detail?.result)"
          label="JSON"
          :max-height="320"
        />
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
</style>
