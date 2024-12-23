import { request } from '@/api/interceptor';
import { MenuRecord } from '@/types/modules/menu';

export function getMenuTree() {
  return request.get<MenuRecord[]>('/apis/menu/tree');
}

export function getAllMenuIds() {
  return request.get<number[]>('/apis/menu/ids');
}
