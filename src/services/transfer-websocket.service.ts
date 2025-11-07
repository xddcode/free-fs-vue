import { UploadWebSocket, ProgressData } from '@/utils/upload-websocket';
import useUserStore from '@/store/modules/user';

/**
 * 全局传输WebSocket服务
 * 单例模式，管理所有传输任务的WebSocket连接和状态推送
 */
// eslint-disable-next-line no-use-before-define
class TransferWebSocketService {
  // eslint-disable-next-line no-use-before-define
  private static instance: TransferWebSocketService | null = null;

  private wsInstance: UploadWebSocket | null = null;

  private listeners: Map<
    string,
    {
      onProgress?: (data: ProgressData) => void;
      onComplete?: (fileId: string, message: string) => void;
      onError?: (message: string) => void;
      onInitStart?: (fileName: string) => void;
      onInitSuccess?: (task: any) => void;
      onChunkSuccess?: (chunkIndex: number) => void;
    }
  > = new Map();

  /**
   * 获取单例实例
   */
  public static getInstance(): TransferWebSocketService {
    if (!TransferWebSocketService.instance) {
      TransferWebSocketService.instance = new TransferWebSocketService();
    }
    return TransferWebSocketService.instance;
  }

  /**
   * 初始化WebSocket连接
   */
  public connect(): void {
    // 如果已经连接，直接返回
    if (this.wsInstance?.isConnected()) {
      // eslint-disable-next-line no-console
      console.log('[TransferWebSocketService] WebSocket已连接，无需重复连接');
      return;
    }

    const userStore = useUserStore();
    const userId = userStore.id;

    if (!userId) {
      // eslint-disable-next-line no-console
      console.error(
        '[TransferWebSocketService] 用户ID不存在，无法初始化WebSocket'
      );
      return;
    }

    // 如果有旧的实例但未连接，先关闭
    if (this.wsInstance) {
      // eslint-disable-next-line no-console
      console.log('[TransferWebSocketService] 关闭旧的WebSocket连接');
      this.wsInstance.close();
      this.wsInstance = null;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[TransferWebSocketService] 创建新的WebSocket连接，userId: ${userId}`
    );

    // 创建新实例
    this.wsInstance = new UploadWebSocket(userId);

    // 注册全局进度回调
    this.wsInstance.onProgress((taskId: string, data: ProgressData) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onProgress) {
        listener.onProgress(data);
      }
    });

    // 注册全局完成回调
    this.wsInstance.onComplete(
      (taskId: string, fileId: string, message: string) => {
        const listener = this.listeners.get(taskId);
        if (listener?.onComplete) {
          listener.onComplete(fileId, message);
        }
        // 完成后移除监听器
        this.listeners.delete(taskId);
      }
    );

    // 注册全局错误回调
    this.wsInstance.onError((taskId: string, message: string) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onError) {
        listener.onError(message);
      }
    });

    // 注册初始化开始回调
    this.wsInstance.onInitStart((taskId: string, fileName: string) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onInitStart) {
        listener.onInitStart(fileName);
      }
    });

    // 注册初始化成功回调
    this.wsInstance.onInitSuccess((taskId: string, task: any) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onInitSuccess) {
        listener.onInitSuccess(task);
      }
    });

    // 注册分片成功回调
    this.wsInstance.onChunkSuccess((taskId: string, chunkIndex: number) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onChunkSuccess) {
        listener.onChunkSuccess(chunkIndex);
      }
    });

    // 建立连接
    this.wsInstance.connect();
  }

  /**
   * 订阅任务进度
   */
  public subscribe(
    taskId: string,
    callbacks?: {
      onProgress?: (data: ProgressData) => void;
      onComplete?: (fileId: string, message: string) => void;
      onError?: (message: string) => void;
      onInitStart?: (fileName: string) => void;
      onInitSuccess?: (task: any) => void;
      onChunkSuccess?: (chunkIndex: number) => void;
    }
  ): void {
    if (!this.wsInstance) {
      this.connect();
    }

    if (callbacks) {
      this.listeners.set(taskId, callbacks);
    }

    this.wsInstance?.subscribe(taskId);
  }

  /**
   * 取消订阅任务
   */
  public unsubscribe(taskId: string): void {
    this.wsInstance?.unsubscribe(taskId);
    this.listeners.delete(taskId);
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    this.wsInstance?.close();
    this.wsInstance = null;
    this.listeners.clear();
  }

  /**
   * 检查是否已连接
   */
  public isConnected(): boolean {
    return this.wsInstance?.isConnected() ?? false;
  }
}

// 导出单例实例
export default TransferWebSocketService.getInstance();
