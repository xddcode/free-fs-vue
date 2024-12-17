<template>
  <div class="container">
    <Breadcrumb :items="['文件中心', '我的文件']" />
    <a-card class="general-card" title="当前位置：/">
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
            <a-input-search allow-clear placeholder="搜索" @search="search" />
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
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { isEmpty } from 'radash';
  import FileList from './components/file-list.vue';

  interface FileItem {
    type: string;
    name: string;
  }

  const files = ref<FileItem[]>([
    { type: 'dir', name: 'Directory' },
    { type: 'code', name: 'Code File' },
    { type: 'doc', name: 'Document File' },
  ]);

  const search = () => {
    console.log('search');
  };
</script>

<script lang="ts">
  export default {
    name: 'Document',
  };
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;
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
</style>
