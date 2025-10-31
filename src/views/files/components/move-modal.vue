<template>
  <a-modal
    :visible="visible"
    title="移动到"
    :width="640"
    ok-text="移动到此处"
    cancel-text="取消"
    :ok-button-props="{ disabled: isOkDisabled }"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <template #footer>
      <div class="modal-footer">
        <a-button type="text" @click="handleCreateFolder">
          <template #icon>
            <icon-folder-add />
          </template>
          新建文件夹
        </a-button>
        <div class="footer-actions">
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" :disabled="isOkDisabled" @click="handleOk">
            移动到此处
          </a-button>
        </div>
      </div>
    </template>
    <div class="move-content">
      <!-- 显示要移动的文件信息 -->
      <div v-if="files && files.length > 0" class="moving-files">
        <div v-if="files.length === 1" class="moving-file">
          <img
            :src="
              getFileIconPath(files[0].isDir ? 'dir' : files[0].suffix || '')
            "
            :alt="files[0].displayName"
            class="file-icon"
          />
          <div class="file-info">
            <div class="file-name">{{ files[0].displayName }}</div>
            <div class="file-size">
              {{ formatFileSize(files[0].size || 0) }}
            </div>
          </div>
        </div>
        <div v-else class="batch-moving">
          <icon-folder-add :size="48" />
          <div class="batch-info">
            <div class="batch-title">批量移动文件</div>
            <div class="batch-count">共 {{ files.length }} 个文件/文件夹</div>
          </div>
        </div>
      </div>

      <a-divider orientation="center">
        <icon-arrow-down />
      </a-divider>

      <!-- 面包屑导航 -->
      <div class="breadcrumb-container">
        <a-breadcrumb>
          <a-breadcrumb-item
            @click="
              breadcrumbPath.length === 0 ? null : navigateToBreadcrumb(-1)
            "
          >
            <span
              :class="[
                'breadcrumb-link',
                { 'is-current': breadcrumbPath.length === 0 },
              ]"
            >
              <icon-folder />
              根目录
            </span>
          </a-breadcrumb-item>
          <a-breadcrumb-item
            v-for="(item, index) in breadcrumbPath"
            :key="item.id"
            @click="
              index === breadcrumbPath.length - 1
                ? null
                : navigateToBreadcrumb(index)
            "
          >
            <span
              :class="[
                'breadcrumb-link',
                { 'is-current': index === breadcrumbPath.length - 1 },
              ]"
            >
              <icon-folder />
              {{ item.displayName }}
            </span>
          </a-breadcrumb-item>
        </a-breadcrumb>
      </div>

      <!-- 目录列表 -->
      <div class="folder-list">
        <a-spin :loading="loading" style="width: 100%">
          <div
            v-if="currentDirs.length === 0 && !isCreatingFolder"
            class="empty-folder"
          >
            <icon-folder />
            <span>当前目录下没有子文件夹</span>
          </div>
          <div v-else class="folder-items">
            <!-- 新建文件夹输入框 -->
            <div
              v-if="isCreatingFolder"
              class="folder-item editing"
              @click.stop
            >
              <div class="folder-item-content">
                <img
                  :src="getFileIconPath('dir')"
                  alt="文件夹"
                  class="folder-icon"
                />
                <a-input
                  ref="folderNameInputRef"
                  v-model="newFolderName"
                  placeholder="请输入文件夹名称"
                  class="folder-name-input"
                  @keyup.enter="confirmCreateFolder"
                  @keyup.esc="cancelCreateFolder"
                />
              </div>
              <div class="edit-actions">
                <icon-check
                  class="action-icon confirm"
                  @click="confirmCreateFolder"
                />
                <icon-close
                  class="action-icon cancel"
                  @click="cancelCreateFolder"
                />
              </div>
            </div>

            <!-- 现有文件夹列表 -->
            <div
              v-for="dir in currentDirs"
              :key="dir.id"
              :class="['folder-item', { selected: selectedDirId === dir.id }]"
              @click="selectDir(dir)"
              @dblclick="enterDir(dir)"
            >
              <div class="folder-item-content">
                <img
                  :src="getFileIconPath('dir')"
                  alt="文件夹"
                  class="folder-icon"
                />
                <span class="folder-name">{{ dir.displayName }}</span>
              </div>
            </div>
          </div>
        </a-spin>
      </div>

      <a-alert type="info" style="margin-top: 16px">
        提示：单击选择目标文件夹，双击进入该文件夹
      </a-alert>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, watch, computed, nextTick } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import {
    IconFolder,
    IconArrowDown,
    IconFolderAdd,
    IconCheck,
    IconClose,
  } from '@arco-design/web-vue/es/icon';
  import type { FileItem } from '@/types/modules/file';
  import { getFolders, createFolder } from '@/api/file';
  import { getFileIconPath } from '@/utils/file-icon';
  import { formatFileSize } from '../hooks/use-file-format';

  interface Props {
    visible: boolean;
    file?: FileItem | null;
    files?: FileItem[] | null;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'confirm', fileIds: string[], targetDirId: string): void;
    (e: 'refresh'): void;
  }>();

  const loading = ref(false);
  const selectedDirId = ref<string>('');
  const currentDirs = ref<FileItem[]>([]);
  const breadcrumbPath = ref<FileItem[]>([]);
  const currentParentId = ref<string | undefined>(undefined);
  const isCreatingFolder = ref(false);
  const newFolderName = ref('');
  const folderNameInputRef = ref();

  // 计算是否禁用确认按钮
  const isOkDisabled = computed(() => {
    // 如果没有选择任何目录，且当前不在根目录，则禁用
    // 如果当前在根目录且没有选择任何子目录，可以移动到根目录
    if (selectedDirId.value) return false;
    if (breadcrumbPath.value.length === 0) return false;
    return true;
  });

  // 重置状态
  const resetState = () => {
    selectedDirId.value = '';
    currentDirs.value = [];
    breadcrumbPath.value = [];
    currentParentId.value = undefined;
    loading.value = false;
    isCreatingFolder.value = false;
    newFolderName.value = '';
  };

  // 加载指定父目录下的所有子目录
  const loadDirs = async (parentId?: string) => {
    loading.value = true;
    try {
      const response = await getFolders(parentId);
      currentDirs.value = response.data || [];
    } catch {
      currentDirs.value = [];
    } finally {
      loading.value = false;
    }
  };

  // 选择目录
  const selectDir = (dir: FileItem) => {
    selectedDirId.value = dir.id;
  };

  // 进入目录（双击）
  const enterDir = async (dir: FileItem) => {
    // 将当前目录添加到面包屑
    breadcrumbPath.value.push(dir);
    currentParentId.value = dir.id;
    selectedDirId.value = ''; // 清空选择
    await loadDirs(dir.id);
  };

  // 通过面包屑导航
  const navigateToBreadcrumb = async (index: number) => {
    if (index === -1) {
      // 返回根目录
      breadcrumbPath.value = [];
      currentParentId.value = undefined;
    } else {
      // 返回到指定层级
      breadcrumbPath.value = breadcrumbPath.value.slice(0, index + 1);
      currentParentId.value = breadcrumbPath.value[index].id;
    }
    selectedDirId.value = ''; // 清空选择
    await loadDirs(currentParentId.value);
  };

  const handleOk = () => {
    const targetFiles = props.files || (props.file ? [props.file] : []);
    if (targetFiles.length === 0) return;

    const fileIds = targetFiles.map((f) => f.id);
    // 如果选择了某个目录，移动到该目录；否则移动到当前所在目录
    const targetDirId = selectedDirId.value || currentParentId.value || '';
    emit('confirm', fileIds, targetDirId);
  };

  const handleCancel = () => {
    resetState();
    emit('update:visible', false);
  };

  // 打开创建文件夹输入框
  const handleCreateFolder = () => {
    isCreatingFolder.value = true;
    newFolderName.value = '';
    nextTick(() => {
      folderNameInputRef.value?.focus();
    });
  };

  // 确认创建文件夹
  const confirmCreateFolder = async () => {
    const folderName = newFolderName.value.trim();
    if (!folderName) {
      Message.warning('请输入文件夹名称');
      return;
    }

    await createFolder({
      folderName,
      parentId: currentParentId.value,
    }).then(() => {
      Message.success('文件夹创建成功');
      isCreatingFolder.value = false;
      newFolderName.value = '';
      // 刷新弹窗内的目录列表
      loadDirs(currentParentId.value);
      // 通知外部刷新文件列表
      emit('refresh');
    });
  };

  // 取消创建文件夹
  const cancelCreateFolder = () => {
    isCreatingFolder.value = false;
    newFolderName.value = '';
  };

  // 监听 visible 变化
  watch(
    () => props.visible,
    (newVal) => {
      if (newVal) {
        resetState();
        loadDirs(); // 加载根目录
      }
    }
  );
</script>

<style lang="less" scoped>
  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .footer-actions {
      display: flex;
      gap: 12px;
    }
  }

  .move-content {
    padding: 20px 0;

    .moving-files {
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

      .batch-moving {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background-color: var(--color-fill-2);
        border-radius: 8px;

        .batch-info {
          flex: 1;

          .batch-title {
            font-size: 14px;
            color: var(--color-text-1);
            font-weight: 500;
            margin-bottom: 4px;
          }

          .batch-count {
            font-size: 12px;
            color: var(--color-text-3);
          }
        }
      }
    }

    :deep(.arco-divider) {
      margin: 20px 0;
    }

    .breadcrumb-container {
      padding: 12px 16px;
      background-color: var(--color-fill-1);
      border-radius: 8px;
      margin-bottom: 16px;

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

        .arco-icon {
          font-size: 14px;
        }

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

    .folder-list {
      min-height: 300px;
      max-height: 400px;
      overflow-y: auto;
      padding: 12px;
      // border: 1px solid var(--color-border-2);
      // border-radius: 8px;
      background-color: var(--color-fill-1);

      .empty-folder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 300px;
        color: var(--color-text-3);
        gap: 12px;

        .arco-icon {
          font-size: 48px;
        }

        span {
          font-size: 14px;
        }
      }

      .folder-items {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .folder-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          cursor: pointer;
          transition: background-color 0.2s;

          &:hover {
            background-color: var(--color-fill-2);
          }

          &.selected {
            background-color: rgb(var(--primary-1));

            .folder-name {
              color: rgb(var(--primary-6));
              font-weight: 500;
            }
          }

          &.editing {
            cursor: default;
            background-color: var(--color-fill-1);

            &:hover {
              background-color: var(--color-fill-1);
            }
          }

          .folder-item-content {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
            overflow: hidden;

            .folder-icon {
              width: 20px;
              height: 20px;
              object-fit: contain;
              flex-shrink: 0;
            }

            .folder-name {
              font-size: 14px;
              color: var(--color-text-1);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }

          .edit-actions {
            display: flex;
            gap: 8px;
            align-items: center;

            .action-icon {
              font-size: 18px;
              cursor: pointer;
              transition: all 0.2s;

              &.confirm {
                color: rgb(var(--primary-6));

                &:hover {
                  transform: scale(1.2);
                  color: rgb(var(--primary-5));
                }
              }

              &.cancel {
                color: var(--color-text-2);

                &:hover {
                  transform: scale(1.2);
                  color: var(--color-text-1);
                }
              }
            }
          }
        }
      }
    }
  }
</style>
