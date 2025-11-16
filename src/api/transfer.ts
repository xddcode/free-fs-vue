import { request } from '@/api/interceptor';
import type {
  FileUploadTaskVO,
  InitUploadCmd,
  CheckUploadCmd,
  CheckUploadResultVO,
} from '@/types/modules/transfer';
import { UploadTaskStatus } from '@/types/modules/transfer';

/**
 * 初始化上传
 * 创建上传任务，返回taskId用于后续分片上传
 */
export function initUpload(params: InitUploadCmd) {
  return request.post<string>('/apis/transfer/init', params);
}

/**
 * 校验文件
 * 前端计算完MD5后调用，判断是否秒传
 */
export function checkUpload(params: CheckUploadCmd) {
  return request.post<CheckUploadResultVO>('/apis/transfer/check', params);
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
    timeout: 60000, // 上传分片超时时间设置为60秒
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
  return request.post<string>(`/apis/transfer/merge/${taskId}`);
}

/**
 * 取消上传任务
 * 删除已上传的分片数据
 */
export function cancelUpload(taskId: string) {
  return request.delete(`/apis/transfer/cancel/${taskId}`);
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
  return request.post(`/apis/transfer/pause/${taskId}`);
}

/**
 * 恢复上传任务
 */
export function resumeUpload(taskId: string) {
  return request.post(`/apis/transfer/resume/${taskId}`);
}

// 导出类型
export type { FileUploadTaskVO };
export { UploadTaskStatus };
