import axios from 'axios';
import { StoragePlatformRecord } from '@/types/modules/storage';

export function getStoragePlatforms(isDefault: number, keywords?: string) {
  return axios.get<StoragePlatformRecord[]>('/apis/storage/platforms', {
    params: { isDefault, keywords },
  });
}

export function openOrCancelStoragePlatform(
  identifier: string,
  action: number
) {
  return axios.get<number[]>(`/apis/storage/platform/${identifier}/${action}`);
}
