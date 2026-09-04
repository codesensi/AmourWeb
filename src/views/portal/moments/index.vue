<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getMoments, type MomentsItem } from "@/api/portal";

defineOptions({ name: "PortalMoments" });

/** 门户列表每页条数(与原站 PAGE_SIZE 一致) */
const PAGE_SIZE = 6;

const items = ref<MomentsItem[]>([]);
const totalRow = ref(0);
const pageNumber = ref(0);
const loading = ref(false);

/** 是否还有更多数据(到底后隐藏「加载更多」) */
const hasMore = computed(() => items.value.length < totalRow.value);

async function loadMore() {
  if (loading.value) return;
  loading.value = true;
  try {
    const { success, data } = await getMoments({
      pageNumber: pageNumber.value + 1,
      pageSize: PAGE_SIZE
    });
    if (success) {
      items.value.push(...data.records);
      totalRow.value = data.totalRow;
      pageNumber.value = data.pageNumber;
    }
  } finally {
    loading.value = false;
  }
}

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
