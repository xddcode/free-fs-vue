import axios from 'axios';
import {
  StoragePlatformRecord,
  StoragePlatformSettingsRecord,
} from '@/types/modules/storage';

export function getStoragePlatforms(isDefault: number, keywords?: string) {
  return axios.get<StoragePlatformRecord[]>('/apis/storage/platforms', {
    params: { isDefault, keywords },
  });
}

export function openOrCancelStoragePlatform(
  identifier: string,
  action: number
) {
  return axios.post<number[]>(`/apis/storage/platform/${identifier}/${action}`);
}

export function getStoragePlatformsSettings(identifier: string) {
  return axios.get<StoragePlatformSettingsRecord>(
    `/apis/storage/settings/${identifier}`
  );
}

export function saveOrUpdateStoragePlatformSettings(data: any) {
  return axios.post('/apis/storage/settings', data);
}
