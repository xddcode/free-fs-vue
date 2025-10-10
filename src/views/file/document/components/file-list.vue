<!-- FileList.vue -->
<template>
  <div class="file-list-container">
    <a-empty v-if="!files.length" description="暂无文件" />
    <div v-else class="file-list" @contextmenu="handleEmptyContextMenu">
      <div
        v-for="(file, index) in files"
        :key="index"
        :class="{ 'file-list-item-selected': selectedFile === file }"
        class="file-list-item"
        @click="handleFileClick(file)"
        @contextmenu.stop="handleFileContextMenu(file, $event)"
      >
        <div class="file-list-img">
          <img :src="getAssetsFile(file.type)" alt="file icon" />
        </div>
        <div class="file-list-name">{{ file.name }}</div>
        <div class="file-list-info">
          <span class="file-date">{{ formatDate(file.modifiedTime) }}</span>
        </div>
      </div>
    </div>
    
    <!-- 自定义右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="custom-context-menu"
      :style="{
        left: contextMenuPosition.x + 'px',
        top: contextMenuPosition.y + 'px',
      }"
      @click.stop
    >
      
      <!-- 文件菜单 -->
      <template v-if="contextMenuFile">
        <div class="menu-item" @click="handleMenuAction('download')">
          <icon-download class="menu-icon" />
          <span>下载</span>
        </div>
        <div class="menu-item" @click="handleMenuAction('share')">
          <icon-share-external class="menu-icon" />
          <span>分享</span>
        </div>
        <div class="menu-item" @click="handleMenuAction('rename')">
          <icon-edit class="menu-icon" />
          <span>重命名</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item danger" @click="handleMenuAction('delete')">
          <icon-delete class="menu-icon" />
          <span>删除</span>
        </div>
      </template>
      
      <!-- 空白区域菜单 -->
      <template v-else>
        <div class="menu-item" @click="handleMenuAction('newFolder')">
          <icon-folder-add class="menu-icon" />
          <span>新建文件夹</span>
        </div>
        <div class="menu-item" @click="handleMenuAction('uploadFile')">
          <icon-upload class="menu-icon" />
          <span>上传文件</span>
        </div>
        <div class="menu-item" @click="handleMenuAction('uploadFolder')">
          <icon-folder class="menu-icon" />
          <span>上传文件夹</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="handleMenuAction('refresh')">
          <icon-refresh class="menu-icon" />
          <span>刷新</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import {
    defineProps,
    PropType,
    onMounted,
    onUnmounted,
    ref,
  } from 'vue';
  import { Message } from '@arco-design/web-vue';

  interface FileItem {
    type: string;
    name: string;
    size?: number;
    modifiedTime?: string;
  }

  defineProps({
    files: {
      type: Array as PropType<FileItem[]>,
      default: () => [],
    },
  });

  const selectedFile = ref<FileItem | null>(null);
  const contextMenuFile = ref<FileItem | null>(null);
  const contextMenuVisible = ref(false);
  const contextMenuPosition = ref({ x: 0, y: 0 });

  const getAssetsFile = (type: string) => {
    return new URL(`../../../../assets/images/fti/${type}.png`, import.meta.url)
      .href;
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFileClick = (file: FileItem) => {
    // 如果点击的是已选中的文件，则取消选择
    if (selectedFile.value === file) {
      selectedFile.value = null;
    } else {
      // 否则选中当前文件
      selectedFile.value = file;
    }
  };

  // 文件操作函数
  const handleDownload = () => {
    Message.info(`下载文件: ${contextMenuFile.value?.name || '未知文件'}`);
    // TODO: 实现文件下载逻辑
  };

  const handleShare = () => {
    Message.info(`分享文件: ${contextMenuFile.value?.name || '未知文件'}`);
    // TODO: 实现文件分享逻辑
  };

  const handleRename = () => {
    Message.info(`重命名文件: ${contextMenuFile.value?.name || '未知文件'}`);
    // TODO: 实现文件重命名逻辑
  };

  const handleDelete = () => {
    Message.warning(`删除文件: ${contextMenuFile.value?.name || '未知文件'}`);
    // TODO: 实现文件删除逻辑
  };

  // 文件夹操作函数
  const handleNewFolder = () => {
    Message.info('新建文件夹');
    // TODO: 实现新建文件夹逻辑
  };

  const handleUploadFile = () => {
    Message.info('上传文件');
    // TODO: 实现上传文件逻辑
  };

  const handleUploadFolder = () => {
    Message.info('上传文件夹');
    // TODO: 实现上传文件夹逻辑
  };

  const handleRefresh = () => {
    Message.info('刷新文件列表');
    // TODO: 实现刷新逻辑
  };

  const handleFileContextMenu = (file: FileItem, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    contextMenuFile.value = file;
    selectedFile.value = file; // 右键时也选中文件
    contextMenuPosition.value = { x: event.clientX, y: event.clientY };
    contextMenuVisible.value = true;
  };

  const handleEmptyContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    contextMenuFile.value = null;
    contextMenuPosition.value = { x: event.clientX, y: event.clientY };
    contextMenuVisible.value = true;
  };

  const handleMenuAction = (action: string) => {
    contextMenuVisible.value = false;

    // 根据不同的操作执行相应的功能
    switch (action) {
      case 'download':
        handleDownload();
        break;
      case 'share':
        handleShare();
        break;
      case 'rename':
        handleRename();
        break;
      case 'delete':
        handleDelete();
        break;
      case 'newFolder':
        handleNewFolder();
        break;
      case 'uploadFile':
        handleUploadFile();
        break;
      case 'uploadFolder':
        handleUploadFolder();
        break;
      case 'refresh':
        handleRefresh();
        break;
      default:
        // 未知操作
        break;
    }
  };

  // 点击外部关闭菜单
  const handleClickOutside = () => {
    if (contextMenuVisible.value) {
      contextMenuVisible.value = false;
    }
  };

  // 监听全局点击事件
  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<style lang="less" scoped>
  .file-list-container {
    flex-grow: 1;
    overflow-y: auto;
    padding: 16px;
  }


  .file-list {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }

  .file-list-item {
    width: 120px;
    text-align: center;
    color: var(--color-text-1);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    padding: 16px 12px;
    background: var(--color-bg-1);

    &:hover {
      background: linear-gradient(
        135deg,
        var(--color-fill-1) 0%,
        var(--color-fill-2) 100%
      );
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    &-selected {
      background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
      box-shadow: 0 4px 16px rgba(24, 144, 255, 0.15);
      transform: translateY(-1px);

      .file-list-name {
        color: #1890ff;
        font-weight: 600;
      }

      .file-list-img {
        transform: scale(1.05);
        filter: drop-shadow(0 2px 4px rgba(24, 144, 255, 0.2));
      }
    }
  }

  .file-list-img {
    width: 100%;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    img {
      width: 48px;
      height: 48px;
      object-fit: contain;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
    }
  }

  .file-list-name {
    margin-top: 8px;
    font-size: 14px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    line-height: 1.4;
  }

  .file-list-info {
    margin-top: 4px;
    font-size: 10px;
    color: var(--color-text-4);
    text-align: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    .file-date {
      color: var(--color-text-4);
      font-size: 11px;
      line-height: 1.2;
    }
  }

  // 自定义右键菜单样式
  .custom-context-menu {
    position: fixed;
    min-width: 180px;
    background: var(--color-bg-1);
    border: 1px solid var(--color-border-2);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 8px 0;
    z-index: 9999;
    user-select: none;
    backdrop-filter: blur(8px);
    animation: contextMenuFadeIn 0.15s ease-out;

    .menu-item {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      font-size: 14px;
      color: var(--color-text-1);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      white-space: nowrap;
      position: relative;
      margin: 0 4px;
      border-radius: 8px;

      &:hover {
        background: linear-gradient(
          135deg,
          var(--color-primary-light-1) 0%,
          var(--color-fill-2) 100%
        );
        color: var(--color-primary-6);
        transform: translateX(2px);
        box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
      }

      &.danger {
        color: var(--color-danger-6);

        &:hover {
          background: linear-gradient(
            135deg,
            var(--color-danger-light-1) 0%,
            #ffe6e6 100%
          );
          color: var(--color-danger-6);
          box-shadow: 0 2px 8px rgba(245, 34, 45, 0.15);
        }
      }

      .menu-icon {
        margin-right: 12px;
        font-size: 16px;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      &:hover .menu-icon {
        transform: scale(1.1);
      }
    }

    .menu-divider {
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        var(--color-border-2) 20%,
        var(--color-border-2) 80%,
        transparent 100%
      );
      margin: 6px 12px;
    }
  }

  // 菜单出现动画
  @keyframes contextMenuFadeIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

</style>
