<script setup lang="ts">
import { onMounted, ref } from "vue";
import { hasPerms } from "@/utils/auth";
import { useLogPage, useLogDetail, LOG_TYPE_OPTIONS } from "./hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Refresh from "~icons/ep/refresh";
import CopyDocument from "~icons/ep/copy-document";
import Check from "~icons/ep/check";

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

const loginTab = useLogPage("login");
const operateTab = useLogPage("operate");

/** 日志详情弹窗(两 Tab 共用) */
const { detail, detailVisible, copiedBlock, openDetail, copyBlock, prettyJson } =
  useLogDetail();

/** Tab 懒加载:首次激活时才请求对应日志,避免不可见页签的无谓请求 */
const loaded: Record<string, boolean> = {};

function handleTabChange(name: string) {
  if (!name || loaded[name]) return;
  loaded[name] = true;
  (name === "login" ? loginTab : operateTab).onSearch();
}

/** 进入页面即加载默认激活 Tab(登录日志);其余 Tab 保持懒加载 */
onMounted(() => {
  handleTabChange(activeTab.value);
});
</script>

<template>
  <div class="main">
    <el-tabs v-model="activeTab" class="bg-bg_color px-3! pt-1!" @tab-change="handleTabChange">
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
            <el-select
              v-model="loginTab.form.status"
              placeholder="请选择"
              clearable
              class="w-37.5!"
            >
              <el-option label="成功" :value="1" />
              <el-option label="失败" :value="0" />
            </el-select>
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
        <PureTableBar title="登录日志" :columns="loginTab.columns" @refresh="loginTab.onSearch">
          <template v-slot="{ size, dynamicColumns }">
            <pure-table
              align-whole="center"
              table-layout="auto"
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
      <el-tab-pane
        v-if="hasPerms('log:operate:page')"
        label="操作日志"
        name="operate"
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
            <el-select
              v-model="operateTab.form.status"
              placeholder="请选择"
              clearable
              class="w-37.5!"
            >
              <el-option label="成功" :value="1" />
              <el-option label="失败" :value="0" />
            </el-select>
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
                v-for="item in LOG_TYPE_OPTIONS"
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
        <PureTableBar title="操作日志" :columns="operateTab.columns" @refresh="operateTab.onSearch">
          <template v-slot="{ size, dynamicColumns }">
            <pure-table
              align-whole="center"
              table-layout="auto"
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
        <div v-else class="code-block">
          <div class="code-header">
            <span class="code-dot" />
            <span class="text-xs text-[rgba(220,220,242,0.6)]">JSON</span>
            <el-button
              text
              size="small"
              class="ml-auto!"
              :style="{
                color:
                  copiedBlock === 'param'
                    ? 'var(--el-color-success)'
                    : 'rgba(220,220,242,0.8)'
              }"
              @click="copyBlock('param')"
            >
              <el-icon class="mr-1">
                <component :is="copiedBlock === 'param' ? Check : CopyDocument" />
              </el-icon>
              {{ copiedBlock === "param" ? "已复制" : "复制" }}
            </el-button>
          </div>
          <pre class="code-body">{{ prettyJson(detail?.param) }}</pre>
        </div>
      </div>
      <div class="detail-section">
        <p class="detail-label">响应结果</p>
        <div
          v-if="detail?.result == null || detail?.result === ''"
          class="py-2 text-center"
        >
          <el-tag type="info" effect="light">无响应结果记录</el-tag>
        </div>
        <div v-else class="code-block">
          <div class="code-header">
            <span class="code-dot" />
            <span class="text-xs text-[rgba(220,220,242,0.6)]">JSON</span>
            <el-button
              text
              size="small"
              class="ml-auto!"
              :style="{
                color:
                  copiedBlock === 'result'
                    ? 'var(--el-color-success)'
                    : 'rgba(220,220,242,0.8)'
              }"
              @click="copyBlock('result')"
            >
              <el-icon class="mr-1">
                <component :is="copiedBlock === 'result' ? Check : CopyDocument" />
              </el-icon>
              {{ copiedBlock === "result" ? "已复制" : "复制" }}
            </el-button>
          </div>
          <pre class="code-body">{{ prettyJson(detail?.result) }}</pre>
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
  max-height: 320px;
  padding: 12px 16px;
  margin: 0;
  overflow: auto;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
