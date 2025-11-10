<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import {
    IconSettings,
    IconSearch,
    IconPlayArrow,
    IconPause,
    IconDelete,
  } from '@arco-design/web-vue/es/icon';
  import {
    formatFileSize,
    formatSpeed,
    formatRemainingTime,
  } from '@/utils/format';
  import {
    getTransferFiles,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    UploadTaskStatus,
  } from '@/api/transfer';
  import type { FileUploadTaskVO } from '@/api/transfer';
  import transferWebSocketService from '@/services/transfer-websocket.service';

  // 当前激活的标签页 1-上传 2-下载 3-已完成
  const activeTab = ref(1);

  // 传输任务列表
  const transferList = ref<FileUploadTaskVO[]>([]);

  // 加载状态
  const loading = ref(false);

  /**
   * 获取传输列表
   */
  async function fetchTransferList() {
    try {
      loading.value = true;
      const response = await getTransferFiles();

      // 去重：如果后端返回了重复的任务，只保留已上传分片数最多的那个
      const taskMap = new Map<string, any>();
      response.data.forEach((item) => {
        const existing = taskMap.get(item.taskId);
        if (
          !existing ||
          item.uploadedChunks > existing.uploadedChunks ||
          // 如果已上传分片数相同，保留状态更靠前的（uploading > paused > completed）
          (item.uploadedChunks === existing.uploadedChunks &&
            item.status === UploadTaskStatus.UPLOADING)
        ) {
          taskMap.set(item.taskId, item);
        }
      });

      transferList.value = Array.from(taskMap.values()).map((item) => {
        // 计算进度百分比
        const progress =
          item.totalChunks > 0
            ? Math.round((item.uploadedChunks / item.totalChunks) * 100)
            : 0;

        return {
          ...item,
          progress,
        };
      });
    } catch (error) {
      Message.error('获取传输列表失败');
    } finally {
      loading.value = false;
    }
  }

  // 已订阅的任务集合（避免重复订阅）
  const subscribedTasks = new Set<string>();

  /**
   * 订阅WebSocket更新
   */
  function subscribeActiveTasksUpdates() {
    // 确保WebSocket已连接
    if (!transferWebSocketService.isConnected()) {
      transferWebSocketService.connect();
    }

    // 为所有活动任务订阅WebSocket进度更新
    transferList.value.forEach((task) => {
      if (
        task.status === UploadTaskStatus.INITIALIZED ||
        task.status === UploadTaskStatus.CHECKING ||
        task.status === UploadTaskStatus.UPLOADING ||
        task.status === UploadTaskStatus.PAUSED ||
        task.status === UploadTaskStatus.MERGING
      ) {
        // 避免重复订阅
        if (subscribedTasks.has(task.taskId)) {
          return;
        }
        subscribedTasks.add(task.taskId);

        transferWebSocketService.subscribe(task.taskId, {
          onInitialized: () => {
            // 初始化状态
          },
          onChecking: () => {
            // 校验中状态
          },
          onQuickUpload: async () => {
            subscribedTasks.delete(task.taskId);
            await fetchTransferList();
            subscribeActiveTasksUpdates();
          },
          onReadyToUpload: () => {
            // 准备上传
          },
          onProgress: (data) => {
            // 实时更新任务进度
            const targetTask = transferList.value.find(
              (t) => t.taskId === task.taskId
            );
            if (targetTask) {
              targetTask.uploadedChunks = data.uploadedChunks;
              // 更新总分片数（如果后端修正了的话）
              if (data.totalChunks) {
                targetTask.totalChunks = data.totalChunks;
              }
              // 确保进度不超过100%
              targetTask.progress = Math.min(100, Math.round(data.progress));
              if (data.speed !== undefined) {
                targetTask.speed = data.speed;
              }
              if (data.remainTime !== undefined) {
                targetTask.remainTime = data.remainTime;
              }
              if (data.uploadedSize !== undefined) {
                targetTask.uploadedSize = data.uploadedSize;
              }
            }
          },
          onPaused: async () => {
            await fetchTransferList();
          },
          onResumed: async () => {
            await fetchTransferList();
          },
          onMerging: () => {
            // 合并中状态
          },
          onComplete: async () => {
            subscribedTasks.delete(task.taskId);
            await fetchTransferList();
            subscribeActiveTasksUpdates();
          },
          onError: async () => {
            subscribedTasks.delete(task.taskId);
            await fetchTransferList();
            subscribeActiveTasksUpdates();
          },
          onCancelled: async () => {
            subscribedTasks.delete(task.taskId);
            await fetchTransferList();
            subscribeActiveTasksUpdates();
          },
        });
      }
    });
  }

  /**
   * 上传中的任务（包括初始化、校验中、上传中、暂停、合并中）
   */
  const uploadingTasks = computed(() =>
    transferList.value.filter(
      (task) =>
        task.status === UploadTaskStatus.INITIALIZED ||
        task.status === UploadTaskStatus.CHECKING ||
        task.status === UploadTaskStatus.UPLOADING ||
        task.status === UploadTaskStatus.PAUSED ||
        task.status === UploadTaskStatus.MERGING
    )
  );

  /**
   * 下载中的任务（暂时为空，后续支持）
   */
  const downloadingTasks = computed(() => []);

  /**
   * 已完成的任务
   */
  const completedTasks = computed(() =>
    transferList.value.filter(
      (task) =>
        task.status === UploadTaskStatus.COMPLETED ||
        task.status === UploadTaskStatus.FAILED ||
        task.status === UploadTaskStatus.CANCELED
    )
  );

  /**
   * 当前显示的任务列表
   */
  const currentTasks = computed(() => {
    if (activeTab.value === 1) return uploadingTasks.value;
    if (activeTab.value === 2) return downloadingTasks.value;
    return completedTasks.value;
  });

  /**
   * 暂停上传
   */
  const handlePause = async (task: FileUploadTaskVO) => {
    try {
      await pauseUpload(task.taskId);
      Message.success('已暂停');
      await fetchTransferList();
    } catch (error) {
      Message.error('暂停失败');
    }
  };

  /**
   * 恢复上传
   */
  const handleResume = async (task: FileUploadTaskVO) => {
    try {
      await resumeUpload(task.taskId);
      Message.success('已恢复');
      await fetchTransferList();
    } catch (error) {
      Message.error('恢复失败');
    }
  };

  /**
   * 取消/删除任务
   */
  const handleCancel = async (task: FileUploadTaskVO) => {
    try {
      await cancelUpload(task.taskId);
      Message.success('已删除');
      await fetchTransferList();
    } catch (error) {
      Message.error('删除失败');
    }
  };

  /**
   * 获取状态文本
   */
  const getStatusText = (status: UploadTaskStatus) => {
    const statusMap = {
      [UploadTaskStatus.INITIALIZED]: '初始化',
      [UploadTaskStatus.CHECKING]: '校验中',
      [UploadTaskStatus.UPLOADING]: '上传中',
      [UploadTaskStatus.PAUSED]: '已暂停',
      [UploadTaskStatus.MERGING]: '合并中',
      [UploadTaskStatus.COMPLETED]: '已完成',
      [UploadTaskStatus.FAILED]: '失败',
      [UploadTaskStatus.CANCELED]: '已取消',
    };
    return statusMap[status] || '未知';
  };

  /**
   * 获取状态颜色
   */
  const getStatusColor = (status: UploadTaskStatus) => {
    const colorMap = {
      [UploadTaskStatus.INITIALIZED]: 'cyan',
      [UploadTaskStatus.CHECKING]: 'arcoblue',
      [UploadTaskStatus.UPLOADING]: 'blue',
      [UploadTaskStatus.PAUSED]: 'orange',
      [UploadTaskStatus.MERGING]: 'purple',
      [UploadTaskStatus.COMPLETED]: 'green',
      [UploadTaskStatus.FAILED]: 'red',
      [UploadTaskStatus.CANCELED]: 'gray',
    };
    return colorMap[status] || 'gray';
  };

  // 定时刷新任务列表（每3秒检查一次是否有新任务）
  let refreshTimer: number | null = null;

  const startAutoRefresh = () => {
    // 立即获取一次
    fetchTransferList().then(() => {
      subscribeActiveTasksUpdates();
    });

    // 定时刷新
    refreshTimer = window.setInterval(async () => {
      const currentTaskIds = new Set(transferList.value.map((t) => t.taskId));
      await fetchTransferList();

      // 检查是否有新任务，如果有则重新订阅
      const hasNewTasks = transferList.value.some(
        (t) => !currentTaskIds.has(t.taskId)
      );
      if (hasNewTasks) {
        subscribeActiveTasksUpdates();
      }
    }, 3000); // 每3秒刷新一次
  };

  const stopAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  };

  onMounted(() => {
    // 页面加载时开始自动刷新
    startAutoRefresh();
  });

  // 组件卸载时停止刷新
  onUnmounted(() => {
    stopAutoRefresh();
  });
</script>

<template>
  <div class="trans-manager">
    <a-layout class="page-layout">
      <a-layout-header class="page-header">
        <div class="header-left">
          <span class="title">传输列表</span>
        </div>

        <div class="header-center">
          <a-tabs
            v-model:active-key="activeTab"
            type="text"
            :header-padding="false"
          >
            <a-tab-pane :key="1" :title="`上传 ${uploadingTasks.length}`" />
            <a-tab-pane :key="2" :title="`下载 ${downloadingTasks.length}`" />
            <a-tab-pane :key="3" title="已完成" />
          </a-tabs>
        </div>

        <div class="header-right">
          <a-space size="small">
            <icon-settings />
            <span>传输设置</span>
          </a-space>
        </div>
      </a-layout-header>

      <a-layout-content class="page-content">
        <!-- 提示横幅 -->
        <a-alert type="info" :show-icon="false" class="vip-banner">
          <div class="banner-content">
            <div class="banner-left">
              <div class="banner-title">
                {{
                  activeTab === 1
                    ? uploadingTasks.length > 0
                      ? `当前正在上传 ${uploadingTasks.length} 个文件`
                      : '暂无上传任务'
                    : activeTab === 2
                    ? '暂无下载任务'
                    : '查看已完成的传输任务'
                }}
              </div>
              <div class="banner-desc">
                {{
                  activeTab === 1
                    ? '上传任务会实时同步进度，支持暂停和恢复'
                    : activeTab === 2
                    ? '下载功能即将推出'
                    : '已完成的任务可以在这里查看'
                }}
              </div>
            </div>
            <div class="banner-right"></div>
          </div>
        </a-alert>

        <!-- 空状态 -->
        <div v-if="currentTasks.length === 0" class="empty-state-container">
          <a-empty>
            <template #image>
              <div class="custom-empty-icon">
                <icon-search />
              </div>
            </template>
            <template v-if="activeTab === 1">暂无上传任务</template>
            <template v-else-if="activeTab === 2">暂无下载任务</template>
            <template v-else>暂无已完成任务</template>
          </a-empty>
        </div>

        <!-- 任务列表 -->
        <div v-else class="file-list">
          <a-table :data="currentTasks" :loading="loading" :pagination="false">
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
                    <a-spin size="small" />
                    <span class="progress-text" style="margin-left: 8px">
                      准备中...
                    </span>
                  </div>
                  <!-- 校验中状态 -->
                  <div
                    v-else-if="record.status === UploadTaskStatus.CHECKING"
                    class="progress-container"
                  >
                    <a-spin size="small" />
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
                    <a-spin size="small" />
                    <span class="progress-text" style="margin-left: 8px">
                      合并文件...
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
                v-if="activeTab === 1"
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
                      @click="handlePause(record)"
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
                      @click="handleResume(record)"
                    >
                      <template #icon>
                        <icon-play-arrow />
                      </template>
                      开始
                    </a-button>

                    <!-- 删除按钮 -->
                    <a-button
                      type="text"
                      size="small"
                      status="danger"
                      @click="handleCancel(record)"
                    >
                      <template #icon>
                        <icon-delete />
                      </template>
                      删除
                    </a-button>
                  </a-space>
                </template>
              </a-table-column>

              <a-table-column
                v-if="activeTab === 3"
                title="完成时间"
                :width="180"
              >
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
        </div>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<style scoped lang="less">
  .trans-manager {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-2);
  }

  /* 确保布局占满全屏 */
  .page-layout {
    height: 100vh;
    width: 100%;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    border-bottom: 1px solid var(--color-border-2);
    padding: 0 24px;
    height: 60px;
  }

  .header-left .title {
    font-size: 18px;
    font-weight: 500;
    color: var(--color-text-1);
  }

  .header-center {
    flex-grow: 1;
    display: flex;
    justify-content: center;
  }

  .header-center :deep(.arco-tabs-nav-tab) {
    padding: 12px 16px;
  }
  .header-center :deep(.arco-tabs-nav::before) {
    display: none;
  }

  .header-right {
    color: var(--color-text-2);
    cursor: pointer;
    &:hover {
      color: var(--color-text-1);
    }
  }

  /* 2. 内容区域样式 */
  .page-content {
    padding: 24px;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

  .vip-banner {
    border-radius: 8px;
    /* 自定义背景色以匹配图片的淡紫色 */
    background-color: #f5f3ff;
    border-color: #e0dfff;
    padding: 16px 20px;
    margin-bottom: 16px;
  }

  .banner-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .banner-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--color-text-1);
  }
  .banner-desc {
    font-size: 12px;
    color: var(--color-text-3);
    margin-top: 4px;
  }

  .empty-state-container {
    flex-grow: 1; /* 占据剩余所有空间 */
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* 自定义空状态图标 */
  .custom-empty-icon {
    font-size: 76px;
    padding: 20px;
    background-color: #e9e3ff;
    color: #7b61ff;
    border-radius: 12px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
  }

  .file-list {
    :deep(.arco-table) {
      .arco-table-th {
        background-color: var(--color-bg-1);
        color: var(--color-text-2);
        font-weight: 500;
      }

      .arco-table-tr {
        transition: all 0.2s;

        &:hover {
          background-color: var(--color-fill-2);
        }
      }
    }
  }

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
