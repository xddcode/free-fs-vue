import axios from 'axios';
import type { RouteRecordNormalized } from 'vue-router';
import { UserState } from '@/store/modules/user/types';
import qs from 'query-string';
import { RoleParams } from '@/types/modules/role';
import {
  LoginParams,
  LoginRes,
  UserListRes,
  UserPageParams,
  UserParams,
  UserRegisterParams,
} from '@/types/modules/user';

export function login(data: LoginParams) {
  return axios.post<LoginRes>('/apis/auth/login', data);
}

export function register(data: UserRegisterParams) {
  return axios.post('/apis/user/register', data);
}

export function logout() {
  return axios.post('/apis/auth/logout');
}

export function getUserInfo() {
  return axios.get<UserState>('/apis/user/info');
}

export function getMenuList() {
  return axios.post<RouteRecordNormalized[]>('/api/user/menu');
}

export function getUserPages(params: UserPageParams) {
  return axios.get<UserListRes>('/apis/user/pages', {
    params,
    paramsSerializer: (obj) => {
      return qs.stringify(obj);
    },
  });
}

export function editUserStatus(userId: string, status: number) {
  return axios.put('/apis/user/status', { userId, status });
}

export function addUser(params: UserParams) {
  return axios.post('/apis/user', params);
}

export function editUser(params: UserParams) {
  return axios.put('/apis/user', params);
}

export function deleteUser(userId: string) {
  return axios.delete(`/apis/user/${userId}`);
}

export function resetUserPassword(userId: string) {
  return axios.put(`/apis/user/reset-password/${userId}`);
}
