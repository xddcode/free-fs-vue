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

export interface LoginRes {
  accessToken: string;
}

export interface UserPageParams extends Partial<UserRecord> {
  page: number;
  pageSize: number;
}

export interface UserListRes {
  data: UserRecord[];
  total: number;
}

export interface LoginParams {
  username: string;
  password: string;
  isRemember: boolean;
}

export interface UserParams {
  id?: string;
  username: string;
  email: string;
  nickname: string;
  roleCode: string;
}

export interface UserRegisterParams {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  nickname: string;
}
