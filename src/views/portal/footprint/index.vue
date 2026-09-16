<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getFootprintList, type FootprintItem } from "@/api/portal";
import PortalSkeleton from "@/components/PortalSkeleton/index.vue";
import PortalLightbox, {
  type LightboxItem
} from "@/components/PortalLightbox/index.vue";
import reveal from "@/directives/reveal";
import { useLightbox } from "@/hooks/useLightbox";

defineOptions({ name: "PortalFootprint" });

const vReveal = reveal;

/** 足迹全量列表(接口不可用/为空时展示空态) */
const items = ref<FootprintItem[]>([]);
/** 首屏加载态:骨架屏展示窗口 */
const loading = ref(true);

/** 按到访日期升序排列(时间轴按旅程推进) */
const journey = computed(() =>
  [...items.value].sort((a, b) =>
    (a.arrivalDate ?? "").localeCompare(b.arrivalDate ?? "")
  )
);

onMounted(async () => {
  try {
    const { success, data } = await getFootprintList();
    if (success && data) items.value = data;
  } catch {
    // 静默降级
  } finally {
    loading.value = false;
  }
});

/* ---------------- 纪念照影院模式 ---------------- */

const { lightboxOpen, lightboxIndex, openAt: openLightbox } = useLightbox();

/** 带照片的足迹(影院模式数据源) */
const photoItems = computed<LightboxItem[]>(() =>
  journey.value
    .filter(it => it.photoUrl)
    .map(it => ({
      url: it.photoUrl as string,
      caption: `${it.city}${it.arrivalDate ? ` · ${it.arrivalDate}` : ""}`
    }))
);

/** 打开纪念照 */
function openPhoto(item: FootprintItem) {
  const idx = photoItems.value.findIndex(p => p.url === item.photoUrl);
  if (idx >= 0) openLightbox(idx);
}

/** 坐标展示文案(30.66°N, 104.06°E) */
function coordText(it: FootprintItem): string {
  if (it.latitude == null || it.longitude == null) return "";
  const ns = it.latitude >= 0 ? "N" : "S";
  const ew = it.longitude >= 0 ? "E" : "W";
  return `${Math.abs(it.latitude).toFixed(2)}°${ns} ${Math.abs(it.longitude).toFixed(2)}°${ew}`;
}
</script>

<template>
  <div class="am-page">
    <!-- 章节题头 -->
    <header class="am-section-head">
      <p class="am-section-kicker">Footprints · 一起走过</p>
      <h1 class="am-section-title">足迹</h1>
      <p class="foot-intro">
        第 {{ journey.length }} 站 · 我们到过的城市,都留在了这条路上。
      </p>
    </header>

    <!-- 旅程时间轴 -->
    <ol v-if="journey.length" class="foot-line">
      <li
        v-for="(it, i) in journey"
        :key="it.id"
        v-reveal="(i % 3 || 0) * 0.06"
        class="foot-item reveal"
      >
        <span class="foot-station" aria-hidden="true">
          {{ String(i + 1).padStart(2, "0") }}
        </span>
        <div class="foot-card">
          <!-- 纪念照(可选):点击进影院模式 -->
          <button
            v-if="it.photoUrl"
            class="foot-photo"
            type="button"
            @click="openPhoto(it)"
          >
            <img
              :src="it.photoUrl"
              :alt="`${it.city} 纪念照`"
              width="600"
              height="400"
              loading="lazy"
            />
          </button>
          <div class="foot-info">
            <h3 class="foot-city">{{ it.city }}</h3>
            <p class="foot-meta">
              <time v-if="it.arrivalDate" class="foot-date">
                {{ it.arrivalDate }}
              </time>
              <span v-if="coordText(it)" class="foot-coord">
                {{ coordText(it) }}
              </span>
            </p>
            <p v-if="it.remark" class="foot-remark">{{ it.remark }}</p>
          </div>
        </div>
      </li>
    </ol>

    <!-- 首屏加载:杂志线框骨架屏;加载完为空则展示空态 -->
    <PortalSkeleton v-if="loading" :rows="3" />

    <div v-else-if="!journey.length" class="am-empty">
      地图上还没有脚印,第一站正在计划中…
    </div>

    <!-- 纪念照影院模式 -->
    <PortalLightbox
      v-model:open="lightboxOpen"
      v-model:index="lightboxIndex"
      :items="photoItems"
    />
  </div>
</template>

<style scoped>
.foot-intro {
  margin-top: 6px;
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

/* 旅程时间轴 */
.foot-line {
  position: relative;
  padding: var(--am-space-lg) 0 0;
  margin: 0;
  list-style: none;
}

/* 中轴虚线:旅程路线 */
.foot-line::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 20px;
  width: 1px;
  content: "";
  background: var(--am-line);
}

.foot-item {
  position: relative;
  contain-intrinsic-size: auto 160px;
  padding: 0 0 var(--am-space-lg) 52px;
  content-visibility: auto;
}

/* 站点编号:压在中轴线上 */
.foot-station {
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
  width: 41px;
  height: 41px;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-rose);
  background: var(--am-bg);
  border: 1px solid var(--am-line);
  border-radius: 50%;
}

/* 城市卡:横排(照片 + 信息) */
.foot-card {
  display: flex;
  gap: var(--am-space-md);
  padding: 16px 18px;
  background: var(--am-card);
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
}

.foot-photo {
  flex-shrink: 0;
  padding: 0;
  cursor: zoom-in;
  background: none;
  border: 0;
}

.foot-photo img {
  display: block;
  width: 128px;
  height: 96px;
  object-fit: cover;
  border-radius: var(--am-radius);
  transition: transform 0.4s var(--am-ease);
}

.foot-photo:hover img {
  transform: scale(1.03);
}

.foot-info {
  min-width: 0;
}

.foot-city {
  margin: 0 0 6px;
  font-family: var(--am-font-display);
  font-size: var(--am-text-lg);
  font-weight: 700;
  color: var(--am-ink);
}

.foot-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 0 6px;
}

.foot-date {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-rose);
}

.foot-coord {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-tertiary);
}

.foot-remark {
  margin: 0;
  font-size: var(--am-text-sm);
  line-height: 1.8;
  color: var(--am-ink-secondary);
}

@media (width <= 640px) {
  .foot-card {
    flex-direction: column;
  }

  .foot-photo img {
    width: 100%;
    height: auto;
    aspect-ratio: 3 / 2;
  }
}
</style>
