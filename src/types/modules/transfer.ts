/**
 * 上传任务状态枚举
 */
// eslint-disable-next-line no-shadow
export enum UploadTaskStatus {
  UPLOADING = 'uploading', // 上传中
  PAUSED = 'paused', // 已暂停
  COMPLETED = 'completed', // 已完成
  FAILED = 'failed', // 失败
  CANCELED = 'canceled', // 已取消
}

/**
 * 文件上传任务VO
 */
export interface FileUploadTaskVO {
  /**
   * 任务ID
   */
  taskId: string;

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
