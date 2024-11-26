export interface RoleRecord {
  id: number;
  roleCode: string;
  roleName: string;
  createTime: string;
  updateTime: string;
}

export interface RolePageParams extends Partial<RoleRecord> {
  page: number;
  pageSize: number;
}

export interface RoleListRes {
  data: RoleRecord[];
  total: number;
}

export interface RoleParams {
  id?: number;
  roleCode: string;
  roleName: string;
  menuIds: number[];
}
