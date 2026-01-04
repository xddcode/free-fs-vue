<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { IconRefresh } from '@arco-design/web-vue/es/icon';

  import { useTransferManager } from './hooks/use-transfer-manager';
  import TransferTable from './components/transfer-table.vue';

  // 当前激活的标签页 1-上传 2-下载 3-已完成
  const activeTab = ref(1);

  const { loading, uploadingTasks, completedTasks, actions } =
    useTransferManager();

  const currentDisplayTasks = computed(() => {
    if (activeTab.value === 1) return uploadingTasks.value;
    if (activeTab.value === 2) return []; // 下载暂空
    return completedTasks.value;
  });
</script>

<template>
  <div class="trans-manager">
    <a-layout class="page-layout">
      <a-layout-header class="page-header">
        <div class="header-left"><span class="title">传输列表</span></div>
        <div class="header-center">
          <a-tabs v-model:active-key="activeTab" type="text">
            <a-tab-pane :key="1" :title="`上传 ${uploadingTasks.length}`" />
            <a-tab-pane :key="2" title="下载 0" />
            <a-tab-pane :key="3" title="已完成" />
          </a-tabs>
        </div>
        <div class="header-right">
          <a-tooltip content="刷新">
            <a-button size="large" @click="actions.refresh">
              <template #icon><icon-refresh /></template>
            </a-button>
          </a-tooltip>
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
        <div
          v-if="currentDisplayTasks.length === 0"
          class="empty-state-container"
        >
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

        <div v-else class="file-list">
          <transfer-table
            :tasks="currentDisplayTasks"
            :loading="loading"
            :show-actions="activeTab === 1"
            :show-complete-time="activeTab === 3"
            @pause="actions.pause"
            @resume="actions.resume"
            @cancel="actions.cancel"
          />
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

<style lang="less">
  /* Dark mode adaptation for transmission page */
  body[arco-theme='dark'] {
    .trans-manager {
      .page-header {
        background-color: var(--color-bg-2) !important;
      }

      .vip-banner {
        background-color: rgba(42, 111, 232, 0.1) !important;
        border-color: rgba(42, 111, 232, 0.2) !important;
      }

      .custom-empty-icon {
        background-color: rgba(123, 97, 255, 0.15) !important;
        color: var(--aurora-primary) !important;
      }
    }
  }
</style>
