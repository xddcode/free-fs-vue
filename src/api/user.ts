import { request } from '@/api/interceptor';
import {
  LoginParams,
  LoginRes,
  UserInfo,
  UserRegisterParams,
  UpdateUserInfoParams,
  ChangeEmailParams,
  SecurityLog,
} from '@/types/modules/user';

/**
 * 用户登录
 */
export function login(data: LoginParams) {
  return request.post<LoginRes>('/apis/auth/login', data);
}

/**
 * 用户注册
 */
export function register(data: UserRegisterParams) {
  return request.post('/apis/user/register', data);
}

/**
 * 用户登出
 */
export function logout() {
  return request.post('/apis/auth/logout');
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return request.get<UserInfo>('/apis/user/info');
}

/**
 * 发送忘记密码验证码
 */
export function sendForgetPasswordCode(mail: string) {
  return request.get(`/apis/user/forget-password/code/${mail}`);
}

/**
 * 忘记密码-修改密码
 */
export function updateForgetPassword(data: {
  mail: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return request.put('/apis/user/forget-password', data);
}

/**
 * 修改密码
 */
export function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return request.put('/apis/user/change-password', data);
}

/**
 * 更新用户信息
 */
export function updateUserInfo(data: UpdateUserInfoParams) {
  return request.put<UserInfo>('/apis/user/info', data);
}

/**
 * 发送修改邮箱验证码
 */
export function sendChangeEmailCode(email: string) {
  return request.get(`/apis/user/change-email/code/${email}`);
}

/**
 * 修改邮箱
 */
export function changeEmail(data: ChangeEmailParams) {
  return request.put('/apis/user/change-email', data);
}

/**
 * 获取安全日志
 */
export function getSecurityLogs(params?: { page?: number; pageSize?: number }) {
  return request.get<{
    list: SecurityLog[];
    total: number;
  }>('/apis/user/security-logs', { params });
}
