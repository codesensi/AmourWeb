<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { DictSelect } from "@/components/DictSelect";
import { DICT_CODES } from "@/api/sys-dict";
import {
  getRoleDataScope,
  saveRoleDataScope,
  type RoleDataScopeRow
} from "@/api/sys-role";

defineOptions({
  name: "RoleDataScopeDrawer"
});

const props = defineProps<{
  /** 抽屉可见性(v-model) */
  visible: boolean;
  /** 目标角色ID */
  roleId?: string;
  /** 目标角色名(标题展示) */
  roleName?: string;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
}>();

/** 行数据(含草稿态的档位选择) */
const rows = ref<Array<RoleDataScopeRow>>([]);
const loading = ref(false);
const saving = ref(false);
/** 是否超级管理员角色(整单置灰,数据范围由后端硬编码 all/all) */
const superAdmin = ref(false);

const loadData = async (roleId: string) => {
  loading.value = true;
  try {
    const result = await getRoleDataScope(roleId);
    rows.value = result.data ?? [];
    superAdmin.value = rows.value.some(row => row.superAdmin);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  value => {
    if (value && props.roleId) {
      loadData(props.roleId);
    }
  }
);

/** 可见范围变更联动:可见收窄为 self 时,可改范围同步收窄(可改不得宽于可见) */
const onVisibleChange = (row: Record<string, unknown>) => {
  if (row.visibleScope === "self") {
    row.editableScope = "self";
  }
};

const handleSave = async () => {
  if (!props.roleId) return;
  saving.value = true;
  try {
    await saveRoleDataScope({
      roleId: props.roleId,
      items: rows.value.map(row => ({
        module: row.module,
        visibleScope: row.visibleScope,
        editableScope: row.editableScope
      }))
    });
    message(`已保存角色「${props.roleName}」的数据权限`, { type: "success" });
    emit("update:visible", false);
  } finally {
    saving.value = false;
  }
};

const handleClose = () => {
  emit("update:visible", false);
};
</script>

<template>
  <el-drawer
    :model-value="visible"
    title="数据权限"
    size="560px"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
  >
    <div v-loading="loading" class="h-full flex flex-col">
      <el-alert
        v-if="superAdmin"
        title="超级管理员持有全部数据权限（系统内置，不可配置）"
        type="info"
        :closable="false"
        class="mb-3!"
      />
      <el-alert
        v-else
        title="可见范围控制列表展示的行，可改范围控制修改/删除等操作；未调整的模块按最小权限（仅本人）兜底。"
        type="info"
        :closable="false"
        class="mb-3!"
      />
      <el-table :data="rows" size="default" class="flex-1">
        <el-table-column
          prop="moduleDesc"
          label="业务模块"
          min-width="110"
          show-overflow-tooltip
        />
        <el-table-column label="可见范围" min-width="130">
          <template #default="{ row }">
            <DictSelect
              v-model="row.visibleScope"
              :dict-code="DICT_CODES.dataScope"
              :disabled="superAdmin || !hasPerms('system:role:scope')"
              class="w-full"
              @change="onVisibleChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="可改范围" min-width="130">
          <template #default="{ row }">
            <DictSelect
              v-model="row.editableScope"
              :dict-code="DICT_CODES.dataScope"
              :disabled="
                superAdmin ||
                !hasPerms('system:role:scope') ||
                row.visibleScope === 'self'
              "
              class="w-full"
            />
          </template>
        </el-table-column>
      </el-table>
      <div class="pt-3 text-right">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          v-if="!superAdmin && hasPerms('system:role:scope')"
          type="primary"
          :loading="saving"
          @click="handleSave"
        >
          保存
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>
