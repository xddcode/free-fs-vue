/**
 * 文件信息
 */
export interface FileItem {
  /** 文件ID */
  id: string;
  /** 资源名称 */
  objectKey: string;
  /** 资源原始名称 */
  originalName: string;
  /** 资源别名（显示名称） */
  displayName: string;
  /** 后缀名 */
  suffix: string;
  /** 文件大小（字节） */
  size: number;
  /** MIME类型 */
  mimeType: string;
  /** 是否目录 */
  isDir: boolean;
  /** 父目录ID */
  parentId?: string;
  /** 用户ID */
  userId: string;
  /** 上传时间 */
  uploadTime: string;
  /** 修改时间 */
  updateTime: string;
  /** 最近访问时间 */
  lastAccessTime?: string;
  /** 是否已收藏 */
  isFavorite?: boolean;
}

/**
 * 回收站文件信息
 */
export interface FileRecycleItem {
  /** 文件ID */
  id: string;
  /** 资源别名（显示名称） */
  displayName: string;
  /** 后缀名 */
  suffix: string;
  /** 文件大小（字节） */
  size: number;
  /** 是否目录 */
  isDir: boolean;
  /** 删除时间 */
  deletedTime: string;
}

/**
 * 文件类型枚举
 */
export type FileType =
  | 'image' // 图片
  | 'video' // 视频
  | 'audio' // 音频
  | 'document' // 文档
  | 'other'; // 其他

/**
 * 排序方向
 */
export type SortOrder = 'ASC' | 'DESC';

/**
 * 文件列表查询参数
 */
export interface FileListParams {
  /** 排序字段 */
  orderBy?: string;
  /** 排序方向 */
  orderDirection?: SortOrder;
  /** 父目录ID（空表示根目录） */
  parentId?: string;
  /** 文件名关键词（搜索用） */
  keyword?: string;
  /** 文件类型过滤 */
  fileType?: FileType;
  /** 是否收藏 */
  isFavorite?: boolean;
  /** 是否最近使用 */
  isRecents?: boolean;
  /** 是否目录 */
  isDir?: boolean;
}
