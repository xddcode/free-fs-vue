import { ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import {
  uploadFile,
  downloadFiles,
  deleteFiles,
  renameFile,
  moveFiles,
  shareFiles,
  createFolder,
  favoriteFile,
  unfavoriteFile,
} from '@/api/file';
import type { FileItem } from '@/types/modules/file';

/**
 * 文件操作 Hook
 * 负责文件的上传、下载、删除、重命名、移动、分享等操作
 */
export default function useFileOperations(refreshCallback: () => void) {
  // 上传相关
  const uploadModalVisible = ref(false);
  const uploadingFiles = ref<File[]>([]);

  // 创建文件夹相关
  const createFolderModalVisible = ref(false);

  // 重命名相关
  const renameModalVisible = ref(false);
  const renamingFile = ref<FileItem | null>(null);

  // 移动文件相关
  const moveModalVisible = ref(false);
  const movingFile = ref<FileItem | null>(null);
  const movingFiles = ref<FileItem[]>([]);

  // 分享相关
  const shareModalVisible = ref(false);
  const sharingFile = ref<FileItem | null>(null);

  // 删除确认相关
  const deleteConfirmVisible = ref(false);
  const deletingFile = ref<FileItem | null>(null);
  const deletingFiles = ref<FileItem[]>([]);

  /**
   * 打开上传弹窗
   */
  const openUploadModal = () => {
    uploadModalVisible.value = true;
  };

  /**
   * 上传单个文件（供 Upload 组件的 custom-request 使用）
   */
  const uploadSingleFile = async (file: File, parentId?: string) => {
    await uploadFile(file, parentId);
  };

  /**
   * 上传文件
   */
  const handleUpload = async (
    files: File[],
    parentId?: string
  ): Promise<
    | { successCount: number; failedCount: number; totalFiles: number }
    | undefined
  > => {
    if (files.length === 0) return undefined;

    let successCount = 0;
    let failedCount = 0;
    const totalFiles = files.length;

    // 依次上传每个文件
    // eslint-disable-next-line no-restricted-syntax
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      try {
        // eslint-disable-next-line no-await-in-loop
        await uploadFile(file, parentId);
        successCount += 1;
      } catch (error) {
        // 上传失败，记录失败次数
        failedCount += 1;
      }
    }

    // 显示上传结果（只在有成功的情况下显示，失败的由拦截器处理）
    if (successCount === totalFiles) {
      Message.success(`成功上传 ${successCount} 个文件`);
    } else if (successCount > 0) {
      Message.warning(
        `成功上传 ${successCount} 个文件，失败 ${failedCount} 个`
      );
    }
    // 全部失败时不显示额外提示，拦截器已经显示了具体错误

    // 只有有成功的文件才刷新列表
    if (successCount > 0) {
      refreshCallback();
    }

    // 总是关闭弹窗
    uploadModalVisible.value = false;

    // 返回上传结果
    return { successCount, failedCount, totalFiles };
  };

  /**
   * 打开创建文件夹弹窗
   */
  const openCreateFolderModal = () => {
    createFolderModalVisible.value = true;
  };

  /**
   * 创建文件夹
   */
  const handleCreateFolder = async (folderName: string, parentId?: string) => {
    await createFolder({
      folderName: folderName.trim(),
      parentId,
    }).then(() => {
      Message.success('文件夹创建成功');
      createFolderModalVisible.value = false;
      refreshCallback();
    });
  };

  /**
   * 打开重命名弹窗
   */
  const openRenameModal = (file: FileItem) => {
    renamingFile.value = file;
    renameModalVisible.value = true;
  };

  /**
   * 重命名文件
   */
  const handleRename = async (fileId: string, newName: string) => {
    await renameFile(fileId, newName.trim()).then(() => {
      Message.success('重命名成功');
      renameModalVisible.value = false;
      renamingFile.value = null;
      refreshCallback();
    });
  };

  /**
   * 打开移动文件弹窗（单个）
   */
  const openMoveModal = (file: FileItem) => {
    movingFile.value = file;
    movingFiles.value = [file];
    moveModalVisible.value = true;
  };

  /**
   * 打开批量移动文件弹窗
   */
  const openBatchMoveModal = (files: FileItem[]) => {
    movingFile.value = null;
    movingFiles.value = files;
    moveModalVisible.value = true;
  };

  /**
   * 移动文件（支持单个和批量）
   */
  const handleMove = async (
    fileIds: string | string[],
    targetDirId: string
  ) => {
    const ids = Array.isArray(fileIds) ? fileIds : [fileIds];

    await moveFiles(targetDirId, ids).then(() => {
      const successMsg =
        ids.length === 1 ? '移动成功' : `成功移动 ${ids.length} 个文件`;
      Message.success(successMsg);
      moveModalVisible.value = false;
      movingFile.value = null;
      movingFiles.value = [];
      refreshCallback();
    });
  };

  /**
   * 打开分享弹窗
   */
  const openShareModal = (file: FileItem) => {
    sharingFile.value = file;
    shareModalVisible.value = true;
  };

  /**
   * 分享文件（支持单个和批量）
   */
  const handleShare = async (
    fileIds: string | string[],
    expireDays?: number
  ) => {
    const ids = Array.isArray(fileIds) ? fileIds : [fileIds];

    return shareFiles(ids, expireDays).then((response) => {
      const successMsg =
        ids.length === 1
          ? '分享链接已生成'
          : `成功生成 ${ids.length} 个分享链接`;
      Message.success(successMsg);
      return response.data;
    });
  };

  /**
   * 打开删除确认弹窗（单个文件）
   */
  const openDeleteConfirm = (file: FileItem) => {
    deletingFile.value = file;
    deletingFiles.value = [file];
    deleteConfirmVisible.value = true;
  };

  /**
   * 打开批量删除确认弹窗
   */
  const openBatchDeleteConfirm = (files: FileItem[]) => {
    deletingFile.value = null;
    deletingFiles.value = files;
    deleteConfirmVisible.value = true;
  };

  /**
   * 删除文件（支持单个和批量）
   */
  const handleDelete = async (fileIds: string | string[]) => {
    const ids = Array.isArray(fileIds) ? fileIds : [fileIds];

    await deleteFiles(ids).then(() => {
      const successMsg =
        ids.length === 1
          ? '已移到回收站'
          : `已将 ${ids.length} 个文件移到回收站`;
      Message.success(successMsg);
      deleteConfirmVisible.value = false;
      deletingFile.value = null;
      deletingFiles.value = [];
      refreshCallback();
    });
  };

  /**
   * 传统下载方式（回退方案）
   */
  const fallbackDownload = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    Message.success('下载成功（使用默认下载文件夹）');
  };

  /**
   * 下载文件（支持单个和批量）
   */
  const handleDownload = async (files: FileItem | FileItem[]) => {
    const fileArray = Array.isArray(files) ? files : [files];
    const fileIds = fileArray.map((f) => f.id);

    await downloadFiles(fileIds).then(async (response) => {
      const blob = new Blob([response.data]);

      // 单个文件使用原文件名，多个文件打包为zip
      const fileName =
        fileIds.length === 1
          ? fileArray[0].displayName
          : `批量下载_${Date.now()}.zip`;

      // 检查浏览器是否支持 File System Access API
      if ('showSaveFilePicker' in window) {
        try {
          const fileTypes =
            fileIds.length === 1 && fileArray[0].suffix
              ? [
                  {
                    description: '文件',
                    accept: {
                      '*/*': [`.${fileArray[0].suffix}`],
                    },
                  },
                ]
              : [
                  {
                    description: 'ZIP 文件',
                    accept: {
                      'application/zip': ['.zip'],
                    },
                  },
                ];

          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: fileTypes,
          });

          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();

          const successMsg =
            fileIds.length === 1
              ? '下载成功'
              : `成功下载 ${fileIds.length} 个文件`;
          Message.success(successMsg);
        } catch (error: any) {
          if (error.name === 'AbortError') {
            Message.info('已取消下载');
            return;
          }
          Message.warning('保存失败，使用默认下载方式');
          fallbackDownload(blob, fileName);
        }
      } else {
        fallbackDownload(blob, fileName);
      }
    });
  };

  /**
   * 收藏/取消收藏文件（支持单个和批量）
   */
  const handleFavorite = async (files: FileItem | FileItem[]) => {
    const fileArray = Array.isArray(files) ? files : [files];
    const fileIds = fileArray.map((f) => f.id);

    // 判断是收藏还是取消收藏
    // 批量时：如果有任何一个文件未被收藏，则执行收藏操作；如果全部已收藏，则执行取消收藏操作
    const hasUnfavorited = fileArray.some((file) => !file.isFavorite);
    const action = hasUnfavorited ? favoriteFile : unfavoriteFile;

    let successMsg = '';
    if (fileIds.length === 1) {
      successMsg = hasUnfavorited ? '已添加到收藏' : '已取消收藏';
    } else {
      successMsg = hasUnfavorited
        ? `已收藏 ${fileIds.length} 个文件`
        : `已取消收藏 ${fileIds.length} 个文件`;
    }

    await action(fileIds).then(() => {
      Message.success(successMsg);
      refreshCallback();
    });
  };

  return {
    // 上传相关
    uploadModalVisible,
    uploadingFiles,
    openUploadModal,
    uploadFile: uploadSingleFile,
    handleUpload,

    // 创建文件夹相关
    createFolderModalVisible,
    openCreateFolderModal,
    handleCreateFolder,

    // 重命名相关
    renameModalVisible,
    renamingFile,
    openRenameModal,
    handleRename,

    // 移动相关
    moveModalVisible,
    movingFile,
    movingFiles,
    openMoveModal,
    openBatchMoveModal,
    handleMove,

    // 分享相关
    shareModalVisible,
    sharingFile,
    openShareModal,
    handleShare,

    // 删除相关
    deleteConfirmVisible,
    deletingFile,
    deletingFiles,
    openDeleteConfirm,
    openBatchDeleteConfirm,
    handleDelete,

    // 下载
    handleDownload,

    // 收藏
    handleFavorite,
  };
}
