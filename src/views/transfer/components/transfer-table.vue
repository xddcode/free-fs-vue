<script setup lang="ts">
  import type { TransferTask, TaskStatus } from '@/types/modules/transfer';
  import { useTransferStore } from '@/store/modules/transfer';
  import {
    formatFileSize,
    formatSpeed,
    formatRemainingTime,
  } from '@/utils/format';
  import {
    IconPause,
    IconPlayArrow,
    IconDelete,
    IconRefresh,
  } from '@arco-design/web-vue/es/icon';

  const props = defineProps<{
    tasks: TransferTask[];
    loading: boolean;
    showActions?: boolean; // 是否显示操作列（已完成列表不需要显示暂停）
    showCompleteTime?: boolean; // 是否显示完成时间
  }>();

  const emit = defineEmits(['pause', 'resume', 'cancel', 'retry']);

  const transferStore = useTransferStore();

  // 获取任务的平滑显示数据
  const getTaskDisplayData = (taskId: string) => {
    return transferStore.getDisplayData(taskId);
  };

  // 计算任务的显示进度（使用平滑后的数据）
  const getDisplayProgress = (task: TransferTask) => {
    // 直接使用 task.progress，已经在 store 中保留了2位小数
    return task.progress;
  };

  // 计算任务的显示速度（使用平滑后的数据）
  const getDisplaySpeed = (task: TransferTask) => {
    if (task.status === 'uploading') {
      const displayData = getTaskDisplayData(task.taskId);
      return displayData.speed;
    }
    return task.speed;
  };

  // 计算任务的显示剩余时间（使用平滑后的数据）
  const getDisplayRemainingTime = (task: TransferTask) => {
    if (task.status === 'uploading') {
      const displayData = getTaskDisplayData(task.taskId);
      return displayData.remainingTime;
    }
    return task.remainingTime;
  };

  // 状态文本映射
  const getStatusText = (status: TaskStatus) => {
    const statusMap: Record<TaskStatus, string> = {
      idle: '空闲',
      initialized: '准备中',
      checking: '校验中',
      uploading: '上传中',
      paused: '已暂停',
      merging: '处理中',
      completed: '已完成',
      failed: '失败',
      cancelled: '已取消',
    };
    return statusMap[status] || '未知';
  };

  // 状态颜色映射
  const getStatusColor = (status: TaskStatus) => {
    const colorMap: Record<TaskStatus, string> = {
      idle: 'gray',
      initialized: 'cyan',
      checking: 'arcoblue',
      uploading: 'blue',
      paused: 'orange',
      merging: 'purple',
      completed: 'green',
      failed: 'red',
      cancelled: 'gray',
    };
    return colorMap[status] || 'gray';
  };

  // 根据状态判断可用的操作按钮
  const canPause = (status: TaskStatus) => status === 'uploading';
  const canResume = (status: TaskStatus) => status === 'paused';
  const canRetry = (status: TaskStatus) => status === 'failed';
  const canCancel = (status: TaskStatus) =>
    ['initialized', 'checking', 'uploading', 'paused', 'failed'].includes(
      status
    );
</script>

<template>
  <a-table :data="tasks" :loading="loading" :pagination="false">
    <template #columns>
      <a-table-column title="文件名称" :width="280">
        <template #cell="{ record }">
          <div class="file-name-cell">
            <span class="file-name">{{ record.fileName }}</span>
          </div>
        </template>
      </a-table-column>

      <a-table-column title="文件大小" :width="140">
        <template #cell="{ record }">
          <span
            v-if="record.status === 'uploading' || record.status === 'paused'"
            class="file-size-text"
          >
            <span class="uploaded-size">
              {{ formatFileSize(record.uploadedBytes || 0) }}
            </span>
            <span class="size-separator">/</span>
            <span class="total-size">
              {{ formatFileSize(record.fileSize) }}
            </span>
          </span>
          <span v-else>{{ formatFileSize(record.fileSize) }}</span>
        </template>
      </a-table-column>

      <a-table-column title="状态" :width="90">
        <template #cell="{ record }">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
      </a-table-column>

      <a-table-column title="进度" :width="300">
        <template #cell="{ record }">
          <!-- 空闲/初始化状态 -->
          <div
            v-if="record.status === 'idle' || record.status === 'initialized'"
            class="progress-container"
          >
            <a-spin :size="16" />
            <span class="progress-text" style="margin-left: 8px">
              准备中...
            </span>
          </div>
          <!-- 校验中状态 -->
          <div
            v-else-if="record.status === 'checking'"
            class="progress-container"
          >
            <a-spin :size="16" />
            <span class="progress-text" style="margin-left: 8px">
              校验文件...
            </span>
          </div>
          <!-- 上传中状态 -->
          <div
            v-else-if="record.status === 'uploading'"
            class="progress-container"
          >
            <a-progress
              :percent="getDisplayProgress(record) / 100"
              size="medium"
              :style="{ width: '300px' }"
            />
            <div class="speed-info">
              <span class="speed-text">
                {{ formatSpeed(getDisplaySpeed(record) || 0) }}
              </span>
              <span v-if="getDisplayRemainingTime(record)" class="time-text">
                剩余 {{ formatRemainingTime(getDisplayRemainingTime(record)) }}
              </span>
            </div>
          </div>
          <!-- 暂停状态 -->
          <div v-else-if="record.status === 'paused'" class="progress-container" style="width: 100%;">
            <a-progress
              :percent="getDisplayProgress(record) / 100"
              size="medium"
              status="warning"
              :style="{ width: '300px' }"
            />
            <span class="progress-text" style="min-width: 100px;">已暂停</span>
          </div>
          <!-- 合并中状态 -->
          <div
            v-else-if="record.status === 'merging'"
            class="progress-container"
          >
            <a-spin :size="16" />
            <span class="progress-text" style="margin-left: 8px">
              正在处理文件...
            </span>
          </div>
          <!-- 完成状态 -->
          <div v-else-if="record.status === 'completed'">
            <span class="status-text success">100%</span>
          </div>
          <!-- 失败状态 -->
          <div v-else-if="record.status === 'failed'">
            <span class="status-text error">{{
              record.errorMessage || '上传失败'
            }}</span>
          </div>
          <!-- 已取消状态 -->
          <div v-else-if="record.status === 'cancelled'">
            <span class="status-text">已取消</span>
          </div>
          <!-- 其他状态 -->
          <div v-else>
            <span class="status-text">-</span>
          </div>
        </template>
      </a-table-column>

      <a-table-column
        v-if="showActions"
        title="操作"
        :width="180"
        align="center"
      >
        <template #cell="{ record }">
          <a-space>
            <!-- 暂停按钮：仅在 uploading 状态显示 -->
            <a-button
              v-if="canPause(record.status)"
              type="text"
              size="small"
              @click="emit('pause', record)"
            >
              <template #icon>
                <icon-pause />
              </template>
              暂停
            </a-button>

            <!-- 恢复按钮：仅在 paused 状态显示 -->
            <a-button
              v-if="canResume(record.status)"
              type="text"
              size="small"
              status="success"
              @click="emit('resume', record)"
            >
              <template #icon>
                <icon-play-arrow />
              </template>
              开始
            </a-button>

            <!-- 重试按钮：仅在 failed 状态显示 -->
            <a-button
              v-if="canRetry(record.status)"
              type="text"
              size="small"
              status="warning"
              @click="emit('retry', record)"
            >
              <template #icon>
                <icon-refresh />
              </template>
              重试
            </a-button>

            <!-- 取消按钮：在 initialized, checking, uploading, paused, failed 状态显示 -->
            <a-button
              v-if="canCancel(record.status)"
              type="text"
              size="small"
              status="danger"
              @click="emit('cancel', record)"
            >
              <template #icon>
                <icon-delete />
              </template>
              取消
            </a-button>
          </a-space>
        </template>
      </a-table-column>

      <a-table-column v-if="showCompleteTime" title="完成时间" :width="180">
        <template #cell="{ record }">
          <span>{{
            record.updatedAt && record.status === 'completed'
              ? new Date(record.updatedAt).toLocaleString('zh-CN')
              : '-'
          }}</span>
        </template>
      </a-table-column>
    </template>
  </a-table>
</template>

<style scoped lang="less">
  .file-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .file-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-suffix {
      color: var(--color-text-3);
      font-size: 12px;
    }
  }

  .file-size-text {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;

    .uploaded-size {
      color: var(--color-text-2);
      font-weight: 500;
    }

    .size-separator {
      color: var(--color-text-4);
      margin: 0 2px;
    }

    .total-size {
      color: var(--color-text-3);
    }
  }

  .progress-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .speed-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 100px;
  }

  .speed-text {
    font-size: 13px;
    color: var(--color-text-2);
    font-weight: 500;
  }

  .time-text {
    font-size: 11px;
    color: var(--color-text-3);
  }

  .progress-text {
    font-size: 12px;
    color: var(--color-text-3);
    margin-left: 8px;
  }

  .status-text {
    font-size: 13px;
    color: var(--color-text-2);

    &.success {
      color: rgb(var(--success-6));
    }

    &.error {
      color: rgb(var(--danger-6));
    }
  }
</style>
