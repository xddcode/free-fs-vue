<template>
  <div class="file-breadcrumb">
    <a-breadcrumb>
      <!-- 自定义标题（用于收藏等特殊视图） -->
      <a-breadcrumb-item v-if="customTitle">
        <span class="breadcrumb-link is-current">
          <icon-star v-if="customTitle === '我的收藏'" />
          <icon-folder v-else />
          {{ customTitle }}
        </span>
      </a-breadcrumb-item>

      <!-- 普通面包屑导航 -->
      <template v-else>
        <!-- 根目录 -->
        <a-breadcrumb-item @click="handleNavigate()">
          <span class="breadcrumb-link">
            <icon-folder />
            全部文件
          </span>
        </a-breadcrumb-item>

        <!-- 多级路径 -->
        <a-breadcrumb-item
          v-for="(item, index) in breadcrumbPath"
          :key="item.id"
          @click="handleNavigate(item.id)"
        >
          <span
            :class="[
              'breadcrumb-link',
              { 'is-current': index === breadcrumbPath.length - 1 },
            ]"
          >
            <icon-folder />
            {{ item.name }}
          </span>
        </a-breadcrumb-item>
      </template>
    </a-breadcrumb>
  </div>
</template>

<script lang="ts" setup>
  import { IconFolder, IconStar } from '@arco-design/web-vue/es/icon';
  import type { BreadcrumbItem } from '../hooks';

  interface Props {
    breadcrumbPath: BreadcrumbItem[];
    customTitle?: string;
  }

  interface Emits {
    (e: 'navigate', folderId?: string): void;
  }

  defineProps<Props>();
  const emit = defineEmits<Emits>();

  /**
   * 处理面包屑导航点击
   */
  const handleNavigate = (folderId?: string) => {
    emit('navigate', folderId);
  };
</script>

<style lang="less" scoped>
  .file-breadcrumb {
    display: flex;
    align-items: center;
    padding: 12px 24px;
    border-bottom: 1px solid var(--color-border-2);
    background-color: var(--color-bg-2);

    :deep(.arco-breadcrumb-item) {
      cursor: pointer;

      &:hover .breadcrumb-link:not(.is-current) {
        color: rgb(var(--primary-6));
      }
    }

    .breadcrumb-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: color 0.2s;

      &.is-current {
        color: var(--color-text-1);
        font-weight: 500;
        cursor: default;
      }

      &:not(.is-current) {
        color: var(--color-text-2);

        &:hover {
          color: rgb(var(--primary-6));
        }
      }
    }
  }
</style>
