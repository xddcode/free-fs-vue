<template>
  <a-modal
    :visible="visible"
    title="分享文件"
    :width="520"
    ok-text="生成分享链接"
    cancel-text="取消"
    :ok-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="share-content">
      <div class="file-info">
        <img
          :src="getFileIconPath(file?.isDir ? 'dir' : file?.suffix || '')"
          :alt="file?.displayName"
          class="file-icon"
        />
        <div class="info-text">
          <div class="file-name">{{ file?.displayName }}</div>
          <div class="file-size">{{ formatFileSize(file?.size || 0) }}</div>
        </div>
      </div>

      <a-divider />

      <a-form :model="form" layout="vertical">
        <a-form-item label="有效期" field="expireDays">
          <a-radio-group v-model="form.expireDays">
            <a-radio :value="1">1天</a-radio>
            <a-radio :value="7">7天</a-radio>
            <a-radio :value="30">30天</a-radio>
            <a-radio :value="0">永久</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>

      <!-- 分享链接展示 -->
      <div v-if="shareLink" class="share-result">
        <a-alert type="success" banner> 分享链接已生成 </a-alert>
        <div class="link-box">
          <a-input :model-value="shareLink" readonly class="link-input" />
          <a-button type="primary" @click="handleCopy">
            <template #icon>
              <icon-copy />
            </template>
            复制链接
          </a-button>
        </div>
        <div class="link-tip"> 分享链接将在 {{ getExpireText() }} 后失效 </div>
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, reactive, watch } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { IconCopy } from '@arco-design/web-vue/es/icon';
  import type { FileItem } from '@/types/modules/file';
  import { getFileIconPath } from '@/utils/file-icon';
  import { formatFileSize } from '../hooks/use-file-format';

  interface Props {
    visible: boolean;
    file?: FileItem | null;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'confirm', fileId: string, expireDays?: number): void;
  }>();

  const loading = ref(false);
  const shareLink = ref('');
  const form = reactive({
    expireDays: 7,
  });

  const handleOk = async () => {
    if (!props.file) return;

    loading.value = true;
    // 模拟生成分享链接
    setTimeout(() => {
      const baseUrl = window.location.origin;
      const shareId = Math.random().toString(36).substring(2, 15);
      shareLink.value = `${baseUrl}/share/${shareId}`;
      loading.value = false;

      emit(
        'confirm',
        props.file!.id,
        form.expireDays === 0 ? undefined : form.expireDays
      );
    }, 500);
  };

  const handleCancel = () => {
    shareLink.value = '';
    form.expireDays = 7;
    emit('update:visible', false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink.value);
      Message.success('链接已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      Message.error('复制失败，请手动复制');
    }
  };

  const getExpireText = () => {
    if (form.expireDays === 0) return '永不';
    if (form.expireDays === 1) return '1天';
    return `${form.expireDays}天`;
  };

  // 监听 visible 变化，重置状态
  watch(
    () => props.visible,
    (newVal) => {
      if (!newVal) {
        shareLink.value = '';
        form.expireDays = 7;
        loading.value = false;
      }
    }
  );
</script>

<style lang="less" scoped>
  .share-content {
    padding: 20px 0;

    .file-info {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background-color: var(--color-fill-2);
      border-radius: 8px;

      .file-icon {
        width: 48px;
        height: 48px;
        object-fit: contain;
      }

      .info-text {
        flex: 1;
        overflow: hidden;

        .file-name {
          font-size: 14px;
          color: var(--color-text-1);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 4px;
        }

        .file-size {
          font-size: 12px;
          color: var(--color-text-3);
        }
      }
    }

    :deep(.arco-divider) {
      margin: 20px 0;
    }

    :deep(.arco-form) {
      .arco-form-item-label-col {
        font-weight: 500;
      }
    }

    .share-result {
      margin-top: 20px;

      :deep(.arco-alert) {
        margin-bottom: 16px;
      }

      .link-box {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;

        .link-input {
          flex: 1;
        }
      }

      .link-tip {
        font-size: 13px;
        color: var(--color-text-3);
        text-align: center;
      }
    }
  }
</style>
