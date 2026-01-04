<template>
  <div class="recycle-bin-view">
    <!-- 工具栏 -->
    <toolbar
      v-model:search-keyword="searchKeyword"
      placeholder="搜索回收站文件"
      hide-actions
      @search="handleSearch"
      @refresh="handleRefresh"
    >
      <template #extra>
        <a-button
          size="large"
          status="danger"
          :disabled="fileList.length === 0"
          @click="handleClearRecycle"
        >
          <template #icon><icon-delete /></template>
          清空回收站
        </a-button>
      </template>
    </toolbar>

    <!-- 面包屑导航 -->
    <file-breadcrumb custom-title="回收站" />
    <div class="recycle-tip-bar">
      <icon-info-circle />
      回收站默认保存7天，到期自动清理！
    </div>

    <!-- 统一的视图控制栏 -->
    <div class="view-control-bar">
      <div class="control-left">
        <span class="file-count-text">
          {{
            selectedIds.length > 0
              ? `已选 ${selectedIds.length} 项`
              : `共 ${fileList.length} 项`
          }}
        </span>
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="recycle-content">
      <LoadingSpinner :loading="loading" :size="150" full-height>
        <!-- 空状态 -->
        <a-empty
          v-if="!loading && fileList.length === 0"
          description="回收站为空"
        >
          <template #image>
            <icon-delete :size="64" style="color: var(--color-text-3)" />
          </template>
        </a-empty>

        <!-- 表格视图 -->
        <div v-else class="file-list">
          <a-table
            v-model:selected-keys="selectedIds"
            :data="fileList"
            :pagination="false"
            :bordered="false"
            :row-selection="{
              type: 'checkbox',
              showCheckedAll: true,
            }"
            row-key="id"
          >
            <template #columns>
              <a-table-column
                title="文件名"
                data-index="displayName"
                :width="400"
              >
                <template #cell="{ record }">
                  <div class="file-name-cell">
                    <div class="file-icon-wrapper">
                      <img
                        :src="
                          getFileIconPath(
                            record.isDir ? 'dir' : record.suffix || ''
                          )
                        "
                        :alt="record.displayName"
                        class="file-icon-img"
                      />
                    </div>
                    <span class="file-name">{{ record.displayName }}</span>
                  </div>
                </template>
              </a-table-column>

              <a-table-column title="大小" data-index="size" :width="120">
                <template #cell="{ record }">
                  <span class="file-size">{{
                    formatFileSize(record.size)
                  }}</span>
                </template>
              </a-table-column>

              <a-table-column
                title="删除时间"
                data-index="deletedTime"
                :width="180"
              >
                <template #cell="{ record }">
                  <span class="file-time">{{
                    formatFileTime(record.deletedTime)
                  }}</span>
                </template>
              </a-table-column>

              <a-table-column title="操作" :width="200" align="center">
                <template #cell="{ record }">
                  <div class="file-actions">
                    <a-tooltip content="还原">
                      <a-button
                        size="small"
                        type="text"
                        @click="handleRestoreSingle(record.id)"
                      >
                        <template #icon>
                          <icon-undo />
                        </template>
                      </a-button>
                    </a-tooltip>
                    <a-tooltip content="删除">
                      <a-button
                        size="small"
                        type="text"
                        status="danger"
                        @click="
                          handleDeleteSingle(record.id, record.displayName)
                        "
                      >
                        <template #icon>
                          <icon-delete />
                        </template>
                      </a-button>
                    </a-tooltip>
                  </div>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </LoadingSpinner>
    </div>

    <!-- 底部悬浮批量操作栏 -->
    <transition name="slide-up">
      <div v-if="selectedIds.length > 0" class="selection-dock">
        <div class="dock-content">
          <div class="dock-actions">
            <a-tooltip content="还原">
              <a-button
                type="text"
                class="dock-btn"
                @click="handleBatchRestore"
              >
                <template #icon><icon-undo /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="彻底删除">
              <a-button
                type="text"
                class="dock-btn delete"
                @click="handleBatchDelete"
              >
                <template #icon><icon-delete /></template>
              </a-button>
            </a-tooltip>
          </div>
          <a-button type="text" class="dock-btn cancel" @click="clearSelection">
            <template #icon><icon-close-circle-fill /></template>
          </a-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { Message, Modal } from '@arco-design/web-vue';
  import { LoadingSpinner } from '@/components';
  import {
    IconDelete,
    IconUndo,
    IconInfoCircle,
    IconRefresh,
    IconCloseCircleFill,
  } from '@arco-design/web-vue/es/icon';
  import {
    getRecycleList,
    restoreFiles,
    permanentDeleteFiles,
    clearRecycle,
  } from '@/api/file';
  import { getFileIconPath } from '@/utils/file-icon';
  import type { FileRecycleItem } from '@/types/modules/file';
  import { formatFileSize, formatFileTime } from '../hooks/use-file-format';
  import Toolbar from './toolbar.vue';
  import FileBreadcrumb from './file-breadcrumb.vue';

  const loading = ref(false);
  const fileList = ref<FileRecycleItem[]>([]);
  const selectedIds = ref<string[]>([]);
  const searchKeyword = ref('');

  /**
   * 获取回收站文件列表
   */
  const fetchRecycleList = async (keyword?: string) => {
    loading.value = true;
    try {
      const response = await getRecycleList(keyword);
      fileList.value = response.data || [];
    } catch {
      fileList.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 处理搜索
   */
  const handleSearch = () => {
    fetchRecycleList(searchKeyword.value);
  };

  /**
   * 处理刷新
   */
  const handleRefresh = () => {
    fetchRecycleList(searchKeyword.value);
  };

  /**
   * 单个还原
   */
  const handleRestoreSingle = (fileId: string) => {
    const file = fileList.value.find((f) => f.id === fileId);
    Modal.confirm({
      title: '确认还原',
      content: `确定要还原文件 "${file?.displayName}" 吗？`,
      okText: '还原',
      cancelText: '取消',
      onOk: async () => {
        await restoreFiles([fileId]).then(() => {
          Message.success('还原成功');
          selectedIds.value = [];
          fetchRecycleList(searchKeyword.value);
        });
      },
    });
  };

  /**
   * 批量还原
   */
  const handleBatchRestore = () => {
    if (selectedIds.value.length === 0) return;

    Modal.confirm({
      title: '确认批量还原',
      content: `确定要还原选中的 ${selectedIds.value.length} 个文件吗？`,
      okText: '还原',
      cancelText: '取消',
      onOk: async () => {
        await restoreFiles(selectedIds.value).then(() => {
          Message.success(`成功还原 ${selectedIds.value.length} 个文件`);
          selectedIds.value = [];
          fetchRecycleList(searchKeyword.value);
        });
      },
    });
  };

  /**
   * 单个彻底删除
   */
  const handleDeleteSingle = (fileId: string, fileName: string) => {
    Modal.confirm({
      title: '确认彻底删除',
      content: `确定要彻底删除文件 "${fileName}" 吗？删除后将无法恢复！`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: {
        status: 'danger',
      },
      onOk: async () => {
        await permanentDeleteFiles([fileId]).then(() => {
          Message.success('删除成功');
          selectedIds.value = [];
          fetchRecycleList(searchKeyword.value);
        });
      },
    });
  };

  /**
   * 批量彻底删除
   */
  const handleBatchDelete = () => {
    if (selectedIds.value.length === 0) return;

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要彻底删除选中的 ${selectedIds.value.length} 个文件吗？删除后将无法恢复！`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: {
        status: 'danger',
      },
      onOk: async () => {
        await permanentDeleteFiles(selectedIds.value).then(() => {
          Message.success(`成功删除 ${selectedIds.value.length} 个文件`);
          selectedIds.value = [];
          fetchRecycleList(searchKeyword.value);
        });
      },
    });
  };

  /**
   * 清空回收站
   */
  const handleClearRecycle = () => {
    Modal.confirm({
      title: '确认清空回收站',
      content: '确定要清空回收站吗？所有文件将被彻底删除且无法恢复！',
      okText: '清空',
      cancelText: '取消',
      okButtonProps: {
        status: 'danger',
      },
      onOk: async () => {
        await clearRecycle().then(() => {
          Message.success('回收站已清空');
          selectedIds.value = [];
          searchKeyword.value = '';
          fetchRecycleList();
        });
      },
    });
  };

  /**
   * 清空选中
   */
  const clearSelection = () => {
    selectedIds.value = [];
  };

  /**
   * 处理键盘事件
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      clearSelection();
    }
  };

  // 初始化加载数据
  onMounted(() => {
    fetchRecycleList();
    window.addEventListener('keydown', handleKeyDown);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<style lang="less" scoped>
  .recycle-bin-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-2);
  }

  .recycle-tip-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 24px;
    background-color: var(--color-warning-light-1);
    color: var(--color-warning-7);
    font-size: 13px;
    border-bottom: 1px solid var(--color-border-2);

    .arco-icon {
      font-size: 14px;
    }
  }

  .view-control-bar {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    background-color: var(--color-bg-1);
    flex-shrink: 0;

    .control-left {
      display: flex;
      align-items: center;
      .file-count-text {
        font-size: 13px;
        color: var(--color-text-3);
        margin-left: 8px;
      }
    }

    .control-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .recycle-content {
    flex: 1;
    padding: 0 24px 16px;
    overflow-y: auto;
    position: relative;
    background-color: var(--color-bg-1);
  }

  // 底部悬浮 Dock (深色高对比方案)
  .selection-dock {
    position: absolute;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    background-color: #1d1d1f;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);

    .dock-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .dock-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .dock-btn {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      font-size: 20px;
      color: rgba(255, 255, 255, 0.85);
      transition: all 0.2s;

      &:hover {
        background-color: rgba(255, 255, 255, 0.12);
        color: #ffffff;
        transform: translateY(-3px);
      }

      &.delete:hover {
        background-color: rgba(var(--danger-6), 0.2);
        color: rgb(var(--danger-6));
      }

      &.cancel {
        color: rgba(255, 255, 255, 0.45);
        font-size: 24px;
        &:hover {
          background-color: transparent;
          color: #ffffff;
        }
      }
    }
  }

  // 动画
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .slide-up-enter-from {
    opacity: 0;
    transform: translate(-50%, 40px);
  }

  .slide-up-leave-to {
    opacity: 0;
    transform: translate(-50%, 20px);
  }

  .file-list {
    flex: 1;
    overflow: auto;
    :deep(.arco-table) {
      .arco-table-th {
        background-color: var(--color-fill-2);
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

    .file-name-cell {
      display: flex;
      align-items: center;
      gap: 12px;

      .file-icon-wrapper {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
      }

      .file-icon-img {
        width: 28px;
        height: 28px;
        object-fit: contain;
      }

      .file-name {
        flex: 1;
        font-size: 14px;
        font-weight: 400;
        color: var(--color-text-2);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .file-size,
    .file-time {
      font-size: 14px;
      color: var(--color-text-3);
    }

    .file-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  }
</style>
