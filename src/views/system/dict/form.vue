<script setup lang="ts">
import { ref, computed } from "vue";
import { formRules } from "./utils/rule";
import { FormProps } from "./utils/types";
import { usePublicHooks } from "../hooks";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    title: "新增",
    id: undefined,
    dictCode: "",
    dictName: "",
    dictValue: "",
    dictLabel: "",
    sort: 1,
    status: 0,
    builtin: 0,
    remark: ""
  })
});

const ruleFormRef = ref();
const { switchStyle } = usePublicHooks();
const newFormInline = ref(props.formInline);

/** 内置行(builtin=1)编辑时锁定编码与值,仅允许改名称/标签/排序/备注 */
const locked = computed(() => props.formInline.builtin === 1);

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
    <el-form-item label="字典编码" prop="dictCode">
      <el-input
        v-model="newFormInline.dictCode"
        :disabled="locked"
        clearable
        placeholder="请输入字典编码"
      />
    </el-form-item>

    <el-form-item label="字典名称" prop="dictName">
      <el-input
        v-model="newFormInline.dictName"
        clearable
        placeholder="请输入字典名称"
      />
    </el-form-item>

    <el-form-item label="字典值" prop="dictValue">
      <el-input
        v-model="newFormInline.dictValue"
        :disabled="locked"
        clearable
        placeholder="请输入字典值"
      />
    </el-form-item>

    <el-form-item label="字典标签" prop="dictLabel">
      <el-input
        v-model="newFormInline.dictLabel"
        clearable
        placeholder="请输入字典标签"
      />
    </el-form-item>

    <el-form-item label="排序" prop="sort">
      <el-input-number
        v-model="newFormInline.sort"
        :min="0"
        controls-position="right"
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

    <el-form-item label="备注">
      <el-input
        v-model="newFormInline.remark"
        placeholder="请输入备注信息"
        type="textarea"
      />
    </el-form-item>
  </el-form>
</template>
