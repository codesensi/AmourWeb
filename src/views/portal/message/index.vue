<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from "vue";
import {
  getMessage,
  sendMessage,
  type MessageItem
} from "@/api/portal/message";
import { message } from "@/utils/message";
import { fallbackAvatar, notifyFallbackAvatar } from "@/utils/avatar";
import { fetchQqInfo, QQ_PATTERN } from "@/utils/qq-info";
import { scrollToTop } from "@/utils/motion";
import { queryKeys } from "@/hooks/query-keys";
import { usePortalList } from "@/hooks/usePortalQuery";
import PortalLoadMore from "@/components/PortalLoadMore/index.vue";
import reveal from "@/directives/reveal";

defineOptions({ name: "PortalMessage" });

const vReveal = reveal;

/** 门户「加载更多」分页加载(每页 6 条);快照头像缺失时提示使用默认头像。
 * 留言为访客可写数据源,staleTime=0,每次激活都校验最新数据 */
const { items, totalRow, loading, hasMore, loadMore, refresh } =
  usePortalList<MessageItem>(queryKeys.message(), getMessage, {
    onLoaded: records => {
      if (records.some(record => !record.avatar)) {
        notifyFallbackAvatar();
      }
    }
  });

/** 提交留言后重载列表:失效缓存并重拉已加载的分页,回页首查看最新状态 */
function reloadMessages() {
  refresh();
  scrollToTop();
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
    <form v-reveal class="postcard-form reveal" @submit.prevent="submit">
      <div class="postcard-head">
        <img
          :src="previewAvatar"
          alt="留言头像预览"
          class="postcard-face"
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
        <!-- 邮票角标:品牌爱心 + 齿孔虚线框,呼应「寄一张明信片」的隐喻 -->
        <span class="postcard-stamp" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M12 21s-7.5-4.9-10-9.2C.4 8.6 2 5 5.5 5c2 0 3.4 1.1 4.2 2.4L12 9.6l2.3-2.2C15.1 6.1 16.5 5 18.5 5 22 5 23.6 8.6 22 11.8 19.5 16.1 12 21 12 21z"
              fill="currentColor"
            />
          </svg>
        </span>
        <header class="postcard-meta">
          <img
            :src="listAvatarSrc(m)"
            alt=""
            class="postcard-face"
            @error="onListAvatarError(m)"
          />
          <span class="postcard-name">{{ m.nickname || "访客" }}</span>
          <time class="postcard-date">{{ m.date }}</time>
          <span v-if="m.location" class="postcard-region">
            寄自{{ m.location }}
          </span>
          <b class="postcard-no">#{{ i + 1 }}</b>
        </header>
        <!-- 留言内容:卡片主角,字号与行高放大,全墨色 -->
        <p class="postcard-text">{{ m.content }}</p>
      </article>
    </div>

    <!-- 首屏加载:杂志线框骨架屏(>300ms 可感知) -->
    <el-skeleton v-if="loading && items.length === 0" :rows="2" animated />

    <div v-if="!loading && items.length === 0" class="am-empty">
      还没有明信片,来投递第一张吧~
    </div>

    <!-- 「加载更多」按钮(门户列表页共用组件) -->
    <PortalLoadMore :loading="loading" :has-more="hasMore" @load="loadMore" />
  </div>
</template>

<style scoped>
/* 留言页内容宽度:表单与明信片墙共用,加宽后仍保留明信片构图 */
.am-page {
  --postcard-width: 960px;
}

/* ---------------- 写明信片表单 ---------------- */
.postcard-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: var(--postcard-width);
  padding: var(--am-space-md) 0 var(--am-space-lg);
  margin-inline: auto;
}

.postcard-head {
  display: flex;
  gap: 14px;
  align-items: center;
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
  animation: am-spin 0.7s linear infinite;
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

/* 单栏居中:与上方表单同宽,像钉在软木板上的一列明信片 */
.postcard-wall {
  display: flex;
  flex-direction: column;
  gap: var(--am-space-md);
  width: 100%;
  max-width: var(--postcard-width);
  padding: var(--am-space-md) 0;
  margin-inline: auto;
}

/* 明信片:纸感卡 + 轻微随机旋转(--tilt 行内注入);
 * 悬浮回正抬升 + 投下纸影,位移 4px 内保持「反馈而非运动」 */
.postcard {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: var(--am-space-lg);
  background: var(--am-card);
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
  transform: rotate(var(--tilt, 0deg));
  transition:
    transform var(--am-duration) var(--am-ease),
    box-shadow var(--am-duration) ease;
}

/* 邮票角标:齿孔虚线框 + 品牌爱心(与刊名同源),微微倾斜似手贴上去的 */
.postcard-stamp {
  position: absolute;
  top: var(--am-space-md);
  right: var(--am-space-md);
  display: grid;
  place-items: center;
  width: 36px;
  height: 42px;
  color: var(--am-rose);
  background: var(--am-rose-soft);
  border: 1px dashed color-mix(in srgb, var(--am-rose) 45%, transparent);
  border-radius: 4px;
  rotate: 4deg;
  transition: transform var(--am-duration) var(--am-ease);
}

.postcard-stamp svg {
  width: 16px;
  height: 16px;
}

.postcard:hover .postcard-stamp {
  transform: scale(1.06);
}

.postcard:hover {
  box-shadow: var(--am-shadow-hover);
  transform: rotate(0deg) translateY(-4px);
}

/* 头部一行:头像/昵称/时间/地点/编号全部弱化为次要信息,内容才是主角 */
.postcard-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  /* 右侧避让邮票角标 */
  padding-inline-end: 44px;
}

.postcard-face {
  width: 28px;
  height: 28px;
  object-fit: cover;
  border: 1px solid var(--am-line);
  border-radius: 50%;
}

.postcard-name {
  font-size: var(--am-text-sm);
  font-weight: 600;
  color: var(--am-ink-secondary);
}

.postcard-date {
  margin-inline-start: auto;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
}

.postcard-region {
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
}

.postcard-no {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  font-weight: 500;
  color: var(--am-rose);
  opacity: 0.75;
}

/* 留言内容:卡片主角,放大字号与行高,全墨色 */
.postcard-text {
  font-size: 1.125rem;
  line-height: 1.85;
  color: var(--am-ink);
  overflow-wrap: anywhere;
}

@media (width <= 640px) {
  .postcard-fields {
    flex-direction: column;
  }
}
</style>
