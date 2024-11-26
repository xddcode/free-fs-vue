<template>
  <a-modal
    :visible="visible"
    :title="title"
    @cancel="handleCancel"
    @close="handleClose"
  >
    <a-form ref="formRef" :model="formData">
      <a-form-item
        field="username"
        label="账号"
        :rules="[{ required: true, message: '请输入账号' }]"
      >
        <a-input
          v-model="formData.username"
          placeholder="请输入账号"
          allow-clear
        />
      </a-form-item>
      <a-form-item
        field="email"
        label="邮箱"
        :rules="[{ required: true, message: '请输入邮箱' }]"
      >
        <a-input
          v-model="formData.email"
          placeholder="请输入邮箱"
          allow-clear
        />
      </a-form-item>

      <a-form-item
        field="roleCode"
        label="角色"
        :rules="[{ required: true, message: '请选择一个角色' }]"
      >
        <a-select
          v-model="formData.roleCode"
          :options="roleOptions"
          placeholder="请选择一个角色"
          allow-clear
        />
      </a-form-item>
      <a-form-item field="nickname" label="昵称">
        <a-input v-model="formData.nickname" placeholder="昵称" allow-clear />
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
  import { getRoleList, RoleRecord } from '@/api/role';
  import { SelectOptionData } from '@arco-design/web-vue/es/select/interface';
  import { UserParams } from '@/types/modules/user';

  const props = defineProps({
    visible: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      default: 'Edit/Create Form',
    },
    initialData: {
      type: Object as PropType<UserParams>,
      default: () => ({}),
    },
  });

  const emit = defineEmits(['update:visible', 'save', 'cancel']);

  const formRef = ref(null);

  const initialFormData = {
    username: '',
    email: '',
    nickname: '',
    roleCode: '',
  };

  const formData = reactive<UserParams>({ ...initialFormData });

  const roleOptions = ref<SelectOptionData[]>([]);

  const setRoleOptions = async () => {
    try {
      const { data } = await getRoleList();
      roleOptions.value = data.map((item: RoleRecord) => ({
        label: item.roleName,
        value: item.roleCode,
      }));
    } catch (error) {
      console.error('Failed to fetch role list:', error);
    }
  };

  const handleClose = () => {
    emit('update:visible', false);
  };

  const handleCancel = () => {
    handleClose();
    emit('cancel');
  };

  const resetForm = () => {
    formData.value = { ...initialFormData };
    if (formRef.value) {
      formRef.value.resetFields();
    }
  };

  const isEdit = computed(() => Object.keys(props.initialData).length > 0);

  watch(
    () => props.visible,
    (newVisible) => {
      if (newVisible) {
        if (isEdit.value) {
          formData.value = { ...props.initialData };
        } else {
          resetForm();
        }
        setRoleOptions();
      }
    }
  );
</script>
