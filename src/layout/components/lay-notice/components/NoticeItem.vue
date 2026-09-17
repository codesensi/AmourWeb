<script setup lang="ts">
import type { NoticeItem } from "@/api/notice";

defineProps<{
  noticeItem: NoticeItem;
  isLast?: boolean;
}>();

const emit = defineEmits<{ open: [item: NoticeItem] }>();
</script>

<template>
  <div
    :class="[
      'notice-container',
      'border-0 border-solid border-[#f0f0f0] dark:border-[#303030]',
      { 'border-b': !isLast }
    ]"
    @click="emit('open', noticeItem)"
  >
    <div class="notice-container-text">
      <div class="notice-text-title text-[#000000d9] dark:text-white">
        <div class="notice-title-content font-bold">
          {{ noticeItem.title }}
        </div>
        <!-- 未读提醒:右上角常显;进入详情即转为已读 -->
        <el-tag
          v-if="!noticeItem.read"
          type="danger"
          size="small"
          class="notice-title-unread"
        >
          未读
        </el-tag>
      </div>
      <div class="notice-text-description">
        {{ noticeItem.content }}
      </div>
      <div class="notice-text-datetime text-[#00000073] dark:text-white">
        {{ noticeItem.createTime }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.notice-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 24px;
  cursor: pointer;

  /* 悬停加深,对齐用户列表(表格行)的悬停底色 */
  &:hover {
    background-color: var(--el-fill-color-light);
  }

  .notice-container-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: space-between;

    .notice-text-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 1.5715;

      .notice-title-content {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .notice-title-unread {
        flex: none;
        margin-left: 8px;
      }
    }

    .notice-text-description,
    .notice-text-datetime {
      font-size: 12px;
      line-height: 1.5715;
    }

    .notice-text-description {
      display: -webkit-box;
      overflow: hidden;
      text-overflow: ellipsis;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .notice-text-datetime {
      margin-top: 4px;
    }
  }
}
</style>
