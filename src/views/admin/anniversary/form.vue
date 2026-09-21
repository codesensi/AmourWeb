<script setup lang="ts">
import ReCol from "@/components/ReCol";
import { formRules } from "./utils/rule";
import type { FormProps } from "./utils/types";
import { DICT_CODES } from "@/api/sys-dict";
import { DictSelect } from "@/components/DictSelect";
import { ref } from "vue";

// 纪念日表单(新增/修改共用):名称/类型(字典下拉)/日期/是否每年重复/排序/显隐
const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    title: "新增",
    name: "",
    type: "",
    anniversaryDate: "",
    repeatYearly: true,
    sort: 0,
    hidden: 0
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

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
    label-width="92px"
  >
    <el-row :gutter="30">
      <re-col>
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="newFormInline.name"
            maxlength="128"
            clearable
            placeholder="请输入纪念日名称"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="类型" prop="type">
          <DictSelect
            v-model="newFormInline.type"
            :dict-code="DICT_CODES.anniversaryType"
            placeholder="请选择类型"
            clearable
            class="w-full!"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="日期" prop="anniversaryDate">
          <el-date-picker
            v-model="newFormInline.anniversaryDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            class="w-full!"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="每年重复">
          <el-switch
            v-model="newFormInline.repeatYearly"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="排序">
          <el-input-number
            v-model="newFormInline.sort"
            :min="0"
            controls-position="right"
            class="w-full!"
          />
        </el-form-item>
      </re-col>
      <re-col v-if="newFormInline.title === '新增'">
        <el-form-item label="显隐">
          <el-switch
            v-model="newFormInline.hidden"
            inline-prompt
            :active-value="0"
            :inactive-value="1"
            active-text="显示"
            inactive-text="隐藏"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
