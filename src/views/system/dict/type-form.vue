<script setup lang="ts">
import { computed, ref } from "vue";
import { formRules } from "./utils/rule";
import type { TypeFormProps } from "./utils/types";

const props = withDefaults(defineProps<TypeFormProps>(), {
  formInline: () => ({
    title: "新增",
    id: undefined,
    dictCode: "",
    dictName: "",
    remark: ""
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

/** 修改时锁定字典编码(编码创建后不可改,对齐后端校验) */
const codeLocked = computed(() => newFormInline.value.title === "修改");

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
        :disabled="codeLocked"
        clearable
        placeholder="请输入字典编码(如 gender)"
      />
    </el-form-item>

    <el-form-item label="字典名称" prop="dictName">
      <el-input
        v-model="newFormInline.dictName"
        clearable
        placeholder="请输入字典名称"
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
