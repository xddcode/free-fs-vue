import { Message } from '@arco-design/web-vue';
import { calculateFileMD5, calculateBlobMD5 } from '@/utils/md5';
import { initUpload, uploadChunk, getUploadedChunks } from '@/api/transfer';
import transferWebSocketService from './transfer-websocket.service';

/**
 * 上传任务信息
 */
export interface UploadTaskInfo {
  file: File;
  parentId?: string;
}

/**
 * 统一的上传服务
 * 负责处理所有上传操作，封装上传逻辑
 */
// eslint-disable-next-line no-use-before-define
class UploadService {
  // eslint-disable-next-line no-use-before-define
  private static instance: UploadService | null = null;

  // 分片大小：256KB（方便观察进度更新）
  // 生产环境建议 1-5MB，测试观察进度可以用 128KB-512KB
  private readonly CHUNK_SIZE = 1024 * 1024 * 5; // 5MB

  private readonly MAX_CONCURRENT_UPLOADS = 3; // 最大并发上传数

  private readonly MAX_RETRY_TIMES = 3; // 最大重试次数

  /**
   * 获取单例实例
   */
  public static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  /**
   * 并发控制的分片上传（异步模式，带并发限制）
   * 控制最多3个分片同时上传，避免网络拥堵
   */
  private async uploadChunksAsync(
    taskId: string,
    file: File,
    totalChunks: number,
    uploadedChunks: number[]
  ): Promise<void> {
    // 需要上传的分片索引
    const chunksToUpload = Array.from(
      { length: totalChunks },
      (_, i) => i
    ).filter((i) => !uploadedChunks.includes(i));

    if (chunksToUpload.length === 0) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[上传服务] 开始上传 ${chunksToUpload.length} 个分片，总共 ${totalChunks} 个分片，并发数: ${this.MAX_CONCURRENT_UPLOADS}`
    );

    let currentIndex = 0;
    const failedChunks: number[] = [];

    // 创建并发控制的上传worker
    const uploadWorker = async (): Promise<void> => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // 获取下一个要上传的分片索引
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

          // eslint-disable-next-line no-console
          console.log(
            `[上传服务] 分片 ${chunkIndex}: 开始上传，大小: ${chunkBlob.size} 字节`
          );

          // 计算分片MD5
          // eslint-disable-next-line no-await-in-loop
          const chunkMd5 = await calculateBlobMD5(chunkBlob);

          // 上传分片（异步模式，后端立即返回"接收成功"）
          // eslint-disable-next-line no-await-in-loop
          await uploadChunk(chunkBlob, taskId, chunkIndex, chunkMd5);

          // eslint-disable-next-line no-console
          console.log(
            `[上传服务] 分片 ${chunkIndex + 1}/${totalChunks} 已提交`
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(
            `[上传服务] 分片 ${chunkIndex + 1}/${totalChunks} 提交失败:`,
            error
          );
          failedChunks.push(chunkIndex);
        }
      }
    };

    // 启动并发worker
    const workers = Array.from(
      { length: Math.min(this.MAX_CONCURRENT_UPLOADS, chunksToUpload.length) },
      () => uploadWorker()
    );

    // 等待所有worker完成
    await Promise.all(workers);

    // 如果有失败的分片，记录日志但不阻断（后端会通过WebSocket推送错误）
    if (failedChunks.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[上传服务] 有 ${failedChunks.length} 个分片提交失败:`,
        failedChunks
      );
    }

    // eslint-disable-next-line no-console
    console.log(
      `[上传服务] 所有分片提交完成，成功: ${
        chunksToUpload.length - failedChunks.length
      }，失败: ${failedChunks.length}`
    );
  }

  /**
   * 上传单个文件
   * 初始化（同步）-> 立即开始上传分片（异步）-> WebSocket推送进度
   */
  public async uploadFile(taskInfo: UploadTaskInfo): Promise<{
    success: boolean;
    taskId?: string;
    message?: string;
  }> {
    const { file, parentId } = taskInfo;

    try {
      // eslint-disable-next-line no-console
      console.log(`[上传服务] 开始上传文件: ${file.name}`);

      // 1. 计算文件MD5
      const fileMd5 = await calculateFileMD5(file);

      // 2. 计算分片信息
      const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);

      // 3. 调用初始化接口（同步返回taskId）
      const initResponse = await initUpload({
        fileName: file.name,
        fileSize: file.size,
        fileMd5,
        parentId,
        totalChunks,
        chunkSize: this.CHUNK_SIZE,
        mimeType: file.type,
      });

      const taskId = initResponse.data;

      // eslint-disable-next-line no-console
      console.log(`[上传服务] 初始化成功，taskId: ${taskId}`);

      // 4. 订阅WebSocket（接收进度更新）
      transferWebSocketService.subscribe(taskId, {
        onProgress: (data) => {
          // 进度更新由外部处理（store）
          // eslint-disable-next-line no-console
          console.log(
            `[上传服务] 进度更新: ${data.uploadedChunks}/${
              data.totalChunks
            } (${Math.round(data.progress)}%)`
          );
        },
        onComplete: (fileId, message) => {
          // eslint-disable-next-line no-console
          console.log(
            `[上传服务] 文件 ${file.name} 上传完成！fileId: ${fileId}`
          );
          Message.success(message || `${file.name} 上传成功`);
        },
        onError: (errorMsg) => {
          // eslint-disable-next-line no-console
          console.error(`[上传服务] 文件 ${file.name} 上传失败:`, errorMsg);
          Message.error(`${file.name} ${errorMsg}`);
        },
      });

      // 5. 立即开始上传分片（异步执行，不阻塞返回）
      this.executeUploadAsync(taskId, file, totalChunks).catch((error) => {
        // eslint-disable-next-line no-console
        console.error(`文件 ${file.name} 上传失败:`, error);
        Message.error(`${file.name} 上传失败`);
      });

      return {
        success: true,
        taskId,
        message: '上传任务已创建',
      };
    } catch (error) {
      const { message: errorMsg = '上传失败' } = error as Error;
      Message.error(`${file.name} 初始化失败: ${errorMsg}`);
      return {
        success: false,
        message: errorMsg,
      };
    }
  }

  /**
   * 执行实际的上传流程（异步模式）
   * 分片上传不等待后端响应，后端通过WebSocket推送进度
   * 后端会自动检测所有分片完成后进行合并
   */
  private async executeUploadAsync(
    taskId: string,
    file: File,
    totalChunks: number
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      `[上传服务] 开始执行上传流程，文件: ${file.name}，任务ID: ${taskId}`
    );

    try {
      // 1. 查询已上传的分片
      // eslint-disable-next-line no-console
      console.log(`[上传服务] 查询已上传的分片...`);
      const uploadedResponse = await getUploadedChunks(taskId);
      const uploadedChunks = uploadedResponse.data || [];
      // eslint-disable-next-line no-console
      console.log(
        `[上传服务] 已上传 ${uploadedChunks.length} 个分片:`,
        uploadedChunks
      );

      // 2. 上传未完成的分片（异步发送，不等待后端处理）
      // eslint-disable-next-line no-console
      console.log(`[上传服务] 开始上传分片（异步模式）...`);
      await this.uploadChunksAsync(taskId, file, totalChunks, uploadedChunks);

      // 3. 所有分片已提交，等待后端处理并自动合并
      // eslint-disable-next-line no-console
      console.log(
        `[上传服务] 所有分片已提交，后端处理中，等待WebSocket推送进度和完成消息...`
      );
    } catch (error) {
      const { message: errorMsg = '上传失败' } = error as Error;
      // eslint-disable-next-line no-console
      console.error(`[上传服务] 文件 ${file.name} 上传失败:`, error);
      throw new Error(`上传失败: ${errorMsg}`);
    }
  }

  /**
   * 批量上传文件（异步模式）
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

    // 并发提交上传任务
    const uploadPromises = files.map(async (file) => {
      const result = await this.uploadFile({ file, parentId });
      if (result.success) {
        successCount += 1;
      } else {
        failedCount += 1;
      }
    });

    await Promise.all(uploadPromises);

    // 显示结果提示
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

// 导出单例实例
export const uploadService = UploadService.getInstance();
