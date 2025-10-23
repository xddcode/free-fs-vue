/**
 * 用户信息
 */
export interface UserInfo {
  id: string;
  username: string;
  nickname: string;
  email: string;
  avatar: string;
  status: number;
}

/**
 * 登录响应
 */
export interface LoginRes {
  accessToken: string;
  userInfo: UserInfo;
}

/**
 * 登录参数
 */
export interface LoginParams {
  username: string;
  password: string;
  isRemember: boolean;
}

/**
 * 注册参数
 */
export interface UserRegisterParams {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  nickname: string;
  avatar?: string; // 头像，可选
}

/**
 * 忘记密码参数
 */
export interface ForgotPasswordParams {
  mail: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}