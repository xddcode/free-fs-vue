export interface UserState {
  id?: string;
  username?: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  status?: number;
  createdAt?: string; // 注册时间
  updatedAt?: string; // 更新时间
  lastLoginAt?: string; // 最后登录时间
}
