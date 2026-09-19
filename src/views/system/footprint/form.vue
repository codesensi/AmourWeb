<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import ReAvatarUpload from "@/components/ReAvatarUpload";
import MapPicker from "@/components/MapPicker";
import { formRules } from "./utils/rule";
import type { FormProps } from "./utils/types";

// 足迹表单(新增/修改共用):地图选点或手动录入城市/经纬度 → 到访日期/照片/备注
const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    title: "新增",
    city: "",
    placeName: "",
    longitude: null,
    latitude: null,
    arrivalDate: "",
    photoUrl: "",
    remark: ""
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
        <el-form-item label="城市" prop="city">
          <el-input
            v-model="newFormInline.city"
            maxlength="128"
            clearable
            placeholder="地图选点后自动填充,或手动输入(如:成都)"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="地图选点">
          <MapPicker
            v-model:longitude="newFormInline.longitude"
            v-model:latitude="newFormInline.latitude"
            v-model:city="newFormInline.city"
            v-model:placeName="newFormInline.placeName"
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
      <re-col>
        <el-form-item label="照片" prop="photoUrl">
          <ReAvatarUpload
            v-model="newFormInline.photoUrl"
            :size="96"
            biz-type="photo"
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
