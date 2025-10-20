import MockService from '@/utils/mock';

// 用户信息类型定义
export interface UserInfo {
  id: string;
  username: string;
  nickname: string;
  email: string;
  avatar?: string;
  status: number; // 0: 正常, 1: 禁用
  createdAt: string;
  lastLoginAt?: string;
  storageQuota: {
    total: number; // 总配额（字节）
    used: number; // 已使用（字节）
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: 'zh-CN' | 'en-US';
    defaultView: 'list' | 'grid';
    autoSync: boolean;
  };
}

// 生成模拟用户数据
export const generateMockUser = (): UserInfo => {
  const totalQuota = 100 * 1024 * 1024 * 1024; // 100GB
  const usedQuota = Math.floor(totalQuota * (0.2 + Math.random() * 0.3)); // 20-50% 使用率

  return {
    id: 'user_001',
    username: 'demo_user',
    nickname: '演示用户',
    email: 'demo@example.com',
    avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
    status: 0,
    createdAt: MockService.generateDate(365),
    lastLoginAt: new Date().toISOString(),
    storageQuota: {
      total: totalQuota,
      used: usedQuota,
    },
    preferences: {
      theme: 'light',
      language: 'zh-CN',
      defaultView: 'list',
      autoSync: true,
    },
  };
};

// 用户 API Mock
export const userApi = {
  // 获取用户信息
  async getUserInfo() {
    const user = generateMockUser();
    return MockService.mockResponse(user);
  },

  // 更新用户信息
  async updateUserInfo(data: Partial<UserInfo>) {
    const user = generateMockUser();
    const updatedUser = { ...user, ...data };
    return MockService.mockResponse(updatedUser, true, '用户信息更新成功');
  },

  // 更新用户偏好设置
  async updateUserPreferences(preferences: Partial<UserInfo['preferences']>) {
    const user = generateMockUser();
    const updatedUser = {
      ...user,
      preferences: { ...user.preferences, ...preferences },
    };
    return MockService.mockResponse(updatedUser, true, '偏好设置更新成功');
  },

  // 更新头像
  async updateAvatar() {
    const user = generateMockUser();
    const avatarUrl = `https://avatars.example.com/${MockService.generateId()}.jpg`;

    return MockService.mockResponse(
      {
        ...user,
        avatar: avatarUrl,
      },
      true,
      '头像更新成功'
    );
  },

  // 修改密码
  async changePassword() {
    return MockService.mockResponse(null, true, '密码修改成功');
  },

  // 获取存储配额信息
  async getStorageQuota() {
    const user = generateMockUser();
    return MockService.mockResponse(user.storageQuota);
  },

  // 获取用户统计信息
  async getUserStats() {
    const stats = {
      totalFiles: Math.floor(Math.random() * 10000) + 1000,
      totalFolders: Math.floor(Math.random() * 1000) + 100,
      sharedFiles: Math.floor(Math.random() * 100) + 10,
      lastLoginAt: new Date().toISOString(),
      accountAge: Math.floor(Math.random() * 365) + 30, // 30-395 天
      storageUsed: Math.floor(Math.random() * 50) + 10, // 10-60 GB
      storageTotal: 100, // 100 GB
    };

    return MockService.mockResponse(stats);
  },
};
