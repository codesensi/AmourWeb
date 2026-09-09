<script setup lang="ts">
import { ref, computed } from "vue";
import type { FormItemProps, FormProps } from "./utils/types";
import { DictTag } from "@/components/DictTag";
import { DictSelect } from "@/components/DictSelect";
import { usePublicHooks } from "../hooks";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    title: "修改",
    id: undefined,
    configKey: "",
    configValue: "",
    valueType: "STRING",
    configGroup: "",
    remark: ""
  })
});

const ruleFormRef = ref();
const { switchStyle } = usePublicHooks();
const newFormInline = ref(props.formInline);

/** 是否整数型配置(INTEGER/LONG 用数字输入框渲染,从源头杜绝非数字输入) */
const numericType = computed(() =>
  ["INTEGER", "LONG"].includes(newFormInline.value.valueType)
);
/** 是否布尔型配置(BOOLEAN 用开关渲染,值仍为字符串 true/false) */
const booleanValue = computed(
  () => newFormInline.value.valueType === "BOOLEAN"
);

/** 是否日期时间型配置(DATETIME 用时间选择器渲染,产出 yyyy-MM-dd HH:mm:ss 字符串) */
const datetimeValue = computed(
  () => newFormInline.value.valueType === "DATETIME"
);

/** 数字输入框与字符串值的桥接(清空回落为空串,交由必填校验拦截) */
const numericProxy = computed<number | undefined>({
  get: () => {
    const num = Number(newFormInline.value.configValue);
    return Number.isFinite(num) ? num : undefined;
  },
  set: value => {
    newFormInline.value.configValue = value == null ? "" : String(value);
  }
});

/** 布尔值编辑开关按消费侧归一化约定写入字符串 "true"/"false" */
const booleanProxy = computed<string>({
  get: () => newFormInline.value.configValue,
  set: value => (newFormInline.value.configValue = value)
});

/** 日期时间选择器与字符串值的桥接(清空回落为空串,交由必填校验拦截) */
const datetimeProxy = computed<string>({
  get: () => newFormInline.value.configValue,
  set: value => (newFormInline.value.configValue = value ?? "")
});

/** 配置键 → 字典编码(取值可枚举的配置项用字典下拉替代自由文本,与 init_dml.sql 字典种子对齐) */
const DICT_CODE_BY_CONFIG_KEY: Record<string, string> = {
  "captcha.image-type": "image-type"
};
/** 当前配置绑定的字典编码;未绑定字典的配置返回 undefined,按值类型走默认控件 */
const configDictCode = computed(
  () => DICT_CODE_BY_CONFIG_KEY[newFormInline.value.configKey ?? ""]
);

const formRules = computed(() => ({
  configValue: [{ required: true, message: "配置值为必填项", trigger: "blur" }]
}));

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-form-item label="配置键" prop="configKey">
      <el-input v-model="newFormInline.configKey" disabled />
    </el-form-item>

    <el-form-item label="值类型" prop="valueType">
      <DictTag dict-code="config-value-type" :value="newFormInline.valueType" />
      <span
        class="ml-2 text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
      >
        {{ newFormInline.remark }}
      </span>
    </el-form-item>

    <el-form-item label="配置值" prop="configValue">
      <DictSelect
        v-if="configDictCode"
        v-model="newFormInline.configValue"
        :dict-code="configDictCode"
        placeholder="请选择配置值"
        class="w-full!"
      />
      <el-switch
        v-else-if="booleanValue"
        v-model="booleanProxy"
        inline-prompt
        active-value="true"
        inactive-value="false"
        active-text="true"
        inactive-text="false"
        :style="switchStyle"
      />
      <el-input-number
        v-else-if="numericType"
        v-model="numericProxy"
        :precision="0"
        controls-position="right"
        class="w-full!"
      />
      <el-date-picker
        v-else-if="datetimeValue"
        v-model="datetimeProxy"
        type="datetime"
        value-format="YYYY-MM-DD HH:mm:ss"
        placeholder="请选择日期时间"
        class="w-full!"
      />
      <el-input
        v-else
        v-model="newFormInline.configValue"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 6 }"
        clearable
        placeholder="请输入配置值"
      />
    </el-form-item>
  </el-form>
</template>
