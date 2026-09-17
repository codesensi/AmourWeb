<script setup lang="ts">
import { PropType } from "vue";
import NoticeItem from "./NoticeItem.vue";
import type { NoticeItem as NoticeItemData } from "@/api/sys-notice";

defineProps({
  list: {
    type: Array as PropType<Array<NoticeItemData>>,
    default: () => []
  }
});

const emit = defineEmits<{ open: [item: NoticeItemData] }>();
</script>

<template>
  <NoticeItem
    v-for="(item, index) in list"
    :key="item.id"
    :noticeItem="item"
    :isLast="index === list.length - 1"
    @open="emit('open', $event)"
  />
</template>
