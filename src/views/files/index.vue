<template>
  <div class="file-manager">
    <a-layout class="file-layout">
      <!-- 右侧：主内容区 -->
      <a-layout-content class="file-main-content">
        <!-- 回收站视图 -->
        <recycle-bin-view v-if="isRecycleBin" />

        <!-- 我的分享视图 -->
        <my-shares-view v-else-if="isSharesView" />

        <!-- 普通文件视图和收藏视图 -->
        <template v-else>
          <!-- 工具栏 -->
          <toolbar
            v-model:search-keyword="searchKeyword"
            :hide-actions="isFavoritesView || isRecentsView"
            @upload="triggerFileSelect"
            @create-folder="operations.openCreateFolderModal"
            @search="fileList.search"
            @refresh="fileList.refresh"
          />

          <!-- 面包屑导航 -->
          <file-breadcrumb
            :breadcrumb-path="fileList.breadcrumbPath.value"
            :custom-title="
              isFavoritesView
                ? '我的收藏'
                : isRecentsView
                ? '最近使用'
                : undefined
            "
            @navigate="fileList.navigateToFolder"
          />

          <!-- 统一的视图控制栏 (固定高度，防止切换跳动) -->
          <div class="view-control-bar">
            <div class="control-left">
              <a-checkbox
                v-if="viewMode === 'grid'"
                :model-value="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="handleSelectAll"
              >
                <span class="file-count-text">
                  {{
                    selectedKeys.length > 0
                      ? `已选 ${selectedKeys.length} 项`
                      : `共 ${fileList.fileList.value.length} 项`
                  }}
                </span>
              </a-checkbox>
              <span v-else class="file-count-text">
                {{
                  selectedKeys.length > 0
                    ? `已选 ${selectedKeys.length} 项`
                    : `共 ${fileList.fileList.value.length} 项`
                }}
              </span>
            </div>
            <div class="control-right">
              <a-button-group size="small">
                <a-button
                  :type="viewMode === 'list' ? 'primary' : 'secondary'"
                  @click="viewMode = 'list'"
                >
                  <template #icon><icon-list /></template>
                </a-button>
                <a-button
                  :type="viewMode === 'grid' ? 'primary' : 'secondary'"
                  @click="viewMode = 'grid'"
                >
                  <template #icon><icon-apps /></template>
                </a-button>
              </a-button-group>
            </div>
          </div>

          <!-- 文件内容区域 -->
          <a-dropdown
            v-model:popup-visible="contextMenuVisible"
            trigger="contextMenu"
            align-point
            :style="{ display: 'block' }"
            :popup-container="'body'"
          >
            <div
              class="file-content"
              @contextmenu.stop
              @click="handleContentClick"
            >
              <LoadingSpinner
                :loading="fileList.loading.value"
                :size="150"
                full-height
              >
                <!-- 空状态 -->
                <a-empty
                  v-if="
                    !fileList.loading.value &&
                    fileList.fileList.value.length === 0
                  "
                  :description="
                    isFavoritesView
                      ? '暂无收藏文件'
                      : isRecentsView
                      ? '暂无最近使用文件'
                      : '暂无文件'
                  "
                />

                <!-- 列表视图 -->
                <file-list-view
                  v-else-if="viewMode === 'list'"
                  v-model:selected-keys="selectedKeys"
                  v-model:view-mode="viewMode"
                  :file-list="fileList.fileList.value"
                  @row-click="handleFileClick"
                  @sort-change="fileList.handleSortChange"
                  @download="operations.handleDownload"
                  @share="operations.openShareModal"
                  @delete="operations.openDeleteConfirm"
                  @rename="operations.openRenameModal"
                  @move="operations.openMoveModal"
                  @favorite="handleFavorite"
                  @refresh="fileList.refresh"
                  @preview="operations.openPreview"
                  @move-items="operations.handleMove"
                  @dropdown-open="handleDropdownOpen"
                />

                <!-- 网格视图 -->
                <file-grid-view
                  v-else
                  v-model:selected-keys="selectedKeys"
                  v-model:view-mode="viewMode"
                  :file-list="fileList.fileList.value"
                  @file-click="handleFileClick"
                  @download="operations.handleDownload"
                  @share="operations.openShareModal"
                  @delete="operations.openDeleteConfirm"
                  @rename="operations.openRenameModal"
                  @move="operations.openMoveModal"
                  @favorite="handleFavorite"
                  @refresh="fileList.refresh"
                  @preview="operations.openPreview"
                  @move-items="operations.handleMove"
                  @dropdown-open="handleDropdownOpen"
                />
              </LoadingSpinner>
            </div>
            <template #content>
              <a-doption @click="operations.openCreateFolderModal">
                <template #icon><icon-folder-add /></template>
                新建文件夹
              </a-doption>
              <a-divider style="margin: 4px 0" />
              <a-doption @click="triggerFileSelect">
                <template #icon><icon-upload /></template>
                上传
              </a-doption>
              <a-divider style="margin: 4px 0" />
              <a-doption @click="fileList.refresh">
                <template #icon><icon-refresh /></template>
                刷新
              </a-doption>
            </template>
          </a-dropdown>
        </template>
      </a-layout-content>
    </a-layout>

    <!-- 隐藏的文件选择input -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      style="display: none"
      @change="handleFileSelect"
    />
    <upload-panel />
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
      :files="operations.movingFiles.value"
      @confirm="handleMove"
      @refresh="fileList.refresh"
    />

    <!-- 分享弹窗 -->
    <share-modal
      v-model:visible="operations.shareModalVisible.value"
      :file="operations.sharingFile.value"
      :files="operations.sharingFiles.value"
      @success="clearSelection"
    />

    <!-- 底部悬浮批量操作栏 -->
    <transition name="slide-up">
      <div v-if="selectedKeys.length > 0" class="selection-dock">
        <div class="dock-content">
          <div class="dock-actions">
            <a-tooltip content="下载">
              <a-button
                type="text"
                class="dock-btn"
                @click="handleBatchDownload"
              >
                <template #icon><icon-download /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="分享">
              <a-button type="text" class="dock-btn" @click="handleBatchShare">
                <template #icon><icon-share-alt /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip :content="favoriteButtonText">
              <a-button
                type="text"
                class="dock-btn"
                @click="handleBatchFavorite"
              >
                <template #icon>
                  <icon-heart
                    :fill="hasUnfavorited ? undefined : 'currentColor'"
                  />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="移动">
              <a-button type="text" class="dock-btn" @click="handleBatchMove">
                <template #icon><icon-drag-arrow /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="删除">
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
  import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { Message } from '@arco-design/web-vue';
  import {
    IconFolderAdd,
    IconUpload,
    IconRefresh,
    IconDownload,
    IconShareAlt,
    IconHeart,
    IconDragArrow,
    IconDelete,
    IconCloseCircleFill,
  } from '@arco-design/web-vue/es/icon';
  import type { FileItem } from '@/types/modules/file';
  import { useUploadTaskStore, useTransferStore } from '@/store';
  import { LoadingSpinner } from '@/components';
  import { useFileList, useFileOperations } from './hooks';
  import {
    Toolbar,
    FileBreadcrumb,
    FileListView,
    FileGridView,
    CreateFolderModal,
    RenameModal,
    MoveModal,
    ShareModal,
    RecycleBinView,
    MySharesView,
    UploadPanel,
  } from './components';

  const route = useRoute();
  const router = useRouter();

  // 文件选择input引用
  const fileInputRef = ref<HTMLInputElement | null>(null);

  // 当前激活的分类 - 逻辑现在由全局侧边栏路由驱动
  const isRecycleBin = computed(() => route.query.view === 'recycle');
  const isFavoritesView = computed(() => route.query.view === 'favorites');
  const isSharesView = computed(() => route.query.view === 'shares');
  const isRecentsView = computed(() => route.query.view === 'recents');

  // 视图模式
  const viewMode = ref<'list' | 'grid'>('grid');

  // 选中的文件
  const selectedKeys = ref<string[]>([]);

  // 右键菜单显示状态
  const contextMenuVisible = ref(false);

  /**
   * 清空选中
   */
  const clearSelection = () => {
    selectedKeys.value = [];
  };

  // 使用文件列表 Hook
  const fileList = useFileList();
  const { searchKeyword } = fileList;

  // 选中的文件对象列表
  const selectedFiles = computed(() => {
    return fileList.fileList.value.filter((file) =>
      selectedKeys.value.includes(file.id)
    );
  });

  // 计算是否有未收藏的文件
  const hasUnfavorited = computed(() => {
    if (selectedFiles.value.length === 0) return true;
    return selectedFiles.value.some((file) => !file.isFavorite);
  });

  // 收藏按钮文本
  const favoriteButtonText = computed(() => {
    return hasUnfavorited.value ? '收藏' : '取消收藏';
  });

  // 使用文件操作 Hook
  const operations = useFileOperations(() => {
    fileList.refresh();
  });

  /**
   * 触发文件选择
   */
  const triggerFileSelect = () => {
    fileInputRef.value?.click();
  };

  /**
   * 处理文件选择
   */
  const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const { files } = target;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);

      if (fileArray.length > 5) {
        Message.warning('一次最多只能上传5个文件');
        target.value = '';
        return;
      }

      const transferStore = useTransferStore();
      const fileCount = fileArray.length;

      try {
        // 开始新的上传批次
        const sessionId = transferStore.startUploadSession();

        // 使用 Transfer Store 创建上传任务
        await Promise.all(
          fileArray.map((file) =>
            transferStore.createTask(
              file,
              fileList.currentParentId.value,
              sessionId
            )
          )
        );

        // 显示成功通知
        Message.success({
          content: `已添加 ${fileCount} 个文件到传输列表`,
          duration: 2000,
        });

        target.value = '';
        fileList.refresh();
      } catch {
        Message.error({
          content: '添加文件失败，请重试',
          duration: 3000,
        });
      }
    }
  };

  /**
   * 处理文件点击（进入文件夹）
   */
  const handleFileClick = (file: FileItem) => {
    if (file.isDir) {
      if (isFavoritesView.value || isRecentsView.value) {
        router.push({
          path: '/files',
          query: {
            parentId: file.id,
          },
        });
      } else {
        fileList.enterFolder(file.id, viewMode.value);
      }
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
  const handleMove = async (fileIds: string[], targetDirId: string) => {
    await operations.handleMove(fileIds, targetDirId);
    clearSelection();
  };

  /**
   * 处理批量删除
   */
  const handleBatchDelete = () => {
    if (selectedKeys.value.length === 0) return;

    // 保存要删除的文件列表（避免闭包问题）
    const filesToDelete = [...selectedFiles.value];

    operations.openBatchDeleteConfirm(filesToDelete, () => {
      // 删除成功后清空选中状态
      clearSelection();
    });
  };

  /**
   * 处理批量下载
   */
  const handleBatchDownload = async () => {
    if (selectedKeys.value.length === 0) return;
    const downloadableFiles = selectedFiles.value.filter((f) => !f.isDir);
    if (downloadableFiles.length === 0) {
      Message.warning('没有可下载的文件');
      return;
    }
    await operations.handleDownload(downloadableFiles);
    clearSelection();
  };

  /**
   * 处理批量分享
   */
  const handleBatchShare = () => {
    if (selectedKeys.value.length === 0) return;
    operations.openBatchShareModal(selectedFiles.value);
  };

  /**
   * 处理批量收藏
   */
  const handleBatchFavorite = async () => {
    if (selectedKeys.value.length === 0) return;
    await operations.handleFavorite(selectedFiles.value);
    clearSelection();
  };

  /**
   * 处理批量移动
   */
  const handleBatchMove = () => {
    if (selectedKeys.value.length === 0) return;

    // 保存要移动的文件列表
    const filesToMove = [...selectedFiles.value];

    operations.openBatchMoveModal(filesToMove, () => {
      // 移动成功后清空选中状态
      clearSelection();
    });
  };

  /**
   * 处理收藏
   */
  const handleFavorite = async (file: FileItem) => {
    await operations.handleFavorite(file);
  };

  // 处理来自侧边栏的全局动作事件
  const handleSidebarAction = (event: any) => {
    const { type } = event.detail;
    if (type === 'create-folder') {
      operations.openCreateFolderModal();
    } else if (type === 'upload') {
      triggerFileSelect();
    }
  };

  // 监听文件列表变化，清空选中状态
  watch(
    () => fileList.fileList.value,
    () => {
      clearSelection();
    }
  );

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    const uploadStore = useUploadTaskStore();
    const hasUploadingTasks = uploadStore.taskList.some(
      (task) => task.status === 'uploading'
    );

    if (hasUploadingTasks) {
      e.preventDefault();
      e.returnValue = '';
      return '有文件正在上传，确定要离开吗？';
    }
    return undefined;
  };

  const handleFileUploadComplete = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { parentId } = customEvent.detail;
    if (parentId === fileList.currentParentId.value || !parentId) {
      fileList.refresh();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      clearSelection();
    }
  };

  const handleContentClick = () => {
    contextMenuVisible.value = false;
  };

  const handleDropdownOpen = () => {
    contextMenuVisible.value = false;
  };

  // 全选相关逻辑
  const isAllSelected = computed(() => {
    const list = fileList.fileList.value;
    if (!list.length) return false;
    return (
      selectedKeys.value.length === list.length &&
      list.every((file) => selectedKeys.value.includes(file.id))
    );
  });

  const isIndeterminate = computed(() => {
    const selectedCount = selectedKeys.value.length;
    return selectedCount > 0 && selectedCount < fileList.fileList.value.length;
  });

  const handleSelectAll = (value: boolean | (string | number | boolean)[]) => {
    const checked = typeof value === 'boolean' ? value : value.length > 0;
    if (checked) {
      selectedKeys.value = fileList.fileList.value.map((file) => file.id);
    } else {
      selectedKeys.value = [];
    }
  };

  onMounted(() => {
    viewMode.value = (route.query.viewMode ?? 'grid') as 'grid' | 'list';
    fileList.fetchFileList();
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('file-upload-complete', handleFileUploadComplete);
    window.addEventListener('keydown', handleKeyDown);
    // 监听全局动作
    window.addEventListener('sidebar-action', handleSidebarAction);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener(
      'file-upload-complete',
      handleFileUploadComplete
    );
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('sidebar-action', handleSidebarAction);
  });
</script>

<style lang="less" scoped>
  .file-manager {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-2);
    position: relative; // 必须设为 relative 供底部操作栏定位

    .file-layout {
      height: 100%;
      background-color: var(--color-bg-2);
    }

    // 右侧主内容区
    .file-main-content {
      display: flex;
      flex-direction: column;
      background-color: var(--color-bg-1); // 使用 bg-1 增加对比
    }

    // 文件内容区域
    .file-content {
      flex: 1;
      padding: 0 24px 16px; // 顶部间距由 view-control-bar 提供
      overflow-y: auto;
    }
  }

  // 统一的控制栏样式
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

      :deep(.arco-btn-group) {
        background-color: var(--color-fill-2);
        padding: 2px;
        border-radius: 6px;
        .arco-btn {
          border: none;
          &.arco-btn-secondary {
            background: transparent;
            color: var(--color-text-3);
          }
          &.arco-btn-primary {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
        }
      }
    }
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
    padding: 8px 12px; // 稍微收窄内边距
    border: 1px solid rgba(255, 255, 255, 0.08);

    .dock-content {
      display: flex;
      align-items: center;
      gap: 16px; // 加大按钮组与取消按钮的间距
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
</style>
