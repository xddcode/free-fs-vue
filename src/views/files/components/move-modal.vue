<template>
  <a-modal
    :visible="visible"
    title="移动到"
    :width="520"
    ok-text="确认移动"
    cancel-text="取消"
    :ok-button-props="{ disabled: !selectedFolderId }"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="move-content">
      <div class="moving-file">
        <img
          :src="getFileIconPath(file?.isDir ? 'dir' : file?.suffix || '')"
          :alt="file?.displayName"
          class="file-icon"
        />
        <div class="file-info">
          <div class="file-name">{{ file?.displayName }}</div>
          <div class="file-size">{{ formatFileSize(file?.size || 0) }}</div>
        </div>
      </div>

      <a-divider orientation="center">
        <icon-arrow-down />
      </a-divider>

      <div class="folder-tree">
        <div class="tree-header">
          <icon-folder />
          <span>选择目标文件夹</span>
        </div>
        <a-tree
          :data="folderTree"
          :default-expand-all="true"
          :selected-keys="selectedKeys"
          @select="handleSelect"
        >
          <template #icon="{ node }">
            <icon-folder v-if="!node.isLeaf" />
          </template>
        </a-tree>
      </div>

      <a-alert type="info" style="margin-top: 16px">
        提示：选择一个文件夹作为移动目标位置
      </a-alert>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue';
  import { IconFolder, IconArrowDown } from '@arco-design/web-vue/es/icon';
  import type { FileItem } from '@/types/modules/file';
  import { getFileList } from '@/api/file';
  import { getFileIconPath } from '@/utils/file-icon';
  import { formatFileSize } from '../hooks/use-file-format';

  interface Props {
    visible: boolean;
    file?: FileItem | null;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'confirm', fileId: string, targetParentId: string): void;
  }>();

  const selectedKeys = ref<string[]>([]);
  const selectedFolderId = ref<string>('');
  const folderTree = ref<any[]>([
    {
      key: 'root',
      title: '全部文件（根目录）',
      children: [],
    },
  ]);

  const handleSelect = (keys: string[]) => {
    if (keys.length > 0) {
      const key = keys[0];
      selectedFolderId.value = key === 'root' ? '' : key;
    }
  };

  const handleOk = () => {
    if (!props.file || !selectedFolderId.value) return;
    emit('confirm', props.file.id, selectedFolderId.value);
  };

  const handleCancel = () => {
    selectedKeys.value = [];
    selectedFolderId.value = '';
    emit('update:visible', false);
  };

  // 加载文件夹列表
  const loadFolderTree = async () => {
    try {
      const response = await getFileList({
        parentId: undefined,
      });

      const folders = response.data?.filter((item) => item.isDir) || [];

      folderTree.value = [
        {
          key: 'root',
          title: '全部文件（根目录）',
          children: folders.map((folder) => ({
            key: folder.id,
            title: folder.displayName,
            isLeaf: false,
          })),
        },
      ];
    } catch {
      // 拦截器已统一处理错误提示，这里捕获避免未处理的 rejection
    }
  };

  // 监听 visible 变化
  watch(
    () => props.visible,
    (newVal) => {
      if (newVal) {
        loadFolderTree();
      } else {
        selectedKeys.value = [];
        selectedFolderId.value = '';
      }
    }
  );
</script>

<style lang="less" scoped>
  .move-content {
    padding: 20px 0;

    .moving-file {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background-color: var(--color-fill-2);
      border-radius: 8px;

      .file-icon {
        width: 48px;
        height: 48px;
        object-fit: contain;
      }

      .file-info {
        flex: 1;
        overflow: hidden;

        .file-name {
          font-size: 14px;
          color: var(--color-text-1);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 4px;
        }

        .file-size {
          font-size: 12px;
          color: var(--color-text-3);
        }
      }
    }

    :deep(.arco-divider) {
      margin: 20px 0;
    }

    .folder-tree {
      max-height: 300px;
      overflow-y: auto;
      padding: 12px;
      border: 1px solid var(--color-border-2);
      border-radius: 8px;
      background-color: var(--color-fill-1);

      .tree-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 500;
        color: var(--color-text-1);
      }

      :deep(.arco-tree) {
        background-color: transparent;
      }
    }
  }
</style>
