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
    <a-form ref="userFormRef" :model="userFormData">
      <a-form-item
        field="username"
        label="账号"
        :rules="[{ required: true, message: '请输入账号' }]"
      >
        <a-input
          v-model="userFormData.username"
          placeholder="请输入账号"
          allow-clear
        />
      </a-form-item>
      <a-form-item
        field="email"
        label="邮箱"
        :rules="[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]"
      >
        <a-input
          v-model="userFormData.email"
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
          v-model="userFormData.roleCode"
          :options="roleOptions"
          placeholder="请选择一个角色"
          allow-clear
        />
      </a-form-item>
      <a-form-item field="nickname" label="昵称">
        <a-input
          v-model="userFormData.nickname"
          placeholder="昵称"
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
  import { addUser, editUser } from '@/api/user';
  import { getRoleList } from '@/api/role';
  import { SelectOptionData } from '@arco-design/web-vue/es/select/interface';
  import { UserParams } from '@/types/modules/user';
  import { RoleRecord } from '@/types/modules/role';
  import { Message } from '@arco-design/web-vue';

  const props = defineProps({
    visible: {
      type: Boolean,
      required: true,
    },
    editData: {
      type: Object as PropType<UserParams>,
      default: () => ({}),
    },
  });

  const emit = defineEmits(['update:visible', 'refresh']);

  const userFormRef = ref<any>(null);

  const getInitialFormData = (): UserParams => ({
    id: '',
    username: '',
    email: '',
    nickname: '',
    roleCode: '',
  });

  const userFormData = reactive<UserParams>(getInitialFormData());

  const resetForm = () => {
    Object.assign(userFormData, getInitialFormData());
    if (userFormRef.value) {
      userFormRef.value.resetFields();
    }
  };

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
    resetForm();
  };

  const handleCancel = () => {
    handleClose();
  };

  const isEdit = computed(() => Object.keys(props.editData).length > 0);

  const title = computed(() => (isEdit.value ? '编辑用户' : '创建用户'));

  const handleOk = () => {
    if (userFormRef.value) {
      userFormRef.value.validate().then(async (errors: any) => {
        if (!errors) {
          if (isEdit.value) {
            await editUser(userFormData);
            Message.success('用户编辑成功');
          } else {
            await addUser(userFormData);
            Message.success('用户创建成功');
          }
          handleClose();
          emit('refresh');
        }
      });
    }
  };

  const setEditData = (data: UserParams) => {
    Object.assign(userFormData, {
      id: data.id,
      username: data.username,
      email: data.email,
      nickname: data.nickname,
      roleCode: data.roleCode,
    });
  };

  watch(
    () => props.visible,
    (newVisible) => {
      if (newVisible) {
        setRoleOptions();
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
