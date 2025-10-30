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
 * 分享列表查询参数
 */
export interface ShareListQuery extends PageQuery {
  /** 分享名称关键词 */
  keyword?: string;
}
