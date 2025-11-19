import { request } from '@/api/interceptor';
import type { PageResult } from '@/types/global';
import type {
  ShareItem,
  ShareListQuery,
  ShareThin,
  ShareCreateParams,
  ShareCreateResponse,
  ShareValidParams,
  ShareQryParams,
} from '@/types/modules/share';
import type { FileItem } from '@/types/modules/file';

/**
 * 分页获取我的分享列表
 */
export function getMyShareList(params: ShareListQuery) {
  return request.get<PageResult<ShareItem>>('/apis/share/pages', {
    params,
  });
}

/**
 * 创建分享
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
  return request.get<ShareThin>(`/apis/share/${shareId}/info`);
}

/**
 * 验证分享码
 */
export function validateShareCode(params: ShareValidParams) {
  return request.post<boolean>('/apis/share/verify/code', params);
}

/**
 * 获取分享文件列表
 */
export function getShareItemList(params: ShareQryParams) {
  return request.get<FileItem[]>(`/apis/share/items`, {
    params,
  });
}
