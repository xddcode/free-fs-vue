<template>
  <a-modal
    :visible="visible"
    :title="title"
    :mask-closable="false"
    ok-text="提交"
    @ok="handleOk"
    @cancel="handleCancel"
    @close="handleClose"
  >
    <a-form ref="roleFormRef" :model="roleFormData">
      <a-form-item
        field="roleCode"
        label="角色编码"
        :rules="[{ required: true, message: '请输入角色编码' }]"
      >
        <a-input
          v-model="roleFormData.roleCode"
          placeholder="请输入角色编码"
          allow-clear
        />
      </a-form-item>
      <a-form-item
        field="roleName"
        label="角色名称"
        :rules="[{ required: true, message: '请输入角色名称' }]"
      >
        <a-input
          v-model="roleFormData.roleName"
          placeholder="请输入角色名称"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
  import {
    ref,
    watch,
    defineProps,
    defineEmits,
    PropType,
    computed,
    reactive,
  } from 'vue';
  import { addRole, editRole } from '@/api/role';
  import { RoleParams } from '@/types/modules/role';
  import { Message } from '@arco-design/web-vue';

  const props = defineProps({
    visible: {
      type: Boolean,
      required: true,
    },
    editData: {
      type: Object as PropType<RoleParams>,
      default: () => ({}),
    },
  });

  const emit = defineEmits(['update:visible', 'refresh']);

  const roleFormRef = ref<any>(null);

  const getInitialFormData = (): RoleParams => ({
    roleCode: '',
    roleName: '',
    menuIds: [],
  });

  const roleFormData = reactive<RoleParams>(getInitialFormData());

  const resetForm = () => {
    Object.assign(roleFormData, getInitialFormData());
    if (roleFormRef.value) {
      roleFormRef.value.resetFields();
    }
  };

  const handleClose = () => {
    emit('update:visible', false);
    resetForm();
  };

  const handleCancel = () => {
    handleClose();
  };

  const isEdit = computed(() => Object.keys(props.editData).length > 0);

  const title = computed(() => (isEdit.value ? '编辑角色' : '创建角色'));

  const handleOk = () => {
    if (roleFormRef.value) {
      roleFormRef.value.validate().then(async (errors: any) => {
        if (!errors) {
          if (isEdit.value) {
            await editRole(roleFormData);
            Message.success('角色编辑成功');
          } else {
            await addRole(roleFormData);
            Message.success('角色创建成功');
          }
          handleClose();
          emit('refresh');
        }
      });
    }
  };

  const setEditData = (data: RoleParams) => {
    Object.assign(roleFormData, {
      id: data.id,
      roleCode: data.roleCode,
      roleName: data.roleName,
    });
  };

  watch(
    () => props.visible,
    (newVisible) => {
      if (newVisible) {
        if (isEdit.value) {
          setEditData(props.editData);
        } else {
          resetForm();
        }
      } else {
        resetForm();
      }
    }
  );

  watch(
    () => props.editData,
    (newEditData) => {
      if (Object.keys(newEditData).length > 0) {
        setEditData(newEditData);
      }
    }
  );
</script>
