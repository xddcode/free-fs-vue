import axios from 'axios';
import qs from 'query-string';
import {
  RoleListRes,
  RolePageParams,
  RoleParams,
  RoleRecord,
} from '@/types/modules/role';

export function getRoleList() {
  return axios.get<RoleRecord[]>('/apis/role/list');
}

export function getRolePages(params: RolePageParams) {
  return axios.get<RoleListRes>('/apis/role/pages', {
    params,
    paramsSerializer: (obj) => {
      return qs.stringify(obj);
    },
  });
}

export function getRoleInfo(roleId: number) {
  return axios.get<RoleRecord>(`/apis/role/info/${roleId}`);
}

export function getRoleMenuIds(roleId?: number) {
  return axios.get<number[]>(`/apis/role/${roleId}/menus`);
}

export function addRole(params: RoleParams) {
  return axios.post<RoleParams>('/apis/role', params);
}

export function editRole(params: RoleParams) {
  return axios.put('/apis/role', params);
}

export function deleteRole(roleId: number) {
  return axios.delete(`/apis/role/${roleId}`);
}
