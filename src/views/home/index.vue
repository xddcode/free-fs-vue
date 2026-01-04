<template>
  <div class="dashboard-container">
    <!-- 1. 顶部问候与搜索区 -->
    <header class="dashboard-header">
      <div class="greeting-wrap">
        <h1 class="greeting-text">
          {{ getTimeState() }}，{{ userStore.username || '管理员' }}
        </h1>
        <p class="sub-text">欢迎回来，今天也要高效管理您的云端文件。</p>
      </div>
      <div class="header-actions">
        <a-input-search
          placeholder="搜索您的云端文件..."
          style="width: 300px"
          class="header-search"
        />
        <a-button type="primary" shape="round" @click="handleUpload">
          <template #icon><icon-plus /></template>
          快速上传
        </a-button>
        <a-tooltip content="刷新">
          <a-button size="large" @click="fetchHomeInfo">
            <template #icon>
              <icon-refresh />
            </template>
          </a-button>
        </a-tooltip>
      </div>
    </header>

    <div class="dashboard-content">
      <!-- 2. 左侧主区域：最近活动与快捷入口 -->
      <div class="main-column">
        <!-- 快捷入口磁贴 -->
        <section class="tiles-section">
          <div class="section-title">快捷入口</div>
          <div class="tiles-grid">
            <div
              v-for="tile in quickTiles"
              :key="tile.label"
              class="tile-card"
              @click="tile.action"
            >
              <div class="tile-icon" :style="{ background: tile.bg }">
                <component :is="tile.icon" />
              </div>
              <div class="tile-info">
                <div class="tile-label">{{ tile.label }}</div>
                <div class="tile-count">{{ tile.count }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 最近文件 -->
        <section class="recent-section">
          <div class="section-header">
            <div class="section-title">最近使用</div>
            <a-link @click="goToFiles">查看全部</a-link>
          </div>
          <LoadingSpinner :loading="loading" :size="100">
            <div v-if="recentFiles.length > 0" class="recent-grid">
              <div
                v-for="file in recentFiles"
                :key="file.id"
                class="file-item-card"
                @dblclick="handleFileDoubleClick(file)"
              >
                <div class="file-preview">
                  <img
                    :src="
                      getFileIconPath(file.isDir ? 'dir' : file.suffix || '')
                    "
                    class="file-type-icon"
                  />
                </div>
                <div class="file-details">
                  <div class="file-name">{{ file.displayName }}</div>
                  <div class="file-meta">
                    {{ formatSize(file.size) }} ·
                    {{ formatTime(file.lastAccessTime || file.updateTime) }}
                  </div>
                </div>
                <div class="file-actions">
                  <a-button type="text" size="small">
                    <template #icon><icon-more /></template>
                  </a-button>
                </div>
              </div>
            </div>
            <a-empty v-else />
          </LoadingSpinner>
        </section>
      </div>

      <!-- 3. 右侧副区域：存储统计与功能入口 -->
      <div class="side-column">
        <!-- 存储概览卡片 -->
        <a-card class="storage-widget" :bordered="false">
          <div class="widget-title">存储概览</div>
          <div class="radial-progress-wrap">
            <a-progress
              type="circle"
              :percent="storagePercent"
              :stroke-width="10"
              size="large"
              :color="{
                '0%': '#a87ffb',
                '100%': '#2a6fe8',
              }"
            >
              <template #text>
                <div class="progress-inner">
                  <span class="percent-val"
                    >{{ storagePercent.toFixed(1) }}%</span
                  >
                  <span class="percent-label">已使用</span>
                </div>
              </template>
            </a-progress>
          </div>
          <div class="storage-info-list">
            <div class="info-item">
              <span class="dot purple"></span>
              <span class="label">已使用</span>
              <span class="value">{{ formatSize(usedStorage) }}</span>
            </div>
            <div class="info-item">
              <span class="dot gray"></span>
              <span class="label">总容量</span>
              <span class="value">{{ formatSize(MAX_STORAGE) }}</span>
            </div>
          </div>
          <a-button
            type="secondary"
            long
            class="manage-btn"
            @click="goToStorage"
          >
            管理存储空间
          </a-button>
        </a-card>

        <!-- 常用功能小组件 -->
        <a-card class="feature-widget" :bordered="false">
          <div class="widget-title">功能特性</div>
          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon-small blue"><icon-safe /></div>
              <div class="feature-text">
                <div class="f-title">数据加密</div>
                <div class="f-desc">多重备份，金融级安全</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon-small green"><icon-thunderbolt /></div>
              <div class="feature-text">
                <div class="f-title">极速传输</div>
                <div class="f-desc">上传下载不限速</div>
              </div>
            </div>
          </div>
        </a-card>

        <!-- 开源信息小组件 -->
        <a-card class="oss-widget" :bordered="false">
          <div class="widget-title">开源项目</div>
          <div class="oss-content">
            <p class="oss-desc">
              Free Fs 是一款基于 SpringBoot 和 Vue3
              构建的开源文件管理系统，欢迎大家交流学习。
            </p>
            <div class="oss-links">
              <a
                href="https://gitee.com/xddcode/free-fs"
                target="_blank"
                class="oss-link-item gitee"
              >
                <icon-link />
                <span>Gitee 仓库</span>
              </a>
              <a
                href="https://github.com/xddcode/free-fs"
                target="_blank"
                class="oss-link-item github"
              >
                <icon-code />
                <span>GitHub 仓库</span>
              </a>
            </div>
          </div>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { Message } from '@arco-design/web-vue';
  import {
    IconPlus,
    IconFile,
    IconFolder,
    IconShareAlt,
    IconStar,
    IconMore,
    IconSafe,
    IconThunderbolt,
    IconRefresh,
    IconCode,
    IconLink,
  } from '@arco-design/web-vue/es/icon';
  import { useUserStore } from '@/store';
  import { LoadingSpinner } from '@/components';
  import type { FileItem } from '@/types/modules/file';
  import { getHomeInfo } from '@/api/home';
  import { getFileIconPath } from '@/utils/file-icon';

  const router = useRouter();
  const userStore = useUserStore();
  const loading = ref(false);

  // 数据定义
  const MAX_STORAGE = 107374182400; // 100GB
  const homeInfo = ref<any>(null);
  const recentFiles = ref<FileItem[]>([]);

  // 计算属性
  const usedStorage = computed(() => homeInfo.value?.usedStorage || 0);
  const storagePercent = computed(() =>
    Math.min(1, usedStorage.value / MAX_STORAGE)
  );

  const quickTiles = computed(() => [
    {
      label: '全部文件',
      count: homeInfo.value?.fileCount || 0,
      icon: IconFile,
      bg: 'rgba(42, 111, 232, 0.1)',
      action: () => router.push('/files'),
    },
    {
      label: '收藏夹',
      count: homeInfo.value?.favoriteCount || 0,
      icon: IconStar,
      bg: 'rgba(255, 125, 0, 0.1)',
      action: () => router.push('/files?view=favorites'),
    },
    {
      label: '我的分享',
      count: homeInfo.value?.shareCount || 0,
      icon: IconShareAlt,
      bg: 'rgba(0, 180, 42, 0.1)',
      action: () => router.push('/files?view=shares'),
    },
    {
      label: '文件夹',
      count: homeInfo.value?.directoryCount || 0,
      icon: IconFolder,
      bg: 'rgba(168, 127, 251, 0.1)',
      action: () => router.push('/files?isDir=true'),
    },
  ]);

  // 工具函数
  const getTimeState = () => {
    const hours = new Date().getHours();
    if (hours < 12) return '早上好';
    if (hours < 18) return '下午好';
    return '晚上好';
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    return date.toLocaleDateString('zh-CN');
  };

  // 事件处理
  const goToFiles = () => router.push('/files');
  const goToStorage = () => router.push('/storage');
  const handleUpload = () => Message.info('请在文件页面上传文件');
  const handleFileDoubleClick = (file: FileItem) => {
    if (file.isDir) router.push('/files');
    else
      window.open(
        `${import.meta.env.VITE_API_VIEW_URL}/preview/${file.id}`,
        '_blank'
      );
  };

  const fetchHomeInfo = async () => {
    loading.value = true;
    try {
      const { data } = await getHomeInfo();
      homeInfo.value = data;
      recentFiles.value = data?.recentFiles || [];
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchHomeInfo);
</script>

<style lang="less" scoped>
  .dashboard-container {
    padding: 32px 40px;
    background-color: var(--color-bg-1);
    min-height: 100vh;
    max-width: 1400px;
    margin: 0 auto;
  }

  // 头部样式
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 40px;

    .greeting-text {
      font-size: 28px;
      font-weight: 600;
      color: var(--color-text-1);
      margin: 0 0 8px 0;
    }

    .sub-text {
      font-size: 15px;
      color: var(--color-text-3);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 16px;
      align-items: center;

      .header-search {
        :deep(.arco-input-wrapper) {
          border-radius: 20px;
          background-color: var(--color-fill-2);
          border: 1px solid transparent;
          transition: all 0.2s;
          &:hover {
            background-color: var(--color-fill-3);
          }
        }
      }
    }
  }

  .dashboard-content {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 32px;
  }

  // 公用标题
  .section-title,
  .widget-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-1);
    margin-bottom: 20px;
  }

  // 1. 快捷磁贴
  .tiles-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 40px;

    .tile-card {
      background: var(--color-bg-2);
      padding: 20px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid var(--color-border-1);

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
        border-color: var(--color-primary-light-3);
      }

      .tile-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: var(--color-text-1);
      }

      .tile-label {
        font-size: 13px;
        color: var(--color-text-3);
        margin-bottom: 2px;
      }

      .tile-count {
        font-size: 20px;
        font-weight: 600;
        color: var(--color-text-1);
      }
    }
  }

  // 2. 最近文件列表
  .recent-section {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .recent-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }

    .file-item-card {
      background: var(--color-bg-2);
      border-radius: 14px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      border: 1px solid var(--color-border-1);
      transition: all 0.2s;

      &:hover {
        background: var(--color-fill-1);
        border-color: var(--color-fill-3);
        .file-actions {
          opacity: 1;
        }
      }

      .file-preview {
        width: 40px;
        height: 40px;
        background: var(--color-fill-2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        .file-type-icon {
          width: 28px;
          height: 28px;
        }
      }

      .file-details {
        flex: 1;
        min-width: 0;
        .file-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .file-meta {
          font-size: 12px;
          color: var(--color-text-4);
          margin-top: 2px;
        }
      }

      .file-actions {
        opacity: 0;
        transition: opacity 0.2s;
      }
    }
  }

  // 3. 右侧小组件
  .storage-widget,
  .feature-widget,
  .oss-widget {
    border-radius: 20px;
    background: var(--color-bg-2);
    border: 1px solid var(--color-border-1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    margin-bottom: 24px;
  }

  .oss-widget {
    .oss-desc {
      font-size: 13px;
      color: var(--color-text-3);
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .oss-links {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .oss-link-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 10px;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;

        &.gitee {
          background: rgba(199, 29, 35, 0.08);
          color: #c71d23;
          &:hover {
            background: rgba(199, 29, 35, 0.15);
          }
        }

        &.github {
          background: rgba(36, 41, 46, 0.08);
          color: var(--color-text-1);
          &:hover {
            background: rgba(36, 41, 46, 0.15);
          }
        }
      }
    }
  }

  .radial-progress-wrap {
    display: flex;
    justify-content: center;
    padding: 20px 0;

    .progress-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      .percent-val {
        font-size: 24px;
        font-weight: 600;
        color: var(--color-text-1);
      }
      .percent-label {
        font-size: 12px;
        color: var(--color-text-4);
      }
    }
  }

  .storage-info-list {
    margin: 20px 0;
    .info-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      font-size: 13px;
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        &.purple {
          background: #a87ffb;
        }
        &.gray {
          background: var(--color-fill-4);
        }
      }
      .label {
        color: var(--color-text-3);
        flex: 1;
      }
      .value {
        color: var(--color-text-1);
        font-weight: 500;
      }
    }
  }

  .manage-btn {
    border-radius: 10px;
    font-weight: 500;
  }

  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .feature-item {
      display: flex;
      gap: 12px;
      align-items: center;

      .feature-icon-small {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        &.blue {
          background: rgba(42, 111, 232, 0.1);
          color: #2a6fe8;
        }
        &.green {
          background: rgba(0, 180, 42, 0.1);
          color: #00b42a;
        }
      }

      .f-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--color-text-1);
      }
      .f-desc {
        font-size: 12px;
        color: var(--color-text-4);
      }
    }
  }
</style>
