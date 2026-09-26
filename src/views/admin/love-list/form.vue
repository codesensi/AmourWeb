<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import ReAvatarUpload from "@/components/ReAvatarUpload";
import { formRules } from "./utils/rule";
import type { FormProps } from "./utils/types";
import { DICT_CODES } from "@/api/sys-dict";
import { useDict } from "@/hooks/useDict";

// 恋爱清单表单(新增/修改共用):内容/完成状态/纪念照/排序;显隐仅新增可选,修改经列表开关维护
const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    title: "新增",
    content: "",
    done: 0,
    photo: "",
    sort: 0,
    hidden: 0
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

/** 完成状态字典:开关文案统一取字典 label */
const { labelOf: doneLabelOf } = useDict(DICT_CODES.done);

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
        <el-form-item label="清单内容" prop="content">
          <el-input
            v-model="newFormInline.content"
            type="textarea"
            :rows="2"
            maxlength="256"
            show-word-limit
            clearable
            placeholder="请输入清单内容"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="完成状态" prop="done">
          <el-switch
            v-model="newFormInline.done"
            inline-prompt
            :active-value="1"
            :inactive-value="0"
            :active-text="doneLabelOf('1')"
            :inactive-text="doneLabelOf('0')"
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
        <el-form-item label="纪念照" prop="photo">
          <ReAvatarUpload
            v-model="newFormInline.photo"
            :size="96"
            biz-type="lovelist"
            label="纪念照"
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
