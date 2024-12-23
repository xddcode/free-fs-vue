<template>
  <div class="container">
    <Breadcrumb :items="['文件中心', '我的文件']" />

    <div class="layout">
      <div class="layout-left-side">
        <div class="menu-demo">
          <a-menu
            mode="vertical"
            show-collapse-button
            :selected-keys="selectedKeys"
            @select="handleMenuSelect"
          >
            <a-menu-item key="all">全部文件</a-menu-item>
            <a-menu-item key="recent">最近文件</a-menu-item>
            <a-menu-item key="star">收藏夹</a-menu-item>
            <a-sub-menu key="category">
              <template #title>文件分类</template>
              <a-menu-item key="category:document">文档</a-menu-item>
              <a-menu-item key="category:image">图片</a-menu-item>
              <a-menu-item key="category:video">视频</a-menu-item>
              <a-menu-item key="category:audio">音频</a-menu-item>
              <a-menu-item key="category:other">其他</a-menu-item>
            </a-sub-menu>
            <a-menu-item key="share">我的分享</a-menu-item>
            <a-menu-item key="recycle">回收站</a-menu-item>
          </a-menu>
        </div>
      </div>
      <div class="layout-content">
        <a-card class="general-card">
          <a-breadcrumb style="margin: 16px 0">
            <a-breadcrumb-item>
              <icon-home />
            </a-breadcrumb-item>
            <a-breadcrumb-item>Home</a-breadcrumb-item>
            <a-breadcrumb-item>Channel</a-breadcrumb-item>
            <a-breadcrumb-item>News</a-breadcrumb-item>
          </a-breadcrumb>

          <div class="file-manager">
            <!-- 按钮和搜索层 -->
            <div class="action-bar">
              <div class="left-actions">
                <a-space>
                  <a-button>
                    <template #icon>
                      <icon-arrow-left />
                    </template>
                    返回上级
                  </a-button>
                  <a-button type="dashed">
                    <template #icon>
                      <icon-refresh />
                    </template>
                    刷新
                  </a-button>
                  <a-button type="primary">
                    <template #icon>
                      <icon-upload />
                    </template>
                    上传文件
                  </a-button>
                  <a-button type="primary">
                    <template #icon>
                      <icon-share-external />
                    </template>
                    上传文件夹
                  </a-button>
                  <a-upload action="/" directory>sdfds</a-upload>
                </a-space>
              </div>
              <div class="right-actions">
                <a-input-search
                  allow-clear
                  placeholder="搜索"
                  @search="search"
                />
              </div>
            </div>

            <!-- 文件列表层 -->
            <FileList :files="files" />

            <!-- 分页层 -->
            <div class="pagination-container">
              <a-pagination v-if="!isEmpty(files)" :total="50" show-total />
            </div>
          </div>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { isEmpty } from 'radash';
  import FileList from './components/file-list.vue';

  interface FileItem {
    type: string;
    name: string;
    size?: number;
    modifiedTime?: string;
  }

  const files = [
    {
      type: 'dir',
      name: '文档1',
      size: 1024,
      modifiedTime: '2021-09-01',
    },
    {
      type: 'doc',
      name: 'image1',
      size: 2048,
      modifiedTime: '2021-09-02',
    },
    {
      type: 'mp3',
      name: 'video1',
      size: 4096,
      modifiedTime: '2021-09-03',
    },
  ];
  const selectedKeys = ref(['all']);
  const currentPath = ref('/');
  const loading = ref(false);

  const handleMenuSelect = (key: string) => {
    selectedKeys.value = [key];
    Message.info(`Selected: ${key}`);
  };

  const search = (value: string) => {
    if (value) {
      Message.info(`Search: ${value}`);
    }
  };
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;
  }

  .layout {
    display: flex;

    &-content {
      flex: 1;
      padding: 0 16px;
    }
  }

  .general-card {
    min-height: 300px;
  }

  .file-manager {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--color-border);
  }

  .pagination-container {
    padding: 16px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid var(--color-border);
  }

  .active {
    color: #0960bd;
    background-color: #e3f4fc;
  }

  .menu-demo {
    width: 100%;
    height: 600px;
    box-sizing: border-box;
    background-color: var(--color-neutral-2);
  }

  .menu-demo .arco-menu {
    width: 200px;
    height: 100%;
    box-shadow: 0 0 1px rgba(0, 0, 0, 0.3);
  }

  .menu-demo .arco-menu :deep(.arco-menu-collapse-button) {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }

  .menu-demo
    .arco-menu:not(.arco-menu-collapsed)
    :deep(.arco-menu-collapse-button) {
    right: 0;
    bottom: 8px;
    transform: translateX(50%);
  }

  .menu-demo .arco-menu:not(.arco-menu-collapsed)::before {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    width: 48px;
    height: 48px;
    background-color: inherit;
    border-radius: 50%;
    box-shadow: -4px 0 2px var(--color-bg-2), 0 0 1px rgba(0, 0, 0, 0.3);
    transform: translateX(50%);
  }

  .menu-demo .arco-menu.arco-menu-collapsed {
    width: 48px;
    height: auto;
    padding-top: 24px;
    padding-bottom: 138px;
    border-radius: 22px;
  }

  .menu-demo .arco-menu.arco-menu-collapsed :deep(.arco-menu-collapse-button) {
    right: 8px;
    bottom: 8px;
  }
</style>
