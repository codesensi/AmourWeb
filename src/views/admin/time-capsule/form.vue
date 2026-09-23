<script setup lang="ts">
import { computed, ref } from "vue";
import ReCol from "@/components/ReCol";
import { formRules } from "./utils/rule";
import type { FormProps } from "./utils/types";

// 时间胶囊表单(新增/修改共用):标题/信件内容/解锁时间;显隐仅新增可选,修改经列表开关维护
// 封存语义:已解锁的胶囊内容只读(时光不可回改)
const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    title: "",
    content: "",
    openTime: "",
    hidden: 0
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

/** 是否已解锁:解锁时间早于当前时间(与后端口径一致;空时间视为未解锁,补 T 后解析,Safari 兼容) */
const isUnlocked = computed(
  () =>
    newFormInline.value.openTime !== "" &&
    new Date(newFormInline.value.openTime.replace(" ", "T")) <= new Date()
);

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
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="newFormInline.title"
            maxlength="128"
            show-word-limit
            clearable
            placeholder="请输入标题"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="解锁时间" prop="openTime">
          <el-date-picker
            v-model="newFormInline.openTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择解锁时间"
            class="w-full!"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="信件内容" prop="content">
          <el-input
            v-model="newFormInline.content"
            type="textarea"
            :rows="6"
            maxlength="5000"
            show-word-limit
            :disabled="isUnlocked"
            :placeholder="
              isUnlocked
                ? '胶囊已解锁，信件内容封存生效，不再支持修改'
                : '请输入信件内容'
            "
          />
          <span v-if="isUnlocked" class="content-note">
            胶囊已解锁，信件内容封存生效，不再支持修改
          </span>
        </el-form-item>
      </re-col>
      <re-col v-if="!isUnlocked">
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

<style lang="scss" scoped>
.content-note {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
</style>
