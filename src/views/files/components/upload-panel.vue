<template>
  <div>
    <!-- 隐藏的文件选择input -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      style="display: none"
      @change="handleFileSelect"
    />

    <a-button
      class="custom-upload-fab"
      type="primary"
      shape="circle"
      :style="{ bottom: fabButtonBottom }"
      @click="handleOpen"
    >
      <template #icon>
        <icon-upload :size="38" style="margin: auto" />
      </template>
    </a-button>

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

      <div v-else ref="expandedPanelRef" class="upload-panel-expanded">
        <div class="panel-header">
          <span class="summary-text">{{ summaryText }}</span>
          <div>
            <icon-close class="panel-icon" @click="uploadStore.closePanel" />
          </div>
        </div>

        <div class="panel-body">
          <div v-if="taskList.length === 0"> 没有更多内容了 </div>
          <div v-for="task in taskList" :key="task.id" class="task-item">
            <icon-file :size="24" />
            <div class="task-info">
              <div class="file-name">{{ task.file.name }}</div>
              <a-progress
                v-if="task.status === 'uploading'"
                :percent="task.progress"
                size="small"
                :style="{ width: '160px' }"
              />
              <span
                v-else-if="task.status === 'success'"
                class="status-text success"
              >
                已上传至 目标文件夹
              </span>
              <span
                v-else-if="task.status === 'error'"
                class="status-text error"
              >
                {{ task.errorMessage }}
              </span>
            </div>
          </div>
        </div>

        <div class="panel-footer" @click="uploadStore.toggleExpand"> 收起 </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import {
    IconCheckCircleFill,
    IconFile,
    IconClose,
    IconUpload,
  } from '@arco-design/web-vue/es/icon';
  import { useUploadTaskStore } from '@/store';
  import { storeToRefs } from 'pinia';
  import { uploadService } from '@/services/upload.service';

  interface Props {
    parentId?: string;
  }
  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'success'): void;
  }>();

  const fileInputRef = ref<HTMLInputElement | null>(null);
  const uploadStore = useUploadTaskStore();
  const { taskList } = storeToRefs(uploadStore);

  const handleOpen = () => {
    // 触发文件选择
    fileInputRef.value?.click();
  };

  const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const { files } = target;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      await uploadService.uploadFiles(fileArray, props.parentId);
      // 清空input，以便可以重复选择相同文件
      target.value = '';
      // 触发成功事件
      emit('success');
    }
  };

  const isUploading = computed(() =>
    uploadStore.taskList.some((t) => t.status === 'uploading')
  );

  const completedCount = computed(() => {
    return taskList.value.filter((t) => t.status === 'success').length;
  });

  watch(completedCount, (newCount, oldCount) => {
    if (newCount > oldCount) {
      emit('success');
    }
  });

  const summaryText = computed(() => {
    const total = taskList.value.length;
    const completed = completedCount.value;

    if (isUploading.value) {
      return `正在上传... (${completed}/${total})`;
    }
    return `上传完成 · 共 ${total} 项`;
  });

  const expandedPanelRef = ref<HTMLDivElement | null>(null);
  const panelObserver = ref<ResizeObserver | null>(null);
  const measuredPanelHeight = ref(0);

  watch(
    () => uploadStore.isExpanded,
    (isExpanded) => {
      if (isExpanded) {
        requestAnimationFrame(() => {
          if (!expandedPanelRef.value) return;

          panelObserver.value = new ResizeObserver((entries) => {
            if (entries[0]) {
              measuredPanelHeight.value = entries[0].contentRect.height;
            }
          });
          panelObserver.value.observe(expandedPanelRef.value);
        });
      } else {
        if (panelObserver.value) {
          panelObserver.value.disconnect();
          panelObserver.value = null;
        }
        measuredPanelHeight.value = 0;
      }
    }
  );

  /** 计算按钮样式 */
  const fabButtonBottom = computed(() => {
    const defaultBottom = 40;
    if (!uploadStore.showPanel) {
      return `${defaultBottom}px`;
    }
    const buttonSpacing = 14;
    if (!uploadStore.isExpanded) {
      return `${20 + defaultBottom + buttonSpacing}px`;
    }
    // 修改需要同步修改 .upload-panel-expanded
    const panelWrapperBottom = 24;
    return `${
      measuredPanelHeight.value + panelWrapperBottom + buttonSpacing
    }px`;
  });
</script>

<style lang="less" scoped>
  .custom-upload-fab {
    height: 56px;
    width: 56px;
    position: fixed;
    right: 40px;
    //bottom: 40px;
    z-index: 99;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .upload-panel-wrapper {
    position: fixed;
    bottom: 24px;
    right: 40px;
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
    transform-origin: bottom right;
    transform: scale(1);

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
