<template>
  <a-card :bordered="false" class="user-panel-card">
    <a-space :size="54">
      <a-upload
        :custom-request="customRequest"
        list-type="picture-card"
        :file-list="fileList"
        :show-upload-button="true"
        :show-file-list="false"
        @change="uploadChange"
      >
        <template #upload-button>
          <a-avatar :size="100" class="info-avatar">
            <template #trigger-icon>
              <icon-camera />
            </template>
            <img v-if="fileList.length" :src="fileList[0].url" />
          </a-avatar>
        </template>
      </a-upload>
      <a-descriptions
        :data="renderData"
        :column="2"
        align="right"
        layout="horizontal"
        :label-style="{
          width: '140px',
          fontWeight: 'normal',
          color: 'rgb(var(--gray-8))',
        }"
        :value-style="{
          width: '800px',
          paddingLeft: '8px',
          textAlign: 'left',
        }"
      >
        <template #label="{ label }">{{ label }} :</template>
        <template #value="{ value }">
          <a-typography-text class="desc-value">{{ value }}</a-typography-text>
        </template>
      </a-descriptions>
    </a-space>
  </a-card>
</template>

<script lang="ts" setup>
  import { ref, computed, watch } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import type {
    FileItem,
    RequestOption,
  } from '@arco-design/web-vue/es/upload/interfaces';
  import { useUserStore } from '@/store';
  import type { DescData } from '@arco-design/web-vue/es/descriptions/interface';
  import { maskEmail } from '@/utils/format';

  const userStore = useUserStore();

  // 格式化时间显示
  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 使用计算属性，使其响应式更新
  const renderData = computed(
    () =>
      [
        {
          label: '账号ID',
          value: userStore.id,
        },
        {
          label: '用户名',
          value: userStore.username,
        },
        {
          label: '昵称',
          value: userStore.nickname,
        },
        {
          label: '邮箱',
          value: maskEmail(userStore.email),
        },
        {
          label: '注册时间',
          value: formatDate(userStore.createdAt),
        },
        {
          label: '最后登录时间',
          value: formatDate(userStore.lastLoginAt),
        },
      ] as DescData[]
  );

  // 使用计算属性，使头像URL响应式更新
  const file = computed<FileItem>(() => ({
    uid: '-2',
    name: 'avatar.png',
    url: userStore.avatar,
  }));

  const fileList = ref<FileItem[]>([file.value]);
  const uploadChange = (fileItemList: FileItem[], fileItem: FileItem) => {
    fileList.value = [fileItem];
  };

  // 监听 userStore 的变化，更新 fileList
  watch(
    () => file.value.url,
    (newUrl) => {
      if (
        fileList.value[0]?.url !== newUrl &&
        !fileList.value[0]?.url?.startsWith('blob:')
      ) {
        fileList.value = [file.value];
      }
    }
  );
  const customRequest = (options: RequestOption) => {
    const controller = new AbortController();

    (async function requestWrap() {
      const { onProgress, onError, onSuccess, fileItem } = options;
      onProgress(20);

      try {
        // TODO: 实现头像上传API
        Message.info('头像上传功能待实现');
        onSuccess({ url: URL.createObjectURL(fileItem.file as Blob) });
      } catch (error) {
        onError(error);
      }
    })();
    return {
      abort() {
        controller.abort();
      },
    };
  };
</script>

<style scoped lang="less">
  .user-panel-card {
    border-radius: 4px;
    background-color: var(--color-bg-2);
    box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.08);
    :deep(.arco-card-body) {
      padding: 20px;
    }
  }

  .desc-value {
    color: rgb(var(--gray-10));
    font-weight: 500;
  }

  :deep(.arco-avatar-trigger-icon-button) {
    width: 32px;
    height: 32px;
    line-height: 32px;
    background-color: #e8f3ff;
    .arco-icon-camera {
      margin-top: 8px;
      color: rgb(var(--arcoblue-6));
      font-size: 14px;
    }
  }
</style>
