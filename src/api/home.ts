import { request } from '@/api/interceptor';
import type { FileItem } from '@/types/modules/file';

export interface HomeInfo {
  fileCount: number;
  directoryCount: number;
  favoriteCount: number;
  shareCount: number;
  usedStorage: number;
  recentFiles: FileItem[];
}

export function getHomeInfo() {
  return request.get<HomeInfo>('/apis/home/info');
}
