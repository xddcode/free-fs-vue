import { request } from '@/api/interceptor';
import {
  StoragePlatformRecord,
  StoragePlatformSettingsRecord,
} from '@/types/modules/storage';

export function getStoragePlatforms(isDefault: number, keywords?: string) {
  return request.get<StoragePlatformRecord[]>('/apis/storage/platforms', {
    params: { isDefault, keywords },
  });
}

export function openOrCancelStoragePlatform(
  identifier: string,
  action: number
) {
  return request.post<number[]>(
    `/apis/storage/platform/${identifier}/${action}`
  );
}

export function getStoragePlatformsSettings(identifier: string) {
  return request.get<StoragePlatformSettingsRecord>(
    `/apis/storage/settings/${identifier}`
  );
}

export function saveOrUpdateStoragePlatformSettings(data: any) {
  return request.post('/apis/storage/settings', data);
}

export function createStoragePlatform(data: any) {
  return request.post('/apis/storage/platform', data);
}

export function updateStoragePlatform(id: string, data: any) {
  return request.put(`/apis/storage/platform/${id}`, data);
}

export function deleteStoragePlatform(id: string) {
  return request.delete(`/apis/storage/platform/${id}`);
}

export function enableStoragePlatform(id: string, enabled: boolean) {
  return request.put(`/apis/storage/platform/${id}/enable`, { enabled });
}
