<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, ref, watch } from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
// v3 将 BubbleMenu 拆分到 menus 子路径导出
import { BubbleMenu } from "@tiptap/vue-3/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { uploadFile } from "@/api/file";
import { message } from "@/utils/message";

/**
 * Tiptap 富文本编辑器(点点滴滴文章正文):
 * v-model 双向绑定 HTML;图片经 /sys/file/upload/markdown 上传为站内资源;
 * v3 StarterKit 内置 Link;BubbleMenu 为选中即浮现的行内标记条。
 * 工具栏为内联 SVG 线描图标(与门户图标风格统一),active 态浅底高亮。
 */
const props = withDefaults(
  defineProps<{
    /** 富文本 HTML 内容 */
    modelValue?: string;
    /** 占位提示 */
    placeholder?: string;
  }>(),
  {
    modelValue: "",
    placeholder: "记录今天的小事…"
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const fileInputRef = ref<HTMLInputElement>();

/** 上传中防抖:图片按钮置灰避免并发上传重复插入 */
const uploading = ref(false);

/** 图片链接判定:http(s) 地址且以常见图片后缀结尾(粘贴时自动转为图片节点) */
const IMAGE_URL_PATTERN = /^https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg)$/i;

/** 字数统计与空态(工具栏右侧反馈 + 空态占位渲染) */
const charCount = ref(0);
const isEmpty = ref(true);

/** Editor 实例以 shallowRef 持有:实例自身不可被深层响应式代理 */
const editor = shallowRef(
  new Editor({
    content: props.modelValue || "",
    extensions: [
      StarterKit.configure({
        // 标题层级收敛为 h2/h3,与门户文章排版对齐
        heading: { levels: [2, 3] },
        // v3 StarterKit 内置 Link:站内编辑场景禁止点击跳转,避免误触离开编辑态
        link: { openOnClick: false }
      }),
      Image.configure({ inline: false, allowBase64: false })
    ],
    editorProps: {
      attributes: {
        class: "rich-editor-content",
        "aria-label": props.placeholder,
        "data-placeholder": props.placeholder
      },
      // 粘贴纯文本图片链接时直接转为图片节点;含图 HTML 与普通文本走默认粘贴处理
      handlePaste: (_view, event) => {
        const text = event.clipboardData?.getData("text/plain")?.trim() ?? "";
        if (!IMAGE_URL_PATTERN.test(text)) {
          return false;
        }
        editor.value.chain().focus().setImage({ src: text }).run();
        return true;
      }
    },
    onCreate: ({ editor }) => syncState(editor),
    onUpdate: ({ editor }) => {
      syncState(editor);
      // v-model 契约:必须以 update:modelValue 事件回传,form 校验才能取到值
      emit("update:modelValue", editor.isEmpty ? "" : editor.getHTML());
    },
    // 选区变化(含应用链接后的焦点回归)时退出气泡的链接输入模式
    onSelectionUpdate: () => resetBubbleLinkMode()
  })
);

/** 同步字数与空态(创建/更新/回填时调用;结构化入参兼容 core 与 vue-3 两类 Editor 实例) */
function syncState(instance: { getText: () => string; isEmpty: boolean }) {
  charCount.value = instance.getText().length;
  isEmpty.value = instance.isEmpty;
}

/** 外部值回填:与内部 HTML 一致时跳过,防止光标跳动 */
watch(
  () => props.modelValue,
  value => {
    if (value !== editor.value.getHTML()) {
      editor.value.commands.setContent(value || "");
      syncState(editor.value);
    }
  }
);

onBeforeUnmount(() => {
  editor.value.destroy();
});

function pickImage() {
  fileInputRef.value?.click();
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ""; // 允许重复选择同一文件
  if (!file || (file instanceof File && !file.type.startsWith("image/"))) {
    return;
  }
  try {
    uploading.value = true;
    const res = await uploadFile("markdown", file, file.name);
    editor.value
      .chain()
      .focus()
      .setImage({ src: res.data.url, alt: file.name })
      .run();
  } catch {
    message("配图上传失败,请重试", { type: "error" });
  } finally {
    uploading.value = false;
  }
}

/** 工具栏按钮定义:icon 为内联 SVG 内部标记(24 viewBox 线描,stroke currentColor) */
type ToolItem = {
  key: string;
  title: string;
  icon?: string;
  /** 文字按钮(标题层级等语义按钮) */
  text?: string;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  run: () => void;
};

/** 链接状态:顶部气泡与选区气泡共用(地址回填 / 选区是否处于链接内) */
const linkPopoverVisible = ref(false);
const linkUrl = ref("");
const editingLink = ref(false);

/** 选区气泡的链接输入模式:气泡内就地取址,不嵌套弹层 */
const bubbleLinkMode = ref(false);

/** 回填:读取选区既有链接地址与链接态 */
function fillLinkState() {
  linkUrl.value = (editor.value.getAttributes("link").href as string) ?? "";
  editingLink.value = editor.value.isActive("link");
}

/** 顶部链接弹层打开时回填 */
function onLinkPopoverShow() {
  fillLinkState();
}

/** 气泡链接按钮:回填选区既有链接并切到输入视图 */
function openBubbleLink() {
  fillLinkState();
  bubbleLinkMode.value = true;
}

/** 选区变化时退出链接输入模式(应用/移除后的 focus 亦会触发,自然回工具视图) */
function resetBubbleLinkMode() {
  bubbleLinkMode.value = false;
}

/** 应用链接:空值视为移除;焦点回编辑器后扩展选区到整个链接再设置 */
function applyLink() {
  const url = linkUrl.value.trim();
  if (!url) {
    removeLink();
    return;
  }
  if (/\s/.test(url)) {
    message("链接地址不能包含空格", { type: "warning" });
    return;
  }
  editor.value
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: url })
    .run();
  linkPopoverVisible.value = false;
  bubbleLinkMode.value = false;
}

function removeLink() {
  editor.value.chain().focus().extendMarkRange("link").unsetLink().run();
  linkPopoverVisible.value = false;
  bubbleLinkMode.value = false;
}

/** 工具栏分组(数据驱动渲染:撤销重做 | 标题 | 行内格式 | 块级 | 插入) */
const toolGroups = computed<ToolItem[][]>(() => [
  [
    {
      key: "undo",
      title: "撤销",
      icon: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11"/>',
      disabled: !editor.value.can().undo(),
      run: () => editor.value.chain().focus().undo().run()
    },
    {
      key: "redo",
      title: "重做",
      icon: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0-5.5 5.5 5.5 5.5 0 0 0 5.5 5.5H13"/>',
      disabled: !editor.value.can().redo(),
      run: () => editor.value.chain().focus().redo().run()
    }
  ],
  [
    {
      key: "h2",
      title: "二级标题",
      text: "H2",
      active: editor.value.isActive("heading", { level: 2 }),
      run: () => editor.value.chain().focus().toggleHeading({ level: 2 }).run()
    },
    {
      key: "h3",
      title: "三级标题",
      text: "H3",
      active: editor.value.isActive("heading", { level: 3 }),
      run: () => editor.value.chain().focus().toggleHeading({ level: 3 }).run()
    }
  ],
  [
    {
      key: "bold",
      title: "加粗",
      icon: '<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8z"/>',
      active: editor.value.isActive("bold"),
      run: () => editor.value.chain().focus().toggleBold().run()
    },
    {
      key: "italic",
      title: "斜体",
      icon: '<path d="M19 4h-9"/><path d="M14 20H5"/><path d="M15 4 9 20"/>',
      active: editor.value.isActive("italic"),
      run: () => editor.value.chain().focus().toggleItalic().run()
    },
    {
      key: "strike",
      title: "删除线",
      icon: '<path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><path d="M4 12h16"/>',
      active: editor.value.isActive("strike"),
      run: () => editor.value.chain().focus().toggleStrike().run()
    },
    {
      key: "underline",
      title: "下划线",
      icon: '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 20h16"/>',
      active: editor.value.isActive("underline"),
      run: () => editor.value.chain().focus().toggleUnderline().run()
    },
    {
      key: "code",
      title: "行内代码",
      icon: '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
      active: editor.value.isActive("code"),
      run: () => editor.value.chain().focus().toggleCode().run()
    }
  ],
  [
    {
      key: "quote",
      title: "引用",
      icon: '<path d="M4 4v16"/><path d="M9 7h11"/><path d="M9 12h8"/>',
      active: editor.value.isActive("blockquote"),
      run: () => editor.value.chain().focus().toggleBlockquote().run()
    },
    {
      key: "bulletList",
      title: "无序列表",
      icon: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
      active: editor.value.isActive("bulletList"),
      run: () => editor.value.chain().focus().toggleBulletList().run()
    },
    {
      key: "orderedList",
      title: "有序列表",
      icon: '<path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
      active: editor.value.isActive("orderedList"),
      run: () => editor.value.chain().focus().toggleOrderedList().run()
    },
    {
      key: "hr",
      title: "分割线",
      icon: '<path d="M5 12h14"/>',
      run: () => editor.value.chain().focus().setHorizontalRule().run()
    }
  ],
  [
    {
      key: "link",
      title: "链接",
      icon: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
      active: editor.value.isActive("link"),
      run: () => {
        linkPopoverVisible.value = true;
      }
    },
    {
      key: "image",
      title: "插入配图(自动上传)",
      icon: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
      loading: uploading.value,
      run: pickImage
    }
  ]
]);

/** 气泡工具集:与顶部工具栏同源;排除撤销/重做与配图(全局或对话框类操作固定在顶部),链接改为气泡内就地输入 */
const bubbleTools = computed<ToolItem[]>(() =>
  toolGroups.value
    .flat()
    .map(tool =>
      tool.key === "link" ? { ...tool, run: openBubbleLink } : tool
    )
    .filter(tool => !["image", "undo", "redo"].includes(tool.key))
);
</script>

<template>
  <div class="rich-editor" :class="{ 'is-empty': isEmpty }">
    <!-- 工具栏:线描图标分组,active 浅底高亮,行尾字数统计 -->
    <div class="rich-editor-toolbar" role="toolbar" aria-label="富文本工具栏">
      <div
        v-for="(group, gi) in toolGroups"
        :key="gi"
        class="rich-editor-group"
      >
        <template v-for="tool in group" :key="tool.key">
          <!-- 链接:气泡弹层取址(替代原生 prompt),打开时回填选区既有链接 -->
          <el-popover
            v-if="tool.key === 'link'"
            v-model:visible="linkPopoverVisible"
            trigger="click"
            placement="top-start"
            :width="320"
            @show="onLinkPopoverShow"
          >
            <template #reference>
              <button
                type="button"
                class="rich-editor-btn"
                :class="{ 'is-active': tool.active }"
                aria-label="链接"
              >
                <svg
                  class="rich-editor-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  v-html="tool.icon"
                />
              </button>
            </template>
            <div class="rich-link-form" @keydown.enter.prevent="applyLink">
              <el-input
                v-model="linkUrl"
                size="small"
                clearable
                placeholder="https://… 或站内路径"
              />
              <div class="rich-link-actions">
                <el-button
                  v-if="editingLink"
                  size="small"
                  text
                  type="danger"
                  @click="removeLink"
                >
                  移除链接
                </el-button>
                <el-button size="small" type="primary" @click="applyLink">
                  确定
                </el-button>
              </div>
            </div>
          </el-popover>
          <el-tooltip
            v-else
            :content="tool.title"
            placement="top"
            :show-after="300"
          >
            <button
              type="button"
              class="rich-editor-btn"
              :class="{ 'is-active': tool.active }"
              :disabled="tool.disabled || tool.loading"
              :aria-label="tool.title"
              @click="tool.run"
            >
              <svg
                v-if="tool.icon"
                class="rich-editor-icon"
                :class="{ 'is-loading': tool.loading }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                v-html="tool.icon"
              />
              <span v-else class="rich-editor-btn-text">{{ tool.text }}</span>
            </button>
          </el-tooltip>
        </template>
      </div>
      <span class="rich-editor-count">{{ charCount }} 字</span>
    </div>

    <!-- 选区浮动标记条:选中文字即浮现,承载全部格式工具;链接切换为气泡内就地输入 -->
    <BubbleMenu :editor="editor">
      <!-- 链接输入模式:气泡内行内取址,不嵌套弹层 -->
      <div v-if="bubbleLinkMode" class="rich-bubble rich-bubble-link">
        <el-input
          v-model="linkUrl"
          size="small"
          clearable
          placeholder="https://… 或站内路径"
          class="rich-bubble-link-input"
          @keydown.enter.prevent="applyLink"
        />
        <el-button size="small" type="primary" @click="applyLink">
          确定
        </el-button>
        <el-button
          v-if="editingLink"
          size="small"
          text
          type="danger"
          @click="removeLink"
        >
          移除
        </el-button>
      </div>
      <div v-else class="rich-bubble" role="toolbar" aria-label="选区工具">
        <el-tooltip
          v-for="tool in bubbleTools"
          :key="tool.key"
          :content="tool.title"
          placement="top"
          :show-after="300"
        >
          <button
            type="button"
            class="rich-editor-btn"
            :class="{ 'is-active': tool.active }"
            :disabled="tool.disabled || tool.loading"
            :aria-label="tool.title"
            @click="tool.run"
          >
            <svg
              v-if="tool.icon"
              class="rich-editor-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              v-html="tool.icon"
            />
            <span v-else class="rich-editor-btn-text">{{ tool.text }}</span>
          </button>
        </el-tooltip>
      </div>
    </BubbleMenu>

    <EditorContent :editor="editor" class="rich-editor-body" />

    <!-- 隐藏的图片选择器:工具栏「插入配图」触发 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />
  </div>
</template>

<style lang="scss">
// 选区浮动标记条(复用工具栏按钮皮肤,浮层加边框与投影);超宽时自动换行
.rich-bubble {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  align-items: center;
  max-width: 420px;
  padding: 3px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  box-shadow: var(--el-box-shadow-light);
}

.rich-bubble-divider {
  width: 1px;
  height: 16px;
  margin: 0 3px;
  background: var(--el-border-color);
}

// 链接输入模式:输入框主导,按钮贴右
.rich-bubble-link {
  gap: 6px;

  .rich-bubble-link-input {
    width: 240px;
  }
}

.rich-editor {
  width: 100%;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  // 焦点态对齐 el-input:主题色边框 + 柔和外圈
  &:focus-within {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
  }
}

.rich-editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  padding: 5px 8px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base) var(--el-border-radius-base) 0 0;
}

.rich-editor-group {
  display: flex;
  gap: 2px;
  align-items: center;

  // 组间分隔线(首组除外)
  & + .rich-editor-group {
    padding-left: 6px;
    margin-left: 4px;
    border-left: 1px solid var(--el-border-color-lighter);
  }
}

.rich-editor-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    color: var(--el-text-color-primary);
    background: var(--el-fill-color-darker);
  }

  &.is-active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-8);
  }

  &:disabled {
    color: var(--el-text-color-placeholder);
    cursor: not-allowed;
    background: transparent;
  }

  svg {
    width: 16px;
    height: 16px;
  }

  // 上传中:图标旋转表达进行态
  svg.is-loading {
    animation: rich-editor-spin 1s linear infinite;
  }
}

.rich-editor-btn-text {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.rich-editor-count {
  margin-left: auto;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-placeholder);
}

// 链接气泡表单:输入 + 移除/确定,回车即提交
.rich-link-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rich-link-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;

  // 相邻按钮清除 EP 默认左侧间距,保持右对齐节奏
  .el-button + .el-button {
    margin-left: 0;
  }
}

.rich-editor-body {
  .rich-editor-content {
    min-height: 240px;
    max-height: 420px;
    padding: 12px 14px;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.8;
    overflow-wrap: anywhere;
    outline: none;

    // 空态占位:编辑器无内容时以提示语占位(经 data-placeholder 下发;空态标志挂编辑器根节点)
    .rich-editor.is-empty .rich-editor-content::before {
      float: left;
      height: 0;
      color: var(--el-text-color-placeholder);
      pointer-events: none;
      content: attr(data-placeholder);
    }

    img {
      max-width: 100%;
      border-radius: var(--el-border-radius-base);
    }

    blockquote {
      padding-left: 12px;
      margin: 8px 0;
      color: var(--el-text-color-secondary);
      border-left: 3px solid var(--el-color-primary-light-5);
    }

    p {
      margin: 4px 0;
    }

    h2,
    h3 {
      margin: 14px 0 6px;
      font-weight: 600;
      line-height: 1.4;
    }

    h2 {
      font-size: 1.25em;
    }

    h3 {
      font-size: 1.1em;
    }

    ul,
    ol {
      padding-left: 24px;
    }

    li {
      margin: 2px 0;
    }

    hr {
      margin: 12px 0;
      border: none;
      border-top: 1px solid var(--el-border-color-lighter);
    }

    a {
      color: var(--el-color-primary);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    // 行内代码:浅底 + 等宽字体,与正文明确区隔
    code {
      padding: 2px 6px;
      font-family: var(--el-font-family-mono, ui-monospace, monospace);
      font-size: 0.92em;
      background: var(--el-fill-color-darker);
      border-radius: 4px;
    }
  }
}

@keyframes rich-editor-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
