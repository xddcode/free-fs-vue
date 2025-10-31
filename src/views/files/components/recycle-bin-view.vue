<template>
  <div class="recycle-bin-view">
    <!-- 工具栏 -->
    <div class="recycle-toolbar">
      <!-- 批量操作工具栏 -->
      <div v-if="selectedIds.length > 0" class="batch-toolbar">
        <div class="toolbar-left">
          <!-- 批量还原 -->
          <a-button type="outline" size="large" @click="handleBatchRestore">
            <template #icon>
              <icon-undo />
            </template>
            还原
          </a-button>
          <!-- 批量删除 -->
          <a-button
            type="outline"
            status="danger"
            size="large"
            @click="handleBatchDelete"
          >
            <template #icon>
              <icon-delete />
            </template>
            删除
          </a-button>
        </div>
      </div>

      <!-- 普通工具栏 -->
      <template v-else>
        <div class="toolbar-left">
          <a-input-search
            v-model="searchKeyword"
            placeholder="搜索回收站文件"
            size="large"
            style="width: 320px"
            allow-clear
            @search="handleSearch"
            @clear="handleSearch"
          />
        </div>
      </template>
    </div>

    <!-- 面包屑导航 -->
    <div class="recycle-breadcrumb">
      <a-breadcrumb>
        <a-breadcrumb-item>
          <span class="breadcrumb-link is-current">
            <icon-delete />
            回收站
          </span>
        </a-breadcrumb-item>
      </a-breadcrumb>
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
        <div v-else class="file-list-container">
          <!-- 列表头部 -->
          <div class="file-list-header">
            <div class="header-left">
              <span class="file-count-text">
                {{
                  selectedIds.length > 0
                    ? `已选 ${selectedIds.length} 个文件`
                    : `共 ${fileList.length} 个文件`
                }}
              </span>
              <span class="recycle-tip">
                <icon-info-circle />
                回收站文件保存10天，到期后自动清理
              </span>
            </div>
            <div class="header-right">
              <!-- 清空回收站 -->
              <a-button
                size="large"
                status="danger"
                :disabled="fileList.length === 0"
                @click="handleClearRecycle"
              >
                <template #icon>
                  <icon-delete />
                </template>
                清空
              </a-button>
              <!-- 刷新按钮 -->
              <a-button size="large" @click="handleRefresh">
                <template #icon>
                  <icon-refresh />
                </template>
              </a-button>
            </div>
          </div>

          <!-- 文件表格 -->
          <div class="file-list">
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
                        @click="
                          handleDeleteSingle(record.id, record.displayName)
                        "
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
    }

    .batch-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }
  }

  .recycle-breadcrumb {
    display: flex;
    align-items: center;
    padding: 12px 24px;
    border-bottom: 1px solid var(--color-border-2);
    background-color: var(--color-bg-2);

    .breadcrumb-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: color 0.2s;

      &.is-current {
        color: var(--color-text-1);
        font-weight: 500;
        cursor: default;
      }
    }
  }

  .recycle-content {
    flex: 1;
    overflow-y: auto;
  }

  .file-list-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .file-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border-2);
    background-color: var(--color-bg-1);

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .file-count-text {
        font-size: 14px;
        color: var(--color-text-2);
      }

      .recycle-tip {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--color-text-3);

        .arco-icon {
          font-size: 14px;
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
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
