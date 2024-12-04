import axios from 'axios';
import type { RouteRecordNormalized } from 'vue-router';
import { UserState } from '@/store/modules/user/types';
import qs from 'query-string';
import { RoleParams } from '@/types/modules/role';
import { UserParams } from '@/types/modules/user';

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginRes {
  accessToken: string;
}

export interface UserRecord {
  id: string;
  username: string;
  nickname: string;
  email: string;
  roleCode: string;
  avatar: string;
  status: number;
  lastLoginTime: string;
  createTime: string;
  updateTime: string;
}

export interface UserPageParams extends Partial<UserRecord> {
  page: number;
  pageSize: number;
}

export interface UserListRes {
  data: UserRecord[];
  total: number;
}

export function login(data: LoginData) {
  return axios.post<LoginRes>('/apis/auth/login', data);
}

export function logout() {
  return axios.post<LoginRes>('/apis/auth/logout');
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
  return axios.post<RoleParams>('/apis/user', params);
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
