import { request } from '@/api/interceptor';

// 存储平台VO类型定义
export interface StoragePlatformVO {
  id: number;
  name: string;
  identifier: string;
  configScheme: string;
  icon: string;
  link: string;
  desc: string;
  isDefault: number;
}

// 用户存储配置VO类型定义
export interface StorageSettingUserVO {
  id: number;
  storagePlatform: StoragePlatformVO;
  configData: string;
  enabled: number;
  userId: string;
}

// 保持向后兼容的类型定义
export interface StoragePlatformRecord {
  id: number;
  name: string;
  identifier: string;
  configScheme: string;
  icon: string;
  link: string;
  desc: string;
  isEnabled: number;
  isDefault: number;
  isSetting: number;
}

export interface StoragePlatformSettingsRecord {
  id: number;
  platformIdentifier: string;
  configData: string;
  enabled: number;
  userId: string;
}

/**
 * 获取存储平台列表（用于下拉选择）
 */
export function getStoragePlatforms() {
  return request.get<StoragePlatformVO[]>('/apis/storage/platforms');
}

/**
 * 获取用户已配置的存储平台列表
 */
export function getUserStorageSettings() {
  return request.get<StorageSettingUserVO[]>('/apis/storage/platform/settings');
}

/**
 * 添加新的存储平台配置
 * @param data 配置数据
 */
export function addStorageSetting(data: {
  platformId: number;
  configData: string;
}) {
  return request.post('/apis/storage/platform/settings', data);
}

/**
 * 更新存储平台配置
 * @param id 配置ID
 * @param data 配置数据
 */
export function updateStorageSetting(
  id: number,
  data: {
    configData: string;
  }
) {
  return request.put(`/apis/storage/platform/settings/${id}`, data);
}

/**
 * 删除存储平台配置
 * @param id 配置ID
 */
export function deleteStorageSetting(id: number) {
  return request.delete(`/apis/storage/platform/settings/${id}`);
}

/**
 * 启用/禁用存储平台配置
 * @param id 配置ID
 * @param enabled 是否启用
 */
export function toggleStorageSetting(id: number, enabled: number) {
  return request.put(`/apis/storage/platform/settings/${id}/toggle`, {
    enabled,
  });
}

// 保持向后兼容的接口
/**
 * 用户开通或取消开通存储平台
 * @param identifier 平台标识
 * @param action 操作类型（1=开通，0=取消开通）
 */
export function openOrCancelStoragePlatform(
  identifier: string,
  action: number
) {
  return request.post(`/apis/storage/platform/${identifier}/${action}`);
}

/**
 * 获取用户的存储平台配置
 * @param identifier 平台标识
 */
export function getStoragePlatformsSettings(identifier: string) {
  return request.get<StoragePlatformSettingsRecord>(
    `/apis/storage/settings/${identifier}`
  );
}

/**
 * 保存或更新用户的存储平台配置
 * @param data 配置数据
 */
export function saveOrUpdateStoragePlatformSettings(data: {
  identifier: string;
  configData: string;
}) {
  return request.post('/apis/storage/settings', data);
}

// 活跃存储平台类型定义
export interface ActiveStoragePlatform {
  settingId: string;
  platformIdentifier: string;
  platformName: string;
  platformIcon: string;
}

/**
 * 获取当前用户已开通且已配置的存储平台列表
 */
export function getActiveStoragePlatforms() {
  return request.get<ActiveStoragePlatform[]>('/apis/storage/active-platforms');
}
