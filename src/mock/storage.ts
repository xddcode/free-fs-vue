import MockService from '@/utils/mock';

// 存储配置类型定义
export interface StorageConfig {
  id: string;
  name: string;
  platform: 'aliyun' | 'tencent' | 'aws' | 'minio' | 'qiniu' | 'huawei';
  description?: string;
  isActive: boolean;
  config: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    region: string;
    endpoint?: string;
    customDomain?: string;
  };
  stats: {
    totalFiles: number;
    totalSize: number;
    usedSize: number;
    lastSyncTime?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// 存储平台信息
export const STORAGE_PLATFORMS = {
  aliyun: {
    name: '阿里云 OSS',
    icon: 'icon-aliyun',
    regions: [
      { value: 'oss-cn-hangzhou', label: '华东1（杭州）' },
      { value: 'oss-cn-shanghai', label: '华东2（上海）' },
      { value: 'oss-cn-beijing', label: '华北1（青岛）' },
      { value: 'oss-cn-shenzhen', label: '华南1（深圳）' },
    ],
    defaultRegion: 'oss-cn-hangzhou',
    endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
  },
  tencent: {
    name: '腾讯云 COS',
    icon: 'icon-tencent',
    regions: [
      { value: 'ap-beijing', label: '北京' },
      { value: 'ap-shanghai', label: '上海' },
      { value: 'ap-guangzhou', label: '广州' },
      { value: 'ap-chengdu', label: '成都' },
    ],
    defaultRegion: 'ap-beijing',
    endpoint: 'https://cos.ap-beijing.myqcloud.com',
  },
  aws: {
    name: 'AWS S3',
    icon: 'icon-aws',
    regions: [
      { value: 'us-east-1', label: '美国东部（弗吉尼亚北部）' },
      { value: 'us-west-2', label: '美国西部（俄勒冈）' },
      { value: 'ap-southeast-1', label: '亚太地区（新加坡）' },
      { value: 'ap-northeast-1', label: '亚太地区（东京）' },
    ],
    defaultRegion: 'us-east-1',
    endpoint: 'https://s3.amazonaws.com',
  },
  minio: {
    name: 'MinIO',
    icon: 'icon-minio',
    regions: [],
    defaultRegion: 'default',
    endpoint: 'http://localhost:9000',
  },
  qiniu: {
    name: '七牛云',
    icon: 'icon-qiniu',
    regions: [
      { value: 'z0', label: '华东' },
      { value: 'z1', label: '华北' },
      { value: 'z2', label: '华南' },
      { value: 'na0', label: '北美' },
    ],
    defaultRegion: 'z0',
    endpoint: 'https://upload-z0.qiniup.com',
  },
  huawei: {
    name: '华为云 OBS',
    icon: 'icon-huawei',
    regions: [
      { value: 'cn-north-4', label: '华北-北京四' },
      { value: 'cn-east-3', label: '华东-上海一' },
      { value: 'cn-south-1', label: '华南-广州' },
      { value: 'ap-southeast-1', label: '亚太-新加坡' },
    ],
    defaultRegion: 'cn-north-4',
    endpoint: 'https://obs.cn-north-4.myhuaweicloud.com',
  },
};

// 生成模拟存储配置数据
export const generateMockStorageConfigs = (): StorageConfig[] => {
  const configs: StorageConfig[] = [];

  // 生成几个示例配置
  const platforms: Array<StorageConfig['platform']> = [
    'aliyun',
    'tencent',
    'aws',
    'minio',
  ];

  platforms.forEach((platform, index) => {
    const platformInfo = STORAGE_PLATFORMS[platform];
    const totalSize = Math.floor(Math.random() * 1000) * 1024 * 1024 * 1024; // GB
    const usedSize = Math.floor(totalSize * (0.3 + Math.random() * 0.4)); // 30-70% 使用率

    configs.push({
      id: `storage_${index + 1}`,
      name: `${platformInfo.name} - 配置${index + 1}`,
      platform,
      description: `这是${platformInfo.name}的存储配置，用于存储个人文件`,
      isActive: index < 2, // 前两个配置启用
      config: {
        accessKey: `AKIA${MockService.generateId()
          .substring(0, 16)
          .toUpperCase()}`,
        secretKey: `***${MockService.generateId().substring(0, 8)}***`,
        bucket: `my-bucket-${index + 1}`,
        region: platformInfo.defaultRegion,
        endpoint: platformInfo.endpoint,
        customDomain: index === 0 ? `cdn.example.com` : undefined,
      },
      stats: {
        totalFiles: Math.floor(Math.random() * 1000) + 100,
        totalSize,
        usedSize,
        lastSyncTime: MockService.generateDate(7),
      },
      createdAt: MockService.generateDate(90),
      updatedAt: MockService.generateDate(7),
    });
  });

  return configs;
};

// 存储配置 API Mock
export const storageApi = {
  // 获取存储配置列表
  async getStorageConfigs() {
    const configs = generateMockStorageConfigs();
    return MockService.mockResponse(configs);
  },

  // 获取单个存储配置
  async getStorageConfig(id: string) {
    const configs = generateMockStorageConfigs();
    const config = configs.find((c) => c.id === id);

    if (!config) {
      return MockService.mockResponse(null, false, '配置不存在');
    }

    return MockService.mockResponse(config);
  },

  // 创建存储配置
  async createStorageConfig(data: Partial<StorageConfig>) {
    if (!data.platform) {
      return MockService.mockResponse(null, false, '缺少平台信息');
    }

    const platformInfo = STORAGE_PLATFORMS[data.platform];
    const newConfig: StorageConfig = {
      id: MockService.generateId(),
      name: data.name || `${platformInfo.name} - 新配置`,
      platform: data.platform,
      description: data.description,
      isActive: true,
      config: {
        accessKey: data.config?.accessKey || '',
        secretKey: data.config?.secretKey || '',
        bucket: data.config?.bucket || '',
        region: data.config?.region || platformInfo.defaultRegion,
        endpoint: data.config?.endpoint || platformInfo.endpoint,
        customDomain: data.config?.customDomain,
      },
      stats: {
        totalFiles: 0,
        totalSize: 0,
        usedSize: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return MockService.mockResponse(newConfig, true, '存储配置创建成功');
  },

  // 更新存储配置
  async updateStorageConfig(id: string, data: Partial<StorageConfig>) {
    const configs = generateMockStorageConfigs();
    const config = configs.find((c) => c.id === id);

    if (!config) {
      return MockService.mockResponse(null, false, '配置不存在');
    }

    const updatedConfig = {
      ...config,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return MockService.mockResponse(updatedConfig, true, '存储配置更新成功');
  },

  // 删除存储配置
  async deleteStorageConfig() {
    return MockService.mockResponse(null, true, '存储配置删除成功');
  },

  // 启用/禁用存储配置
  async toggleStorageConfig(id: string, isActive: boolean) {
    const configs = generateMockStorageConfigs();
    const config = configs.find((c) => c.id === id);

    if (!config) {
      return MockService.mockResponse(null, false, '配置不存在');
    }

    config.isActive = isActive;
    config.updatedAt = new Date().toISOString();

    return MockService.mockResponse(
      config,
      true,
      `存储配置已${isActive ? '启用' : '禁用'}`
    );
  },

  // 测试存储配置连接
  async testStorageConfig() {
    // 模拟连接测试
    const success = Math.random() > 0.1; // 90% 成功率

    if (success) {
      return MockService.mockResponse(
        {
          connected: true,
          message: '连接测试成功',
          bucketExists: true,
          canRead: true,
          canWrite: true,
        },
        true,
        '连接测试成功'
      );
    }
    return MockService.mockResponse(
      {
        connected: false,
        message: '连接失败，请检查配置信息',
        bucketExists: false,
        canRead: false,
        canWrite: false,
      },
      false,
      '连接测试失败'
    );
  },

  // 获取存储统计信息
  async getStorageStats() {
    const configs = generateMockStorageConfigs();
    const activeConfigs = configs.filter((c) => c.isActive);

    const totalStats = activeConfigs.reduce(
      (acc, config) => {
        acc.totalFiles += config.stats.totalFiles;
        acc.totalSize += config.stats.totalSize;
        acc.usedSize += config.stats.usedSize;
        return acc;
      },
      { totalFiles: 0, totalSize: 0, usedSize: 0 }
    );

    return MockService.mockResponse({
      ...totalStats,
      configCount: configs.length,
      activeConfigCount: activeConfigs.length,
      lastSyncTime: new Date().toISOString(),
    });
  },
};
