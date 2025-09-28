import { Pagination } from '../global';

export interface LoginLogRecord {
  id: number;
  userId: string;
  username: string;
  loginIp: string;
  loginAddress: string;
  browser: string;
  os: string;
  status: number;
  msg: string;
  loginTime: string;
}

export interface LoginLogPageRes {
  data: LoginLogRecord[];
  total: number;
}

export interface LoginLogPageParams extends Partial<Pagination> {
  keyword?: string;
  status?: number;
}
