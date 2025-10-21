<template>
  <div class="recycle-bin-view">
    <!-- 工具栏 -->
    <div class="recycle-toolbar">
      <div class="toolbar-left">
        <h3 class="page-title">回收站</h3>
        <span class="file-count">{{ fileList.length }} 个文件</span>
      </div>
      <div class="toolbar-right">
        <a-button
          type="outline"
          status="danger"
          :disabled="fileList.length === 0"
          @click="handleClearRecycle"
        >
          <template #icon>
            <icon-delete />
          </template>
          清空回收站
        </a-button>
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
            :data="fileList"
            :pagination="false"
            :bordered="false"
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
                data-index="updateTime"
                :width="180"
              >
                <template #cell="{ record }">
                  <span class="file-time">{{
                    formatFileTime(record.updateTime)
                  }}</span>
                </template>
              </a-table-column>

              <a-table-column title="操作" :width="200" align="center">
                <template #cell="{ record }">
                  <div class="file-actions">
                    <a-button
                      size="small"
                      type="text"
                      @click="handleRestore(record)"
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
                      @click="handleDelete(record)"
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
  import { IconDelete, IconUndo } from '@arco-design/web-vue/es/icon';
  import type { FileItem } from '@/types/modules/file';
  import {
    getRecycleList,
    restoreFile,
    permanentDeleteFile,
    clearRecycle,
  } from '@/api/file';
  import { getFileIconPath } from '@/utils/file-icon';
  import { formatFileSize, formatFileTime } from '../hooks/use-file-format';

  const loading = ref(false);
  const fileList = ref<FileItem[]>([]);

  /**
   * 获取回收站文件列表
   */
  const fetchRecycleList = async () => {
    loading.value = true;
    try {
      const response = await getRecycleList();
      fileList.value = response.data || [];
    } catch (error) {
      Message.error('获取回收站列表失败');
      fileList.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 还原文件
   */
  const handleRestore = (file: FileItem) => {
    Modal.confirm({
      title: '确认还原',
      content: `确定要还原文件 "${file.displayName}" 吗？`,
      okText: '还原',
      cancelText: '取消',
      onOk: async () => {
        try {
          await restoreFile(file.id);
          Message.success('还原成功');
          fetchRecycleList();
        } catch (error) {
          Message.error('还原失败');
        }
      },
    });
  };

  /**
   * 彻底删除文件
   */
  const handleDelete = (file: FileItem) => {
    Modal.confirm({
      title: '确认彻底删除',
      content: `确定要彻底删除文件 "${file.displayName}" 吗？删除后将无法恢复！`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: {
        status: 'danger',
      },
      onOk: async () => {
        try {
          await permanentDeleteFile(file.id);
          Message.success('删除成功');
          fetchRecycleList();
        } catch (error) {
          Message.error('删除失败');
        }
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
        try {
          await clearRecycle();
          Message.success('回收站已清空');
          fetchRecycleList();
        } catch (error) {
          Message.error('清空失败');
        }
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

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .page-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-1);
      }

      .file-count {
        font-size: 13px;
        color: var(--color-text-3);
      }
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
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
