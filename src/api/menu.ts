import axios from 'axios';
import { MenuRecord } from '@/types/modules/menu';

export function getMenuTree() {
  return axios.get<MenuRecord[]>('/apis/menu/tree');
}

export function getAllMenuIds() {
  return axios.get<number[]>('/apis/menu/ids');
}
