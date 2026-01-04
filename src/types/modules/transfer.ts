/**
 * 上传任务状态枚举
 */
// eslint-disable-next-line no-shadow
export enum UploadTaskStatus {
  INITIALIZED = 'initialized', // 已初始化
  CHECKING = 'checking', // 校验中
  UPLOADING = 'uploading', // 上传中
  PAUSED = 'paused', // 已暂停
  MERGING = 'merging', // 合并中
  COMPLETED = 'completed', // 已完成
  FAILED = 'failed', // 失败
  CANCELLING = 'cancelling', // 取消中
  CANCELED = 'canceled', // 已取消
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
}
