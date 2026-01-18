/**
 * 任务状态联合类型（9 种状态）
 * - idle: 空闲，任务刚创建
 * - initialized: 已初始化，准备开始
 * - checking: 校验中，计算 MD5
 * - uploading: 上传中
 * - paused: 已暂停
 * - merging: 合并中，后端合并分片
 * - completed: 已完成
 * - failed: 失败
 * - cancelled: 已取消
 */
export type TaskStatus =
  | 'idle'
  | 'initialized'
  | 'checking'
  | 'uploading'
  | 'paused'
  | 'merging'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * 上传任务状态枚举（保留兼容旧代码）
 * @deprecated 请使用 TaskStatus 类型
 */
// eslint-disable-next-line no-shadow
export enum UploadTaskStatus {
  IDLE = 'idle', // 空闲
  INITIALIZED = 'initialized', // 已初始化
  CHECKING = 'checking', // 校验中
  UPLOADING = 'uploading', // 上传中
  PAUSED = 'paused', // 已暂停
  MERGING = 'merging', // 合并中
  COMPLETED = 'completed', // 已完成
  FAILED = 'failed', // 失败
  CANCELLED = 'cancelled', // 已取消
}

/**
 * 传输任务接口
 * 单个文件传输任务的完整数据结构
 */
export interface TransferTask {
  /** 任务唯一标识 */
  taskId: string;
  /** 文件名 */
  fileName: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 当前状态 */
  status: TaskStatus;
  /** 上传进度 0-100 */
  progress: number;
  /** 已上传字节数 */
  uploadedBytes: number;
  /** 上传速度（字节/秒） */
  speed: number;
  /** 预计剩余时间（秒） */
  remainingTime: number;
  /** 错误信息 */
  errorMessage?: string;
  /** 任务创建时间戳 */
  createdAt: number;
  /** 任务更新时间戳 */
  updatedAt: number;
  /** 父目录 ID */
  parentId?: string;
  /** 文件 MIME 类型 */
  mimeType?: string;
  /** 文件 MD5 */
  fileMd5?: string;
  /** 总分片数 */
  totalChunks?: number;
  /** 已上传分片数 */
  uploadedChunks?: number;
  /** 分片大小 */
  chunkSize?: number;
}

/**
 * 进度更新数据
 */
export interface ProgressUpdate {
  uploadedBytes: number;
  totalBytes: number;
  uploadedChunks?: number;
  totalChunks?: number;
}

// ==================== SSE 相关类型 ====================

/**
 * SSE 消息类型
 */
export type SSEMessageType = 'progress' | 'status' | 'complete' | 'error';

/**
 * SSE 进度数据
 */
export interface SSEProgressData {
  uploadedBytes: number;
  totalBytes: number;
  uploadedChunks: number;
  totalChunks: number;
}

/**
 * SSE 状态变更数据
 */
export interface SSEStatusData {
  status: TaskStatus;
  message?: string;
}

/**
 * SSE 完成数据
 */
export interface SSECompleteData {
  fileId: string;
  fileName: string;
  fileSize: number;
}

/**
 * SSE 错误数据
 */
export interface SSEErrorData {
  code: string;
  message: string;
}

/**
 * SSE 消息联合类型
 */
export type SSEMessageData =
  | SSEProgressData
  | SSEStatusData
  | SSECompleteData
  | SSEErrorData;

/**
 * SSE 消息接口
 */
export interface SSEMessage {
  type: SSEMessageType;
  taskId: string;
  data: SSEMessageData;
}

/**
 * SSE 进度消息
 */
export interface SSEProgressMessage {
  type: 'progress';
  taskId: string;
  data: SSEProgressData;
}

/**
 * SSE 状态消息
 */
export interface SSEStatusMessage {
  type: 'status';
  taskId: string;
  data: SSEStatusData;
}

/**
 * SSE 完成消息
 */
export interface SSECompleteMessage {
  type: 'complete';
  taskId: string;
  data: SSECompleteData;
}

/**
 * SSE 错误消息
 */
export interface SSEErrorMessage {
  type: 'error';
  taskId: string;
  data: SSEErrorData;
}

/**
 * 初始化上传请求参数
 */
export interface InitUploadCmd {
  fileName: string;
  fileSize: number;
  parentId?: string;
  totalChunks: number;
  chunkSize: number;
  mimeType: string;
}

/**
 * 校验上传请求参数
 */
export interface CheckUploadCmd {
  taskId: string;
  fileMd5: string;
  fileName: string;
}

/**
 * 校验上传响应结果
 */
export interface CheckUploadResultVO {
  /**
   * 是否秒传
   */
  isQuickUpload: boolean;

  /**
   * 秒传成功后的文件信息
   */
  fileId?: string;

  /**
   * 任务ID
   */
  taskId: string;

  /**
   * 提示信息
   */
  message?: string;
}

/**
 * 文件传输任务VO
 */
export interface FileTransferTaskVO {
  /**
   * 任务ID
   */
  taskId: string;

  /**
   * 任务类型
   */
  taskType: 'upload' | 'download';

  /**
   * 用户ID
   */
  userId: string;

  /**
   * 父目录ID
   */
  parentId?: string;

  /**
   * 对象key
   */
  objectKey: string;

  /**
   * 文件名
   */
  fileName: string;

  /**
   * 文件大小(字节)
   */
  fileSize: number;

  /**
   * 文件类型(扩展名)
   */
  suffix?: string;

  /**
   * 总分片数
   */
  totalChunks: number;

  /**
   * 已上传分片数
   */
  uploadedChunks: number;

  /**
   * 分片大小
   */
  chunkSize: number;

  /**
   * 存储平台配置ID
   */
  storagePlatformSettingId: string;

  /**
   * 状态
   */
  status: UploadTaskStatus;

  /**
   * 错误信息
   */
  errorMsg?: string;

  /**
   * 开始时间
   */
  startTime?: string;

  /**
   * 完成时间
   */
  completeTime?: string;

  /**
   * 上传进度（计算得出，0-100）
   */
  progress?: number;

  /**
   * 上传速度（字节/秒）
   */
  speed?: number;

  /**
   * 剩余时间（秒）
   */
  remainTime?: number;

  /**
   * 已上传大小（字节）
   */
  uploadedSize?: number;

  /**
   * 完成事件数据（用于轮询检查）
   * 当任务完成时，后端会设置此字段
   * 前端通过轮询检查此字段来判断任务是否完成
   */
  completeEventData?: {
    fileId: string;
    fileName: string;
    fileSize: number;
  };
}
