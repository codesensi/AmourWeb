<script setup lang="ts">
import { ref, computed } from "vue";
import type { FormItemProps, FormProps } from "./utils/types";
import { usePublicHooks } from "../hooks";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    title: "修改",
    id: undefined,
    configKey: "",
    configValue: "",
    valueType: "STRING",
    configGroup: "",
    status: 0,
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

const formRules = computed(() => ({
  configValue: [
    { required: true, message: "配置值为必填项", trigger: "blur" }
  ]
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
      <el-tag effect="plain">{{ newFormInline.valueType }}</el-tag>
      <span
        class="ml-2 text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
      >
        {{ newFormInline.remark }}
      </span>
    </el-form-item>

    <el-form-item label="配置值" prop="configValue">
      <el-switch
        v-if="booleanValue"
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
        class="!w-full"
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

    <el-form-item label="状态">
      <el-switch
        v-model="newFormInline.status"
        inline-prompt
        :active-value="0"
        :inactive-value="1"
        active-text="启用"
        inactive-text="禁用"
        :style="switchStyle"
      />
    </el-form-item>
  </el-form>
</template>
