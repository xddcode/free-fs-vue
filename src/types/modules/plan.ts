import { Pagination } from '../global';

export interface PlanRecord {
  id: number;
  planCode: string;
  planName: string;
  description: string;
  storageQuotaGb: number;
  maxFiles: number;
  maxFileSize: number;
  bandwidthQuota: number;
  price: number;
  isActive: number;
  isDefault: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanPageRes {
  data: PlanRecord[];
  total: number;
}

export interface PlanPageParams extends Partial<Pagination> {
  planName?: string;
}

export interface PlanParams {
  id?: number;
  planCode: string;
  planName: string;
  description: string;
  storageQuotaGb?: number;
  maxFiles?: number;
  maxFileSize?: number;
  bandwidthQuota?: number;
  price?: number;
  isActive: number;
  isDefault: number;
  sortOrder?: number;
}
