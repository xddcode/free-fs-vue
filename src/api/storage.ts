import axios from 'axios';
import { StoragePlatformRecord } from '@/types/modules/storage';

export function getStoragePlatforms(isDefault: number) {
  return axios.get<StoragePlatformRecord[]>('/apis/storage/platforms', {
    params: { isDefault },
  });
}

export function getAllMenuIds() {
  return axios.get<number[]>('/apis/menu/ids');
}
