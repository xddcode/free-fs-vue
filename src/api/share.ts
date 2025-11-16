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
 * 分享
 */
export function shareFiles(fileIds: string[], expireDays?: number) {
  return request.post('/apis/share/create', { fileIds, expireDays });
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
