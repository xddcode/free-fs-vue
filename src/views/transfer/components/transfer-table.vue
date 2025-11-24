<script setup lang="ts">
  import {
    UploadTaskStatus,
    type FileTransferTaskVO,
  } from '@/types/modules/transfer';
  import {
    formatFileSize,
    formatSpeed,
    formatRemainingTime,
  } from '@/utils/format';
  import {
    IconPause,
    IconPlayArrow,
    IconDelete,
  } from '@arco-design/web-vue/es/icon';

  const props = defineProps<{
    tasks: FileTransferTaskVO[];
    loading: boolean;
    showActions?: boolean; // 是否显示操作列（已完成列表不需要显示暂停）
    showCompleteTime?: boolean; // 是否显示完成时间
  }>();

  const emit = defineEmits(['pause', 'resume', 'cancel']);

  const getStatusText = (status: UploadTaskStatus) => {
    const statusMap = {
      [UploadTaskStatus.INITIALIZED]: '准备中',
      [UploadTaskStatus.CHECKING]: '校验中',
      [UploadTaskStatus.UPLOADING]: '上传中',
      [UploadTaskStatus.PAUSED]: '已暂停',
      [UploadTaskStatus.MERGING]: '处理中',
      [UploadTaskStatus.COMPLETED]: '已完成',
      [UploadTaskStatus.FAILED]: '失败',
      [UploadTaskStatus.CANCELLING]: '取消中',
      [UploadTaskStatus.CANCELED]: '已取消',
    };
    return statusMap[status] || '未知';
  };
  const getStatusColor = (status: UploadTaskStatus) => {
    const colorMap = {
      [UploadTaskStatus.INITIALIZED]: 'cyan',
      [UploadTaskStatus.CHECKING]: 'arcoblue',
      [UploadTaskStatus.UPLOADING]: 'blue',
      [UploadTaskStatus.PAUSED]: 'orange',
      [UploadTaskStatus.MERGING]: 'purple',
      [UploadTaskStatus.COMPLETED]: 'green',
      [UploadTaskStatus.FAILED]: 'red',
      [UploadTaskStatus.CANCELLING]: 'orange',
      [UploadTaskStatus.CANCELED]: 'gray',
    };
    return colorMap[status] || 'gray';
  };
</script>

<template>
  <a-table :data="tasks" :loading="loading" :pagination="false">
    <template #columns>
      <a-table-column title="文件名称" :width="300">
        <template #cell="{ record }">
          <div class="file-name-cell">
            <span class="file-name">{{ record.fileName }}</span>
            <span v-if="record.suffix" class="file-suffix">{{
              record.suffix
            }}</span>
          </div>
        </template>
      </a-table-column>

      <a-table-column title="文件大小" :width="160">
        <template #cell="{ record }">
          <span
            v-if="
              record.status === UploadTaskStatus.UPLOADING ||
              record.status === UploadTaskStatus.PAUSED
            "
            class="file-size-text"
          >
            <span class="uploaded-size">
              {{
                formatFileSize(
                  record.uploadedSize ||
                    Math.round(
                      (record.uploadedChunks / record.totalChunks) *
                        record.fileSize
                    )
                )
              }}
            </span>
            <span class="size-separator">/</span>
            <span class="total-size">
              {{ formatFileSize(record.fileSize) }}
            </span>
          </span>
          <span v-else>{{ formatFileSize(record.fileSize) }}</span>
        </template>
      </a-table-column>

      <a-table-column title="状态" :width="100">
        <template #cell="{ record }">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
      </a-table-column>

      <a-table-column title="进度" :width="260">
        <template #cell="{ record }">
          <!-- 初始化状态 -->
          <div
            v-if="record.status === UploadTaskStatus.INITIALIZED"
            class="progress-container"
          >
            <a-spin :size="16" />
            <span class="progress-text" style="margin-left: 8px">
              准备中...
            </span>
          </div>
          <!-- 校验中状态 -->
          <div
            v-else-if="record.status === UploadTaskStatus.CHECKING"
            class="progress-container"
          >
            <a-spin :size="16" />
            <span class="progress-text" style="margin-left: 8px">
              校验文件...
            </span>
          </div>
          <!-- 上传中状态 -->
          <div
            v-else-if="record.status === UploadTaskStatus.UPLOADING"
            class="progress-container"
          >
            <a-progress
              :percent="record.progress / 100"
              size="medium"
              :style="{ width: '120px' }"
            />
            <div class="speed-info">
              <span class="speed-text">
                {{ formatSpeed(record.speed || 0) }}
              </span>
              <span v-if="record.remainTime" class="time-text">
                剩余 {{ formatRemainingTime(record.remainTime) }}
              </span>
            </div>
          </div>
          <!-- 暂停状态 -->
          <div v-else-if="record.status === UploadTaskStatus.PAUSED">
            <a-progress
              :percent="record.progress / 100"
              size="medium"
              status="warning"
              :style="{ width: '160px' }"
            />
            <span class="progress-text">已暂停</span>
          </div>
          <!-- 合并中状态 -->
          <div
            v-else-if="record.status === UploadTaskStatus.MERGING"
            class="progress-container"
          >
            <a-spin :size="16" />
            <span class="progress-text" style="margin-left: 8px">
              正在处理文件...
            </span>
          </div>
          <!-- 取消中状态 -->
          <div
            v-else-if="record.status === UploadTaskStatus.CANCELLING"
            class="progress-container"
          >
            <a-spin :size="16" />
            <span class="progress-text" style="margin-left: 8px">
              正在取消...
            </span>
          </div>
          <!-- 完成状态 -->
          <div v-else-if="record.status === UploadTaskStatus.COMPLETED">
            <span class="status-text success">100%</span>
          </div>
          <!-- 失败状态 -->
          <div v-else-if="record.status === UploadTaskStatus.FAILED">
            <span class="status-text error">{{
              record.errorMsg || '上传失败'
            }}</span>
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
        :width="150"
        align="center"
      >
        <template #cell="{ record }">
          <a-space>
            <!-- 暂停按钮 -->
            <a-button
              v-if="record.status === UploadTaskStatus.UPLOADING"
              type="text"
              size="small"
              @click="emit('pause', record)"
            >
              <template #icon>
                <icon-pause />
              </template>
              暂停
            </a-button>

            <!-- 开始按钮 -->
            <a-button
              v-else-if="record.status === UploadTaskStatus.PAUSED"
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

            <!-- 删除按钮（取消中状态不显示） -->
            <a-button
              v-if="record.status !== UploadTaskStatus.CANCELLING"
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
            record.completeTime
              ? new Date(record.completeTime).toLocaleString('zh-CN')
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
  .progress-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }
</style>
