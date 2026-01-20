import { calculateFileMD5, calculateBlobMD5 } from '@/utils/md5';
import {
  checkUpload,
  uploadChunk,
  getUploadedChunks,
  mergeChunks,
} from '@/api/transfer';

/**
 * 分片上传结果
 */
export interface ChunkUploadResult {
  chunkIndex: number;
  success: boolean;
  error?: string;
}

/**
 * 上传任务上下文
 * 存储每个任务的运行时状态
 */
interface UploadTaskContext {
  taskId: string;
  file: File;
  totalChunks: number;
  chunkSize: number;
  uploadedChunks: Set<number>;
  isPaused: boolean;
  isCancelled: boolean;
  activeUploads: Map<number, AbortController>;
  retryCount: Map<number, number>;
  concurrency: number; // 任务专属的并发配置
}

/**
 * 进度更新数据
 */
export interface ProgressUpdateData {
  uploadedBytes: number;
  totalBytes: number;
  uploadedChunks: number;
  totalChunks: number;
}

/**
 * 上传执行器回调接口
 * 用于解耦 store 依赖
 */
export interface UploadExecutorCallbacks {
  onTransition: (taskId: string, status: string) => void;
  onProgress: (taskId: string, data: ProgressUpdateData) => void;
  onError: (taskId: string, errorMessage: string) => void;
}

// ==================== 静态工具函数 ====================

function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('abort') ||
      message.includes('connection') ||
      message.includes('fetch')
    );
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * 上传执行器
 * 负责分片上传的具体执行逻辑
 */
class UploadExecutor {
  private static instance: UploadExecutor | null = null;

  /** 分片大小：5MB */
  public readonly CHUNK_SIZE = 5 * 1024 * 1024;

  /** 默认并发数 */
  public readonly DEFAULT_CONCURRENCY = 3;

  /** 最大重试次数 */
  public readonly MAX_RETRY_COUNT = 3;

  /** 重试基础延迟（毫秒） */
  private readonly RETRY_BASE_DELAY = 1000;

  /** 任务上下文映射 */
  private taskContexts = new Map<string, UploadTaskContext>();

  /** 当前并发数配置 */
  private concurrency = this.DEFAULT_CONCURRENCY;

  /** 回调函数 */
  private callbacks: UploadExecutorCallbacks | null = null;

  /**
   * 获取单例实例
   */
  public static getInstance(): UploadExecutor {
    if (!UploadExecutor.instance) {
      UploadExecutor.instance = new UploadExecutor();
    }
    return UploadExecutor.instance;
  }

  /**
   * 设置回调函数
   * @param callbacks 回调函数集合
   */
  public setCallbacks(callbacks: UploadExecutorCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * 设置并发数
   * @param concurrency 并发数
   */
  public setConcurrency(concurrency: number): void {
    this.concurrency = Math.max(1, concurrency);
  }

  /**
   * 获取当前并发数
   */
  public getConcurrency(): number {
    return this.concurrency;
  }

  /**
   * 计算文件的分片数量
   * @param fileSize 文件大小（字节）
   * @param chunkSize 分片大小（字节）
   * @returns 分片数量
   *
   */
  public calculateChunkCount(fileSize: number, chunkSize: number): number {
    return Math.ceil(fileSize / chunkSize);
  }

  /**
   * 开始上传任务
   * @param taskId 任务 ID
   * @param file 要上传的文件
   * @param concurrency 可选的并发数配置，如果不提供则使用当前全局配置
   * @param chunkSize 可选的分片大小配置，如果不提供则使用默认值 5MB
   */
  public async start(
    taskId: string,
    file: File,
    concurrency?: number,
    chunkSize?: number
  ): Promise<void> {
    // 使用提供的分片大小，如果没有提供则使用默认值
    const taskChunkSize = chunkSize ?? this.CHUNK_SIZE;
    const totalChunks = this.calculateChunkCount(file.size, taskChunkSize);

    // 如果提供了并发数，使用提供的值；否则使用当前全局配置
    // 这样可以确保已运行的任务不受配置变更影响
    const taskConcurrency = concurrency ?? this.concurrency;

    // 创建任务上下文
    const context: UploadTaskContext = {
      taskId,
      file,
      totalChunks,
      chunkSize: taskChunkSize,
      uploadedChunks: new Set(),
      isPaused: false,
      isCancelled: false,
      activeUploads: new Map(),
      retryCount: new Map(),
      concurrency: taskConcurrency, // 保存任务专属的并发配置
    };

    this.taskContexts.set(taskId, context);

    try {
      // 转换到 checking 状态
      this.notifyTransition(taskId, 'checking');

      // 计算文件 MD5
      const fileMd5 = await calculateFileMD5(file);

      // 检查是否被取消或暂停
      if (context.isCancelled || context.isPaused) {
        return;
      }

      // 校验文件（秒传检查）
      const checkResult = await checkUpload({
        taskId,
        fileMd5,
        fileName: file.name,
      });

      if (checkResult.data.isQuickUpload) {
        // 秒传成功，直接完成
        this.notifyTransition(taskId, 'completed');
        this.cleanup(taskId);
        return;
      }

      // 获取已上传的分片
      const uploadedResponse = await getUploadedChunks(taskId);
      const uploadedChunks = uploadedResponse.data || [];
      uploadedChunks.forEach((index) => context.uploadedChunks.add(index));

      // 更新进度
      this.notifyProgress(taskId, context);

      // 转换到 uploading 状态
      this.notifyTransition(taskId, 'uploading');

      // 开始分片上传
      await this.uploadChunks(context);

      // 检查是否被取消
      if (context.isCancelled) {
        return;
      }

      // 检查是否被暂停
      if (context.isPaused) {
        return;
      }

      // 所有分片上传完成
      // 后端会在最后一个分片上传成功后自动触发合并
      // 前端通过 SSE 监听合并完成事件
      if (context.uploadedChunks.size === totalChunks) {
        this.notifyTransition(taskId, 'merging');
      }
    } catch (error) {
      // 检查是否是网络错误
      if (isNetworkError(error)) {
        // 网络错误自动暂停
        this.notifyTransition(taskId, 'paused');
      } else {
        // 其他错误标记为失败
        const errorMessage =
          error instanceof Error ? error.message : '上传失败';
        this.notifyError(taskId, errorMessage);
      }
    }
  }

  /**
   * 暂停上传任务
   * @param taskId 任务 ID
   */
  public pause(taskId: string): void {
    const context = this.taskContexts.get(taskId);
    if (!context) {
      return;
    }

    context.isPaused = true;
    // 不中止正在进行的上传，让它们自然完成
    // 但不会启动新的上传
  }

  /**
   * 恢复上传任务
   * @param taskId 任务 ID
   */
  public async resume(taskId: string): Promise<void> {
    const context = this.taskContexts.get(taskId);
    if (!context) {
      return;
    }

    context.isPaused = false;

    try {
      // 从后端获取实际已上传的分片列表（这是真实情况）
      const uploadedResponse = await getUploadedChunks(taskId);
      const backendUploadedChunks = uploadedResponse.data || [];

      // 清空前端记录，以后端为准
      context.uploadedChunks.clear();

      // 使用后端返回的已上传分片列表
      backendUploadedChunks.forEach((index) =>
        context.uploadedChunks.add(index)
      );

      // 找出缺失的分片
      const missingChunks: number[] = [];
      for (let i = 0; i < context.totalChunks; i += 1) {
        if (!context.uploadedChunks.has(i)) {
          missingChunks.push(i);
        }
      }

      // 更新进度
      this.notifyProgress(taskId, context);

      // 继续上传剩余分片（包括缺失的分片）
      await this.uploadChunks(context);

      // 检查是否被取消或暂停
      if (context.isCancelled || context.isPaused) {
        return;
      }

      // 所有分片上传完成
      // 后端会在最后一个分片上传成功后自动触发合并
      // 前端通过 SSE 监听合并完成事件
      if (context.uploadedChunks.size === context.totalChunks) {
        this.notifyTransition(taskId, 'merging');
      } else {
        throw new Error(
          `分片不完整：已上传 ${context.uploadedChunks.size}/${context.totalChunks}`
        );
      }
    } catch (error) {
      if (isNetworkError(error)) {
        this.notifyTransition(taskId, 'paused');
      } else {
        const errorMessage =
          error instanceof Error ? error.message : '上传失败';
        this.notifyError(taskId, errorMessage);
      }
    }
  }

  /**
   * 取消上传任务
   * @param taskId 任务 ID
   */
  public cancel(taskId: string): void {
    const context = this.taskContexts.get(taskId);
    if (!context) {
      return;
    }

    context.isCancelled = true;
    context.isPaused = false;

    // 中止所有正在进行的上传
    context.activeUploads.forEach((controller) => {
      controller.abort();
    });
    context.activeUploads.clear();

    // 清理任务上下文
    this.cleanup(taskId);
  }

  /**
   * 获取任务是否正在运行
   * @param taskId 任务 ID
   */
  public isRunning(taskId: string): boolean {
    const context = this.taskContexts.get(taskId);
    return context !== undefined && !context.isPaused && !context.isCancelled;
  }

  /**
   * 获取任务是否已暂停
   * @param taskId 任务 ID
   */
  public isPaused(taskId: string): boolean {
    const context = this.taskContexts.get(taskId);
    return context?.isPaused ?? false;
  }

  /**
   * 获取当前活跃上传数
   * @param taskId 任务 ID
   */
  public getActiveUploadCount(taskId: string): number {
    const context = this.taskContexts.get(taskId);
    return context?.activeUploads.size ?? 0;
  }

  /**
   * 获取任务上下文（用于测试）
   * @param taskId 任务 ID
   */
  public getTaskContext(taskId: string): UploadTaskContext | undefined {
    return this.taskContexts.get(taskId);
  }

  /**
   * 清理所有任务（用于测试）
   */
  public clearAll(): void {
    this.taskContexts.forEach((context) => {
      context.activeUploads.forEach((controller) => {
        controller.abort();
      });
    });
    this.taskContexts.clear();
  }

  // ==================== 私有方法 ====================

  /**
   * 通知状态转换
   */
  private notifyTransition(taskId: string, status: string): void {
    if (this.callbacks?.onTransition) {
      this.callbacks.onTransition(taskId, status);
    }
  }

  /**
   * 通知进度更新
   */
  private notifyProgress(taskId: string, context: UploadTaskContext): void {
    if (!this.callbacks?.onProgress) return;

    const { file, totalChunks, uploadedChunks, chunkSize } = context;

    // 计算已上传字节数
    let uploadedBytes = 0;
    uploadedChunks.forEach((chunkIndex) => {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      uploadedBytes += end - start;
    });

    this.callbacks.onProgress(taskId, {
      uploadedBytes,
      totalBytes: file.size,
      uploadedChunks: uploadedChunks.size,
      totalChunks,
    });
  }

  /**
   * 通知错误
   */
  private notifyError(taskId: string, errorMessage: string): void {
    if (this.callbacks?.onError) {
      this.callbacks.onError(taskId, errorMessage);
    }
  }

  /**
   * 并发上传分片
   * @param context 任务上下文
   *
   */
  private async uploadChunks(context: UploadTaskContext): Promise<void> {
    const { taskId, file, totalChunks, uploadedChunks, concurrency } = context;

    // 获取需要上传的分片索引
    const chunksToUpload: number[] = [];
    for (let i = 0; i < totalChunks; i += 1) {
      if (!uploadedChunks.has(i)) {
        chunksToUpload.push(i);
      }
    }

    if (chunksToUpload.length === 0) {
      return;
    }

    let currentIndex = 0;

    // 创建工作线程
    const uploadWorker = async (): Promise<void> => {
      while (currentIndex < chunksToUpload.length) {
        // 检查是否被暂停或取消（在获取新分片之前检查）
        if (context.isPaused || context.isCancelled) {
          break;
        }

        const localIndex = currentIndex;
        currentIndex += 1;

        const chunkIndex = chunksToUpload[localIndex];

        // 上传单个分片（带重试）
        // eslint-disable-next-line no-await-in-loop
        const result = await this.uploadChunkWithRetry(
          context,
          file,
          chunkIndex
        );

        // 即使暂停了，也要处理已经完成的上传结果
        if (result.success) {
          uploadedChunks.add(chunkIndex);
          this.notifyProgress(taskId, context);
        } else if (!context.isCancelled && !context.isPaused) {
          // 只有在未暂停且未取消的情况下才抛出错误
          throw new Error(result.error || `分片 ${chunkIndex} 上传失败`);
        }
        // 如果暂停了但分片上传失败，不抛出错误，让暂停正常进行
      }
    };

    // 启动并发工作线程，使用任务专属的并发配置
    const workerCount = Math.min(concurrency, chunksToUpload.length);
    const workers = Array.from({ length: workerCount }, () => uploadWorker());

    await Promise.all(workers);
  }

  /**
   * 上传单个分片（带重试）
   * @param context 任务上下文
   * @param file 文件
   * @param chunkIndex 分片索引
   *
   */
  private async uploadChunkWithRetry(
    context: UploadTaskContext,
    file: File,
    chunkIndex: number
  ): Promise<ChunkUploadResult> {
    const { taskId, chunkSize } = context;
    let retryCount = context.retryCount.get(chunkIndex) || 0;

    while (retryCount <= this.MAX_RETRY_COUNT) {
      // 在开始上传之前检查是否被暂停或取消
      if (context.isPaused || context.isCancelled) {
        return { chunkIndex, success: false, error: '任务已暂停或取消' };
      }

      try {
        // 创建 AbortController
        const abortController = new AbortController();
        context.activeUploads.set(chunkIndex, abortController);

        // 切分分片
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBlob = file.slice(start, end);

        // 计算分片 MD5
        // eslint-disable-next-line no-await-in-loop
        const chunkMd5 = await calculateBlobMD5(chunkBlob);

        // MD5 计算后再次检查是否被取消（暂停不检查，让上传继续）
        if (context.isCancelled) {
          context.activeUploads.delete(chunkIndex);
          return { chunkIndex, success: false, error: '任务已取消' };
        }

        // 上传分片（即使暂停了也让这个分片上传完成）
        // eslint-disable-next-line no-await-in-loop
        await uploadChunk(chunkBlob, taskId, chunkIndex, chunkMd5);

        // 上传成功，清理
        context.activeUploads.delete(chunkIndex);
        context.retryCount.delete(chunkIndex);

        // 即使暂停了，也返回成功，让 worker 记录这个分片
        return { chunkIndex, success: true };
      } catch (error) {
        context.activeUploads.delete(chunkIndex);

        // 如果是取消导致的错误，直接返回
        if (context.isCancelled) {
          return { chunkIndex, success: false, error: '任务已取消' };
        }

        retryCount += 1;
        context.retryCount.set(chunkIndex, retryCount);

        // 如果还有重试次数，等待后重试
        if (retryCount <= this.MAX_RETRY_COUNT) {
          // 指数退避：1s, 2s, 4s
          const delay = this.RETRY_BASE_DELAY * 2 ** (retryCount - 1);
          // eslint-disable-next-line no-await-in-loop
          await sleep(delay);
        } else {
          // 超过重试次数
          const errorMessage =
            error instanceof Error ? error.message : '上传失败';
          return {
            chunkIndex,
            success: false,
            error: `分片 ${chunkIndex} 上传失败（已重试 ${this.MAX_RETRY_COUNT} 次）: ${errorMessage}`,
          };
        }
      }
    }

    return {
      chunkIndex,
      success: false,
      error: `分片 ${chunkIndex} 上传失败`,
    };
  }

  /**
   * 清理任务上下文
   * @param taskId 任务 ID
   */
  private cleanup(taskId: string): void {
    this.taskContexts.delete(taskId);
  }
}

/**
 * 上传执行器单例
 */
export const uploadExecutor = UploadExecutor.getInstance();

export default uploadExecutor;
