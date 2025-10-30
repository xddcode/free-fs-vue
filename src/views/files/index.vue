<template>
  <div class="file-manager">
    <a-layout class="file-layout">
      <!-- 左侧：文件分类（始终显示） -->
      <a-layout-sider class="category-sider" :width="240">
        <div class="category-header">
          <div class="category-title">
            <icon-cloud :size="20" />
            <span>我的文件</span>
          </div>
        </div>

        <div class="category-menu">
          <div
            v-for="category in fileCategories"
            :key="category.key"
            :class="[
              'category-item',
              { active: activeCategory === category.key },
            ]"
            @click="handleCategoryClick(category)"
          >
            <component :is="category.icon" :size="18" />
            <span>{{ category.label }}</span>
            <span v-if="category.count" class="count">{{
              category.count
            }}</span>
          </div>

          <a-divider style="margin: 16px 0" />

          <div class="quick-access">
            <div class="quick-title">快捷访问</div>
            <div
              :class="[
                'category-item',
                { active: activeCategory === 'favorites' },
              ]"
              @click="handleFavoritesClick"
            >
              <icon-star :size="18" />
              <span>我的收藏</span>
            </div>
            <div
              :class="[
                'category-item',
                { active: activeCategory === 'shares' },
              ]"
              @click="handleSharesClick"
            >
              <icon-share-alt :size="18" />
              <span>我的分享</span>
            </div>
            <div class="category-item">
              <icon-history :size="18" />
              <span>最近使用</span>
            </div>
          </div>
        </div>
      </a-layout-sider>

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
            :hide-actions="isFavoritesView"
            :selected-count="selectedKeys.length"
            :selected-files="selectedFiles"
            @upload="operations.openUploadModal"
            @create-folder="operations.openCreateFolderModal"
            @search="fileList.search"
            @batch-delete="handleBatchDelete"
            @batch-download="handleBatchDownload"
            @batch-share="handleBatchShare"
            @batch-favorite="handleBatchFavorite"
            @batch-move="handleBatchMove"
          />

          <!-- 面包屑导航 -->
          <file-breadcrumb
            :breadcrumb-path="fileList.breadcrumbPath.value"
            :custom-title="isFavoritesView ? '我的收藏' : undefined"
            @navigate="fileList.navigateToFolder"
          />

          <!-- 文件内容区域 -->
          <div class="file-content">
            <a-spin
              :loading="fileList.loading.value"
              style="width: 100%; min-height: 400px"
            >
              <!-- 空状态 -->
              <a-empty
                v-if="
                  !fileList.loading.value &&
                  fileList.fileList.value.length === 0
                "
                :description="isFavoritesView ? '暂无收藏文件' : '暂无文件'"
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
              />
            </a-spin>
          </div>
        </template>
      </a-layout-content>
    </a-layout>

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
      :files="operations.deletingFiles.value"
      @confirm="handleDelete"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted, markRaw, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { Message } from '@arco-design/web-vue';
  import {
    IconCloud,
    IconFile,
    IconImage,
    IconMusic,
    IconDelete,
    IconStar,
    IconHistory,
    IconFileVideo,
    IconMore,
    IconShareAlt,
  } from '@arco-design/web-vue/es/icon';
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
    MySharesView,
  } from './components';

  const route = useRoute();
  const router = useRouter();

  // 文件分类（对应后端 FileTypeEnum）
  const fileCategories = [
    {
      key: 'all',
      label: '全部文件',
      icon: markRaw(IconFile),
      path: '/files',
      count: null,
    },
    {
      key: 'image',
      label: '图片',
      icon: markRaw(IconImage),
      path: '/files?type=image',
      count: null,
    },
    {
      key: 'document',
      label: '文档',
      icon: markRaw(IconFile),
      path: '/files?type=document',
      count: null,
    },
    {
      key: 'video',
      label: '视频',
      icon: markRaw(IconFileVideo),
      path: '/files?type=video',
      count: null,
    },
    {
      key: 'audio',
      label: '音频',
      icon: markRaw(IconMusic),
      path: '/files?type=audio',
      count: null,
    },
    {
      key: 'other',
      label: '其它',
      icon: markRaw(IconMore),
      path: '/files?type=other',
      count: null,
    },
    {
      key: 'recycle',
      label: '回收站',
      icon: markRaw(IconDelete),
      path: '/files?view=recycle',
      count: null,
    },
  ];

  // 当前激活的分类
  const activeCategory = computed(() => {
    if (route.query.view === 'recycle') return 'recycle';
    if (route.query.view === 'favorites') return 'favorites';
    if (route.query.view === 'shares') return 'shares';
    if (!route.query.type) return 'all';
    return route.query.type as string;
  });

  // 是否是回收站视图
  const isRecycleBin = computed(() => route.query.view === 'recycle');

  // 是否是收藏视图
  const isFavoritesView = computed(() => route.query.view === 'favorites');

  // 是否是分享视图
  const isSharesView = computed(() => route.query.view === 'shares');

  // 视图模式
  const viewMode = ref<'list' | 'grid'>('grid');

  // 选中的文件
  const selectedKeys = ref<string[]>([]);

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

  // 使用文件操作 Hook
  const operations = useFileOperations(() => {
    fileList.refresh();
  });

  /**
   * 处理文件点击（进入文件夹）
   */
  const handleFileClick = (file: FileItem) => {
    if (file.isDir) {
      // 如果在收藏视图下，跳转到全部文件页面并进入该文件夹
      if (isFavoritesView.value) {
        router.push({
          path: '/files',
          query: {
            parentId: file.id,
          },
        });
      } else {
        // 正常进入文件夹
        fileList.enterFolder(file.id);
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
  const handleMove = async (fileId: string, targetParentId: string) => {
    // 如果有选中的文件，移动所有选中的文件
    if (selectedKeys.value.length > 0) {
      await operations.handleMove(selectedKeys.value, targetParentId);
      clearSelection();
    } else {
      // 否则只移动单个文件
      await operations.handleMove(fileId, targetParentId);
    }
  };

  /**
   * 处理分享
   */
  const handleShare = async (fileId: string, expireDays?: number) => {
    // 如果有选中的文件，分享所有选中的文件
    if (selectedKeys.value.length > 0) {
      await operations.handleShare(selectedKeys.value, expireDays);
      clearSelection();
    } else {
      // 否则只分享单个文件
      await operations.handleShare(fileId, expireDays);
    }
  };

  /**
   * 处理删除
   */
  const handleDelete = async (fileIds: string | string[]) => {
    await operations.handleDelete(fileIds);
    // 删除成功后清空选中
    clearSelection();
  };

  /**
   * 处理批量删除
   */
  const handleBatchDelete = () => {
    if (selectedKeys.value.length === 0) return;
    operations.openBatchDeleteConfirm(selectedFiles.value);
  };

  /**
   * 处理批量下载
   */
  const handleBatchDownload = async () => {
    if (selectedKeys.value.length === 0) return;

    // 过滤出非文件夹的文件
    const downloadableFiles = selectedFiles.value.filter((f) => !f.isDir);

    if (downloadableFiles.length === 0) {
      Message.warning('没有可下载的文件');
      return;
    }

    // 使用批量下载
    await operations.handleDownload(downloadableFiles);
    clearSelection();
  };

  /**
   * 处理批量分享
   */
  const handleBatchShare = async () => {
    if (selectedKeys.value.length === 0) return;

    // 调用批量分享
    await operations.handleShare(selectedKeys.value);
    clearSelection();
  };

  /**
   * 处理批量收藏
   */
  const handleBatchFavorite = async () => {
    if (selectedKeys.value.length === 0) return;

    // 使用统一的收藏方法
    await operations.handleFavorite(selectedFiles.value);
    clearSelection();
  };

  /**
   * 处理批量移动
   */
  const handleBatchMove = () => {
    if (selectedKeys.value.length === 0) return;

    // 打开移动弹窗 - 使用第一个文件作为代表
    const [firstFile] = selectedFiles.value;
    if (firstFile) {
      operations.movingFile.value = firstFile;
      operations.moveModalVisible.value = true;
    }
  };

  /**
   * 处理收藏
   */
  const handleFavorite = async (file: FileItem) => {
    await operations.handleFavorite(file);
  };

  /**
   * 处理分类点击
   */
  const handleCategoryClick = (category: any) => {
    router.push(category.path);
  };

  /**
   * 处理收藏点击
   */
  const handleFavoritesClick = () => {
    router.push('/files?view=favorites');
  };

  /**
   * 处理分享点击
   */
  const handleSharesClick = () => {
    router.push('/files?view=shares');
  };

  // 监听文件列表变化，清空选中状态
  watch(
    () => fileList.fileList.value,
    () => {
      clearSelection();
    }
  );

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

    .file-layout {
      height: 100%;
      background-color: var(--color-bg-2);
    }

    // 分类侧边栏
    .category-sider {
      background-color: var(--color-bg-2);
      border-right: 1px solid var(--color-border-2);

      :deep(.arco-layout-sider-children) {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
    }

    .category-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--color-border-2);

      .category-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-1);
      }
    }

    .category-menu {
      flex: 1;
      padding: 8px;
      overflow-y: auto;
    }

    .category-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--color-text-2);
      font-size: 14px;
      margin-bottom: 2px;

      span:first-of-type {
        flex: 1;
      }

      .count {
        font-size: 12px;
        color: var(--color-text-3);
        flex: none;
      }

      &:hover {
        background-color: var(--color-fill-2);
        color: rgb(var(--primary-6));
      }

      &.active {
        background-color: var(--color-primary-light-1);
        color: rgb(var(--primary-6));
        font-weight: 500;
      }
    }

    .quick-access {
      .quick-title {
        font-size: 12px;
        color: var(--color-text-3);
        padding: 8px 12px 4px;
      }
    }

    // 右侧主内容区
    .file-main-content {
      display: flex;
      flex-direction: column;
      background-color: var(--color-bg-2);
    }

    // 文件内容区域
    .file-content {
      flex: 1;
      padding: 16px 24px;
      overflow-y: auto;
    }
  }
</style>
