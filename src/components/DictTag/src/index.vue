<script setup lang="ts">
import { computed } from "vue";
import { useDict } from "@/hooks/useDict";

type TagType = "success" | "warning" | "primary" | "info" | "danger";

defineOptions({ name: "DictTag", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 字典编码(如 gender、enable) */
    dictCode: string;
    /** 字典值(统一字符串比较;数字型值自动转换) */
    value: string | number | null | undefined;
    /** dict_value → el-tag type 颜色映射(如 { "1": "danger" }),未命中走默认样式 */
    tagMap?: Record<string, string>;
    /** el-tag 尺寸透传 */
    size?: "small" | "default" | "large";
    /** el-tag 形态透传 */
    effect?: "dark" | "light" | "plain";
  }>(),
  {
    tagMap: undefined,
    size: undefined,
    effect: undefined
  }
);

/** 组内条目(响应式);取数走查询层,key 携带编码,重复挂载不重复请求 */
const { options } = useDict(props.dictCode);

/** 反查展示标签;未命中回退为原值 */
const label = computed(() => {
  if (props.value == null || props.value === "") return "";
  const item = options.value.find(
    candidate => candidate.dictValue === String(props.value)
  );
  return item ? item.dictLabel : String(props.value);
});

/** el-tag 颜色类型(未命中为 undefined,走默认样式) */
const type = computed(
  () => props.tagMap?.[String(props.value)] as TagType | undefined
);
</script>

<template>
  <el-tag v-bind="$attrs" :size="size" :effect="effect" :type="type">
    {{ label }}
  </el-tag>
</template>
