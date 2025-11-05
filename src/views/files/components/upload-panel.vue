<template>
  <div v-if="uploadStore.showPanel" class="upload-panel-wrapper">
    <div
      v-if="!uploadStore.isExpanded"
      class="upload-panel-collapsed"
      @click="uploadStore.toggleExpand"
    >
      <a-spin v-if="isUploading" :size="14" />
      <icon-check-circle-fill v-else style="color: rgb(var(--success-6))" />
      <span class="summary-text">{{ summaryText }}</span>
      <icon-close class="panel-icon" @click.stop="uploadStore.closePanel" />
    </div>

    <div v-else class="upload-panel-expanded">
      <div class="panel-header">
        <span class="summary-text">{{ summaryText }}</span>
        <div>
          <icon-close class="panel-icon" @click="uploadStore.closePanel" />
        </div>
      </div>

      <div class="panel-body">
        <div v-if="taskList.length === 0"> 没有更多内容了 </div>
        <div
          v-for="task in taskList"
          :key="task.id"
          class="task-item"
        >
          <icon-file :size="24" />
          <div class="task-info">
            <div class="file-name">{{ task.file.name }}</div>
            <a-progress
              v-if="task.status === 'uploading'"
              :percent="task.progress / 100"
              size="small"
              :style="{ width: '160px' }"
            />
            <span
              v-else-if="task.status === 'success'"
              class="status-text success"
            >
              已上传至 目标文件夹
            </span>
            <span v-else-if="task.status === 'error'" class="status-text error">
              {{ task.errorMessage }}
            </span>
          </div>
        </div>
      </div>

      <div class="panel-footer" @click="uploadStore.toggleExpand"> 收起 </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import {
    IconCheckCircleFill,
    IconFile,
    IconClose,
  } from '@arco-design/web-vue/es/icon';
  import { useUploadTaskStore } from '@/store';
  import { storeToRefs } from 'pinia';

  const uploadStore = useUploadTaskStore();
  const { taskList } = storeToRefs(uploadStore);

  const isUploading = computed(() =>
    uploadStore.taskList.some((t) => t.status === 'uploading')
  );

  const summaryText = computed(() => {
    const total = taskList.value.length;
    const completed = taskList.value.filter(
      (t) => t.status === 'success'
    ).length;

    if (isUploading.value) {
      return `正在上传... (${completed}/${total})`;
    }
    return `上传完成 · 共 ${total} 项`;
  });
</script>

<style lang="less" scoped>
  .upload-panel-wrapper {
    position: fixed;
    bottom: 24px;
    right: 100px;
    z-index: 1000;
    border-radius: 8px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08),
      0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
    background-color: var(--color-bg-popup);
    color: var(--color-text-1);
  }

  .panel-icon {
    cursor: pointer;
    color: var(--color-text-3);
    &:hover {
      color: var(--color-text-1);
    }
  }

  // 折叠样式
  .upload-panel-collapsed {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;

    .summary-text {
      flex: 1;
      font-size: 14px;
    }
  }

  .upload-panel-expanded {
    width: 360px; // 宽度
    max-height: 400px; // 最大高度
    display: flex;
    flex-direction: column;

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border-2);
      .summary-text {
        font-size: 14px;
        font-weight: 500;
      }
    }

    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .task-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-radius: 4px;
      &:hover {
        background-color: var(--color-fill-2);
      }
      .task-info {
        flex: 1;
        font-size: 13px;
        .file-name {
          margin-bottom: 4px;
        }
        .status-text {
          font-size: 12px;
          color: var(--color-text-3);
          &.success {
            color: rgb(var(--success-6));
          }
          &.error {
            color: rgb(var(--danger-6));
          }
        }
      }
    }

    .panel-footer {
      padding: 12px 16px;
      text-align: center;
      font-size: 14px;
      cursor: pointer;
      border-top: 1px solid var(--color-border-2);
      &:hover {
        background-color: var(--color-fill-2);
      }
    }
  }
</style>
