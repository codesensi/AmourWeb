<script setup lang="ts">
import { computed } from "vue";
import { getAnniversaryList } from "@/api/portal/anniversary";
import { getLovePhotoCover } from "@/api/portal/love-photo";
import { nextOccurrenceDays } from "@/utils/anniversary";
import reveal from "@/directives/reveal";
import { queryKeys } from "@/hooks/query-keys";
import { usePortalQuery } from "@/hooks/usePortalQuery";
import HomeAnniversaryCard from "./components/HomeAnniversaryCard.vue";
import HomeCover from "./components/HomeCover.vue";
import HomeFootprintCard from "./components/HomeFootprintCard.vue";
import HomePhotoCard from "./components/HomePhotoCard.vue";
import HomeToc from "./components/HomeToc.vue";

defineOptions({ name: "PortalHome" });

const vReveal = reveal;

/* ---------------- 纪念日预告:最近的一个 ---------------- */

/** 最近纪念日(封面焦点):接口按下一次发生日升序,取首条即最近;
 * 数据到达时按当日计算剩余天数
 * (独立 key anniversaryFocus:与纪念日页分页 ["anniversary"] 数据形状不同) */
const { data: anniversaryPage } = usePortalQuery(
  queryKeys.anniversaryFocus(),
  () => getAnniversaryList({ pageNumber: 1, pageSize: 1 })
);

const nextAnniversary = computed(() => {
  const item = anniversaryPage.value?.records[0];
  if (!item) return null;
  const days = nextOccurrenceDays(item, new Date());
  return days === null
    ? null
    : { name: item.name, date: item.anniversaryDate, days };
});

/* ---------------- 恋爱画册:封面照片 ---------------- */

/** 画册封面照片(sort 首位;接口不可用/画册为空时整卡不渲染) */
const { data: latestPhoto } = usePortalQuery(
  queryKeys.latestPhoto(),
  getLovePhotoCover
);
</script>

<template>
  <div>
    <HomeCover />

    <HomeToc />

    <!-- 足迹世界地图 + 纪念日预告:非对称双栏,右栏倒计时填充右区 -->
    <section class="editorial">
      <div class="am-page">
        <div
          class="editorial-grid"
          :class="{ 'editorial-grid--solo': !nextAnniversary && !latestPhoto }"
        >
          <HomeFootprintCard v-reveal />
          <HomeAnniversaryCard
            v-reveal="0.1"
            :anniversary="nextAnniversary"
            :tall="!latestPhoto"
          />
          <HomePhotoCard
            v-reveal="0.2"
            :photo="latestPhoto"
            :tall="!nextAnniversary"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ---------------- 足迹地图 + 纪念日预告 ---------------- */
.editorial {
  padding-top: var(--am-space-2xl, 64px);
}

/* Bento 三卡组:左大卡跨两行,右侧倒计时/一言两小卡;统一卡体配平视觉重量 */
.editorial-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  grid-auto-rows: minmax(120px, auto);
  gap: var(--am-space-md);
  align-items: stretch;
}

/* 倒计时与画册均无内容时:仅剩足迹地图卡,保持原宽水平居中 */
.editorial-grid--solo {
  grid-template-columns: minmax(0, 66.667%);
  justify-content: center;
}

.editorial-grid > * {
  transition:
    transform var(--am-duration) var(--am-ease),
    box-shadow var(--am-duration) var(--am-ease);
}

.editorial-grid > *:hover {
  box-shadow: var(--am-shadow-hover);
  transform: translateY(-4px);
}

/* 地图卡不参与 hover 抬升:避免 CSS transform 与画布交互层叠加产生布局反馈 */
.editorial-grid > .footprint-card:hover {
  transform: none;
}

/* 一言/倒计时在缺失彼此时各自占满右列 */
.teaser-card--tall,
.photo-card--tall {
  grid-row: span 2;
}

/* 640px:双栏区块上下堆叠 */
@media (width <= 640px) {
  .editorial-grid {
    grid-template-columns: 1fr;
  }

  .teaser-card--tall,
  .photo-card--tall {
    grid-row: auto;
  }
}
</style>
