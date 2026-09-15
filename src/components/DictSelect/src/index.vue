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
// 仅在 setup 时按初始编码拉取一次:store 内部有缓存,重复挂载不重复请求;
// 当前所有调用方的 dictCode 均为静态字面量;若未来需要动态切换编码,
// 需改为 watch(dictCode, code => store.load([code]))
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
