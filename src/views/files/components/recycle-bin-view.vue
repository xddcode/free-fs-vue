<template>
  <div class="recycle-bin-view">
    <!-- 工具栏 -->
    <div class="recycle-toolbar">
      <div class="toolbar-left">
        <!-- 批量还原 -->
        <a-button
          type="outline"
          size="large"
          :disabled="selectedIds.length === 0"
          @click="handleBatchRestore"
        >
          <template #icon>
            <icon-undo />
          </template>
          批量还原
        </a-button>
        <!-- 批量删除 -->
        <a-button
          type="outline"
          status="danger"
          size="large"
          :disabled="selectedIds.length === 0"
          @click="handleBatchDelete"
        >
          <template #icon>
            <icon-delete />
          </template>
          批量删除
        </a-button>
        <!-- 清空回收站 -->
        <a-button
          type="outline"
          status="danger"
          size="large"
          :disabled="fileList.length === 0"
          @click="handleClearRecycle"
        >
          <template #icon>
            <icon-delete />
          </template>
          清空回收站
        </a-button>
        <!-- 提示文字 -->
        <span class="recycle-tip">
          <icon-info-circle />
          回收站文件保存10天，到期后自动清理
        </span>
      </div>
      <div class="toolbar-right">
        <!-- 刷新按钮 -->
        <a-button size="large" @click="fetchRecycleList">
          <template #icon>
            <icon-refresh />
          </template>
        </a-button>
      </div>
    </div>

    <!-- 面包屑导航 -->
    <div class="recycle-breadcrumb">
      <div class="breadcrumb-left">
        <icon-delete />
        <span class="breadcrumb-title">回收站</span>
      </div>
      <div class="breadcrumb-info">
        共 {{ fileList.length }} 个文件
        <template v-if="selectedIds.length > 0">
          ，已选 {{ selectedIds.length }} 个
        </template>
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="recycle-content">
      <a-spin :loading="loading" style="width: 100%; min-height: 400px">
        <!-- 空状态 -->
        <a-empty
          v-if="!loading && fileList.length === 0"
          description="回收站为空"
        >
          <template #image>
            <icon-delete :size="64" style="color: var(--color-text-3)" />
          </template>
        </a-empty>

        <!-- 列表视图 -->
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
                    <a-button
                      size="small"
                      type="text"
                      @click="handleRestoreSingle(record.id)"
                    >
                      <template #icon>
                        <icon-undo />
                      </template>
                      还原
                    </a-button>
                    <a-button
                      size="small"
                      type="text"
                      status="danger"
                      @click="handleDeleteSingle(record.id, record.displayName)"
                    >
                      <template #icon>
                        <icon-delete />
                      </template>
                      删除
                    </a-button>
                  </div>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { Message, Modal } from '@arco-design/web-vue';
  import {
    IconDelete,
    IconUndo,
    IconInfoCircle,
    IconRefresh,
  } from '@arco-design/web-vue/es/icon';
  import type { FileRecycleItem } from '@/types/modules/file';
  import {
    getRecycleList,
    restoreFiles,
    permanentDeleteFiles,
    clearRecycle,
  } from '@/api/file';
  import { getFileIconPath } from '@/utils/file-icon';
  import { formatFileSize, formatFileTime } from '../hooks/use-file-format';

  const loading = ref(false);
  const fileList = ref<FileRecycleItem[]>([]);
  const selectedIds = ref<string[]>([]);

  /**
   * 获取回收站文件列表
   */
  const fetchRecycleList = async () => {
    loading.value = true;
    try {
      const response = await getRecycleList();
      fileList.value = response.data || [];
    } catch {
      // 拦截器已统一处理错误提示
      fileList.value = [];
    } finally {
      loading.value = false;
    }
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
          fetchRecycleList();
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
          fetchRecycleList();
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
          fetchRecycleList();
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
          fetchRecycleList();
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
          fetchRecycleList();
        });
      },
    });
  };

  // 初始化加载数据
  onMounted(() => {
    fetchRecycleList();
  });
</script>

<style lang="less" scoped>
  .recycle-bin-view {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .recycle-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--color-border-2);
    background-color: var(--color-bg-2);

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .recycle-tip {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: 12px;
        font-size: 14px;
        color: var(--color-text-3);

        .arco-icon {
          font-size: 16px;
        }
      }
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .recycle-breadcrumb {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    border-bottom: 1px solid var(--color-border-2);
    background-color: var(--color-bg-2);

    .breadcrumb-left {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--color-text-2);

      .arco-icon {
        font-size: 16px;
      }

      .breadcrumb-title {
        font-weight: 500;
      }
    }

    .breadcrumb-info {
      font-size: 14px;
      color: var(--color-text-3);
    }
  }

  .recycle-content {
    flex: 1;
    padding: 16px 24px;
    overflow-y: auto;
  }

  .file-list {
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
