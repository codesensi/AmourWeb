<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import MoodSelect from "./components/MoodSelect.vue";
import { formRules } from "./utils/rule";
import type { FormProps } from "./utils/types";

// 情侣日记表单(新增/修改共用):记录日期/心情/日记内容
// 记录人不进表单:由后端取当前登录人填充(日记归属与登录者绑定)
const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    diaryDate: "",
    mood: "",
    content: ""
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
        <el-form-item label="记录日期" prop="diaryDate">
          <el-date-picker
            v-model="newFormInline.diaryDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择记录日期"
            class="w-full!"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="心情" prop="mood">
          <MoodSelect
            v-model="newFormInline.mood"
            placeholder="不标记"
            class="w-full!"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="日记内容" prop="content">
          <el-input
            v-model="newFormInline.content"
            type="textarea"
            :rows="8"
            maxlength="5000"
            show-word-limit
            placeholder="今天发生了什么值得记下的事?"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
