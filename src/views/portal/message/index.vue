<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { getMessage, sendMessage, type MessageItem } from "@/api/portal";
import { message } from "@/utils/message";
import { fallbackAvatar, notifyFallbackAvatar } from "@/utils/avatar";
import { fetchQqInfo, QQ_PATTERN } from "@/utils/qqInfo";
import { usePagedList } from "@/hooks/usePagedList";
import PortalLoadMore from "@/components/PortalLoadMore/index.vue";
import PortalSkeleton from "@/components/PortalSkeleton/index.vue";
import reveal from "@/directives/reveal";

defineOptions({ name: "PortalMessage" });

const vReveal = reveal;

/** 门户「加载更多」分页加载(每页 6 条);快照头像缺失时提示使用默认头像 */
const { items, totalRow, loading, hasMore, loadMore, reset } =
  usePagedList<MessageItem>(getMessage, {
    onLoaded: records => {
      if (records.some(record => !record.avatar)) {
        notifyFallbackAvatar();
      }
    }
  });

/** 提交留言后重载列表:清空旧内容并重建流加载 */
function reloadMessages() {
  reset();
}

/** 留言表单:校验文案逐字保留原站 */
const form = reactive({ qq: "", name: "", text: "" });
const submitting = ref(false);
const submitText = ref("投递留言");
/** 表单级提交结果状态行(role=status + aria-live,读屏器即时播报) */
const formStatus = ref("");

/** 列表头像地址:留言快照 avatar 非空用之,否则本地兜底图 */
function listAvatarSrc(m: MessageItem): string {
  return m.avatar || fallbackAvatar;
}

/** 列表头像加载失败:置空快照地址,回退本地兜底图 */
function onListAvatarError(m: MessageItem) {
  m.avatar = "";
  notifyFallbackAvatar();
}

/** qq-info 返回的头像地址(后端已降级,恒非空;后端 qq-avatar 未配置时为空) */
const previewQqAvatar = ref("");

/** 表单预览头像地址:空态/工具头像失败时展示本地兜底图,工具链接可展示则直接展示 */
const previewAvatar = computed(() => previewQqAvatar.value || fallbackAvatar);

/** 表单预览头像加载失败:清空工具返回链接,回落到空态/本地生成头像 */
function onPreviewError() {
  previewQqAvatar.value = "";
}

/** 请求序号:仅采纳最后一次 qq-info 请求结果,避免快速切换 QQ 时旧响应覆盖 */
let qqInfoSeq = 0;

/**
 * 拉取 QQ 信息并回填表单。
 * <p>
 * 头像取 qq-info 返回值(后端已降级,地址恒非空);昵称非空则填充昵称输入框,为空则提示手动输入。
 */
async function applyQqInfo(qq: string) {
  const seq = ++qqInfoSeq;
  const { avatarUrl, nickname } = await fetchQqInfo(qq);
  if (seq !== qqInfoSeq) return;
  previewQqAvatar.value = avatarUrl;
  const name = nickname.trim();
  if (name) {
    form.name = name;
  } else {
    message("请手动填写昵称");
  }
}

/** QQ 输入过滤:仅保留数字,最长 12 位 */
function onQqInput() {
  form.qq = form.qq.replace(/\D/g, "").slice(0, 12);
}

/** QQ 失焦:非空拉取 QQ 信息(头像 + 昵称回填);为空则清空回填昵称 */
function onQqBlur() {
  const qq = form.qq.trim();
  if (!qq) {
    previewQqAvatar.value = "";
    form.name = "";
    return;
  }
  previewQqAvatar.value = "";
  applyQqInfo(qq);
}

async function submit() {
  if (submitting.value) return;
  if (form.qq.length === 0) {
    message("请填写QQ号码！", { type: "warning" });
    return;
  }
  if (!QQ_PATTERN.test(form.qq)) {
    message("您的QQ号码格式错误 请输入由6-12位的数字组成的QQ号码！", {
      type: "warning"
    });
    return;
  }
  if (["123456", "100000", "1234567"].includes(form.qq)) {
    message("我想也许这并不是您的QQ号码...", { type: "warning" });
    return;
  }
  if (!form.name.trim()) {
    message("请填写您的昵称！", { type: "warning" });
    return;
  }
  if (!form.text.trim()) {
    message("请填写您要留言的内容！", { type: "warning" });
    return;
  }
  if (form.text.length <= 2) {
    message("请填写两个字符以上的内容！", { type: "warning" });
    return;
  }
  if (/^[0-9]+$/.test(form.text)) {
    message("内容为纯数字 已被拦截！", { type: "warning" });
    return;
  }
  if (new RegExp("[操垃圾傻逼妈]").test(form.text)) {
    message(
      "您输入的内容是违禁词 请注意您的发言不文明的留言会被管理员拉进小黑屋喔",
      { type: "warning" }
    );
    return;
  }

  submitting.value = true;
  submitText.value = "留言投递中...";
  formStatus.value = "";
  try {
    await sendMessage({ qq: form.qq, name: form.name, text: form.text });
    message("留言提交成功,审核通过后上墙！", { type: "success" });
    submitText.value = "留言成功";
    formStatus.value = "留言提交成功,审核通过后就会出现在明信片墙上。";
    reloadMessages();
    // 按钮置灰 5 秒后恢复(对齐原站 submitMessage);句柄随卸载清理
    submitTimer = setTimeout(() => {
      submitting.value = false;
      submitText.value = "投递留言";
    }, 5000);
  } catch {
    submitting.value = false;
    submitText.value = "投递留言";
    formStatus.value = "留言投递失败,请稍后重试。";
  }
}

/** 防连点恢复定时器:组件卸载时清理,避免卸载后仍写响应式状态 */
let submitTimer: ReturnType<typeof setTimeout> | undefined;
onUnmounted(() => clearTimeout(submitTimer));

onMounted(() => loadMore());
</script>

<template>
  <div class="am-page">
    <!-- 章节题头 -->
    <header class="am-section-head">
      <p class="am-section-kicker">Sweet Words · 甜甜的话</p>
      <h1 class="am-section-title">访客留言簿</h1>
      <p class="msg-intro">
        已收到 <b class="msg-count">{{ totalRow }}</b> 条祝福留言
      </p>
    </header>

    <!-- 写明信片:置顶表单卡(字段均配可见 label,占位符仅为示例) -->
    <form class="postcard-form reveal" @submit.prevent="submit">
      <div class="postcard-head">
        <img
          :src="previewAvatar"
          alt="留言头像预览"
          class="postcard-avatar"
          @error="onPreviewError"
        />
        <div class="postcard-fields">
          <div class="postcard-field">
            <label class="postcard-label" for="msg-qq">QQ 号码</label>
            <input
              id="msg-qq"
              v-model="form.qq"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              placeholder="如 123456789"
              maxlength="12"
              aria-describedby="msg-qq-hint"
              @input="onQqInput"
              @blur="onQqBlur"
            />
            <span id="msg-qq-hint" class="postcard-hint">
              填写 QQ 自动带出头像与昵称
            </span>
          </div>
          <div class="postcard-field">
            <label class="postcard-label" for="msg-name">昵称</label>
            <input
              id="msg-name"
              v-model="form.name"
              type="text"
              autocomplete="nickname"
              placeholder="QQ 自动带出,也可手填"
            />
          </div>
        </div>
      </div>
      <div class="postcard-field">
        <label class="postcard-label" for="msg-text">留言内容</label>
        <textarea
          id="msg-text"
          v-model="form.text"
          rows="5"
          maxlength="1024"
          placeholder="写一张明信片给我们…"
          aria-describedby="msg-text-count"
        />
      </div>
      <div class="postcard-actions">
        <span id="msg-text-count" class="postcard-count">
          {{ form.text.length }} / 1024
        </span>
        <button class="postcard-submit" type="submit" :disabled="submitting">
          <span v-if="submitting" class="postcard-spinner" aria-hidden="true" />
          {{ submitText }}
        </button>
      </div>
      <p v-if="formStatus" class="postcard-status" role="status">
        {{ formStatus }}
      </p>
    </form>

    <!-- 明信片墙 -->
    <div class="postcard-wall">
      <article
        v-for="(m, i) in items"
        :key="`${m.date}-${i}`"
        v-reveal="(i % 3 || 0) * 0.06"
        class="postcard reveal"
        :style="{ '--tilt': `${((i % 3) - 1) * 0.8}deg` }"
      >
        <header class="postcard-meta">
          <time class="postcard-date">{{ m.date }}</time>
          <span v-if="m.location" class="postcard-region">
            寄自{{ m.location }}
          </span>
        </header>
        <p class="postcard-text">{{ m.content }}</p>
        <footer class="postcard-sign">
          <img :src="listAvatarSrc(m)" alt="" @error="onListAvatarError(m)" />
          <span class="postcard-name">{{ m.nickname || "访客" }}</span>
          <b class="postcard-no">#{{ i + 1 }}</b>
        </footer>
      </article>
    </div>

    <!-- 首屏加载:杂志线框骨架屏(>300ms 可感知) -->
    <PortalSkeleton v-if="loading && items.length === 0" :rows="2" />

    <div v-if="!loading && items.length === 0" class="am-empty">
      还没有明信片,来投递第一张吧~
    </div>

    <!-- 「加载更多」按钮(门户列表页共用组件) -->
    <PortalLoadMore :loading="loading" :has-more="hasMore" @load="loadMore" />
  </div>
</template>

<style scoped>
/* ---------------- 写明信片表单 ---------------- */
.postcard-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 720px;
  padding: var(--am-space-md) 0 var(--am-space-lg);
}

.postcard-head {
  display: flex;
  gap: 14px;
  align-items: center;
}

.postcard-avatar {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border: 1px solid var(--am-line);
  border-radius: 50%;
}

.postcard-fields {
  display: flex;
  flex: 1;
  gap: 10px;
}

/* 字段组:可见 label + 输入 + 提示,读屏与键鼠用户共用同一入口 */
.postcard-field {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.postcard-label {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.postcard-hint {
  font-size: var(--am-text-xs);
  color: var(--am-ink-tertiary);
}

/* 提交结果状态行:role=status,读屏器即时播报 */
.postcard-status {
  margin: 0;
  font-size: var(--am-text-sm);
  color: var(--am-rose);
}

/* 提交中 spinner:内联反馈,替代纯文字等待 */
.postcard-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  vertical-align: -2px;
  border: 2px solid currentcolor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: postcard-spin 0.7s linear infinite;
}

@keyframes postcard-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .postcard-spinner {
    animation-duration: 2s;
  }
}

.postcard-fields input,
.postcard-form textarea {
  width: 100%;
  padding: 12px 14px;
  font-family: inherit;
  font-size: var(--am-text-sm);
  color: var(--am-ink);
  background: var(--am-card);
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
}

.postcard-fields input:focus,
.postcard-form textarea:focus {
  outline: 2px solid var(--am-rose);
  outline-offset: 1px;
  border-color: transparent;
}

.postcard-form textarea {
  line-height: 1.7;
  resize: vertical;
}

.postcard-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.postcard-count {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
}

.postcard-submit {
  padding: 12px 28px;
  font-size: var(--am-text-sm);
  color: var(--am-cta-text);
  cursor: pointer;
  background: var(--am-cta);
  border: 0;
  border-radius: var(--am-radius-pill);
  transition:
    opacity var(--am-duration) ease,
    transform var(--am-duration-fast) var(--am-ease),
    box-shadow var(--am-duration) ease;
}

.postcard-submit:hover:not(:disabled) {
  box-shadow: var(--am-shadow-hover);
  transform: translateY(-2px);
}

/* 按压反馈:缩到 97% 表达「按下了」,不改布局边界 */
.postcard-submit:active:not(:disabled) {
  box-shadow: none;
  transform: scale(0.97);
}

.postcard-submit:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

/* ---------------- 明信片墙 ---------------- */
.postcard-wall {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--am-space-md);
  padding: var(--am-space-md) 0;
}

/* 明信片:纸感卡 + 轻微随机旋转(--tilt 行内注入);
 * 悬浮回正抬升 + 投下纸影,位移 4px 内保持「反馈而非运动」 */
.postcard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: var(--am-space-md);
  background: var(--am-card);
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
  transform: rotate(var(--tilt, 0deg));
  transition:
    transform var(--am-duration) var(--am-ease),
    box-shadow var(--am-duration) ease;
}

.postcard:hover {
  box-shadow: var(--am-shadow-hover);
  transform: rotate(0deg) translateY(-4px);
}

.postcard-meta {
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--am-line);
}

.postcard-date {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
}

.postcard-sign {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: auto;
}

.postcard-sign img {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 50%;
}

.postcard-name {
  font-size: var(--am-text-sm);
  color: var(--am-ink);
}

.postcard-no {
  margin-left: auto;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-rose);
}

@media (width <= 640px) {
  .postcard-wall {
    grid-template-columns: 1fr;
  }

  .postcard-fields {
    flex-direction: column;
  }
}
</style>
