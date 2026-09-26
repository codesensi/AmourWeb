<script setup lang="ts">
import ReCol from "@/components/ReCol";
import ReAvatarUpload from "@/components/ReAvatarUpload";
import MapPicker from "@/components/MapPicker";
import { formRules } from "./utils/rule";
import type { FormProps } from "./utils/types";
import { computed, ref } from "vue";

// 足迹表单(新增/修改共用):地图选点或手动录入城市/经纬度 → 到访日期/照片/备注
const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    title: "新增",
    city: "",
    placeName: "",
    degraded: false,
    longitude: null,
    latitude: null,
    arrivalDate: "",
    hidden: 0,
    photoUrl: "",
    remark: ""
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

/** 城市输入提示:按高德服务状态切换(MapPicker 外泄的降级标记驱动) */
const cityPlaceholder = computed(() =>
  newFormInline.value.degraded
    ? "精确地点搜索选中后自动回填，也可手动输入城市名"
    : "精确地点搜索选中或地图点选后自动回填，也可手动输入城市名"
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
        <el-form-item label="城市" prop="city">
          <el-input
            v-model="newFormInline.city"
            maxlength="128"
            clearable
            :placeholder="cityPlaceholder"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="精确地点">
          <MapPicker
            v-model:longitude="newFormInline.longitude"
            v-model:latitude="newFormInline.latitude"
            v-model:city="newFormInline.city"
            v-model:placeName="newFormInline.placeName"
            @update:degraded="v => (newFormInline.degraded = v)"
            class="w-full"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="到访日期" prop="arrivalDate">
          <el-date-picker
            v-model="newFormInline.arrivalDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
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
      <re-col>
        <el-form-item label="照片" prop="photoUrl">
          <ReAvatarUpload
            v-model="newFormInline.photoUrl"
            :size="96"
            biz-type="footprint"
            label="足迹照片"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="newFormInline.remark"
            type="textarea"
            :rows="2"
            maxlength="512"
            show-word-limit
            clearable
            placeholder="记录这段旅程的点滴(选填)"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
