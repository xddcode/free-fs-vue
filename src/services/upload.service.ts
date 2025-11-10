import { Message, Notification } from '@arco-design/web-vue';
import { calculateFileMD5, calculateBlobMD5 } from '@/utils/md5';
import {
  initUpload,
  checkUpload,
  uploadChunk,
  getUploadedChunks,
} from '@/api/transfer';
import transferWebSocketService from './transfer-websocket.service';

export const FILE_UPLOAD_COMPLETE_EVENT = 'file-upload-complete';

export interface UploadTaskInfo {
  file: File;
  parentId?: string;
}

interface FileUploadInfo {
  file: File;
  totalChunks: number;
}

/**
 * 文件上传服务
 * 提供文件分片上传、断点续传、暂停恢复等功能
 */
class UploadService {
  private static instance: any = null;

  private readonly CHUNK_SIZE = 1024 * 1024 * 5; // 5MB

  private readonly MAX_CONCURRENT_UPLOADS = 3;

  private readonly MAX_RETRY_TIMES = 3;

  private pausedTasks = new Set<string>();

  private uploadingFiles = new Map<string, FileUploadInfo>();

  public static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  /**
   * 并发控制的分片上传
   */
  private async uploadChunksAsync(
    taskId: string,
    file: File,
    totalChunks: number,
    uploadedChunks: number[]
  ): Promise<void> {
    const chunksToUpload = Array.from(
      { length: totalChunks },
      (_, i) => i
    ).filter((i) => !uploadedChunks.includes(i));

    if (chunksToUpload.length === 0) {
      return;
    }

    let currentIndex = 0;
    const failedChunks: number[] = [];

    const uploadWorker = async (): Promise<void> => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (this.pausedTasks.has(taskId)) {
          break;
        }

        const localIndex = currentIndex;
        currentIndex += 1;

        if (localIndex >= chunksToUpload.length) {
          break;
        }

        const chunkIndex = chunksToUpload[localIndex];

        try {
          const start = chunkIndex * this.CHUNK_SIZE;
          const end = Math.min(start + this.CHUNK_SIZE, file.size);
          const chunkBlob = file.slice(start, end);

          // eslint-disable-next-line no-await-in-loop
          const chunkMd5 = await calculateBlobMD5(chunkBlob);

          if (this.pausedTasks.has(taskId)) {
            break;
          }

          // eslint-disable-next-line no-await-in-loop
          await uploadChunk(chunkBlob, taskId, chunkIndex, chunkMd5);
        } catch (error) {
          failedChunks.push(chunkIndex);
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(this.MAX_CONCURRENT_UPLOADS, chunksToUpload.length) },
      () => uploadWorker()
    );

    await Promise.all(workers);
  }

  /**
   * 上传单个文件
   */
  public async uploadFile(taskInfo: UploadTaskInfo): Promise<{
    success: boolean;
    taskId?: string;
    message?: string;
  }> {
    const { file, parentId } = taskInfo;

    try {
      const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);

      const initResponse = await initUpload({
        fileName: file.name,
        fileSize: file.size,
        parentId,
        totalChunks,
        chunkSize: this.CHUNK_SIZE,
        mimeType: file.type || 'application/octet-stream',
      });

      const taskId = initResponse.data;

      transferWebSocketService.subscribe(taskId, {
        onProgress: () => {
          // 进度更新由传输列表页面处理
        },
        onPaused: () => {
          this.pausedTasks.add(taskId);
        },
        onResumed: (uploadedChunks) => {
          this.pausedTasks.delete(taskId);

          const fileInfo = this.uploadingFiles.get(taskId);
          if (fileInfo) {
            this.uploadChunksAsync(
              taskId,
              fileInfo.file,
              fileInfo.totalChunks,
              uploadedChunks
            ).catch(() => {
              Message.error('恢复上传失败');
            });
          }
        },
        onMerging: () => {
          // 合并中状态由传输列表页面处理
        },
        onComplete: (fileId) => {
          Notification.success({
            title: '文件上传完成',
            content: `${file.name} 已成功上传`,
            position: 'bottomRight',
            duration: 5000,
          });

          window.dispatchEvent(
            new CustomEvent(FILE_UPLOAD_COMPLETE_EVENT, {
              detail: { fileId, fileName: file.name, parentId },
            })
          );

          this.pausedTasks.delete(taskId);
          this.uploadingFiles.delete(taskId);
        },
        onError: (errorMsg) => {
          Message.error(`${file.name} ${errorMsg}`);
          this.pausedTasks.delete(taskId);
          this.uploadingFiles.delete(taskId);
        },
        onCancelled: () => {
          this.pausedTasks.delete(taskId);
          this.uploadingFiles.delete(taskId);
        },
      });

      this.executeUploadAsync(taskId, file, totalChunks).catch(() => {
        // 错误会通过WebSocket推送
      });

      return {
        success: true,
        taskId,
        message: '文件已添加到传输列表',
      };
    } catch (error) {
      const { message: errorMsg = '初始化失败' } = error as Error;
      Message.error(`${file.name} 初始化失败: ${errorMsg}`);
      return {
        success: false,
        message: errorMsg,
      };
    }
  }

  /**
   * 执行上传流程
   */
  private async executeUploadAsync(
    taskId: string,
    file: File,
    totalChunks: number
  ): Promise<void> {
    try {
      const fileMd5 = await calculateFileMD5(file);

      const checkResponse = await checkUpload({
        taskId,
        fileMd5,
        fileName: file.name,
      });

      const checkResult = checkResponse.data;

      if (checkResult.isQuickUpload) {
        Message.success(`${file.name} 秒传成功`);
        return;
      }

      this.uploadingFiles.set(taskId, {
        file,
        totalChunks,
      });

      const uploadedResponse = await getUploadedChunks(taskId);
      const uploadedChunks = uploadedResponse.data || [];

      await this.uploadChunksAsync(taskId, file, totalChunks, uploadedChunks);
    } catch (error) {
      const { message: errorMsg = '上传失败' } = error as Error;
      this.uploadingFiles.delete(taskId);
      throw new Error(`上传失败: ${errorMsg}`);
    }
  }

  /**
   * 批量上传文件
   */
  public async uploadFiles(
    files: File[],
    parentId?: string
  ): Promise<{
    successCount: number;
    failedCount: number;
    totalCount: number;
  }> {
    let successCount = 0;
    let failedCount = 0;

    const uploadPromises = files.map(async (file) => {
      const result = await this.uploadFile({ file, parentId });
      if (result.success) {
        successCount += 1;
      } else {
        failedCount += 1;
      }
    });

    await Promise.all(uploadPromises);

    if (successCount === files.length) {
      Message.success(`成功提交 ${successCount} 个上传任务`);
    } else if (successCount > 0) {
      Message.warning(`成功提交 ${successCount} 个，失败 ${failedCount} 个`);
    } else if (failedCount > 0) {
      Message.error(`所有任务提交失败`);
    }

    return {
      successCount,
      failedCount,
      totalCount: files.length,
    };
  }
}

export const uploadService = UploadService.getInstance();
