<script setup lang="ts">
defineOptions({ name: "HomePhotoCard" });

defineProps<{
  /** 画册封面照片(sort 首位;null 时整卡不渲染) */
  photo: { img: string; text: string } | null | undefined;
  /** 纪念日卡缺失时占满右列(布局联动由骨架层下发) */
  tall: boolean;
}>();
</script>

<template>
  <RouterLink
    v-if="photo"
    class="photo-card"
    :class="{ 'photo-card--tall': tall }"
    to="/love-photo"
  >
    <img :src="photo.img" :alt="photo.text" class="photo-card-img" />
    <span class="am-section-kicker photo-card-kicker"> Album · 恋爱画册 </span>
    <span class="photo-card-caption">{{ photo.text }}</span>
  </RouterLink>
</template>

<style scoped>
/* 恋爱画册卡:图片满铺整卡,标签浮于左上角压暗渐变上,卡片趋近正方形 */
.photo-card {
  position: relative;
  display: flex;
  flex-direction: column;
  aspect-ratio: 3 / 2;
  padding: 0;
  overflow: hidden;
  background: var(--am-card);
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
}

.photo-card-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--am-duration) var(--am-ease);
}

/* 顶部栏目浮层:平时纯图,悬停/聚焦时浮现;轻投影保证浅图上的可读性
 * (浮层文字恒用暖白,不随主题切换) */
.photo-card-kicker {
  position: absolute;
  inset: 0 0 auto;
  padding: var(--am-space-sm);
  color: rgb(255 251 245 / 90%);
  text-align: center;
  text-shadow: 0 1px 4px rgb(20 16 14 / 40%);
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity var(--am-duration) var(--am-ease),
    transform var(--am-duration) var(--am-ease);
}

/* 底部画册名称:居中弱化显示 */
.photo-card-caption {
  position: absolute;
  inset: auto 0 0;
  padding: var(--am-space-sm);
  font-size: var(--am-text-xs);
  line-height: 1.5;
  color: rgb(255 251 245 / 75%);
  text-align: center;
  text-shadow: 0 1px 4px rgb(20 16 14 / 40%);
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity var(--am-duration) var(--am-ease),
    transform var(--am-duration) var(--am-ease);
}

/* 悬停/键盘聚焦:文字浮现 */
.photo-card:hover .photo-card-kicker,
.photo-card:focus-visible .photo-card-kicker,
.photo-card:hover .photo-card-caption,
.photo-card:focus-visible .photo-card-caption {
  opacity: 1;
  transform: translateY(0);
}

/* 触屏设备无悬停:文字常显 */
@media (hover: none) {
  .photo-card-kicker,
  .photo-card-caption {
    opacity: 1;
    transform: none;
  }
}

/* 减弱动效偏好:浮现无过渡,瞬时显隐 */
@media (prefers-reduced-motion: reduce) {
  .photo-card-kicker,
  .photo-card-caption {
    transition: none;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .photo-card:hover .photo-card-img {
    transform: scale(1.04);
  }
}
</style>
