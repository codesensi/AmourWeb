<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import ReAvatarUpload from "@/components/ReAvatarUpload";
import { formRules } from "./utils/rule";
import type { FormProps } from "./utils/types";

// 恋爱画册照片表单(新增/修改共用):上传或填写地址 → 文案/日期/标签/排序;显隐仅新增可选,修改经列表开关维护
const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    title: "新增",
    url: "",
    caption: "",
    dateText: "",
    tags: [],
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
    label-width="82px"
  >
    <el-row :gutter="30">
      <re-col>
        <el-form-item label="照片" prop="url">
          <ReAvatarUpload
            v-model="newFormInline.url"
            :size="96"
            biz-type="photo"
            label="照片"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="照片文案" prop="caption">
          <el-input
            v-model="newFormInline.caption"
            type="textarea"
            :rows="2"
            maxlength="512"
            show-word-limit
            clearable
            placeholder="请输入照片文案"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="照片日期" prop="dateText">
          <el-date-picker
            v-model="newFormInline.dateText"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            class="w-full!"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="newFormInline.sort"
            :min="0"
            controls-position="right"
            class="w-full!"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="标签">
          <el-select
            v-model="newFormInline.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签后回车创建(如:旅行/日常/节日)"
            class="w-full"
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
