<script setup lang="ts">
  import { useUploadTaskStore } from '@/store';
  import { storeToRefs } from 'pinia';
  import { UploadPanel } from '@/views/files/components';
  import { formatFileSize } from '@/utils/format';

  const uploadStore = useUploadTaskStore();
  const { taskList } = storeToRefs(uploadStore);
</script>

<template>
  <div class="trans-manager">
    <a-layout class="page-layout">
      <a-layout-header class="page-header">
        <div class="header-left">
          <span class="title">传输列表</span>
        </div>

        <div class="header-center">
          <a-tabs :default-active-key="1" type="text" :header-padding="false">
            <a-tab-pane :key="1" title="上传 0"></a-tab-pane>
            <a-tab-pane :key="2" title="下载 0"></a-tab-pane>
            <a-tab-pane :key="3" title="已完成"></a-tab-pane>
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
        <a-alert type="info" :show-icon="false" class="vip-banner">
          <div class="banner-content">
            <div class="banner-left">
              <div class="banner-title">暂无上传任务</div>
              <div class="banner-desc">请自由选择要上传的文件哦~~</div>
            </div>
            <div class="banner-right"></div>
          </div>
        </a-alert>

        <div v-if="taskList.length == 0" class="empty-state-container">
          <a-empty>
            <template #image>
              <div class="custom-empty-icon">
                <icon-search />
              </div>
            </template>
            暂无上传任务
          </a-empty>
        </div>
        <div v-else class="file-list">
          <a-table :data="taskList" style="margin-top: 30px">
            <template #columns>
              <a-table-column title="文件名称">
                <template #cell="{ record }">
                  <span>{{ record.file.name }}</span>
                </template>
              </a-table-column>
              <a-table-column title="文件大小">
                <template #cell="{ record }">
                  <span>{{ formatFileSize(record.file.size) }}</span>
                </template>
              </a-table-column>
              <a-table-column title="文件类型">
                <template #cell="{ record }">
                  <span>{{ record.file.type }}</span>
                </template>
              </a-table-column>
              <a-table-column title="状态" data-index="progress">
                <template #cell="{ record }">
                  <a-progress
                    :percent="record.progress / 100"
                    size="medium"
                    :style="{ width: '160px' }"
                  />
                  <span
                    v-if="record.status === 'error'"
                    class="status-text error"
                  >
                    {{ task.errorMessage }}
                  </span>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-layout-content>
    </a-layout>

    <!-- 上传面板 -->
    <upload-panel />
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
  }

  /* 2. 内容区域样式 */
  .page-content {
    padding: 24px;
    display: flex;
    flex-direction: column;
  }

  .vip-banner {
    border-radius: 8px;
    /* 自定义背景色以匹配图片的淡紫色 */
    background-color: #f5f3ff;
    border-color: #e0dfff;
    padding: 16px 20px;
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

      .file-row {
        transition: all 0.2s;

        &:hover {
          background-color: var(--color-fill-2);
        }
      }
    }
  }
</style>
