<script setup lang="ts">
import { computed } from "vue";
import { useDict } from "@/hooks/useDict";

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

/** 组内条目(响应式);取数走查询层,key 携带编码,重复挂载不重复请求 */
const { options } = useDict(props.dictCode);

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
