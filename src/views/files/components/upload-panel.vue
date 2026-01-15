<template>
  <div>
    <div v-if="showPanel" class="upload-panel-wrapper">
      <div
        v-if="!isExpanded"
        class="upload-panel-collapsed"
        @click="toggleExpand"
      >
        <a-spin v-if="isUploading" :size="14" />
        <icon-check-circle-fill v-else style="color: rgb(var(--success-6))" />
        <span class="summary-text">{{ summaryText }}</span>
        <icon-close class="panel-icon" @click.stop="closePanel" />
      </div>

      <div v-else ref="expandedPanelRef" class="upload-panel-expanded">
        <div class="panel-header">
          <span class="summary-text">{{ summaryText }}</span>
          <div>
            <icon-close class="panel-icon" @click="closePanel" />
          </div>
        </div>

        <div class="panel-body">
          <div v-if="taskList.length === 0"> 没有更多内容了 </div>
          <div v-for="task in taskList" :key="task.taskId" class="task-item">
            <icon-file :size="24" />
            <div class="task-info">
              <div class="file-name">{{ task.fileName }}</div>

              <!-- 空闲/初始化状态 -->
              <div
                v-if="task.status === 'idle' || task.status === 'initialized'"
                class="progress-row"
              >
                <a-spin :size="14" />
                <span class="status-text">准备中...</span>
              </div>

              <!-- 校验中状态 -->
              <div v-else-if="task.status === 'checking'" class="progress-row">
                <a-spin :size="14" />
                <span class="status-text">校验文件...</span>
              </div>

              <!-- 上传中状态：进度条 + 速度 + 剩余时间 -->
              <div v-else-if="task.status === 'uploading'" class="progress-row">
                <a-progress
                  :percent="task.progress / 100"
                  size="small"
                  :style="{ width: '100px', flex: 'none' }"
                />
                <div class="speed-info">
                  <span class="speed-text">{{ formatSpeed(task.speed) }}</span>
                  <span v-if="task.remainingTime" class="time-text">
                    剩余 {{ formatRemainingTime(task.remainingTime) }}
                  </span>
                </div>
              </div>

              <!-- 暂停状态：进度条 + "已暂停" -->
              <div v-else-if="task.status === 'paused'" class="progress-row">
                <a-progress
                  :percent="task.progress / 100"
                  size="small"
                  status="warning"
                  :style="{ width: '100px', flex: 'none' }"
                />
                <span class="status-text">已暂停</span>
              </div>

              <!-- 合并中状态 -->
              <div v-else-if="task.status === 'merging'" class="progress-row">
                <a-spin :size="14" />
                <span class="status-text">正在处理...</span>
              </div>

              <!-- 完成状态 -->
              <span
                v-else-if="task.status === 'completed'"
                class="status-text success"
              >
                已上传至 目标文件夹
              </span>

              <!-- 失败状态 -->
              <span
                v-else-if="task.status === 'failed'"
                class="status-text error"
              >
                {{ task.errorMessage || '上传失败' }}
              </span>

              <!-- 已取消状态 -->
              <span v-else-if="task.status === 'cancelled'" class="status-text">
                已取消
              </span>
            </div>
          </div>
        </div>

        <div class="panel-footer" @click="toggleExpand"> 收起 </div>
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
  } from '@arco-design/web-vue/es/icon';
  import { useTransferStore } from '@/store';
  import { storeToRefs } from 'pinia';
  import { formatSpeed, formatRemainingTime } from '@/utils/format';

  interface Props {
    parentId?: string;
  }
  defineProps<Props>();
  const emit = defineEmits<{
    (e: 'success'): void;
  }>();

  const transferStore = useTransferStore();

  // 使用当前批次的任务列表，而不是所有任务
  const { currentSessionTasks: taskList } = storeToRefs(transferStore);

  // 面板显示状态（本地管理）
  const showPanel = ref(false);
  const isExpanded = ref(false);

  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
  };

  const closePanel = () => {
    showPanel.value = false;
    isExpanded.value = false;
  };

  const isUploading = computed(() =>
    taskList.value.some((t) =>
      ['initialized', 'checking', 'uploading', 'merging'].includes(t.status)
    )
  );

  const completedCount = computed(() => {
    return taskList.value.filter((t) => t.status === 'completed').length;
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
    () => isExpanded.value,
    (expanded) => {
      if (expanded) {
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

  // 监听任务列表变化，自动显示面板
  watch(
    () => taskList.value.length,
    (newLength, oldLength) => {
      if (newLength > oldLength) {
        showPanel.value = true;
      }
    }
  );
</script>

<style lang="less" scoped>
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
        .progress-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .speed-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 80px;
        }
        .speed-text {
          font-size: 12px;
          color: var(--color-text-2);
          font-weight: 500;
        }
        .time-text {
          font-size: 11px;
          color: var(--color-text-3);
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
