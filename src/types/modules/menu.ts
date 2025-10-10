export interface MenuRecord {
  id: number;
  pid: number;
  name: string;
  path: string;
  title: string;
  icon: string;
  component: string;
  type: number;
  order: number;
  ignoreCache: number;
  requiresAuth: number;
  roles: string;
  permission: string;
  children: MenuRecord[];
  createdAt: string;
  updatedAt: string;
}
