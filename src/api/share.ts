import { request } from '@/api/interceptor';
import type { PageResult } from '@/types/global';
import type { ShareItem, ShareListQuery } from '@/types/modules/share';

/**
 * 分页获取我的分享列表
 */
export function getMyShareList(params: ShareListQuery) {
  return request.get<PageResult<ShareItem>>('/apis/share/pages', {
    params,
  });
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
 * 分享
 */
export function shareFiles(params: ShareCreateParams) {
  return request.post<ShareCreateResponse>('/apis/share/create', params);
}

/**
 * 取消分享
 */
export function cancelShare(shareId: string) {
  return request.put(`/apis/share/${shareId}/cancel`);
}

/**
 * 查看分享详情
 */
export function getShareDetail(shareId: string) {
  return request.get<ShareItem>(`/apis/share/${shareId}`);
}
