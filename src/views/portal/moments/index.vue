<script setup lang="ts">
import { onMounted } from "vue";
import { getMoments, type MomentsItem } from "@/api/portal";
import { usePagedList } from "@/hooks/usePagedList";
import PortalLoadMore from "@/components/PortalLoadMore/index.vue";

defineOptions({ name: "PortalMoments" });

/** 门户「加载更多」分页加载(每页 6 条,与原站 PAGE_SIZE 一致) */
const { items, loading, hasMore, loadMore } =
  usePagedList<MomentsItem>(getMoments);

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
          <!-- 标题:数据模型无详情页,原站的可展开空链接改按纯文本渲染 -->
          <div class="top-title textOneHide">{{ it.title }}</div>
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
    <!-- 「加载更多」按钮:替代原站 layui flow 的按钮式分页(门户列表页共用组件) -->
    <PortalLoadMore :loading="loading" :has-more="hasMore" @load="loadMore" />
  </div>
</template>
