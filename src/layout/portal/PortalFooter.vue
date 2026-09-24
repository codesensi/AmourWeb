<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { getPortalSaying, type SayingData } from "@/api/portal/saying";
import { getVisitTotal, reportVisit } from "@/api/portal/visit";
import { usePortalSysConfig } from "./usePortalSysConfig";

defineOptions({ name: "PortalFooter" });

/** 站点公共配置:由 PortalLayout 经 providePortalSysConfig 注入 */
const sysConfig = usePortalSysConfig();

/** 版权年份:配置起始年份早于当前年份时显示「起始-当前」区间;
 * 配置缺失、非法或恰为当前年份(防御性:配置晚于当前年份同理)时仅显示当前年份 */
const copyrightYears = computed(() => {
  const nowYear = new Date().getFullYear();
  const startYear = Number.parseInt(sysConfig.value.copyrightYear ?? "", 10);
  const start =
    Number.isInteger(startYear) && startYear < nowYear ? startYear : null;
  return start ? `${start}-${nowYear}` : String(nowYear);
});

/** ICP 备案文案:未配置(缺失或纯空白)时整个 ICP 块不展示 */
const icpText = computed(() => sysConfig.value.icp?.trim() ?? "");

/** 页脚一言(随机优先):请求失败或无数据时降级为固定兜底文案 */
const saying = ref<SayingData | null>(null);

/** 一言接口调不通(请求异常/无数据返回)时的兜底文案:站点自己的态度文案 */
const FALLBACK_SAYING: SayingData = {
  content: "落俗不可避免,浪漫至死不渝",
  source: "",
  author: ""
};

/** 访问累计(PV):接口不可用时不展示该行 */
const totalPv = ref<number | null>(null);

/** 访问累计(UV):与 PV 同接口同成败,一并展示 */
const totalUv = ref<number | null>(null);

/** 上报访问(每浏览器每日一次:localStorage 按日标记去重;失败静默,下次访问再计) */
function reportVisitOnce() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const reportedKey = "amour_visit_reported";
  try {
    if (localStorage.getItem(reportedKey) === today) return;
    localStorage.setItem(reportedKey, today);
  } catch {
    // localStorage 不可用(隐私模式等):跳过去重直接上报
  }
  void reportVisit().catch(() => {});
}

/** 管理后台地址:项目为 hash 路由,须带 # 前缀,否则 /admin 会被当作首页 */
const adminHref = `${import.meta.env.BASE_URL}#/admin`;

/** 写在最后 · 出处·作者 */
const sayingFrom = computed(() =>
  [saying.value?.source, saying.value?.author].filter(Boolean).join("·")
);

onMounted(async () => {
  // 一言与访问计数互不阻塞:一言拿不到(失败/空数据)时显示兜底文案,访问计数失败静默降级
  reportVisitOnce();
  try {
    const { success, data } = await getPortalSaying();
    saying.value = success && data?.content ? data : FALLBACK_SAYING;
  } catch {
    saying.value = FALLBACK_SAYING;
  }
  try {
    const { success, data } = await getVisitTotal();
    if (success && data) {
      totalPv.value = data.pv;
      totalUv.value = data.uv;
    }
  } catch {
    // 静默降级
  }
});
</script>

<template>
  <!-- 版权页(Colophon):写在最后 + 站点信息 + 备案/版权 -->
  <footer class="colophon">
    <div class="colophon-inner">
      <!-- 写在最后:一言(接口不可用时渲染兜底文案) -->
      <p v-if="saying?.content" class="colophon-saying">
        <span class="colophon-kicker">Love Notes · 写在最后</span>
        <span class="colophon-saying-text">“{{ saying.content }}”</span>
        <span v-if="sayingFrom" class="colophon-saying-from">
          —— {{ sayingFrom }}
        </span>
      </p>

      <div class="colophon-meta">
        <!-- 访问累计:来自 portal_visit(接口不可用时不展示) -->
        <p v-if="totalPv !== null" class="colophon-visit">
          我们的故事已被翻开
          <b class="colophon-visit-num">{{ totalPv }}</b>
          次，已被
          <b class="colophon-visit-num">{{ totalUv }}</b>
          位访客翻开过
        </p>

        <p class="colophon-copy">
          © {{ copyrightYears }}
          <RouterLink to="/" class="colophon-link">{{
            sysConfig.name || "AMOUR"
          }}</RouterLink>
          · 与我们的每一天
        </p>

        <p v-if="icpText" class="colophon-icp">
          <a
            href="https://beian.miit.gov.cn/#/Integrated/index"
            target="_blank"
            rel="noopener"
            class="colophon-link colophon-icp-link"
            ><!-- 备案徽标:盾形线描小图,与门户图标风格统一 -->
            <svg
              class="colophon-icp-badge"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
              />
              <path d="m9 12 2 2 4-4" />
            </svg>
            {{ icpText }}</a
          >
        </p>

        <!-- 管理后台:低存在感文字入口(对齐市面个人站惯例),新标签页打开 -->
        <p class="colophon-admin">
          <a
            :href="adminHref"
            target="_blank"
            rel="noopener"
            class="colophon-link colophon-admin-link"
          >
            <!-- 管理后台:齿轮线描小图,与门户图标风格统一 -->
            <svg
              class="colophon-admin-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
            管理后台
          </a>
          <span class="colophon-admin-divider">·</span>
          <!-- GitHub 仓库:octocat 实心徽标(品牌图形,不在线描图标体系内) -->
          <a
            href="https://github.com/codesensi/Amour"
            target="_blank"
            rel="noopener"
            class="colophon-link colophon-github"
          >
            <svg
              class="colophon-github-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.304 3.495.997.108-.775.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.51-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.295-1.552 3.3-1.23 3.3-1.23.615 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              />
            </svg>
            开源仓库
          </a>
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* 版权页:纸面上下边线 + 居中排版;底部避让手势条安全区 */
.colophon {
  padding: var(--am-space-lg) var(--am-space-md)
    calc(var(--am-space-lg) + env(safe-area-inset-bottom, 0px));
  background: var(--am-bg-deep);
  border-top: 1px solid var(--am-line);
}

.colophon-inner {
  max-width: var(--am-content-width);
  margin: 0 auto;
  text-align: center;
}

/* 写在最后:衬线斜体引文 */
.colophon-saying {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: var(--am-space-md);
  margin-bottom: var(--am-space-md);
  border-bottom: 1px solid var(--am-line);
}

.colophon-kicker {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-rose);
  letter-spacing: 0.18em;
}

.colophon-saying-text {
  font-family: var(--am-font-display);
  font-size: var(--am-text-lg);
  font-style: italic;
  color: var(--am-ink);
}

.colophon-saying-from {
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

/* 站点信息 */
.colophon-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

.colophon-visit-num {
  font-family: var(--am-font-mono);
  color: var(--am-rose);
}

.colophon-link {
  color: var(--am-ink-secondary);
  text-decoration: none;
}

.colophon-link:hover {
  color: var(--am-rose);
  text-decoration: underline;
  text-underline-offset: 4px;
}

/* 备案行:徽标与文案垂直居中 */
.colophon-icp-link {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.colophon-icp-badge {
  width: 14px;
  height: 14px;
}

/* 管理后台 + GitHub 仓库:行内并排居中,间隔点与版权行同款 */
.colophon-admin {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.colophon-admin-link {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.colophon-admin-icon {
  width: 14px;
  height: 14px;
}

.colophon-github {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.colophon-github-icon {
  width: 14px;
  height: 14px;
}
</style>
