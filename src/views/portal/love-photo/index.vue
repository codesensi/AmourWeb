<script setup lang="ts">
import { computed, onMounted } from "vue";
import { getLovePhoto, type LovePhotoItem } from "@/api/portal";
import type { ApiResult, PageResult } from "@/api/types";
import { usePagedList } from "@/hooks/usePagedList";

defineOptions({ name: "PortalLovePhoto" });

/** 门户「加载更多」分页加载(每页 6 条,与原站 PAGE_SIZE 一致);适配器为每张记录补 show 字段驱动浮现动画 */
const { items, loading, hasMore, loadMore } = usePagedList<
  LovePhotoItem & { show: boolean }
>(
  async params => {
    const res = await getLovePhoto(params);
    if (res.success) {
      res.data.records = res.data.records.map(p => ({ ...p, show: false }));
    }
    return res as ApiResult<PageResult<LovePhotoItem & { show: boolean }>>;
  },
  {
    onLoaded: (batch, startIndex) => {
      // 逐张浮现动画(300ms 间隔,仅本次追加的卡片);经响应式代理赋值触发更新
      batch.forEach((_, idx) => {
        setTimeout(() => {
          const it = items.value[startIndex + idx];
          if (it) it.show = true;
        }, idx * 300);
      });
    }
  }
);

/** 灯箱预览地址:当前已加载的全部图片(el-image 内建预览,点击任意张按其索引打开) */
const previewUrls = computed(() => items.value.map(p => p.img));

onMounted(() => loadMore());
</script>

<template>
  <div>
    <!-- 标题(照搬原站 love-photo.html) -->
    <h4 class="text-ce central">记录下你的最美瞬间</h4>
    <div id="photoGallery" class="row central gallery">
      <div
        v-for="(photo, i) in items"
        :key="i"
        class="img-card col-lg-4 col-md-6 col-sm-12 col-sm-x-12 photo-item"
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
          <div class="words">
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
