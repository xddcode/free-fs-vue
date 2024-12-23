import { request } from '@/api/interceptor';
import qs from 'query-string';
import {
  RoleListRes,
  RolePageParams,
  RoleParams,
  RoleRecord,
} from '@/types/modules/role';

export function getRoleList() {
  return request.get<RoleRecord[]>('/apis/role/list');
}

export function getRolePages(params: RolePageParams) {
  return request.get<RoleListRes>('/apis/role/pages', {
    params,
    paramsSerializer: (obj) => {
      return qs.stringify(obj);
    },
  });
}

export function getRoleInfo(roleId: number) {
  return request.get<RoleRecord>(`/apis/role/info/${roleId}`);
}

export function getRoleMenuIds(roleId?: number) {
  return request.get<number[]>(`/apis/role/${roleId}/menus`);
}

export function addRole(params: RoleParams) {
  return request.post<RoleParams>('/apis/role', params);
}

export function editRole(params: RoleParams) {
  return request.put('/apis/role', params);
}

export function deleteRole(roleId: number) {
  return request.delete(`/apis/role/${roleId}`);
}
