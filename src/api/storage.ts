import { request } from '@/api/interceptor';

// 使用原有的类型定义
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
 * 获取存储平台列表（用户视角）
 * @param isDefault 是否默认平台（1=是，0=否）
 * @param keywords 搜索关键词
 */
export function getStoragePlatforms(keywords?: string) {
  return request.get<StoragePlatformRecord[]>('/apis/storage/platforms', {
    params: { keywords },
  });
}

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

/**
 * 获取当前用户已开通且已配置的存储平台列表
 */
export function getActiveStoragePlatforms() {
  return request.get<StoragePlatformRecord[]>('/apis/storage/active-platforms');
}
