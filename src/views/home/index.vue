<template>
  <div class="home-container">
    <!-- 顶部欢迎区域 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1>欢迎使用个人云盘</h1>
          <p>安全存储，随时随地访问您的文件</p>
        </div>
        <div class="welcome-actions">
          <a-button type="primary" size="large" @click="goToFiles">
            <template #icon>
              <icon-folder />
            </template>
            管理文件
          </a-button>
          <a-button size="large" @click="handleUpload">
            <template #icon>
              <icon-upload />
            </template>
            上传文件
          </a-button>
        </div>
      </div>
    </div>

    <!-- 存储统计卡片 -->
    <div class="storage-stats">
      <a-card class="stats-card" :bordered="false">
        <div class="stats-header">
          <h3>存储空间</h3>
          <a-link @click="goToStorage">管理存储 <icon-right /></a-link>
        </div>
        <div class="storage-info">
          <div class="storage-chart">
            <a-progress
              :percent="storagePercent"
              :stroke-width="12"
              :show-text="false"
              :color="{
                '0%': '#165DFF',
                '100%': '#722ED1',
              }"
            />
          </div>
          <div class="storage-details">
            <div class="storage-used">
              <span class="value">{{ formatSize(usedStorage) }}</span>
              <span class="label">已使用</span>
            </div>
            <div class="storage-total">
              <span class="value">{{ formatSize(MAX_STORAGE) }}</span>
              <span class="label">总容量</span>
            </div>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 快速统计 -->
    <div class="quick-stats">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card class="stat-item" :bordered="false" @click="goToFiles">
            <div class="stat-icon files">
              <icon-file />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ fileCount }}</div>
              <div class="stat-label">文件数量</div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-item" :bordered="false" @click="goToFiles">
            <div class="stat-icon folders">
              <icon-folder />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ directoryCount }}</div>
              <div class="stat-label">文件夹</div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-item" :bordered="false" @click="goToShares">
            <div class="stat-icon shared">
              <icon-share-alt />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ shareCount }}</div>
              <div class="stat-label">已分享</div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-item" :bordered="false" @click="goToFavorites">
            <div class="stat-icon recent">
              <icon-star />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ favoriteCount }}</div>
              <div class="stat-label">已收藏</div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 最近使用 -->
    <div class="recent-section">
      <div class="section-header">
        <h3>最近使用</h3>
        <a-link @click="goToFiles">查看全部 <icon-right /></a-link>
      </div>
      <LoadingSpinner :loading="loading" :size="150">
        <div v-if="recentFiles.length > 0" class="recent-files">
          <div
            v-for="file in recentFiles"
            :key="file.id"
            class="file-card"
            @dblclick="handleFileDoubleClick(file)"
          >
            <div class="file-icon">
              <img
                :src="getFileIconPath(file.isDir ? 'dir' : file.suffix || '')"
                :alt="file.displayName"
                class="file-icon-img"
              />
            </div>
            <div class="file-info">
              <div class="file-name">{{ file.displayName }}</div>
              <div class="file-meta">
                {{ formatSize(file.size) }} ·
                {{ formatTime(file.lastAccessTime || file.updateTime) }}
              </div>
            </div>
          </div>
        </div>
        <a-empty v-else description="暂无最近使用的文件">
          <a-button type="primary" @click="goToFiles">开始使用</a-button>
        </a-empty>
      </LoadingSpinner>
    </div>

    <!-- 功能特性 -->
    <div class="features-section">
      <div class="section-header">
        <h3>功能特性</h3>
      </div>
      <a-row :gutter="16">
        <a-col :span="8">
          <div class="feature-card">
            <div class="feature-icon">
              <icon-safe />
            </div>
            <h4>安全可靠</h4>
            <p>采用企业级加密技术，多重备份机制，确保您的数据安全</p>
          </div>
        </a-col>
        <a-col :span="8">
          <div class="feature-card">
            <div class="feature-icon">
              <icon-cloud />
            </div>
            <h4>多端同步</h4>
            <p>支持多设备自动同步，随时随地访问您的文件</p>
          </div>
        </a-col>
        <a-col :span="8">
          <div class="feature-card">
            <div class="feature-icon">
              <icon-thunderbolt />
            </div>
            <h4>极速传输</h4>
            <p>采用P2P加速技术，上传下载速度更快</p>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { Message } from '@arco-design/web-vue';
  import {
    IconUpload,
    IconFile,
    IconFolder,
    IconShareAlt,
    IconStar,
    IconRight,
    IconSafe,
    IconCloud,
    IconThunderbolt,
  } from '@arco-design/web-vue/es/icon';
  import { LoadingSpinner } from '@/components';
  import type { FileItem } from '@/types/modules/file';
  import { getHomeInfo, type HomeInfo } from '@/api/home';
  import { getFileIconPath } from '@/utils/file-icon';

  const router = useRouter();
  const loading = ref(false);

  // 最大存储容量：100GB
  const MAX_STORAGE = 107374182400; // 100GB in bytes

  const homeInfo = ref<HomeInfo | null>(null);
  const recentFiles = ref<FileItem[]>([]);

  // 已使用存储容量（如果超过100GB则显示为100GB）
  const usedStorage = computed(() => {
    const used = homeInfo.value?.usedStorage;
    if (used === null || used === undefined) {
      return 0;
    }
    
    // 转换为数字（处理字符串类型的情况），后端返回的是字节数
    const usedBytes = typeof used === 'string' ? parseFloat(used) : Number(used);
    
    // 确保返回的是有效数字
    if (Number.isNaN(usedBytes) || usedBytes < 0) {
      return 0;
    }
    
    // 如果值已经超过MAX_STORAGE，限制为MAX_STORAGE
    return usedBytes > MAX_STORAGE ? MAX_STORAGE : usedBytes;
  });

  // 存储使用百分比（确保不超过100%）
  const storagePercent = computed(() => {
    const used = usedStorage.value;
    if (used <= 0 || MAX_STORAGE <= 0) {
      return 0;
    }
    const percent = used / MAX_STORAGE;
    // 确保百分比在 0-1 之间
    return Math.min(1, Math.max(0, Number(percent.toFixed(4))));
  });

  const fileCount = computed(() => homeInfo.value?.fileCount ?? 0);
  const directoryCount = computed(() => homeInfo.value?.directoryCount ?? 0);
  const shareCount = computed(() => homeInfo.value?.shareCount ?? 0);
  const favoriteCount = computed(() => homeInfo.value?.favoriteCount ?? 0);

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 事件处理
  const goToFiles = () => {
    router.push('/files');
  };

  const goToStorage = () => {
    router.push('/storage');
  };

  const goToShares = () => {
    router.push('/files?view=shares');
  };

  const goToFavorites = () => {
    router.push('/files?view=favorites');
  };

  const handleUpload = () => {
    Message.info('上传功能开发中...');
  };

  /**
   * 预览文件
   */
  const openPreview = (file: FileItem) => {
    const apiBaseUrl = import.meta.env.VITE_API_VIEW_URL || '';
    const previewUrl = `${apiBaseUrl}/preview/${file.id}`;
    window.open(previewUrl, '_blank');
  };

  /**
   * 处理文件双击事件
   */
  const handleFileDoubleClick = (file: FileItem) => {
    if (file.isDir) {
      // 如果是文件夹，跳转到文件列表
      goToFiles();
    } else {
      // 如果是文件，打开预览
      openPreview(file);
    }
  };

  // 获取首页数据
  const fetchHomeInfo = async () => {
    loading.value = true;
    try {
      const { data } = await getHomeInfo();
      if (data) {
        homeInfo.value = data;
        recentFiles.value = data.recentFiles || [];
      }
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchHomeInfo();
  });
</script>

<style lang="less" scoped>
  .home-container {
    padding: 0;
    background-color: var(--color-fill-2);
    min-height: 100vh;
  }

  // 欢迎横幅
  .welcome-banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60px 40px;
    margin-bottom: 24px;
    color: white;

    .welcome-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .welcome-text {
      h1 {
        font-size: 36px;
        font-weight: 600;
        margin: 0 0 12px 0;
        color: white;
      }

      p {
        font-size: 16px;
        margin: 0;
        opacity: 0.9;
      }
    }

    .welcome-actions {
      display: flex;
      gap: 12px;

      :deep(.arco-btn) {
        height: 44px;
        padding: 0 24px;
        font-size: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

        &.arco-btn-primary {
          background: white;
          color: #667eea;
          border: none;

          &:hover {
            background: #f0f0f0;
          }
        }

        &:not(.arco-btn-primary) {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);

          &:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        }
      }
    }
  }

  // 存储统计卡片
  .storage-stats {
    max-width: 1400px;
    margin: -40px auto 24px;
    padding: 0 40px;

    .stats-card {
      border-radius: 12px;
      box-shadow: 0 2px 16px var(--color-fill-4);
      overflow: hidden;
      background: var(--color-bg-2);

      :deep(.arco-card-body) {
        padding: 24px 32px;
      }
    }

    .stats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        color: var(--color-text-1);
      }
    }

    .storage-info {
      display: flex;
      align-items: center;
      gap: 40px;
    }

    .storage-chart {
      flex: 1;
    }

    .storage-details {
      display: flex;
      gap: 32px;

      > div {
        display: flex;
        flex-direction: column;
        align-items: center;

        .value {
          font-size: 24px;
          font-weight: 600;
          color: var(--color-text-1);
          margin-bottom: 4px;
        }

        .label {
          font-size: 14px;
          color: var(--color-text-3);
        }
      }
    }
  }

  // 快速统计
  .quick-stats {
    max-width: 1400px;
    margin: 0 auto 24px;
    padding: 0 40px;

    .stat-item {
      border-radius: 12px;
      box-shadow: 0 2px 8px var(--color-fill-3);
      transition: all 0.3s;
      cursor: pointer;
      background: var(--color-bg-2);

      &:hover {
        box-shadow: 0 4px 16px var(--color-fill-4);
        transform: translateY(-2px);
      }

      :deep(.arco-card-body) {
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
      }
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;

      &.files {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      &.folders {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
      }

      &.shared {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
      }

      &.recent {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        color: white;
      }
    }

    .stat-info {
      flex: 1;

      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: var(--color-text-1);
        line-height: 1.2;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 14px;
        color: var(--color-text-3);
      }
    }
  }

  // 最近使用
  .recent-section {
    max-width: 1400px;
    margin: 0 auto 24px;
    padding: 0 40px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h3 {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        color: var(--color-text-1);
      }
    }

    .recent-files {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .file-card {
      background: var(--color-bg-2);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 2px 8px var(--color-fill-3);

      &:hover {
        box-shadow: 0 4px 16px var(--color-fill-4);
        transform: translateY(-2px);
      }

      .file-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        background: var(--color-fill-2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-2);
        flex-shrink: 0;

        .file-icon-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }
      }

      .file-info {
        flex: 1;
        min-width: 0;

        .file-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-1);
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-meta {
          font-size: 12px;
          color: var(--color-text-3);
        }
      }
    }
  }

  // 功能特性
  .features-section {
    max-width: 1400px;
    margin: 40px auto 0;
    padding: 40px 40px 80px;

    .section-header {
      margin-bottom: 24px;

      h3 {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        color: var(--color-text-1);
      }
    }

    .feature-card {
      text-align: center;
      padding: 32px 24px;
      background: var(--color-bg-2);
      border-radius: 12px;
      box-shadow: 0 2px 8px var(--color-fill-3);
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 16px var(--color-fill-4);
        transform: translateY(-4px);
      }

      .feature-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        color: white;
      }

      h4 {
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-1);
        margin: 0 0 12px 0;
      }

      p {
        font-size: 14px;
        color: var(--color-text-3);
        line-height: 1.6;
        margin: 0;
      }
    }
  }
</style>
