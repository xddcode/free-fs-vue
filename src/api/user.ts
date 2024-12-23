import { request } from '@/api/interceptor';
import type { RouteRecordNormalized } from 'vue-router';
import { UserState } from '@/store/modules/user/types';
import qs from 'query-string';
import {
  LoginParams,
  LoginRes,
  UserListRes,
  UserPageParams,
  UserParams,
  UserRegisterParams,
} from '@/types/modules/user';

export function login(data: LoginParams) {
  return request.post<LoginRes>('/apis/auth/login', data);
}

export function register(data: UserRegisterParams) {
  return request.post('/apis/user/register', data);
}

export function logout() {
  return request.post('/apis/auth/logout');
}

export function getUserInfo() {
  return request.get<UserState>('/apis/user/info');
}

export function getMenuList() {
  return request.post<RouteRecordNormalized[]>('/api/user/menu');
}

export function getUserPages(params: UserPageParams) {
  return request.get<UserListRes>('/apis/user/pages', {
    params,
    paramsSerializer: (obj) => {
      return qs.stringify(obj);
    },
  });
}

export function editUserStatus(userId: string, status: number) {
  return request.put('/apis/user/status', { userId, status });
}

export function addUser(params: UserParams) {
  return request.post('/apis/user', params);
}

export function editUser(params: UserParams) {
  return request.put('/apis/user', params);
}

export function deleteUser(userId: string) {
  return request.delete(`/apis/user/${userId}`);
}

export function resetUserPassword(userId: string) {
  return request.put(`/apis/user/reset-password/${userId}`);
}
