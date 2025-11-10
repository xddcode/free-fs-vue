import { request } from '@/api/interceptor';

// 存储平台类型定义
export interface StoragePlatform {
  id: number;
  name: string;
  identifier: string;
  configScheme: string;
  icon: string;
  link: string;
  desc: string;
  isDefault: number;
}

// 用户存储配置类型定义
export interface StorageSetting {
  id: number;
  storagePlatform: StoragePlatform;
  configData: string;
  enabled: number;
  userId: string;
  remark?: string;
}

/**
 * 获取存储平台列表（用于下拉选择）
 */
export function getStoragePlatforms() {
  return request.get<StoragePlatform[]>('/apis/storage/platforms');
}

/**
 * 获取用户已配置的存储平台列表
 */
export function getUserStorageSettings() {
  return request.get<StorageSetting[]>('/apis/storage/platform/settings');
}

/**
 * 添加新的存储平台配置
 * @param data 配置数据
 */
export function addStorageSetting(data: {
  platformIdentifier: string;
  configData: string;
  remark?: string;
}) {
  return request.post('/apis/storage/settings', data);
}

/**
 * 更新存储平台配置
 * @param data 配置数据
 */
export function updateStorageSetting(data: {
  settingId: string;
  platformIdentifier: string;
  configData: string;
  remark?: string;
}) {
  return request.put('/apis/storage/settings', data);
}

/**
 * 删除存储平台配置
 * @param id 配置ID
 */
export function deleteStorageSetting(id: number) {
  return request.delete(`/apis/storage/settings/${id}`);
}

/**
 * 启用/禁用存储平台配置
 * @param id 配置ID
 * @param action 动作：0禁用，1启用
 */
export function toggleStorageSetting(id: string, action: number) {
  return request.post(`/apis/storage/settings/${id}/${action}`);
}

/**
 * 获取用户的存储平台配置
 * @param identifier 平台标识
 */
export function getStoragePlatformsSettings(identifier: string) {
  return request.get<StorageSetting>(`/apis/storage/settings/${identifier}`);
}

// 活跃存储平台类型定义
export interface ActiveStoragePlatform {
  settingId: string;
  platformIdentifier: string;
  platformName: string;
  platformIcon: string;
  isEnabled: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 获取当前用户已开通且已配置的存储平台列表
 */
export function getActiveStoragePlatforms() {
  return request.get<ActiveStoragePlatform[]>('/apis/storage/active-platforms');
}
