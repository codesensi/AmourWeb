<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import ReCol from "@/components/ReCol";
import RichEditor from "./components/RichEditor.vue";
import { getMomentsHistory } from "@/api/admin-moments";
import { formRules } from "./utils/rule";
import type { FormProps } from "./utils/types";

// 点点滴滴表单(新增/修改共用):标题/记录日期/分类/标签/排序/状态/富文本正文
// 作者不进表单:由后端取当前登录人填充(文章归属与登录者绑定)
// 分类/标签首版为自由输入 + 历史值下拉建议(不建字典,历史值来自 /admin/moments/history)
const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    title: "",
    recordDate: "",
    category: "",
    tags: "",
    sort: 0,
    status: 0,
    content: ""
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

/** 历史值建议(分类/标签,取自已发布文章的去重集合) */
const categorySuggestions = ref<string[]>([]);
const tagSuggestions = ref<string[]>([]);

onMounted(async () => {
  try {
    const res = await getMomentsHistory();
    categorySuggestions.value = res.data?.categories ?? [];
    tagSuggestions.value = res.data?.tags ?? [];
  } catch {
    // 建议接口失败不阻塞表单:历史值仅为辅助输入
  }
});

/** 过滤历史建议:输入即筛选,不区分大小写;回调契约见 EP AutocompleteFetchSuggestions */
const suggestOf = (source: string[], input: string) =>
  source
    .filter(item => item.toLowerCase().includes(input.toLowerCase()))
    .map(value => ({ value }));

/** 标签多选双向适配:表单契约是逗号分隔字符串,选择态为数组 */
const tagsModel = computed<string[]>({
  get: () =>
    newFormInline.value.tags ? newFormInline.value.tags.split(",") : [],
  set: list => {
    newFormInline.value.tags = list.join(",");
  }
});

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
      <re-col :value="12">
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="newFormInline.title"
            maxlength="256"
            show-word-limit
            placeholder="请输入文章标题"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12">
        <el-form-item label="记录日期" prop="recordDate">
          <el-date-picker
            v-model="newFormInline.recordDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择记录日期"
            class="w-full!"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12">
        <el-form-item label="分类" prop="category">
          <el-autocomplete
            v-model="newFormInline.category"
            :fetch-suggestions="
              query => suggestOf(categorySuggestions, String(query ?? ''))
            "
            clearable
            placeholder="输入或从历史分类中选择"
            class="w-full!"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12">
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="tagsModel"
            multiple
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            placeholder="输入回车添加,或从历史标签中选择"
            class="w-full!"
          >
            <el-option
              v-for="tag in tagSuggestions"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
      </re-col>
      <re-col :value="12">
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="newFormInline.sort"
            :min="0"
            :max="9999"
            controls-position="right"
            class="w-full!"
          />
        </el-form-item>
      </re-col>
      <!-- 状态仅新增时可选;修改经列表状态开关走 change-status 独立端点(对齐纪念日显隐惯例) -->
      <re-col v-if="!newFormInline.id" :value="12">
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="newFormInline.status"
            inline-prompt
            :active-value="0"
            :inactive-value="1"
            active-text="显示"
            inactive-text="隐藏"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="正文" prop="content">
          <RichEditor v-model="newFormInline.content" />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
