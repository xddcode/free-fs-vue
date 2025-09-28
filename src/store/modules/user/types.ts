export type RoleType = '' | '*' | 'admin' | 'user';

export interface UserState {
  id?: number;
  username?: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  status?: number;
  roleCode?: RoleType;
}
