import { request } from '@/api/interceptor';
import type { FileListParams, FileItem } from '@/types/modules/file';

/**
 * 查询文件列表
 * 支持关键词搜索和文件类型筛选
 */
export function getFileList(params: FileListParams) {
  return request.get<FileItem[]>('/apis/file/list', {
    params,
  });
}

/**
 * 上传文件
 */
export function uploadFile(file: File, parentId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (parentId) {
    formData.append('parentId', parentId);
  }
  return request.post('/apis/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 下载文件
 */
export function downloadFile(fileId: string) {
  return request.get(`/apis/file/download/${fileId}`, {
    responseType: 'blob',
  });
}

/**
 * 预览文件
 */
export function previewFile(fileId: string) {
  return request.get(`/apis/file/preview/${fileId}`, {
    responseType: 'blob',
  });
}

/**
 * 创建文件夹
 */
export function createFolder(data: { folderName: string; parentId?: string }) {
  return request.post('/apis/file/directory', data);
}

/**
 * 删除文件
 */
export function deleteFile(fileId: string) {
  return request.delete(`/apis/file/${fileId}`);
}

/**
 * 批量删除文件
 */
export function batchDeleteFiles(fileIds: string[]) {
  return request.post('/apis/file/batch-delete', { fileIds });
}

/**
 * 重命名文件
 */
export function renameFile(fileId: string, displayName: string) {
  return request.put(`/apis/file/${fileId}/rename`, { displayName });
}

/**
 * 移动文件
 */
export function moveFile(fileId: string, targetParentId: string) {
  return request.put(`/apis/file/${fileId}/move`, { targetParentId });
}

/**
 * 复制文件
 */
export function copyFile(fileId: string, targetParentId: string) {
  return request.post(`/apis/file/${fileId}/copy`, { targetParentId });
}

/**
 * 分享文件
 */
export function shareFile(fileId: string, expireDays?: number) {
  return request.post(`/apis/file/${fileId}/share`, { expireDays });
}

/**
 * 取消分享
 */
export function unshareFile(fileId: string) {
  return request.delete(`/apis/file/${fileId}/share`);
}

/**
 * 获取回收站文件列表
 */
export function getRecycleList() {
  return request.get<FileItem[]>('/apis/file/recycle/list');
}

/**
 * 还原文件
 */
export function restoreFile(fileId: string) {
  return request.put(`/apis/file/recycle/${fileId}/restore`);
}

/**
 * 彻底删除文件
 */
export function permanentDeleteFile(fileId: string) {
  return request.delete(`/apis/file/recycle/${fileId}`);
}

/**
 * 清空回收站
 */
export function clearRecycle() {
  return request.delete('/apis/file/recycle/clear');
}

// 导出类型以便在组件中使用
export type { FileListParams, FileItem };
