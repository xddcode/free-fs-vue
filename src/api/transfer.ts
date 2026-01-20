import { request } from '@/api/interceptor';
import type {
  FileTransferTaskVO,
  InitUploadCmd,
  CheckUploadCmd,
  CheckUploadResultVO,
} from '@/types/modules/transfer';

/**
 * 初始化上传
 * 创建上传任务，返回taskId用于后续分片上传
 */
export function initUpload(params: InitUploadCmd) {
  return request.post<string>('/apis/transfer/init', params, {
    showErrorMessage: false,
  } as any);
}

/**
 * 校验文件
 * 前端计算完MD5后调用，判断是否秒传
 */
export function checkUpload(params: CheckUploadCmd) {
  return request.post<CheckUploadResultVO>('/apis/transfer/check', params, {
    showErrorMessage: false,
  } as any);
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
    timeout: 60000,
    showErrorMessage: false, // 禁用拦截器的错误提示，由业务层统一处理
  } as any);
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
  return request.get<FileTransferTaskVO[]>('/apis/transfer/files');
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

/**
 * 下载文件
 * 注意：此接口返回文件流，使用原始axios请求以正确处理blob响应
 */
// export function downloadFile(fileId: string) {
//   // 直接使用 axios 实例而非 request 包装器，避免 blob 响应被额外处理
//   const service = require('@/api/interceptor').default;
//   return service.get(`/apis/transfer/download/${fileId}`, {
//     responseType: 'blob',
//   });
// }
