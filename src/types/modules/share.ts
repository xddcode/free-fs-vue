import type { PageQuery } from '../global';

/**
 * 文件分享信息
 */
export interface ShareItem {
  /** 分享ID（用于唯一标识） */
  id: string;
  /** 分享名称 */
  shareName: string;
  /** 分享链接 */
  shareUrl: string | null;
  /** 提取码 */
  shareCode: string | null;
  /** 过期时间 */
  expireTime: string | null;
  /** 是否永久有效 */
  isPermanent: boolean | null;
  /** 查看次数 */
  viewCount: number;
  /** 下载次数 */
  downloadCount: number;
  /** 最大查看次数 */
  maxViewCount: number;
  /** 最大下载次数 */
  maxDownloadCount: number;
  /** 文件数量 */
  fileCount?: number;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 分享简要信息
 */
export interface ShareThin {
  /** 分享ID（用于唯一标识） */
  id: string;
  /** 分享名称 */
  shareName: string;
  /** 过期时间 */
  expireTime: string | null;
  /** 文件数量 */
  fileCount?: number;
  /** 是否有验证码 */
  hasCheckCode: boolean;
  /** 是否已过期 */
  isExpire: boolean;
}

/**
 * 分享列表查询参数
 */
export interface ShareListQuery extends PageQuery {
  /** 分享名称关键词 */
  keyword?: string;
}

/**
 * 分享创建参数
 */
export interface ShareCreateParams {
  /** 文件ID列表（支持多个文件/文件夹） */
  fileIds: string[];
  /** 分享名称（可选，默认取第一个文件名） */
  shareName?: string;
  /** 有效期类型：1-1天 2-7天 3-30天 4-自定义 null-永久 */
  expireType?: number | null;
  /** 自定义有效期（可选） */
  expireTime?: string;
  /** 是否需要提取码 */
  needShareCode?: boolean;
  /** 最大查看次数（可选） */
  maxViewCount?: number;
  /** 最大下载次数（可选） */
  maxDownloadCount?: number;
}

/**
 * 分享创建响应
 */
export interface ShareCreateResponse {
  /** 分享ID */
  id: string;
  /** 分享名称 */
  shareName: string;
  /** 分享链接 */
  shareUrl: string;
  /** 提取码 */
  shareCode: string | null;
  /** 过期时间 */
  expireTime: string | null;
  /** 是否永久有效 */
  isPermanent: boolean;
  /** 查看次数 */
  viewCount: number;
  /** 下载次数 */
  downloadCount: number;
  /** 最大查看次数 */
  maxViewCount: number | null;
  /** 最大下载次数 */
  maxDownloadCount: number | null;
  /** 文件数量 */
  fileCount: number;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 分享验证参数
 */
export interface ShareValidParams {
  /** 分享ID */
  shareId: string;
  /** 分享码 */
  shareCode: string | null;
}

/**
 * 分享查询参数
 */
export interface ShareQryParams {
  /** 分享ID */
  shareId: string;
  /** 父级目录ID */
  parentId: string;
}
