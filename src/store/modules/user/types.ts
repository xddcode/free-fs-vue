export type RoleType = '' | '*' | 'admin' | 'normal';

export interface UserState {
  id?: number;
  username?: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  status?: number;
  roleCode?: RoleType;
}
