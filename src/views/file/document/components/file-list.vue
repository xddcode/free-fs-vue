<!-- FileList.vue -->
<template>
  <div class="file-list-container">
    <a-dropdown trigger="contextMenu" align-point :style="{ display: 'block' }">
      <a-empty v-if="isEmpty(files)" description="暂无文件" />
      <div v-else class="file-list">
        <div v-for="(file, index) in files" :key="index" class="file-list-item">
          <div class="file-list-img">
            <img :src="getAssetsFile(file.type)" alt="file icon" />
          </div>
          <div class="file-list-name">{{ file.name }}</div>
          <div class="file-list-ck">✓</div>
        </div>
      </div>
      <template #content>
        <a-doption>
          <template #icon>
            <icon-folder-add />
          </template>
          <template #default>新建文件夹</template>
        </a-doption>
        <a-doption>
          <template #icon>
            <icon-upload />
          </template>
          <template #default>上传文件</template>
        </a-doption>
        <a-doption>
          <template #icon>
            <icon-share-external />
          </template>
          <template #default>上传文件夹</template>
        </a-doption>
        <a-doption>
          <template #icon>
            <icon-refresh />
          </template>
          <template #default>刷新</template>
        </a-doption>
      </template>
    </a-dropdown>
  </div>
</template>

<script lang="ts" setup>
  import { defineProps, PropType } from 'vue';
  import { isEmpty } from 'radash';

  interface FileItem {
    type: string;
    name: string;
  }

  const props = defineProps({
    files: {
      type: Array as PropType<FileItem[]>,
      default: () => [],
    },
  });

  const getAssetsFile = (type: string) => {
    return new URL(`../../../../assets/images/fti/${type}.png`, import.meta.url)
      .href;
  };
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
    width: 100px;
    text-align: center;
    color: var(--color-text-1);
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
  }

  .file-list-img {
    width: 100%;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .file-list-img img {
    width: 48px;
    height: 48px;
    object-fit: contain;
    transition: all 0.3s ease;
  }

  .file-list-name {
    padding: 8px 5px;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background-color: var(--color-bg-2);
  }

  .file-list-ck {
    position: absolute;
    right: 3px;
    top: 3px;
    width: 16px;
    height: 16px;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    font-size: 10px;
  }

  .file-list-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);

    .file-list-img {
      background-color: var(--color-fill-2);
    }

    .file-list-name {
      color: var(--color-primary);
    }

    .file-list-ck {
      opacity: 1;
    }

    .file-list-img img {
      transform: scale(1.1);
    }
  }
</style>
