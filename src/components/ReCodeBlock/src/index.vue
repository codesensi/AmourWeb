<script setup lang="ts">
import { ref, watch } from "vue";
import { useClipboard } from "@vueuse/core";
import { ElMessageBox } from "element-plus";
import CopyDocument from "~icons/ep/copy-document";
import Check from "~icons/ep/check";

defineOptions({ name: "ReCodeBlock" });

const props = withDefaults(
  defineProps<{
    /** 展示并复制的内容(纯文本,经文本插值渲染,不渲染 HTML 防注入) */
    code: string;
    /** 右上角内容类型标签,如 JSON / URL */
    label?: string;
    /** 内容区最大高度(px),超出内滚;缺省不限制 */
    maxHeight?: number;
  }>(),
  { label: "JSON" }
);

/** 复制态,1.5s 后还原按钮态 */
const copied = ref(false);
/** legacy 模式:非安全上下文(http)自动降级 execCommand 复制 */
const { copy: copyText } = useClipboard({ legacy: true });

/** 内容变化时还原复制态(详情弹窗切换展示对象) */
watch(
  () => props.code,
  () => {
    copied.value = false;
  }
);

/** 复制内容到剪贴板,1.5s 后还原按钮态,失败时降级提示 */
async function handleCopy() {
  try {
    await copyText(props.code);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch {
    ElMessageBox.alert("复制失败,请手动选择文本复制", "系统提示");
  }
}
</script>

<template>
  <div class="code-block">
    <div class="code-header">
      <span class="code-dot" />
      <span class="text-xs text-[rgba(220,220,242,0.6)]">{{ label }}</span>
      <el-button
        text
        size="small"
        class="ml-auto!"
        :style="{
          color: copied ? 'var(--el-color-success)' : 'rgba(220,220,242,0.8)'
        }"
        @click="handleCopy"
      >
        <el-icon class="mr-1">
          <component :is="copied ? Check : CopyDocument" />
        </el-icon>
        {{ copied ? "已复制" : "复制" }}
      </el-button>
    </div>
    <pre
      class="code-body"
      :style="{
        maxHeight: maxHeight ? `${maxHeight}px` : undefined
      }"
      >{{ code }}</pre>
  </div>
</template>

<style scoped>
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
  overflow: auto;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
