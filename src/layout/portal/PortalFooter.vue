<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { getPortalSaying, type SayingData, getVisitTotal } from "@/api/portal";
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

/** 卷末一言(随机优先,失败降级):content 为空或请求失败时不展示 */
const saying = ref<SayingData | null>(null);

/** 访问累计(PV):接口不可用时不展示该行 */
const totalPv = ref<number | null>(null);

/** 卷末语 · 出处·作者 */
const sayingFrom = computed(() =>
  [saying.value?.source, saying.value?.author].filter(Boolean).join("·")
);

/** 访问数滚动入场:从 0 计到目标值(rAF 缓动,reduced-motion 时直接到位) */
function countUp(target: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    totalPv.value = target;
    return;
  }
  const duration = 900;
  const startAt = performance.now();
  function tick(now: number) {
    const progress = Math.min(1, (now - startAt) / duration);
    const eased = 1 - (1 - progress) ** 3;
    totalPv.value = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

onMounted(async () => {
  // 一言与访问计数互不阻塞,任一失败静默降级(对应行不渲染)
  try {
    const { success, data } = await getPortalSaying();
    if (success && data?.content) saying.value = data;
  } catch {
    // 静默降级
  }
  try {
    const { success, data } = await getVisitTotal();
    if (success && data) countUp(data.pv);
  } catch {
    // 静默降级
  }
});
</script>

<template>
  <!-- 版权页(Colophon):卷末语 + 站点信息 + 备案/版权 -->
  <footer class="colophon">
    <div class="colophon-inner">
      <!-- 卷末语:一言(失败/为空不渲染) -->
      <p v-if="saying?.content" class="colophon-saying">
        <span class="colophon-kicker">卷末语</span>
        <span class="colophon-saying-text">“{{ saying.content }}”</span>
        <span v-if="sayingFrom" class="colophon-saying-from">
          —— {{ sayingFrom }}
        </span>
      </p>

      <div class="colophon-meta">
        <!-- 访问累计:来自 portal_visit(接口不可用时不展示) -->
        <p v-if="totalPv !== null" class="colophon-visit">
          本刊已被阅读
          <b class="colophon-visit-num">{{ totalPv }}</b>
          次
        </p>

        <p class="colophon-copy">
          © {{ copyrightYears }}
          <RouterLink to="/" class="colophon-link">{{
            sysConfig.name || "AMOUR"
          }}</RouterLink>
          · 与我们的每一期
        </p>

        <p v-if="icpText" class="colophon-icp">
          <a
            href="https://beian.miit.gov.cn/#/Integrated/index"
            target="_blank"
            rel="noopener"
            class="colophon-link"
            >{{ icpText }}</a
          >
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

/* 卷末语:衬线斜体引文 */
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
</style>
