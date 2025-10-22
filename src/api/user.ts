import { request } from '@/api/interceptor';
import {
  LoginParams,
  LoginRes,
  UserInfo,
  UserRegisterParams,
  ForgotPasswordParams,
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
export function updateForgetPassword(data: { mail: string; code: string; newPassword: string; confirmPassword: string }) {
  return request.put('/apis/user/forget-password', data);
}