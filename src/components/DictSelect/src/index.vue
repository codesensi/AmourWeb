<script setup lang="ts">
import { computed } from "vue";
import { useDictStoreHook } from "@/store/modules/dict";

defineOptions({ name: "DictSelect", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 字典编码(sys_dict.dict_code,如 gender、enable) */
    dictCode: string;
    /** 选项值类型:string-原样绑定(dict_value 为 VARCHAR 默认),number-数字枚举绑定 */
    valueType?: "string" | "number";
  }>(),
  { valueType: "string" }
);

const store = useDictStoreHook();
store.load([props.dictCode]);

/** 组内条目(响应式,首次加载完成后自动更新) */
const options = computed(() => store.group(props.dictCode));

/** 依据 valueType 转换选项绑定值 */
function parseValue(dictValue: string) {
  return props.valueType === "number" ? Number(dictValue) : dictValue;
}
</script>

<template>
  <el-select v-bind="$attrs">
    <el-option
      v-for="item in options"
      :key="item.dictValue"
      :label="item.dictLabel"
      :value="parseValue(item.dictValue)"
    />
  </el-select>
</template>
