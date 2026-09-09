<script setup lang="ts">
import { onMounted } from "vue";
import { getMoments, type MomentsItem } from "@/api/portal";
import { usePagedList } from "@/hooks/usePagedList";

defineOptions({ name: "PortalMoments" });

/** 门户「加载更多」分页加载(每页 6 条,与原站 PAGE_SIZE 一致) */
const { items, loading, hasMore, loadMore } = usePagedList<MomentsItem>(
  getMoments
);

onMounted(() => loadMore());
</script>

<template>
  <div class="central">
    <div class="title">
      <h1>有人愿意听你碎碎念念也很浪漫</h1>
    </div>
    <div id="momentsBox" class="row central central-800">
      <div
        v-for="it in items"
        :key="it.id"
        class="card col-lg-12 col-md-12 col-sm-12 col-sm-x-12"
      >
        <div class="moments-texts">
          <a href="javascript:void(0)" :data-id="it.id">
            <div class="top-title textOneHide">
              {{ it.title }}
              <svg class="moments-icon" aria-hidden="true">
                <use xlink:href="#icon-zhankai" />
              </svg>
            </div>
          </a>
          <div class="info">
            <span>
              <svg class="moments-icon" aria-hidden="true">
                <use xlink:href="#icon-shoucang" />
              </svg>
              {{ it.author }} <i>记录于</i> {{ it.date }}
            </span>
          </div>
        </div>
      </div>
      <div v-if="!loading && items.length === 0" class="portal-empty">
        暂无记录…
      </div>
    </div>
    <div v-if="hasMore" class="moments-load-more" @click="loadMore">
      {{ loading ? "加载中..." : "加载更多" }}
    </div>
  </div>
</template>

<style scoped>
/* 「加载更多」按钮:替代原站 layui flow 的按钮式分页 */
.moments-load-more {
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

.moments-load-more:hover {
  color: #ff69b4;
  border-color: #ff69b4;
}
</style>
