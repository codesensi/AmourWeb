<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getLoveList, type LoveListItem } from "@/api/portal";

defineOptions({ name: "PortalLoveList" });

/** 门户列表每页条数(与原站 PAGE_SIZE 一致) */
const PAGE_SIZE = 6;

const items = ref<LoveListItem[]>([]);
const totalRow = ref(0);
const pageNumber = ref(0);
const loading = ref(false);

/** 是否还有更多数据(到底后隐藏「加载更多」) */
const hasMore = computed(() => items.value.length < totalRow.value);

async function loadMore() {
  if (loading.value) return;
  loading.value = true;
  try {
    const { success, data } = await getLoveList(
      pageNumber.value + 1,
      PAGE_SIZE
    );
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
      <h1>总有些惊奇的际遇 比方说当我遇见你</h1>
    </div>
    <div class="row central central-800">
      <div class="card col-lg-12 col-md-12 col-sm-12 col-sm-x-12">
        <div class="love-list-texts animated fadeInUp delay-03s">
          <div id="loveListBox" class="love-list-items">
            <!-- 清单项:完成项显成功图标(com)+success 样式+可选照片;未完成项 air 图标+unfinished 置灰 -->
            <ul>
              <li v-for="(it, i) in items" :key="i" class="item">
                <i
                  class="iconfont icon-chenggong2"
                  :class="it.done ? 'icon-done' : 'icon-todo'"
                />
                <span :class="it.done ? 'success' : 'unfinished'">
                  {{ it.text }}
                </span>
                <svg v-if="it.done" class="icon" aria-hidden="true">
                  <use xlink:href="#icon-tupian" />
                </svg>
                <ul>
                  <li>
                    <img
                      v-if="it.img"
                      :src="it.img"
                      :alt="it.text"
                      loading="lazy"
                    />
                  </li>
                </ul>
              </li>
            </ul>
            <div v-if="!loading && items.length === 0" class="portal-empty">
              暂无清单…
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 加载更多(替代原站 layui flow 的按钮式分页) -->
    <div v-if="hasMore" class="list-load-more" @click="loadMore">
      {{ loading ? "加载中..." : "加载更多" }}
    </div>
  </div>
</template>

<style scoped>
/* 「加载更多」按钮:替代原站 layui flow 的按钮式分页(与点点滴滴页一致) */
.list-load-more {
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

.list-load-more:hover {
  color: #ff69b4;
  border-color: #ff69b4;
}
</style>
