<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  getNoticeList,
  markNoticesRead,
  type NoticeItem
} from "@/api/sys-notice";
import NoticeList from "./components/NoticeList.vue";

import BellIcon from "~icons/lucide/bell";
import ArrowLeftIcon from "~icons/ri/arrow-left-s-line";

const dropdownRef = ref();
/** 通知列表(登录态接口;拉取失败静默降级为空态,与 fetchSysConfig 同款兜底风格) */
const notices = ref<Array<NoticeItem>>([]);
/** 当前查看的通知(空=列表视图,非空=详情视图) */
const currentNotice = ref<NoticeItem | null>(null);

/** 未读数(角标红点由它驱动) */
const unreadCount = computed(
  () => notices.value.filter(item => !item.read).length
);

onMounted(async () => {
  try {
    const res = await getNoticeList();
    notices.value = res.data ?? [];
  } catch {
    notices.value = [];
  }
});

/** 打开详情:进入即标记已读(未读时);标记失败则保持未读,下次进入可重试 */
const onOpen = async (item: NoticeItem) => {
  currentNotice.value = item;
  if (!item.read) {
    try {
      await markNoticesRead([item.id]);
      item.read = true;
    } catch {
      /* 静默降级:保持未读状态 */
    }
  }
};

/** 全部标记已读:接口幂等,成功后本地同步置为已读,避免二次拉取 */
const onMarkAsRead = async () => {
  await markNoticesRead();
  notices.value = notices.value.map(item => ({ ...item, read: true }));
};

/** 面板关闭即复位为列表视图:避免下次打开仍停留在上次未退出的详情 */
const onVisibleChange = (visible: boolean) => {
  if (!visible) {
    currentNotice.value = null;
  }
};
</script>

<template>
  <el-dropdown
    ref="dropdownRef"
    trigger="click"
    placement="bottom-end"
    @visible-change="onVisibleChange"
  >
    <span
      :class="['dropdown-badge', 'navbar-bg-hover', 'select-none', 'mr-1.75']"
    >
      <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0">
        <span class="header-notice-icon">
          <IconifyIconOffline :icon="BellIcon" />
        </span>
      </el-badge>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-empty
          v-if="notices.length === 0"
          description="暂无消息"
          :image-size="60"
          style="width: 330px"
        />
        <!-- 详情视图:点击列表条目进入,返回回到列表 -->
        <div
          v-else-if="currentNotice"
          class="noticeDetail-container"
          style="width: 330px"
        >
          <div class="m-1">
            <el-button
              type="primary"
              size="small"
              text
              @click="currentNotice = null"
            >
              <IconifyIconOffline :icon="ArrowLeftIcon" />
              返回
            </el-button>
          </div>
          <div class="px-6 pb-4">
            <div
              class="text-sm font-bold mb-1 text-[#000000d9] dark:text-white"
            >
              {{ currentNotice.title }}
            </div>
            <div class="text-xs mb-2 text-[#00000073] dark:text-white">
              {{ currentNotice.createTime }}
            </div>
            <div
              class="text-sm whitespace-pre-wrap text-[#000000d9] dark:text-white"
            >
              {{ currentNotice.content }}
            </div>
          </div>
        </div>
        <template v-else>
          <el-scrollbar max-height="345px">
            <div class="noticeList-container" style="width: 330px">
              <NoticeList :list="notices" @open="onOpen" />
            </div>
          </el-scrollbar>
          <div
            v-if="notices.length > 0"
            class="border-t border-t-(--el-border-color-light) text-sm"
          >
            <div class="flex justify-end m-1">
              <el-button type="primary" size="small" text @click="onMarkAsRead">
                全部已读
              </el-button>
            </div>
          </div>
        </template>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
/* ”铃铛“摇晃衰减动画 */
@keyframes pure-bell-ring {
  0%,
  100% {
    transform-origin: top;
  }

  15% {
    transform: rotateZ(10deg);
  }

  30% {
    transform: rotateZ(-10deg);
  }

  45% {
    transform: rotateZ(5deg);
  }

  60% {
    transform: rotateZ(-5deg);
  }

  75% {
    transform: rotateZ(2deg);
  }
}

.dropdown-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 48px;
  cursor: pointer;

  .header-notice-icon {
    font-size: 16px;
  }

  &:hover {
    .header-notice-icon svg {
      animation: pure-bell-ring 1s both;
    }
  }
}

.noticeList-container {
  padding: 15px 0 0;
}

.noticeDetail-container {
  padding: 8px 0 0;
}
</style>
