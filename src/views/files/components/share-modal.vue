<template>
  <a-modal
    :visible="visible"
    :title="isBatchShare ? `分享 ${fileCount} 个文件` : '分享文件'"
    :width="520"
    :ok-text="shareLink ? '复制链接' : '生成分享链接'"
    cancel-text="取消"
    :ok-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="share-content">
      <div v-if="!isBatchShare" class="file-info">
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
      <div v-else class="batch-share-info">
        <div class="file-preview-list">
          <div
            v-for="previewFile in displayFiles"
            :key="previewFile.id"
            class="preview-file-item"
          >
            <img
              :src="
                getFileIconPath(
                  previewFile.isDir ? 'dir' : previewFile.suffix || ''
                )
              "
              :alt="previewFile.displayName"
              class="preview-file-icon"
            />
            <span class="preview-file-name">{{ previewFile.displayName }}</span>
          </div>
        </div>
        <div class="files-count-tip">
          {{ filesCountText }}
        </div>
      </div>

      <a-divider />

      <a-form :model="form" layout="vertical">
        <a-form-item label="有效期" field="expireType">
          <a-radio-group v-model="form.expireType" :disabled="!!shareLink">
            <a-radio :value="1">7天</a-radio>
            <a-radio :value="2">30天</a-radio>
            <a-radio :value="3">自定义</a-radio>
            <a-radio :value="4">永久</a-radio>
          </a-radio-group>
          <a-date-picker
            v-if="form.expireType === 3"
            v-model="form.customExpireTime"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disabledDate"
            :disabled-time="disabledTime as any"
            :disabled="!!shareLink"
            placeholder="请选择过期时间"
            style="width: 100%; margin-top: 12px"
          />
        </a-form-item>

        <a-form-item label="分享类型" field="needShareCode">
          <a-radio-group v-model="form.needShareCode" :disabled="!!shareLink">
            <a-radio :value="false">公开分享</a-radio>
            <a-radio :value="true">私密分享</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="分享权限" field="scope">
          <a-checkbox-group v-model="form.scopeList" :disabled="!!shareLink">
            <a-checkbox value="preview">预览</a-checkbox>
            <a-checkbox value="download">下载</a-checkbox>
          </a-checkbox-group>
        </a-form-item>

        <a-form-item label="最大查看次数" field="maxViewCount">
          <div class="form-item-with-input">
            <a-radio-group
              v-model="form.maxViewCountType"
              :disabled="!!shareLink"
            >
              <a-radio value="unlimited">不限制</a-radio>
              <a-radio value="custom">自定义</a-radio>
            </a-radio-group>
            <a-input-number
              v-if="form.maxViewCountType === 'custom'"
              v-model="form.maxViewCount"
              :min="1"
              :disabled="!!shareLink"
              placeholder="请输入次数"
              style="width: 150px; margin-left: 12px"
            />
          </div>
        </a-form-item>

        <a-form-item label="最大下载次数" field="maxDownloadCount">
          <div class="form-item-with-input">
            <a-radio-group
              v-model="form.maxDownloadCountType"
              :disabled="!!shareLink"
            >
              <a-radio value="unlimited">不限制</a-radio>
              <a-radio value="custom">自定义</a-radio>
            </a-radio-group>
            <a-input-number
              v-if="form.maxDownloadCountType === 'custom'"
              v-model="form.maxDownloadCount"
              :min="1"
              :disabled="!!shareLink"
              placeholder="请输入次数"
              style="width: 150px; margin-left: 12px"
            />
          </div>
        </a-form-item>
      </a-form>

      <!-- 分享链接展示 -->
      <div v-if="shareLink" class="share-result">
        <a-alert type="success" banner> 分享链接已生成 </a-alert>
        <div class="link-box">
          <a-textarea
            :model-value="getShareText()"
            readonly
            :auto-size="{ minRows: shareCode ? 2 : 1 }"
            class="link-input"
          />
        </div>
        <div class="link-tip">
          <template v-if="isPermanentShare()">
            分享链接永久有效
          </template>
          <template v-else>
            分享链接将在 {{ getExpireText() }} 后失效
          </template>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, reactive, watch, computed } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { shareFiles } from '@/api/share';
  import type { FileItem } from '@/types/modules/file';
  import { getFileIconPath } from '@/utils/file-icon';
  import { formatFileSize } from '../hooks/use-file-format';

  interface Props {
    visible: boolean;
    file?: FileItem | null;
    files?: FileItem[] | null;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'success'): void;
  }>();

  const loading = ref(false);
  const shareLink = ref('');
  const shareCode = ref('');
  const shareExpireTime = ref('');
  const isPermanent = ref(false);
  const form = reactive({
    expireType: 1,
    customExpireTime: '',
    needShareCode: false,
    maxViewCountType: 'unlimited' as 'unlimited' | 'custom',
    maxViewCount: undefined as number | undefined,
    maxDownloadCountType: 'unlimited' as 'unlimited' | 'custom',
    maxDownloadCount: undefined as number | undefined,
    scopeList: ['preview'] as string[],
  });

  // 是否是批量分享
  const isBatchShare = ref(false);
  const fileCount = ref(0);
  // 用于预览的文件列表（最多显示3个）
  const displayFiles = ref<FileItem[]>([]);

  // 文件数量提示文本
  const filesCountText = computed(() => {
    const total = props.files?.length || 0;
    if (total > 3) {
      return `等 ${total} 个文件`;
    }
    return `共 ${total} 个文件`;
  });

  // 重置表单
  const resetForm = () => {
    shareLink.value = '';
    shareCode.value = '';
    shareExpireTime.value = '';
    isPermanent.value = false;
    form.expireType = 1;
    form.customExpireTime = '';
    form.needShareCode = false;
    form.maxViewCountType = 'unlimited';
    form.maxViewCount = undefined;
    form.maxDownloadCountType = 'unlimited';
    form.maxDownloadCount = undefined;
    form.scopeList = ['preview'];
  };

  // 禁用过去的日期
  const disabledDate = (current?: Date) => {
    if (!current) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return current < today;
  };

  // 禁用过去的时间
  const disabledTime = (current: Date) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 如果是今天，禁用过去的时间
    if (current.getTime() === today.getTime()) {
      return {
        disabledHours: () => {
          const hours = [];
          for (let i = 0; i < now.getHours(); i += 1) {
            hours.push(i);
          }
          return hours;
        },
        disabledMinutes: (selectedHour: number) => {
          if (selectedHour === now.getHours()) {
            const minutes = [];
            for (let i = 0; i < now.getMinutes(); i += 1) {
              minutes.push(i);
            }
            return minutes;
          }
          return [];
        },
        disabledSeconds: (selectedHour: number, selectedMinute: number) => {
          if (
            selectedHour === now.getHours() &&
            selectedMinute === now.getMinutes()
          ) {
            const seconds = [];
            for (let i = 0; i < now.getSeconds(); i += 1) {
              seconds.push(i);
            }
            return seconds;
          }
          return [];
        },
      };
    }
    return {};
  };

  // 获取分享文本
  const getShareText = () => {
    if (shareCode.value) {
      return `${shareLink.value}\n提取码：${shareCode.value}`;
    }
    return shareLink.value;
  };

  const handleCopy = async () => {
    try {
      const text = getShareText();
      await navigator.clipboard.writeText(text);
      Message.success(
        shareCode.value ? '链接和提取码已复制到剪贴板' : '链接已复制到剪贴板'
      );
    } catch (error) {
      Message.error('复制失败，请手动复制');
    }
  };

  const handleOk = async () => {
    // 获取要分享的文件ID列表
    const targetFiles = props.files || (props.file ? [props.file] : []);
    if (targetFiles.length === 0) return;

    // 如果已经生成链接，点击按钮则复制
    if (shareLink.value) {
      await handleCopy();
      return;
    }

    // 验证自定义时间
    if (form.expireType === 3 && !form.customExpireTime) {
      Message.warning('请选择过期时间');
      return;
    }

    // 验证自定义次数
    if (form.maxViewCountType === 'custom' && !form.maxViewCount) {
      Message.warning('请输入最大查看次数');
      return;
    }

    if (form.maxDownloadCountType === 'custom' && !form.maxDownloadCount) {
      Message.warning('请输入最大下载次数');
      return;
    }

    loading.value = true;

    try {
      const fileIds = targetFiles.map((f) => f.id);

      // 构建 scope 字符串：将选中的权限用逗号拼接
      const scope = form.scopeList.join(',');

      const params = {
        fileIds,
        expireType: form.expireType,
        expireTime: form.expireType === 3 ? form.customExpireTime : undefined,
        needShareCode: form.needShareCode,
        maxViewCount:
          form.maxViewCountType === 'custom' ? form.maxViewCount : undefined,
        maxDownloadCount:
          form.maxDownloadCountType === 'custom'
            ? form.maxDownloadCount
            : undefined,
        scope,
      };

      const { data } = await shareFiles(params);

      // 前端根据 shareToken 拼接完整的分享链接
      const shareToken = data.id;
      const baseUrl = window.location.origin;
      shareLink.value = `${baseUrl}/s/${shareToken}`;
      shareCode.value = data.shareCode || '';
      shareExpireTime.value = data.expireTime || '';
      isPermanent.value = data.isPermanent;

      const successMsg =
        fileIds.length === 1
          ? '分享链接已生成'
          : `成功生成 ${fileIds.length} 个文件的分享链接`;
      Message.success(successMsg);
      emit('success');
    }finally {
      loading.value = false;
    }
  };

  const handleCancel = () => {
    resetForm();
    emit('update:visible', false);
  };

  const isPermanentShare = () => {
    // 如果已经有分享链接，使用后端返回的 isPermanent 字段
    if (shareLink.value) {
      return isPermanent.value;
    }
    // 如果还没有生成链接，根据表单选择判断
    return form.expireType === 4;
  };

  const getExpireText = () => {
    if (shareExpireTime.value) {
      return shareExpireTime.value;
    }
    if (form.expireType === 4) return '永不';
    if (form.expireType === 3 && form.customExpireTime) {
      return form.customExpireTime;
    }
    if (form.expireType === null) return '未知';
    const expireMap: Record<number, string> = {
      1: '7天',
      2: '30天',
    };
    return expireMap[form.expireType] || '未知';
  };

  // 监听 visible 变化，重置状态
  watch(
    () => props.visible,
    (newVal) => {
      if (newVal) {
        // 弹窗打开时，判断是否为批量分享
        isBatchShare.value = !!(props.files && props.files.length > 0);
        fileCount.value = props.files?.length || 1;
        // 设置预览文件列表（最多显示3个）
        displayFiles.value = props.files ? props.files.slice(0, 3) : [];
      } else {
        resetForm();
        loading.value = false;
        isBatchShare.value = false;
        fileCount.value = 0;
        displayFiles.value = [];
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

    .batch-share-info {
      .file-preview-list {
        display: flex;
        justify-content: center;
        gap: 24px;
        padding: 24px 16px;
        background-color: var(--color-fill-1);
        border-radius: 8px;

        .preview-file-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 80px;

          .preview-file-icon {
            width: 64px;
            height: 64px;
            object-fit: contain;
          }

          .preview-file-name {
            font-size: 12px;
            color: var(--color-text-2);
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
            line-height: 1.4;
          }
        }
      }

      .files-count-tip {
        margin-top: 16px;
        text-align: center;
        font-size: 14px;
        color: var(--color-text-3);
      }
    }

    :deep(.arco-divider) {
      margin: 20px 0;
    }

    :deep(.arco-form) {
      .arco-form-item-label-col {
        font-weight: 500;
      }

      .arco-radio-group {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
    }

    .form-item-with-input {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;

      :deep(.arco-input-number) {
        flex-shrink: 0;
      }
    }

    .share-type-tip {
      margin-top: 8px;
      font-size: 12px;
      color: var(--color-text-3);
      line-height: 1.5;
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
        align-items: flex-start;

        .link-input {
          flex: 1;
        }

        :deep(.arco-textarea) {
          resize: none;
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
