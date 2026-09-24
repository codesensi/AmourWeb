<script setup lang="ts">
import { computed } from "vue";
import { useDict } from "@/hooks/useDict";
import { DICT_CODES } from "@/api/sys-dict";
import { hasMoodIcon, MOOD_PATHS } from "../utils/mood-icons";

defineOptions({ name: "MoodSelect", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 选中的心情编码(空=未选择:筛选时不过滤,表单提交后归一化为不标记) */
    modelValue?: string;
    /** 占位文案 */
    placeholder?: string;
    /** 是否可清空 */
    clearable?: boolean;
  }>(),
  { placeholder: "请选择", clearable: true }
);

const emit = defineEmits<{
  "update:modelValue": [value: string | undefined];
}>();

/** 心情字典:条目(标签/排序)由字典管理维护,图标取本地线描路径 */
const { options } = useDict(DICT_CODES.diaryMood);

/** 双向绑定:清空时原样透传(undefined/空串),由使用方决定语义——
 * 筛选框空值=不过滤;表单空值提交后由后端归一化为不标记(none) */
const model = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
</script>

<template>
  <el-select
    v-model="model"
    :placeholder="placeholder"
    :clearable="clearable"
    v-bind="$attrs"
  >
    <!-- 选中回显:标签插槽带上心情图标 -->
    <template #label="{ label, value }">
      <span class="mood-option">
        <svg
          v-if="hasMoodIcon(String(value))"
          class="mood-option-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path v-for="(d, i) in MOOD_PATHS[String(value)]" :key="d" :d="d" />
        </svg>
        <span>{{ label }}</span>
      </span>
    </template>
    <el-option
      v-for="item in options"
      :key="item.dictValue"
      :label="item.dictLabel"
      :value="item.dictValue"
    >
      <span class="mood-option">
        <svg
          v-if="hasMoodIcon(item.dictValue)"
          class="mood-option-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path v-for="(d, i) in MOOD_PATHS[item.dictValue]" :key="d" :d="d" />
        </svg>
        <span>{{ item.dictLabel }}</span>
      </span>
    </el-option>
  </el-select>
</template>

<style scoped>
/* 下拉选项/选中回显的心情图标行 */
.mood-option {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.mood-option-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}
</style>
