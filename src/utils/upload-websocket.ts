/**
 * WebSocket消息类型定义
 */
interface WebSocketMessage {
  type?:
    | 'progress'
    | 'complete'
    | 'error'
    | 'success'
    | 'pong'
    | 'init_start' // 初始化开始
    | 'init_success' // 初始化成功
    | 'chunk_success'; // 分片上传成功
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
type InitStartCallback = (taskId: string, fileName: string) => void;
type InitSuccessCallback = (taskId: string, task: any) => void;
type ChunkSuccessCallback = (taskId: string, chunkIndex: number) => void;

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

  private onInitStartCallback: InitStartCallback | null = null;

  private onInitSuccessCallback: InitSuccessCallback | null = null;

  private onChunkSuccessCallback: ChunkSuccessCallback | null = null;

  constructor(userId: string, baseUrl?: string) {
    this.userId = userId;
    // 从环境变量获取API地址
    const apiBaseUrl = baseUrl || import.meta.env.VITE_API_BASE_URL || '';
    // 将 http/https 替换为 ws/wss
    const wsUrl = apiBaseUrl
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://');
    this.url = `${wsUrl}/ws/upload?userId=${userId}`;
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
      case 'progress':
        if (message.taskId && message.data && this.onProgressCallback) {
          this.onProgressCallback(message.taskId, message.data);
        }
        break;

      case 'complete':
        if (message.taskId && this.onCompleteCallback) {
          this.onCompleteCallback(
            message.taskId,
            message.data || '',
            message.message || '上传成功'
          );
        }
        break;

      case 'error':
        if (message.taskId && this.onErrorCallback) {
          this.onErrorCallback(message.taskId, message.message || '上传失败');
        }
        break;

      case 'success':
        // 订阅成功的确认消息
        // eslint-disable-next-line no-console
        console.log('[UploadWebSocket] 订阅成功:', message.message);
        break;

      case 'init_start':
        // 初始化开始
        if (message.taskId && this.onInitStartCallback) {
          const fileName = message.data?.fileName || '';
          this.onInitStartCallback(message.taskId, fileName);
        }
        break;

      case 'init_success':
        // 初始化成功
        if (message.taskId && message.data && this.onInitSuccessCallback) {
          this.onInitSuccessCallback(message.taskId, message.data);
        }
        break;

      case 'chunk_success':
        // 分片上传成功
        if (message.taskId && this.onChunkSuccessCallback) {
          const chunkIndex = message.data?.chunkIndex || 0;
          this.onChunkSuccessCallback(message.taskId, chunkIndex);
        }
        break;

      case 'pong':
        // 心跳响应，不需要处理
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
   * 注册初始化开始回调
   */
  onInitStart(callback: InitStartCallback): void {
    this.onInitStartCallback = callback;
  }

  /**
   * 注册初始化成功回调
   */
  onInitSuccess(callback: InitSuccessCallback): void {
    this.onInitSuccessCallback = callback;
  }

  /**
   * 注册分片成功回调
   */
  onChunkSuccess(callback: ChunkSuccessCallback): void {
    this.onChunkSuccessCallback = callback;
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
