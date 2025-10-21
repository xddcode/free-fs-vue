<template>
  <div class="file-manager">
    <!-- 回收站视图 -->
    <recycle-bin-view v-if="isRecycleBin" />

    <!-- 普通文件视图 -->
    <template v-else>
      <!-- 工具栏 -->
      <toolbar
        v-model:search-keyword="searchKeyword"
        v-model:view-mode="viewMode"
        @upload="operations.openUploadModal"
        @create-folder="operations.openCreateFolderModal"
        @search="fileList.search"
        @refresh="fileList.refresh"
      />

      <!-- 面包屑导航 -->
      <file-breadcrumb :total="fileList.total.value" />

      <!-- 文件内容区域 -->
      <div class="file-content">
        <a-spin
          :loading="fileList.loading.value"
          style="width: 100%; min-height: 400px"
        >
          <!-- 空状态 -->
          <a-empty
            v-if="
              !fileList.loading.value && fileList.fileList.value.length === 0
            "
            description="暂无文件"
          />

          <!-- 列表视图 -->
          <file-list-view
            v-else-if="viewMode === 'list'"
            :file-list="fileList.fileList.value"
            @row-click="handleFileClick"
            @sort-change="fileList.handleSortChange"
            @download="operations.handleDownload"
            @share="operations.openShareModal"
            @delete="operations.openDeleteConfirm"
            @rename="operations.openRenameModal"
            @move="operations.openMoveModal"
          />

          <!-- 网格视图 -->
          <file-grid-view
            v-else
            :file-list="fileList.fileList.value"
            @file-click="handleFileClick"
            @download="operations.handleDownload"
            @share="operations.openShareModal"
            @delete="operations.openDeleteConfirm"
            @rename="operations.openRenameModal"
            @move="operations.openMoveModal"
          />
        </a-spin>
      </div>
    </template>

    <!-- 上传文件弹窗 -->
    <upload-modal
      v-model:visible="operations.uploadModalVisible.value"
      :parent-id="fileList.currentParentId.value"
      @success="fileList.refresh"
    />

    <!-- 新建文件夹弹窗 -->
    <create-folder-modal
      v-model:visible="operations.createFolderModalVisible.value"
      :parent-id="fileList.currentParentId.value"
      @confirm="handleCreateFolder"
    />

    <!-- 重命名弹窗 -->
    <rename-modal
      v-model:visible="operations.renameModalVisible.value"
      :file="operations.renamingFile.value"
      @confirm="handleRename"
    />

    <!-- 移动文件弹窗 -->
    <move-modal
      v-model:visible="operations.moveModalVisible.value"
      :file="operations.movingFile.value"
      @confirm="handleMove"
    />

    <!-- 分享弹窗 -->
    <share-modal
      v-model:visible="operations.shareModalVisible.value"
      :file="operations.sharingFile.value"
      @confirm="handleShare"
    />

    <!-- 删除确认弹窗 -->
    <delete-confirm-modal
      v-model:visible="operations.deleteConfirmVisible.value"
      :file="operations.deletingFile.value"
      @confirm="handleDelete"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import type { FileItem } from '@/types/modules/file';
  import { useFileList, useFileOperations } from './hooks';
  import {
    Toolbar,
    FileBreadcrumb,
    FileListView,
    FileGridView,
    UploadModal,
    CreateFolderModal,
    RenameModal,
    MoveModal,
    ShareModal,
    DeleteConfirmModal,
    RecycleBinView,
  } from './components';

  const route = useRoute();

  // 是否是回收站视图
  const isRecycleBin = computed(() => route.query.view === 'recycle');

  // 视图模式
  const viewMode = ref<'list' | 'grid'>('grid');

  // 使用文件列表 Hook
  const fileList = useFileList();
  const { searchKeyword } = fileList;

  // 使用文件操作 Hook
  const operations = useFileOperations(() => {
    fileList.refresh();
  });

  /**
   * 处理文件点击（进入文件夹）
   */
  const handleFileClick = (file: FileItem) => {
    if (file.isDir) {
      fileList.enterFolder(file.id);
    }
  };

  /**
   * 处理创建文件夹
   */
  const handleCreateFolder = async (folderName: string, parentId?: string) => {
    await operations.handleCreateFolder(folderName, parentId);
  };

  /**
   * 处理重命名
   */
  const handleRename = async (fileId: string, newName: string) => {
    await operations.handleRename(fileId, newName);
  };

  /**
   * 处理移动
   */
  const handleMove = async (fileId: string, targetParentId: string) => {
    await operations.handleMove(fileId, targetParentId);
  };

  /**
   * 处理分享
   */
  const handleShare = async (fileId: string, expireDays?: number) => {
    await operations.handleShare(fileId, expireDays);
  };

  /**
   * 处理删除
   */
  const handleDelete = async (fileId: string) => {
    await operations.handleDelete(fileId);
  };

  // 初始化加载数据
  onMounted(() => {
    fileList.fetchFileList();
  });
</script>

<style lang="less" scoped>
  .file-manager {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-2);

    // 文件内容区域
    .file-content {
      flex: 1;
      padding: 16px 24px;
      overflow-y: auto;
    }
  }
</style>
