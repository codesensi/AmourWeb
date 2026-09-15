<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { getLovePhoto, type LovePhotoItem } from "@/api/portal";
import type { ApiResult, PageResult } from "@/api/types";
import { usePagedList } from "@/hooks/usePagedList";
import PortalLoadMore from "@/components/PortalLoadMore/index.vue";

defineOptions({ name: "PortalLovePhoto" });

/** 逐张浮现动画的定时器句柄:组件卸载时统一清理,避免卸载后仍写响应式状态 */
const showTimers: ReturnType<typeof setTimeout>[] = [];

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
        showTimers.push(
          setTimeout(() => {
            const it = items.value[startIndex + idx];
            if (it) it.show = true;
          }, idx * 300)
        );
      });
    }
  }
);

/** 灯箱预览地址:当前已加载的全部图片(el-image 内建预览,点击任意张按其索引打开) */
const previewUrls = computed(() => items.value.map(p => p.img));

onMounted(() => loadMore());
onUnmounted(() => showTimers.forEach(clearTimeout));
</script>

<template>
  <div>
    <!-- 标题(照搬原站 love-photo.html) -->
    <h4 class="text-ce central">记录下你的最美瞬间</h4>
    <div id="photoGallery" class="row central gallery">
      <!-- 列表为一次性追加不重排,index 作 key 可接受;后端补主键后应改用业务 id -->
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
    <!-- 「加载更多」按钮:替代原站 layui flow 的按钮式分页(门户列表页共用组件) -->
    <PortalLoadMore :loading="loading" :has-more="hasMore" @load="loadMore" />
  </div>
</template>
