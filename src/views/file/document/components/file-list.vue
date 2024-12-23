<!-- FileList.vue -->
<template>
  <div class="file-list-container">
    <a-dropdown trigger="contextMenu" align-point :style="{ display: 'block' }">
      <a-empty v-if="!files.length" description="暂无文件" />
      <div v-else class="file-list">
        <div
          v-for="(file, index) in files"
          :key="index"
          class="file-list-item"
          :class="{ 'file-list-item-selected': selectedFiles.includes(file) }"
          @click="handleFileClick(file)"
        >
          <div class="file-list-img">
            <img :src="getAssetsFile(file.type)" alt="file icon" />
          </div>
          <div class="file-list-name">{{ file.name }}</div>
          <div class="file-list-info">
            <!--                      <span class="file-size">{{ file.size }}</span>-->
            <span class="file-date">{{ file.modifiedTime }}</span>
          </div>
          <div class="file-list-checkbox">
            <a-checkbox :checked="selectedFiles.includes(file)" />
          </div>
        </div>
      </div>
      <template #content>
        <a-doption>新建文件夹</a-doption>
        <a-doption>上传文件</a-doption>
        <a-doption>上传文件夹</a-doption>
        <a-divider style="margin: 4px 0" />
        <a-doption>下载</a-doption>
        <a-doption>分享</a-doption>
        <a-doption>移动到</a-doption>
        <a-doption>复制到</a-doption>
        <a-doption>重命名</a-doption>
        <a-divider style="margin: 4px 0" />
        <a-doption>刷新</a-doption>
        <a-doption status="danger">删除</a-doption>
      </template>
    </a-dropdown>
  </div>
</template>

<script lang="ts" setup>
  import { defineProps, PropType, ref } from 'vue';

  interface FileItem {
    type: string;
    name: string;
    size?: number;
    modifiedTime?: string;
  }

  const props = defineProps({
    files: {
      type: Array as PropType<FileItem[]>,
      default: () => [],
    },
  });

  const selectedFiles = ref<FileItem[]>([]);

  const getAssetsFile = (type: string) => {
    return new URL(`../../../../assets/images/fti/${type}.png`, import.meta.url)
      .href;
  };

  // const formatFileSize = (size?: number) => {
  //   if (!size) return '-';
  //   const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  //   let index = 0;
  //   while (size >= 1024 && index < units.length - 1) {
  //     size /= 1024;
  //     index++;
  //   }
  //   return `${size.toFixed(2)} ${units[index]}`;
  // };
  //
  // const formatDate = (date?: string) => {
  //   if (!date) return '-';
  //   return dayjs(date).format('YYYY-MM-DD HH:mm');
  // };
  //
  // const handleFileClick = (file: FileItem) => {
  //   selectedFiles.value = [file];
  // };
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
    transition: all 0.2s ease;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
    padding: 8px;

    &:hover {
      background-color: var(--color-fill-2);

      .file-list-checkbox {
        opacity: 1;
      }
    }

    &-selected {
      background-color: var(--color-primary-light-1);

      &:hover {
        background-color: var(--color-primary-light-2);
      }

      .file-list-checkbox {
        opacity: 1;
      }
    }
  }

  .file-list-img {
    width: 100%;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }
  }

  .file-list-name {
    margin-top: 2px;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-list-info {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-3);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .file-list-checkbox {
    position: absolute;
    top: 8px;
    right: 8px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
</style>
