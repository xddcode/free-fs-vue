<template>
  <a-form
    ref="formRef"
    :model="formData"
    class="form"
    :label-col-props="{ span: 8 }"
    :wrapper-col-props="{ span: 16 }"
  >
    <a-form-item
      field="nickname"
      label="昵称"
      :rules="[
        {
          required: true,
          message: '请输入昵称',
        },
        {
          minLength: 2,
          maxLength: 20,
          message: '昵称长度为2-20个字符',
        },
      ]"
    >
      <a-input v-model="formData.nickname" placeholder="请输入昵称" />
    </a-form-item>
    <a-form-item>
      <a-space>
        <a-button type="primary" :loading="loading" @click="handleSave">
          保存
        </a-button>
        <a-button type="secondary" @click="reset"> 重置 </a-button>
      </a-space>
    </a-form-item>
  </a-form>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import type { FormInstance } from '@arco-design/web-vue';
  import { useUserStore } from '@/store';
  import { updateUserInfo } from '@/api/user';

  const userStore = useUserStore();
  const formRef = ref<FormInstance>();
  const loading = ref(false);
  const formData = ref({
    nickname: '',
  });

  // 初始化表单数据
  onMounted(() => {
    formData.value.nickname = userStore.nickname || '';
  });

  const handleSave = async () => {
    const res = await formRef.value?.validate();
    if (!res) {
      try {
        loading.value = true;
        await updateUserInfo({
          nickname: formData.value.nickname,
        });
        // 更新store中的用户信息
        userStore.setInfo({ nickname: formData.value.nickname });
        Message.success('昵称修改成功');
      } catch (error) {
        Message.error('昵称修改失败');
      } finally {
        loading.value = false;
      }
    }
  };

  const reset = async () => {
    formData.value.nickname = userStore.nickname || '';
    await formRef.value?.clearValidate();
  };
</script>

<style scoped lang="less">
  .form {
    width: 540px;
    margin: 0 auto;
    padding-top: 20px;
  }
</style>
