import { UploadWebSocket, ProgressData } from '@/utils/upload-websocket';
import useUserStore from '@/store/modules/user';

type TaskCallback = {
  onProgress?: (data: ProgressData) => void;
  onComplete?: (fileId: string, message: string) => void;
  onError?: (message: string) => void;
  onInitialized?: (message: string) => void;
  onChecking?: (message: string) => void;
  onQuickUpload?: (fileId: string) => void;
  onReadyToUpload?: (uploadId: string) => void;
  onPaused?: (message: string) => void;
  onResumed?: (uploadedChunks: number[]) => void;
  onMerging?: (message: string) => void;
  onCancelling?: (message: string) => void;
  onCancelled?: (message: string) => void;
};

/**
 * 传输WebSocket服务
 * 管理文件上传的WebSocket连接和消息分发
 */
class TransferWebSocketService {
  private static instance: any = null;

  private wsInstance: UploadWebSocket | null = null;

  public listeners: Map<string, TaskCallback> = new Map();

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
    if (this.wsInstance?.isConnected()) {
      return;
    }

    const userStore = useUserStore();
    const { id: userId } = userStore;

    if (!userId) {
      return;
    }

    if (this.wsInstance) {
      this.wsInstance.close();
      this.wsInstance = null;
    }

    this.wsInstance = new UploadWebSocket(userId);

    this.wsInstance.onProgress((taskId: string, data: ProgressData) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onProgress) {
        listener.onProgress(data);
      }
    });

    this.wsInstance.onComplete(
      (taskId: string, fileId: string, message: string) => {
        const listener = this.listeners.get(taskId);
        if (listener?.onComplete) {
          listener.onComplete(fileId, message);
        }
        this.listeners.delete(taskId);
      }
    );

    this.wsInstance.onError((taskId: string, message: string) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onError) {
        listener.onError(message);
      }
      // 错误后删除监听器
      this.listeners.delete(taskId);
    });

    this.wsInstance.onInitialized((taskId: string, message: string) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onInitialized) {
        listener.onInitialized(message);
      }
    });

    this.wsInstance.onChecking((taskId: string, message: string) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onChecking) {
        listener.onChecking(message);
      }
    });

    this.wsInstance.onQuickUpload((taskId: string, fileId: string) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onQuickUpload) {
        listener.onQuickUpload(fileId);
      }
      this.listeners.delete(taskId);
    });

    this.wsInstance.onReadyToUpload((taskId: string, uploadId: string) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onReadyToUpload) {
        listener.onReadyToUpload(uploadId);
      }
    });

    this.wsInstance.onPaused((taskId: string, message: string) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onPaused) {
        listener.onPaused(message);
      }
    });

    this.wsInstance.onResumed((taskId: string, uploadedChunks: number[]) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onResumed) {
        listener.onResumed(uploadedChunks);
      }
    });

    this.wsInstance.onMerging((taskId: string, message: string) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onMerging) {
        listener.onMerging(message);
      }
    });

    this.wsInstance.onCancelling((taskId: string, message: string) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onCancelling) {
        listener.onCancelling(message);
      }
    });

    this.wsInstance.onCancelled((taskId: string, message: string) => {
      const listener = this.listeners.get(taskId);
      if (listener?.onCancelled) {
        listener.onCancelled(message);
      }
      this.listeners.delete(taskId);
    });

    this.wsInstance.connect();
  }

  /**
   * 订阅任务进度
   * 如果已存在监听器，会合并回调而不是覆盖
   */
  public subscribe(taskId: string, callbacks?: TaskCallback): void {
    if (!this.wsInstance) {
      this.connect();
    }

    if (callbacks) {
      const existingListener = this.listeners.get(taskId);

      if (existingListener) {
        const mergedCallbacks: any = {};

        const mergeCallback = (
          key: keyof TaskCallback,
          oldCb: any,
          newCb: any
        ) => {
          if (oldCb && newCb) {
            return (...args: any[]) => {
              oldCb(...args);
              newCb(...args);
            };
          }
          return newCb || oldCb;
        };

        const allKeys = new Set([
          ...Object.keys(callbacks),
          ...Object.keys(existingListener),
        ]);

        allKeys.forEach((key) => {
          const k = key as keyof TaskCallback;
          mergedCallbacks[k] = mergeCallback(
            k,
            existingListener[k],
            callbacks[k]
          );
        });

        this.listeners.set(taskId, mergedCallbacks);
      } else {
        this.listeners.set(taskId, callbacks);
      }
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

export default TransferWebSocketService.getInstance();
