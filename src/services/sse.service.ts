import type {
  SSEMessage,
  SSEMessageType,
  SSEProgressData,
  SSEStatusData,
  SSECompleteData,
  SSEErrorData,
} from '@/types/modules/transfer';

/**
 * SSE 消息处理器类型
 */
export type SSEMessageHandler = (message: SSEMessage) => void;

/**
 * SSE 连接状态变化处理器类型
 */
export type SSEConnectionHandler = (connected: boolean) => void;

/**
 * SSE 服务配置
 */
interface SSEServiceConfig {
  /** API 基础 URL */
  baseUrl: string;
  /** SSE 端点路径 */
  endpoint: string;
  /** 重连后是否自动同步任务 */
  syncOnReconnect: boolean;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: SSEServiceConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  endpoint: '/apis/transfer/sse',
  syncOnReconnect: true,
};

// ==================== 静态解析函数 ====================

function parseProgressData(data: Record<string, unknown>): SSEProgressData {
  return {
    uploadedBytes: Number(data.uploadedBytes) || 0,
    totalBytes: Number(data.totalBytes) || 0,
    uploadedChunks: Number(data.uploadedChunks) || 0,
    totalChunks: Number(data.totalChunks) || 0,
  };
}

function parseStatusData(data: Record<string, unknown>): SSEStatusData {
  return {
    status: (data.status as string) || 'idle',
    message: data.message as string | undefined,
  } as SSEStatusData;
}

function parseCompleteData(data: Record<string, unknown>): SSECompleteData {
  return {
    fileId: (data.fileId as string) || '',
    fileName: (data.fileName as string) || '',
    fileSize: Number(data.fileSize) || 0,
  };
}

function parseErrorData(data: Record<string, unknown>): SSEErrorData {
  return {
    code: (data.code as string) || 'UNKNOWN_ERROR',
    message: (data.message as string) || 'Unknown error occurred',
  };
}

/**
 * SSE 服务
 * 负责与后端建立 SSE 连接并接收实时推送消息
 *
 * 实现单例模式，确保每个用户会话只有一个 EventSource 连接
 *
 */
class SSEService {
  /** 单例实例 */
  private static instance: SSEService | null = null;

  /** EventSource 实例 */
  private eventSource: EventSource | null = null;

  /** 当前连接的用户 ID */
  private currentUserId: string | null = null;

  /** 消息处理器列表 */
  private messageHandlers: Set<SSEMessageHandler> = new Set();

  /** 连接状态变化处理器列表 */
  private connectionHandlers: Set<SSEConnectionHandler> = new Set();

  /** 服务配置 */
  private config: SSEServiceConfig;

  /** 是否已连接 */
  private connected = false;

  /** 重连同步回调 */
  private onReconnectSync: (() => Promise<void>) | null = null;

  /**
   * 私有构造函数，防止外部实例化
   */
  private constructor(config: Partial<SSEServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 获取单例实例
   * @param config 可选配置
   * @returns SSEService 实例
   *
   */
  public static getInstance(config?: Partial<SSEServiceConfig>): SSEService {
    if (!SSEService.instance) {
      SSEService.instance = new SSEService(config);
    }
    return SSEService.instance;
  }

  /**
   * 重置单例实例（仅用于测试）
   */
  public static resetInstance(): void {
    if (SSEService.instance) {
      SSEService.instance.disconnect();
      SSEService.instance = null;
    }
  }

  /**
   * 连接 SSE
   * @param userId 用户 ID
   * @param token 可选的认证 token
   *
   */
  public connect(userId: string, token?: string): void {
    // 如果已经连接到同一用户，不重复连接
    if (this.eventSource && this.currentUserId === userId) {
      return;
    }

    // 如果连接到不同用户，先断开
    if (this.eventSource) {
      this.disconnect();
    }

    this.currentUserId = userId;
    
    // 构建 URL，包含 userId 和 token（如果有）
    let url = `${this.config.baseUrl}${this.config.endpoint}?userId=${encodeURIComponent(userId)}`;
    if (token) {
      url += `&token=${encodeURIComponent(token)}`;
    }

    try {
      this.eventSource = new EventSource(url);
      this.setupEventListeners();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[SSE] Failed to create EventSource:', error);
      this.setConnected(false);
    }
  }

  /**
   * 断开 SSE 连接
   */
  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.currentUserId = null;
      this.setConnected(false);
    }
  }

  /**
   * 检查是否已连接
   * @returns 是否已连接
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * 获取当前连接的用户 ID
   * @returns 用户 ID 或 null
   */
  public getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * 注册消息处理器
   * @param handler 消息处理器
   * @returns 取消注册的函数
   *
   */
  public onMessage(handler: SSEMessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * 注册连接状态变化处理器
   * @param handler 连接状态处理器
   * @returns 取消注册的函数
   */
  public onConnectionChange(handler: SSEConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  /**
   * 设置重连后同步回调
   * @param callback 同步回调函数
   *
   */
  public setReconnectSyncCallback(callback: () => Promise<void>): void {
    this.onReconnectSync = callback;
  }

  /**
   * 设置连接状态并通知处理器
   */
  private setConnected(connected: boolean): void {
    const wasConnected = this.connected;
    this.connected = connected;

    // 通知所有连接状态处理器
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[SSE] Connection handler error:', error);
      }
    });

    // 如果从断开变为连接，触发重连同步
    if (!wasConnected && connected && this.config.syncOnReconnect) {
      this.triggerReconnectSync();
    }
  }

  /**
   * 触发重连同步
   */
  private async triggerReconnectSync(): Promise<void> {
    if (this.onReconnectSync) {
      try {
        await this.onReconnectSync();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[SSE] Reconnect sync failed:', error);
      }
    }
  }

  /**
   * 设置 EventSource 事件监听器
   */
  private setupEventListeners(): void {
    if (!this.eventSource) return;

    // 连接打开
    this.eventSource.onopen = () => {
      this.setConnected(true);
    };

    // 连接错误（浏览器会自动重连）
    this.eventSource.onerror = (event) => {
      // eslint-disable-next-line no-console
      console.error('[SSE] Connection error:', event);
      // 只有在 CLOSED 状态时才标记为断开
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.setConnected(false);
      }
    };

    // 监听各种事件类型
    this.eventSource.addEventListener('progress', (event) => {
      this.handleEvent('progress', event);
    });

    this.eventSource.addEventListener('status', (event) => {
      this.handleEvent('status', event);
    });

    this.eventSource.addEventListener('complete', (event) => {
      this.handleEvent('complete', event);
    });

    this.eventSource.addEventListener('error', (event) => {
      // 注意：这里的 error 是业务错误事件，不是连接错误
      if (event instanceof MessageEvent) {
        this.handleEvent('error', event);
      }
    });

    // 通用消息处理（用于未指定事件类型的消息）
    this.eventSource.onmessage = (event) => {
      this.handleGenericMessage(event);
    };
  }

  /**
   * 处理特定类型的事件
   * @param type 事件类型
   * @param event MessageEvent
   */
  private handleEvent(type: SSEMessageType, event: Event): void {
    if (!(event instanceof MessageEvent)) return;

    try {
      const rawData = JSON.parse(event.data);
      const message = this.parseMessage(type, rawData);

      if (message) {
        this.dispatchMessage(message);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[SSE] Failed to parse ${type} event:`, error, event.data);
    }
  }

  /**
   * 处理通用消息（未指定事件类型）
   * @param event MessageEvent
   */
  private handleGenericMessage(event: MessageEvent): void {
    try {
      const rawData = JSON.parse(event.data);

      // 尝试从数据中获取类型
      if (rawData.type && rawData.taskId) {
        const message = this.parseMessage(rawData.type, rawData);
        if (message) {
          this.dispatchMessage(message);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        '[SSE] Failed to parse generic message:',
        error,
        event.data
      );
    }
  }

  /**
   * 解析消息数据
   * @param type 消息类型
   * @param rawData 原始数据
   * @returns 解析后的 SSEMessage 或 null
   *
   */
  private parseMessage(
    type: SSEMessageType,
    rawData: Record<string, unknown>
  ): SSEMessage | null {
    const taskId = rawData.taskId as string;
    if (!taskId) {
      // eslint-disable-next-line no-console
      console.warn('[SSE] Message missing taskId:', rawData);
      return null;
    }

    // 数据可能在 data 字段中，也可能直接在根级别
    const data = (rawData.data as Record<string, unknown>) || rawData;

    switch (type) {
      case 'progress':
        return {
          type: 'progress',
          taskId,
          data: parseProgressData(data),
        };

      case 'status':
        return {
          type: 'status',
          taskId,
          data: parseStatusData(data),
        };

      case 'complete':
        return {
          type: 'complete',
          taskId,
          data: parseCompleteData(data),
        };

      case 'error':
        return {
          type: 'error',
          taskId,
          data: parseErrorData(data),
        };

      default:
        // eslint-disable-next-line no-console
        console.warn('[SSE] Unknown message type:', type);
        return null;
    }
  }

  /**
   * 分发消息给所有处理器
   * @param message SSE 消息
   *
   */
  private dispatchMessage(message: SSEMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[SSE] Message handler error:', error);
      }
    });
  }
}

/**
 * 导出单例实例
 */
export const sseService = SSEService.getInstance();

/**
 * 导出类（用于测试或需要自定义配置的场景）
 */
export { SSEService };

export default sseService;
