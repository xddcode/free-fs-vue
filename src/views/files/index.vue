<template>
  <div class="file-manager">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <a-button type="primary" size="large" @click="handleUpload">
          <template #icon>
            <icon-upload />
          </template>
          上传
        </a-button>
        <a-button size="large" @click="handleCreateFolder">
          <template #icon>
            <icon-folder-add />
          </template>
          新建文件夹
        </a-button>
      </div>

      <div class="toolbar-right">
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索文件"
          size="large"
          style="width: 320px"
          allow-clear
          @search="handleSearch"
        />
        <a-button-group size="large">
          <a-button @click="viewMode = 'list'">
            <icon-list
              :style="{ color: viewMode === 'list' ? '#165dff' : '' }"
            />
          </a-button>
          <a-button @click="viewMode = 'grid'">
            <icon-apps
              :style="{ color: viewMode === 'grid' ? '#165dff' : '' }"
            />
          </a-button>
        </a-button-group>
        <a-button size="large" @click="handleRefresh">
          <icon-refresh />
        </a-button>
      </div>
    </div>

    <!-- 面包屑导航 -->
    <div class="breadcrumb-bar">
      <a-breadcrumb>
        <a-breadcrumb-item>
          <icon-folder />
          全部文件
        </a-breadcrumb-item>
      </a-breadcrumb>
      <div class="breadcrumb-info"> 共 {{ total }} 个文件 </div>
    </div>

    <!-- 文件列表 -->
    <div class="file-content">
      <a-spin :loading="loading" style="width: 100%; min-height: 400px">
        <div v-if="viewMode === 'list'" class="list-view">
          <a-table
            :data="fileList"
            :pagination="false"
            :bordered="false"
            row-key="id"
            :row-class="() => 'file-row'"
            @row-click="handleRowClick"
          >
            <template #columns>
              <a-table-column title="文件名" data-index="name" :width="400">
                <template #cell="{ record }">
                  <div class="file-name-cell">
                    <div class="file-icon-wrapper">
                      <component
                        :is="getFileIcon(record.type)"
                        :size="20"
                        :class="['file-icon', record.type]"
                      />
                    </div>
                    <span class="file-name">{{ record.name }}</span>
                  </div>
                </template>
              </a-table-column>

              <a-table-column title="大小" data-index="size" :width="120">
                <template #cell="{ record }">
                  <span class="file-size">{{ formatSize(record.size) }}</span>
                </template>
              </a-table-column>

              <a-table-column
                title="修改时间"
                data-index="modifiedTime"
                :width="180"
              >
                <template #cell="{ record }">
                  <span class="file-time">{{
                    formatTime(record.modifiedTime)
                  }}</span>
                </template>
              </a-table-column>

              <a-table-column title="操作" :width="200" align="center">
                <template #cell="{ record }">
                  <div class="file-actions">
                    <a-button
                      v-if="record.type !== 'folder'"
                      size="small"
                      type="text"
                      @click.stop="handleDownload(record)"
                    >
                      <icon-download />
                    </a-button>
                    <a-button
                      size="small"
                      type="text"
                      @click.stop="handleShare(record)"
                    >
                      <icon-share-alt />
                    </a-button>
                    <a-button
                      size="small"
                      type="text"
                      status="danger"
                      @click.stop="handleDelete(record)"
                    >
                      <icon-delete />
                    </a-button>
                    <a-dropdown trigger="hover">
                      <a-button size="small" type="text" @click.stop>
                        <icon-more />
                      </a-button>
                      <template #content>
                        <a-doption @click="handleRename(record)">
                          <icon-edit />
                          重命名
                        </a-doption>
                        <a-doption @click="handleMove(record)">
                          <icon-drag-arrow />
                          移动到
                        </a-doption>
                      </template>
                    </a-dropdown>
                  </div>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>

        <!-- 网格视图 -->
        <div v-else class="grid-view">
          <div
            v-for="file in fileList"
            :key="file.id"
            class="grid-item"
            @click="handleFileClick(file)"
          >
            <div class="grid-item-icon">
              <component
                :is="getFileIcon(file.type)"
                :size="48"
                :class="['file-icon', file.type]"
              />
            </div>
            <div class="grid-item-name" :title="file.name">
              {{ file.name }}
            </div>
            <div class="grid-item-info">
              {{ formatSize(file.size) }}
            </div>
            <div class="grid-item-actions">
              <a-button size="mini" type="text" @click.stop="handleShare(file)">
                <icon-share-alt />
              </a-button>
              <a-dropdown trigger="hover">
                <a-button size="mini" type="text" @click.stop>
                  <icon-more />
                </a-button>
                <template #content>
                  <a-doption @click="handleDownload(file)">
                    <icon-download />
                    下载
                  </a-doption>
                  <a-doption @click="handleDelete(file)">
                    <icon-delete />
                    删除
                  </a-doption>
                </template>
              </a-dropdown>
            </div>
          </div>
        </div>

        <a-empty
          v-if="!loading && fileList.length === 0"
          description="暂无文件"
        >
          <a-button type="primary" @click="handleUpload">
            <template #icon>
              <icon-upload />
            </template>
            上传文件
          </a-button>
        </a-empty>
      </a-spin>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useRoute } from 'vue-router';
  import { fileApi, type FileItem } from '@/mock/file';
  import {
    IconUpload,
    IconFolderAdd,
    IconRefresh,
    IconApps,
    IconList,
    IconFolder,
    IconImage,
    IconMusic,
    IconFileVideo,
    IconFile,
    IconDownload,
    IconDelete,
    IconMore,
    IconShareAlt,
    IconEdit,
    IconDragArrow,
  } from '@arco-design/web-vue/es/icon';

  // 路由
  const route = useRoute();

  // 响应式数据
  const loading = ref(false);
  const searchKeyword = ref('');
  const fileList = ref<FileItem[]>([]);
  const currentPage = ref(1);
  const pageSize = ref(20);
  const total = ref(0);
  const viewMode = ref<'list' | 'grid'>('list');

  // 获取文件图标
  const getFileIcon = (type: string) => {
    if (type === 'folder') return IconFolder;
    if (type === 'image') return IconImage;
    if (type === 'video') return IconFileVideo;
    if (type === 'audio') return IconMusic;
    if (type === 'document') return IconFile;
    return IconFile;
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 获取文件列表
  const fetchFileList = async (reset = false) => {
    if (loading.value) return;

    loading.value = true;
    try {
      const response = await fileApi.getFileList({
        type: route.query.type as string,
        keyword: searchKeyword.value,
        page: reset ? 1 : currentPage.value,
        pageSize: pageSize.value,
      });

      if (response.code === 200) {
        if (reset) {
          fileList.value = response.data.list;
          currentPage.value = 1;
        } else {
          fileList.value.push(...response.data.list);
        }
        total.value = response.data.total;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('获取文件列表失败:', error);
      Message.error('获取文件列表失败');
    } finally {
      loading.value = false;
    }
  };

  // 事件处理
  const handleUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const { files } = e.target as HTMLInputElement;
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        const uploadPromises = fileArray.map(async (file) => {
          try {
            const response = await fileApi.uploadFile(file);
            if (response.code === 200) {
              Message.success(`${file.name} 上传成功`);
              return true;
            }
            return false;
          } catch (error) {
            Message.error(`${file.name} 上传失败`);
            return false;
          }
        });

        await Promise.all(uploadPromises);
        fetchFileList(true);
      }
    };
    input.click();
  };

  const handleCreateFolder = async () => {
    const name = window.prompt('请输入文件夹名称:');
    if (name && name.trim()) {
      try {
        const response = await fileApi.createFolder(name.trim());
        if (response.code === 200) {
          Message.success('文件夹创建成功');
          fetchFileList(true);
        }
      } catch (error) {
        Message.error('文件夹创建失败');
      }
    }
  };

  const handleSearch = () => {
    fetchFileList(true);
  };

  const handleRefresh = () => {
    fetchFileList(true);
  };

  const handleRowClick = (record: FileItem) => {
    if (record.type === 'folder') {
      Message.info(`打开文件夹: ${record.name}`);
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      Message.info(`打开文件夹: ${file.name}`);
    }
  };

  const handleDownload = async (record: FileItem) => {
    try {
      const response = await fileApi.downloadFile(record.id);
      if (response.code === 200) {
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = record.name;
        link.click();
        Message.success('下载已开始');
      }
    } catch (error) {
      Message.error('下载失败');
    }
  };

  const handleShare = async (record: FileItem) => {
    try {
      const response = await fileApi.shareFile(record.id);
      if (response.code === 200) {
        navigator.clipboard.writeText(response.data.shareUrl);
        Message.success('分享链接已复制到剪贴板');
      }
    } catch (error) {
      Message.error('分享失败');
    }
  };

  const handleDelete = async (record: FileItem) => {
    if (window.confirm(`确定要删除 "${record.name}" 吗？`)) {
      try {
        const response = await fileApi.deleteFile();
        if (response.code === 200) {
          Message.success('删除成功');
          fetchFileList(true);
        }
      } catch (error) {
        Message.error('删除失败');
      }
    }
  };

  const handleRename = (record: FileItem) => {
    Message.info(`重命名: ${record.name}`);
  };

  const handleMove = (record: FileItem) => {
    Message.info(`移动: ${record.name}`);
  };

  onMounted(() => {
    fetchFileList(true);
  });
</script>

<style lang="less" scoped>
  .file-manager {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-2);

    // 工具栏
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--color-border-2);
      background-color: var(--color-bg-2);
    }

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    // 面包屑
    .breadcrumb-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      border-bottom: 1px solid var(--color-border-2);
      background-color: var(--color-bg-2);

      .breadcrumb-info {
        font-size: 14px;
        color: var(--color-text-3);
      }
    }

    // 文件内容区域
    .file-content {
      flex: 1;
      padding: 16px 24px;
      overflow-y: auto;
    }

    // 列表视图
    .list-view {
      :deep(.arco-table) {
        .arco-table-th {
          background-color: var(--color-fill-2);
          color: var(--color-text-2);
          font-weight: 500;
        }

        .file-row {
          cursor: pointer;
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
          background-color: var(--color-fill-2);
          border-radius: 6px;
        }

        .file-icon {
          &.folder {
            color: #ff7d00;
          }
          &.image {
            color: #00b42a;
          }
          &.video {
            color: #165dff;
          }
          &.audio {
            color: #722ed1;
          }
          &.document {
            color: #f77234;
          }
        }

        .file-name {
          flex: 1;
          font-size: 14px;
          color: var(--color-text-1);
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
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s;
      }

      :deep(.arco-table-tr:hover .file-actions) {
        opacity: 1;
      }
    }

    // 网格视图
    .grid-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 16px;
      padding: 8px;

      .grid-item {
        background: var(--color-bg-2);
        border: 1px solid var(--color-border-2);
        border-radius: 8px;
        padding: 16px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;

        &:hover {
          box-shadow: 0 4px 12px var(--color-fill-4);
          transform: translateY(-2px);

          .grid-item-actions {
            opacity: 1;
          }
        }
      }

      .grid-item-icon {
        margin-bottom: 12px;
        display: flex;
        justify-content: center;

        .file-icon {
          &.folder {
            color: #ff7d00;
          }
          &.image {
            color: #00b42a;
          }
          &.video {
            color: #165dff;
          }
          &.audio {
            color: #722ed1;
          }
          &.document {
            color: #f77234;
          }
        }
      }

      .grid-item-name {
        font-size: 14px;
        color: var(--color-text-1);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .grid-item-info {
        font-size: 12px;
        color: var(--color-text-3);
      }

      .grid-item-actions {
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s;
        background: var(--color-bg-3);
        backdrop-filter: blur(4px);
        border-radius: 4px;
        padding: 2px;
      }
    }
  }
</style>
