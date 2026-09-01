<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getPhotos, type PhotoItem } from "@/api/portal";

defineOptions({ name: "PortalPhoto" });

/** 门户列表每页条数(与原站 PAGE_SIZE 一致) */
const PAGE_SIZE = 6;

const items = ref<(PhotoItem & { show: boolean })[]>([]);
const totalRow = ref(0);
const pageNumber = ref(0);
const loading = ref(false);

/** 是否还有更多数据(到底后隐藏「加载更多」) */
const hasMore = computed(() => items.value.length < totalRow.value);

/** 灯箱预览地址:当前已加载的全部图片(点击任意张按其索引打开) */
const previewUrls = computed(() => items.value.map(p => p.img));

/** 灯箱显隐与初始索引 */
const viewerVisible = ref(false);
const viewerIndex = ref(0);

function openViewer(index: number) {
  viewerIndex.value = index;
  viewerVisible.value = true;
}

async function loadMore() {
  if (loading.value) return;
  loading.value = true;
  try {
    const { success, data } = await getPhotos(pageNumber.value + 1, PAGE_SIZE);
    if (success) {
      const batch = data.records.map(p => ({ ...p, show: false }));
      const base = items.value.length;
      items.value.push(...batch);
      totalRow.value = data.totalRow;
      pageNumber.value = data.pageNumber;
      // 逐张浮现动画(300ms 间隔,仅本次追加的卡片);经响应式代理赋值触发更新
      batch.forEach((_, idx) => {
        setTimeout(() => {
          const it = items.value[base + idx];
          if (it) it.show = true;
        }, idx * 300);
      });
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadMore());
</script>

<template>
  <!-- 标题(照搬原站 love-photo.html) -->
  <h4 class="text-ce central">记录下你的最美瞬间</h4>
  <div id="photoGallery" class="row central gallery">
    <div
      v-for="(photo, i) in items"
      :key="i"
      class="img_card col-lg-4 col-md-6 col-sm-12 col-sm-x-12 photo-item"
      :class="{ show: photo.show }"
    >
      <div class="love_img">
        <el-image
          :src="photo.img"
          :alt="photo.text"
          :data-description="photo.date"
          :preview-src-list="previewUrls"
          :initial-index="i"
          preview-teleported
          hide-on-click-modal
        />
        <div class="words" :data-tip="photo.text" data-tip-position="top">
          <i>{{ photo.date }}</i
          ><span>{{ photo.text }}</span>
        </div>
      </div>
    </div>
    <div v-if="!loading && items.length === 0" class="portal-empty">
      暂无照片…
    </div>
  </div>
  <!-- 「加载更多」按钮:替代原站 layui flow 的按钮式分页 -->
  <div v-if="hasMore" class="photo-load-more" @click="loadMore">
    {{ loading ? "加载中..." : "加载更多" }}
  </div>
</template>

<style scoped>
/* 「加载更多」按钮:替代原站 layui flow 的按钮式分页(与点点滴滴页一致) */
.photo-load-more {
  width: fit-content;
  padding: 0.5rem 2rem;
  margin: 2rem auto 0;
  font-size: 1.2rem;
  color: #959595;
  text-align: center;
  letter-spacing: 0.3rem;
  cursor: pointer;
  border: 1px solid #e4e4e4;
  border-radius: 2rem;
  transition: all 0.2s;
}

.photo-load-more:hover {
  color: #ff69b4;
  border-color: #ff69b4;
}
</style>
