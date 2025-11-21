/**
 * WebSocket消息类型定义
 */
interface WebSocketMessage {
  type?:
    | 'success' // 成功消息（如订阅成功）
    | 'error' // 错误消息
    | 'pong' // 心跳响应
    | 'initialized' // 任务初始化成功
    | 'checking' // 文件校验中
    | 'quick_upload' // 秒传成功
    | 'ready_to_upload' // 准备上传（校验完成，非秒传）
    | 'progress' // 上传进度
    | 'paused' // 已暂停
    | 'resumed' // 已继续
    | 'merging' // 合并中
    | 'complete' // 上传完成
    | 'cancelling' // 取消中
    | 'cancelled'; // 已取消
  action?: 'subscribe' | 'unsubscribe' | 'ping';
  taskId?: string;
  data?: any;
  message?: string;
}

/**
 * 进度数据接口
 */
export interface ProgressData {
  uploadedChunks: number;
  totalChunks: number;
  uploadedSize: number;
  totalSize: number;
  progress: number;
  speed: number; // 字节/秒
  remainTime: number; // 剩余秒数
}

/**
 * 事件回调类型
 */
type ProgressCallback = (taskId: string, data: ProgressData) => void;
type CompleteCallback = (
  taskId: string,
  fileId: string,
  message: string
) => void;
type ErrorCallback = (taskId: string, message: string) => void;
type ConnectCallback = () => void;
type InitializedCallback = (taskId: string, message: string) => void;
type CheckingCallback = (taskId: string, message: string) => void;
type QuickUploadCallback = (taskId: string, fileId: string) => void;
type ReadyToUploadCallback = (taskId: string, uploadId: string) => void;
type PausedCallback = (taskId: string, message: string) => void;
type ResumedCallback = (taskId: string, uploadedChunks: number[]) => void;
type MergingCallback = (taskId: string, message: string) => void;
type CancellingCallback = (taskId: string, message: string) => void;
type CancelledCallback = (taskId: string, message: string) => void;

/**
 * WebSocket上传管理类
 * 负责WebSocket连接、心跳、消息处理和事件回调
 */
export class UploadWebSocket {
  private ws: WebSocket | null = null;

  private userId: string;

  private url: string;

  private heartbeatTimer: number | null = null;

  private reconnectTimer: number | null = null;

  private reconnectAttempts = 0;

  private maxReconnectAttempts = 5;

  private isManualClose = false;

  // 事件回调
  private onProgressCallback: ProgressCallback | null = null;

  private onCompleteCallback: CompleteCallback | null = null;

  private onErrorCallback: ErrorCallback | null = null;

  private onConnectCallback: ConnectCallback | null = null;

  private onInitializedCallback: InitializedCallback | null = null;

  private onCheckingCallback: CheckingCallback | null = null;

  private onQuickUploadCallback: QuickUploadCallback | null = null;

  private onReadyToUploadCallback: ReadyToUploadCallback | null = null;

  private onPausedCallback: PausedCallback | null = null;

  private onResumedCallback: ResumedCallback | null = null;

  private onMergingCallback: MergingCallback | null = null;

  private onCancellingCallback: CancellingCallback | null = null;

  private onCancelledCallback: CancelledCallback | null = null;

  /**
   * 构建websocket
   * @param userId
   */
  constructor(userId: string) {
    this.userId = userId;
    // 从环境变量获取API地址，直接使用服务端地址
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    // 将 http/https 转换为 ws/wss
    const wsUrl = apiBaseUrl.replace(/^https?:\/\//, (match) => {
      return match === 'https://' ? 'wss://' : 'ws://';
    });
    const socketUrl = `${wsUrl}/ws/upload`;
    this.url = `${socketUrl}?userId=${userId}`;
  }

  /**
   * 连接WebSocket
   */
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.isManualClose = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        // eslint-disable-next-line no-console
        console.log('[UploadWebSocket] 连接成功');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        if (this.onConnectCallback) {
          this.onConnectCallback();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[UploadWebSocket] 消息解析失败:', error);
        }
      };

      this.ws.onerror = (error) => {
        // eslint-disable-next-line no-console
        console.error('[UploadWebSocket] 连接错误:', error);
      };

      this.ws.onclose = () => {
        // eslint-disable-next-line no-console
        console.log('[UploadWebSocket] 连接关闭');
        this.stopHeartbeat();

        // 如果不是手动关闭，尝试重连
        if (
          !this.isManualClose &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.reconnect();
        }
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[UploadWebSocket] 连接失败:', error);
      this.reconnect();
    }
  }

  /**
   * 重连
   */
  private reconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * 2 ** (this.reconnectAttempts - 1), 30000);

    // eslint-disable-next-line no-console
    console.log(
      `[UploadWebSocket] ${delay}ms后尝试第${this.reconnectAttempts}次重连...`
    );

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * 处理WebSocket消息
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'success':
        // 订阅成功的确认消息
        // eslint-disable-next-line no-console
        console.log('[UploadWebSocket] 订阅成功:', message.message);
        break;

      case 'error':
        if (message.taskId && this.onErrorCallback) {
          this.onErrorCallback(message.taskId, message.message || '上传失败');
        }
        break;

      case 'pong':
        // 心跳响应，不需要处理
        break;

      case 'initialized':
        // 任务初始化成功
        if (message.taskId && this.onInitializedCallback) {
          this.onInitializedCallback(
            message.taskId,
            message.message || '任务创建成功'
          );
        }
        break;

      case 'checking':
        // 文件校验中
        if (message.taskId && this.onCheckingCallback) {
          this.onCheckingCallback(
            message.taskId,
            message.message || '正在校验文件...'
          );
        }
        break;

      case 'quick_upload':
        // 秒传成功
        if (message.taskId && this.onQuickUploadCallback) {
          this.onQuickUploadCallback(message.taskId, message.data || '');
        }
        break;

      case 'ready_to_upload':
        // 准备上传（校验完成，非秒传）
        if (message.taskId && this.onReadyToUploadCallback) {
          this.onReadyToUploadCallback(message.taskId, message.data || '');
        }
        break;

      case 'progress':
        // 上传进度
        if (message.taskId && message.data && this.onProgressCallback) {
          this.onProgressCallback(message.taskId, message.data);
        }
        break;

      case 'paused':
        // 已暂停
        if (message.taskId && this.onPausedCallback) {
          this.onPausedCallback(
            message.taskId,
            message.message || '上传已暂停'
          );
        }
        break;

      case 'resumed':
        // 已继续
        if (message.taskId && this.onResumedCallback) {
          this.onResumedCallback(message.taskId, message.data || []);
        }
        break;

      case 'merging':
        // 合并中
        if (message.taskId && this.onMergingCallback) {
          this.onMergingCallback(
            message.taskId,
            message.message || '正在合并文件...'
          );
        }
        break;

      case 'complete':
        // 上传完成
        if (message.taskId && this.onCompleteCallback) {
          this.onCompleteCallback(
            message.taskId,
            message.data || '',
            message.message || '上传完成'
          );
        }
        break;

      case 'cancelling':
        // 取消中
        if (message.taskId && this.onCancellingCallback) {
          this.onCancellingCallback(
            message.taskId,
            message.message || '正在取消...'
          );
        }
        break;

      case 'cancelled':
        // 已取消
        if (message.taskId && this.onCancelledCallback) {
          this.onCancelledCallback(
            message.taskId,
            message.message || '上传已取消'
          );
        }
        break;

      default:
        // eslint-disable-next-line no-console
        console.warn('[UploadWebSocket] 未知消息类型:', message);
    }
  }

  /**
   * 发送消息
   */
  private send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // eslint-disable-next-line no-console
      console.warn('[UploadWebSocket] WebSocket未连接，无法发送消息');
    }
  }

  /**
   * 订阅任务进度
   */
  subscribe(taskId: string): void {
    this.send({
      action: 'subscribe',
      taskId,
    });
  }

  /**
   * 取消订阅
   */
  unsubscribe(taskId: string): void {
    this.send({
      action: 'unsubscribe',
      taskId,
    });
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      this.send({ action: 'ping' });
    }, 30000); // 30秒一次
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 关闭连接
   */
  close(): void {
    this.isManualClose = true;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 注册进度回调
   */
  onProgress(callback: ProgressCallback): void {
    this.onProgressCallback = callback;
  }

  /**
   * 注册完成回调
   */
  onComplete(callback: CompleteCallback): void {
    this.onCompleteCallback = callback;
  }

  /**
   * 注册错误回调
   */
  onError(callback: ErrorCallback): void {
    this.onErrorCallback = callback;
  }

  /**
   * 注册连接成功回调
   */
  onConnect(callback: ConnectCallback): void {
    this.onConnectCallback = callback;
  }

  /**
   * 注册任务初始化成功回调
   */
  onInitialized(callback: InitializedCallback): void {
    this.onInitializedCallback = callback;
  }

  /**
   * 注册文件校验中回调
   */
  onChecking(callback: CheckingCallback): void {
    this.onCheckingCallback = callback;
  }

  /**
   * 注册秒传成功回调
   */
  onQuickUpload(callback: QuickUploadCallback): void {
    this.onQuickUploadCallback = callback;
  }

  /**
   * 注册准备上传回调
   */
  onReadyToUpload(callback: ReadyToUploadCallback): void {
    this.onReadyToUploadCallback = callback;
  }

  /**
   * 注册已暂停回调
   */
  onPaused(callback: PausedCallback): void {
    this.onPausedCallback = callback;
  }

  /**
   * 注册已继续回调
   */
  onResumed(callback: ResumedCallback): void {
    this.onResumedCallback = callback;
  }

  /**
   * 注册合并中回调
   */
  onMerging(callback: MergingCallback): void {
    this.onMergingCallback = callback;
  }

  /**
   * 注册取消中回调
   */
  onCancelling(callback: CancellingCallback): void {
    this.onCancellingCallback = callback;
  }

  /**
   * 注册已取消回调
   */
  onCancelled(callback: CancelledCallback): void {
    this.onCancelledCallback = callback;
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
