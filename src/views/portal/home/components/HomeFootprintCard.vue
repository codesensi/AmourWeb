<script setup lang="ts">
import { computed, markRaw, ref } from "vue";
import { useRouter } from "vue-router";
import MapPinLine from "~icons/ri/map-pin-line";
import { getFootprintMapPoints } from "@/api/portal/footprint";
import PortalAmapTrack from "@/components/PortalAmapTrack/index.vue";
import type { MapPoint } from "@/components/PortalWorldMap/index.vue";
import { queryKeys } from "@/hooks/query-keys";
import { usePortalQuery } from "@/hooks/usePortalQuery";

/** 足迹原始数据(缓存 5 分钟,KeepAlive 激活时过期重拉);
 * 地图连线需全量点位,map-points 专用端点一次拉取
 * (独立 key footprintMap:与足迹页分页 ["footprint"] 数据形状不同,共用会导致
 *  useInfiniteQuery 读到单对象缓存时抛 TypeError 使整页空白) */
const { data: footprintPoints } = usePortalQuery(
  queryKeys.footprintMap(),
  getFootprintMapPoints
);

/** 地图点位:有坐标的足迹(后端已按到访日期升序,依此连线)
 * (元素经 markRaw 剥离响应式,避免 echarts 每帧重绘遍历 Proxy) */
const mapPoints = computed<MapPoint[]>(() =>
  (footprintPoints.value ?? [])
    .filter(it => it.longitude != null && it.latitude != null)
    .map(it =>
      markRaw({
        id: it.id,
        city: it.city,
        placeName: it.placeName,
        longitude: it.longitude as number,
        latitude: it.latitude as number,
        arrivalDate: it.arrivalDate,
        remark: it.remark,
        photoUrl: it.photoUrl
      })
    )
);

/** 精确地点展示文案(与城市同名视为未录入,避免「成都 / 成都」式重复) */
function placeText(point: MapPoint): string {
  if (!point.placeName || point.placeName === point.city) return "";
  return point.placeName;
}

/** 选中的足迹详情(null=关闭) */
const selectedPoint = ref<MapPoint | null>(null);

const router = useRouter();

function onMapSelect(point: MapPoint | null) {
  selectedPoint.value = point;
}

function closeMapDetail() {
  selectedPoint.value = null;
}

/** 浮层内直达足迹页(链接不可嵌套,改用编程导航) */
function goFootprint() {
  selectedPoint.value = null;
  router.push("/footprint");
}
</script>

<template>
  <div class="editorial-card footprint-card">
    <PortalAmapTrack
      class="footprint-map"
      :points="mapPoints"
      @select="onMapSelect"
    />
    <p class="am-section-kicker">Footprints · 足迹</p>
    <span class="editorial-title">我们走过的每一座城</span>
    <p class="editorial-meta">
      已到访 {{ mapPoints.length }} 座城市,滚轮缩放、拖动漫游
    </p>
    <RouterLink to="/footprint" class="editorial-more">
      查看全部足迹 →
    </RouterLink>
    <span
      v-if="selectedPoint"
      class="footprint-detail"
      :class="{ 'footprint-detail--photo': selectedPoint.photoUrl }"
      :style="
        selectedPoint.photoUrl
          ? {
              backgroundImage:
                `linear-gradient(rgb(15 18 25 / 55%), rgb(15 18 25 / 55%)), ` +
                `url('${selectedPoint.photoUrl}')`
            }
          : undefined
      "
      @click.stop
    >
      <span class="gd-city">{{ selectedPoint.city }}</span>
      <span
        v-if="selectedPoint.arrivalDate || placeText(selectedPoint)"
        class="gd-meta"
      >
        <span v-if="selectedPoint.arrivalDate" class="gd-date">
          {{ selectedPoint.arrivalDate }}
        </span>
        <span
          v-if="placeText(selectedPoint)"
          class="gd-place"
          :title="selectedPoint.placeName ?? ''"
        >
          <MapPinLine aria-hidden="true" />
          <span>{{ placeText(selectedPoint) }}</span>
        </span>
      </span>
      <span v-if="selectedPoint.remark" class="gd-remark">
        {{ selectedPoint.remark }}
      </span>
      <span class="gd-more" @click.stop="goFootprint"> 查看全部足迹 → </span>
      <button
        type="button"
        class="gd-close"
        aria-label="关闭详情"
        @click.stop="closeMapDetail"
      >
        ×
      </button>
    </span>
  </div>
</template>

<style scoped>
/* 足迹世界地图卡:地图铺满整卡作背景,文字浮于其上 */
.footprint-map {
  position: absolute;
  inset: 0;

  /* 禁止选中:防止画布拖动连带触发链接的原生拖拽/文字选择 */
  user-select: none;
}

.footprint-card .am-section-kicker,
.footprint-card .editorial-title,
.footprint-card .editorial-meta {
  position: relative;
  z-index: 1;

  /* 文字不拦截指针:整卡面均可拖拽地图 */
  pointer-events: none;
}

/* 足迹卡片标题调小:大幅地图底图上文字过重 */
.footprint-card .editorial-title {
  font-size: clamp(1.4rem, 3.2vw, var(--am-text-xl));
}

/* 跳转链接是明确的可点按钮,浮于地图之上 */
.footprint-card .editorial-more {
  position: relative;
  z-index: 1;
}

/* 卡片文字默认隐藏,鼠标进入卡片才渐显(触屏无 hover,媒体查询保证常显) */
@media (hover: hover) {
  .footprint-card .am-section-kicker,
  .footprint-card .editorial-title,
  .footprint-card .editorial-meta,
  .footprint-card .editorial-more {
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .footprint-card:hover .am-section-kicker,
  .footprint-card:hover .editorial-title,
  .footprint-card:hover .editorial-meta,
  .footprint-card:hover .editorial-more,
  /* 键盘 Tab 聚焦到链接时同样显示,保证键盘可达 */
  .footprint-card:focus-within .editorial-more {
    opacity: 1;
  }
}

/* 详情浮层:点击地点后的详细说明(层级高于重置视角按钮,打开时自然覆盖它) */
.footprint-detail {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  justify-content: center;
  padding: var(--am-space-xl, 48px);
  text-align: center;
  background: var(--am-bg-deep);
}

.gd-city {
  font-family: var(--am-font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  line-height: 1.15;
  color: var(--am-ink);
}

.gd-date {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-base);

  /* 与 .gd-place 统一行框高度,保证同一水平轴对齐 */
  line-height: 1.2;
  color: var(--am-ink-secondary);
  letter-spacing: 0.08em;
}

/* 日期与精确地点同行:一行内并列展示 */
.gd-meta {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 定位图标与足迹页同款:1em 玫瑰色,随中文字面微调居中 */
.gd-place {
  display: flex;
  gap: 3px;
  align-items: center;
  min-width: 0;
  font-size: var(--am-text-base);
  line-height: 1.2;
  color: var(--am-ink-secondary);
}

.gd-place svg {
  flex-shrink: 0;
  width: 1em;
  height: 1em;
  color: var(--am-rose);
  transform: translateY(-0.09em);
}

.gd-place span {
  overflow: hidden;
  text-overflow: ellipsis;

  /* 行框紧贴字面:文字与 1em 图标同一几何中心,消除中文下沉造成的图标偏低 */
  line-height: 1;
  white-space: nowrap;
}

.gd-remark {
  max-width: 34ch;
  font-size: var(--am-text-lg);
  line-height: 1.7;
  color: var(--am-ink-secondary);
}

.gd-more {
  font-size: var(--am-text-sm);
  color: var(--am-rose);
  cursor: pointer;
}

.gd-more:hover,
.gd-more:focus-visible {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.gd-close {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 32px;
  height: 32px;
  font-size: var(--am-text-lg);
  color: var(--am-ink-secondary);
  cursor: pointer;
  background: none;
  border: 0;
}

.gd-close:hover {
  color: var(--am-ink);
}

.gd-close:focus-visible {
  outline: 2px solid var(--am-rose);
  outline-offset: 2px;
}

/* 有足迹照片时:照片铺满浮层作背景(叠深色遮罩),文字切换为白系保证可读 */
.footprint-detail--photo {
  background-position: center;
  background-size: cover;
}

.footprint-detail--photo .gd-city {
  color: #fff;
}

.footprint-detail--photo .gd-date,
.footprint-detail--photo .gd-place,
.footprint-detail--photo .gd-remark {
  color: rgb(255 255 255 / 72%);
}

.footprint-detail--photo .gd-more {
  color: #fda4af;
}

.footprint-detail--photo .gd-more:hover,
.footprint-detail--photo .gd-more:focus-visible {
  color: #fff;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.footprint-detail--photo .gd-close {
  color: rgb(255 255 255 / 72%);
}

/* 卡体骨架:列表卡片通用形态(整卡 flex 纵排,跨两行占位) */
.editorial-card {
  position: relative;
  display: flex;
  flex-direction: column;
  grid-row: span 2;
  padding: var(--am-space-lg);
  overflow: hidden;
  background: var(--am-card);
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
}

.editorial-title {
  display: inline-block;
  margin: 10px 0 6px;
  font-family: var(--am-font-display);
  font-size: clamp(1.8rem, 5vw, var(--am-text-huge));
  font-weight: 700;
  line-height: 1.2;
  color: var(--am-ink);
  text-decoration: none;
  transition: color var(--am-duration-fast) ease;
}

.editorial-title:hover {
  color: var(--am-rose);
}

.editorial-meta {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

.editorial-more {
  display: inline-block;
  align-self: flex-start;
  padding-top: 14px;
  margin-top: auto;
  font-size: var(--am-text-sm);
  color: var(--am-rose);
  text-decoration: none;
  transition: transform var(--am-duration-fast) var(--am-ease);
}

.editorial-more:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
  transform: translateX(2px);
}
</style>
