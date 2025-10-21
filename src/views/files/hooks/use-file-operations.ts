import { ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import {
  uploadFile,
  downloadFile,
  deleteFile,
  renameFile,
  moveFile,
  shareFile,
  createFolder,
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

  // 分享相关
  const shareModalVisible = ref(false);
  const sharingFile = ref<FileItem | null>(null);

  // 删除确认相关
  const deleteConfirmVisible = ref(false);
  const deletingFile = ref<FileItem | null>(null);

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
    try {
      await createFolder({
        folderName: folderName.trim(),
        parentId,
      });
      Message.success('文件夹创建成功');
      createFolderModalVisible.value = false;
      refreshCallback();
    } catch (error) {
      // 拦截器已处理错误提示
    }
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
    try {
      await renameFile(fileId, newName.trim());
      Message.success('重命名成功');
      renameModalVisible.value = false;
      renamingFile.value = null;
      refreshCallback();
    } catch (error) {
      // 拦截器已处理错误提示
    }
  };

  /**
   * 打开移动文件弹窗
   */
  const openMoveModal = (file: FileItem) => {
    movingFile.value = file;
    moveModalVisible.value = true;
  };

  /**
   * 移动文件
   */
  const handleMove = async (fileId: string, targetParentId: string) => {
    try {
      await moveFile(fileId, targetParentId);
      Message.success('移动成功');
      moveModalVisible.value = false;
      movingFile.value = null;
      refreshCallback();
    } catch (error) {
      // 拦截器已处理错误提示
    }
  };

  /**
   * 打开分享弹窗
   */
  const openShareModal = (file: FileItem) => {
    sharingFile.value = file;
    shareModalVisible.value = true;
  };

  /**
   * 分享文件
   */
  const handleShare = async (fileId: string, expireDays?: number) => {
    try {
      const response = await shareFile(fileId, expireDays);
      Message.success('分享链接已生成');
      return response.data;
    } catch (error) {
      // 拦截器已处理错误提示
      return null;
    }
  };

  /**
   * 打开删除确认弹窗
   */
  const openDeleteConfirm = (file: FileItem) => {
    deletingFile.value = file;
    deleteConfirmVisible.value = true;
  };

  /**
   * 删除文件
   */
  const handleDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      Message.success('删除成功');
      deleteConfirmVisible.value = false;
      deletingFile.value = null;
      refreshCallback();
    } catch (error) {
      // 拦截器已处理错误提示
    }
  };

  /**
   * 下载文件
   */
  const handleDownload = async (file: FileItem) => {
    try {
      const response = await downloadFile(file.id);

      // 创建下载链接
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.displayName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Message.success('下载成功');
    } catch (error) {
      Message.error('下载失败');
    }
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
    openMoveModal,
    handleMove,

    // 分享相关
    shareModalVisible,
    sharingFile,
    openShareModal,
    handleShare,

    // 删除相关
    deleteConfirmVisible,
    deletingFile,
    openDeleteConfirm,
    handleDelete,

    // 下载
    handleDownload,
  };
}
