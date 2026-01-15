import { ref } from 'vue';
import { Message, Modal } from '@arco-design/web-vue';
import {
  uploadFile,
  deleteFiles,
  renameFile,
  moveFiles,
  createFolder,
  favoriteFile,
  unfavoriteFile,
} from '@/api/file';
import type { FileItem } from '@/types/modules/file';
import { shareFiles } from '@/api/share';
import { getToken } from '@/utils/auth';

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
  const moveSuccessCallback = ref<(() => void) | null>(null);

  // 分享相关
  const shareModalVisible = ref(false);
  const sharingFile = ref<FileItem | null>(null);
  const sharingFiles = ref<FileItem[]>([]);

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
   * @param files 要移动的文件列表
   * @param onSuccess 可选的成功回调函数
   */
  const openBatchMoveModal = (files: FileItem[], onSuccess?: () => void) => {
    movingFile.value = null;
    movingFiles.value = files;
    moveModalVisible.value = true;
    
    // 保存成功回调，在移动完成后执行
    moveSuccessCallback.value = onSuccess || null;
  };

  /**
   * 移动文件（支持单个和批量）
   * @param fileIds 文件ID或ID数组
   * @param targetDirId 目标目录ID
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
      
      // 执行成功回调（用于清空选中状态等）
      if (moveSuccessCallback.value) {
        moveSuccessCallback.value();
        moveSuccessCallback.value = null;
      }
    });
  };

  /**
   * 打开分享弹窗（单个）
   */
  const openShareModal = (file: FileItem) => {
    sharingFile.value = file;
    sharingFiles.value = [file];
    shareModalVisible.value = true;
  };

  /**
   * 打开批量分享弹窗
   */
  const openBatchShareModal = (files: FileItem[]) => {
    sharingFile.value = null;
    sharingFiles.value = files;
    shareModalVisible.value = true;
  };

  /**
   * 分享文件（支持单个和批量）
   * 注意：此方法不再直接调用，现在都通过打开分享弹窗来完成
   */
  const handleShare = async (
    fileIds: string | string[],
    expireType?: number | null,
    expireTime?: string,
    needShareCode?: boolean,
    maxViewCount?: number,
    maxDownloadCount?: number
  ) => {
    const ids = Array.isArray(fileIds) ? fileIds : [fileIds];

    return shareFiles({
      fileIds: ids,
      expireType,
      expireTime,
      needShareCode,
      maxViewCount,
      maxDownloadCount,
    }).then((response) => {
      const successMsg =
        ids.length === 1
          ? '分享链接已生成'
          : `成功生成 ${ids.length} 个分享链接`;
      Message.success(successMsg);
      return response.data;
    });
  };

  /**
   * 删除文件（支持单个和批量）
   * @param fileIds 文件ID或ID数组
   * @param onSuccess 可选的成功回调函数
   */
  const handleDelete = async (fileIds: string | string[], onSuccess?: () => void) => {
    const ids = Array.isArray(fileIds) ? fileIds : [fileIds];

    await deleteFiles(ids).then(() => {
      const successMsg =
        ids.length === 1
          ? '已移到回收站'
          : `已将 ${ids.length} 个文件移到回收站`;
      Message.success(successMsg);
      refreshCallback();
      
      // 执行成功回调（用于清空选中状态等）
      onSuccess?.();
    });
  };

  /**
   * 打开删除确认弹窗（单个文件）
   */
  const openDeleteConfirm = (file: FileItem) => {
    Modal.confirm({
      title: '确认放入回收站',
      content: `确定要将文件 "${file.displayName}" 放入回收站吗？`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: {
        status: 'danger',
      },
      onOk: () => handleDelete(file.id),
    });
  };

  /**
   * 打开批量删除确认弹窗
   * @param files 要删除的文件列表
   * @param onSuccess 可选的成功回调函数
   */
  const openBatchDeleteConfirm = (files: FileItem[], onSuccess?: () => void) => {
    if (files.length === 0) return;
    Modal.confirm({
      title: '确认批量放入回收站',
      content: `确定要将选中的 ${files.length} 个文件放入回收站吗？`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: {
        status: 'danger',
      },
      onOk: () => {
        const ids = files.map((f) => f.id);
        handleDelete(ids, onSuccess);
      },
    });
  };

  /**
   * 下载文件（支持单个和批量）
   * 使用 a 标签直接下载，token 通过 URL 参数传递
   */
  const handleDownload = async (files: FileItem | FileItem[]) => {
    try {
      const fileArray = Array.isArray(files) ? files : [files];
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const token = getToken();

      // 依次下载每个文件
      fileArray.forEach((file) => {
        // 构建下载链接，将 token 放到 URL 参数中
        const downloadUrl = `${apiBaseUrl}/apis/transfer/download/${file.id}?Authorization=Bearer ${token}`;

        // 创建隐藏的 a 标签触发下载
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.originalName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

      const successMsg =
        fileArray.length === 1
          ? '开始下载文件'
          : `开始下载 ${fileArray.length} 个文件`;
      Message.success(successMsg);
    } catch (err: any) {
      Message.error(err.message || '下载失败，请稍后重试');
    }
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

  /**
   * 预览文件
   * @param {FileItem} file - 文件对象
   */
  const openPreview = (file: FileItem) => {
    const apiBaseUrl = import.meta.env.VITE_API_VIEW_URL || '';
    const previewUrl = `${apiBaseUrl}/preview/${file.id}`;
    window.open(previewUrl, '_blank');
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
    sharingFiles,
    openShareModal,
    openBatchShareModal,
    handleShare,

    // 删除相关
    openDeleteConfirm,
    openBatchDeleteConfirm,
    handleDelete,

    // 下载
    handleDownload,

    // 收藏
    handleFavorite,

    // 预览
    openPreview,
  };
}
