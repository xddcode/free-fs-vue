import { request } from '@/api/interceptor';
import type { FileUploadTaskVO } from '@/types/modules/transfer';
import { UploadTaskStatus } from '@/types/modules/transfer';

/**
 * 初始化上传请求参数
 */
export interface InitUploadParams {
  fileName: string;
  fileSize: number;
  fileMd5: string;
  parentId?: string;
  totalChunks: number;
  chunkSize: number;
  mimeType?: string;
}

/**
 * 上传任务信息
 */
export interface UploadTask {
  taskId: string;
  fileName: string;
  totalChunks: number;
  uploadedChunks: number;
  status: string;
}

/**
 * 文件信息
 */
export interface FileInfo {
  id: string;
  fileName: string;
  size: number;
  mimeType?: string;
  [key: string]: any;
}

/**
 * 初始化上传响应（秒传）
 */
export interface InitUploadInstantResponse {
  instant: true;
  message: string;
  fileInfo: FileInfo;
}

/**
 * 初始化上传响应
 */
export interface InitUploadNormalResponse {
  instant: false;
  message: string;
  taskId: string;
}

/**
 * 初始化上传响应
 */
export type InitUploadResponse =
  | InitUploadInstantResponse
  | InitUploadNormalResponse;

/**
 * 初始化上传（异步）
 * 检查文件是否可以秒传，如果不能则立即返回taskId
 * 后续状态通过WebSocket推送
 */
export function initUpload(params: InitUploadParams) {
  return request.post<string>('/apis/transfer/init', params);
}

/**
 * 上传分片
 */
export function uploadChunk(
  file: Blob,
  taskId: string,
  chunkIndex: number,
  chunkMd5: string
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('taskId', taskId);
  formData.append('chunkIndex', chunkIndex.toString());
  formData.append('chunkMd5', chunkMd5);

  return request.post('/apis/transfer/chunk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 查询已上传的分片
 * 用于断点续传
 */
export function getUploadedChunks(taskId: string) {
  return request.get<number[]>(`/apis/transfer/chunks/${taskId}`);
}

/**
 * 合并分片
 * 所有分片上传完成后调用此接口合并文件
 */
export function mergeChunks(taskId: string) {
  return request.post<FileInfo>(`/apis/transfer/merge/${taskId}`);
}

/**
 * 取消上传任务
 * 删除已上传的分片数据
 */
export function cancelUpload(taskId: string) {
  return request.delete(`/apis/transfer/task/${taskId}`);
}

/**
 * 获取传输文件列表
 * 用于传输列表页面展示
 */
export function getTransferFiles() {
  return request.get<FileUploadTaskVO[]>('/apis/transfer/files');
}

/**
 * 暂停上传任务
 */
export function pauseUpload(taskId: string) {
  return request.put(`/apis/transfer/task/${taskId}/pause`);
}

/**
 * 恢复上传任务
 */
export function resumeUpload(taskId: string) {
  return request.put(`/apis/transfer/task/${taskId}/resume`);
}

// 导出类型
export type { FileUploadTaskVO };
export { UploadTaskStatus };
