<template>
  <div class="share-page-bg">
    <div class="bg-decoration"></div>

    <div class="main-container">
      <transition name="fade-slide" mode="out-in">
        <div v-if="!isVerified" key="verify" class="card-wrapper verify-mode">
          <div class="verify-header">
            <a-avatar :size="64" class="user-avatar">
              <icon-user />
            </a-avatar>
            <div class="verify-text">
              <h2>Free-fs 的文件分享</h2>
              <p>需要提取码才能访问</p>
            </div>
          </div>

          <div class="verify-input-box">
            <a-input-search
              v-model="accessCode"
              placeholder="请输入提取码"
              button-text="查看文件"
              search-button
              size="large"
              :loading="verifying"
              @search="handleVerify"
              @press-enter="handleVerify"
            >
              <template #prefix><icon-lock /></template>
            </a-input-search>
          </div>
        </div>

        <div v-else key="explorer" class="card-wrapper explorer-mode">
          <div class="app-header">
            <div class="header-meta">
              <div class="folder-icon-box">
                <icon-folder style="font-size: 24px; color: #ffb400" />
              </div>
              <div class="meta-text">
                <div class="title">{{ shareData.shareName }}</div>
                <div class="subtitle"
                  >{{ shareData.expireTime }} 分享 -
                  {{ currentList.length }} 个文件</div
                >
              </div>
            </div>
            <div class="header-actions">
              <a-button class="btn-download" type="primary">
                <template #icon><icon-download /></template>
                下载
              </a-button>
            </div>
          </div>

          <div class="app-nav">
            <a-breadcrumb>
              <a-breadcrumb-item @click="handleBreadcrumb(-1)">
                <icon-home /> 根目录
              </a-breadcrumb-item>
              <a-breadcrumb-item
                v-for="(item, index) in breadcrumbs"
                :key="index"
                @click="handleBreadcrumb(index)"
              >
                {{ item.name }}
              </a-breadcrumb-item>
            </a-breadcrumb>
          </div>

          <div class="app-body">
            <a-table
              :data="currentList"
              :pagination="false"
              :bordered="false"
              :hoverable="true"
              row-key="id"
              class="compact-table"
              :scroll="{ y: 400 }"
            >
              <template #columns>
                <a-table-column title="名称" data-index="name">
                  <template #cell="{ record }">
                    <div class="file-row" @click="handleRowClick(record)">
                      <div class="icon-box">
                        <icon-folder
                          v-if="record.type === 'folder'"
                          style="color: #ffb400; font-size: 22px"
                        />
                        <icon-file-pdf
                          v-else-if="record.ext === 'pdf'"
                          style="color: #f53f3f; font-size: 22px"
                        />
                        <icon-file-image
                          v-else-if="['png', 'jpg'].includes(record.ext)"
                          style="color: #b7eb8f; font-size: 22px"
                        />
                        <icon-file
                          v-else
                          style="color: #86909c; font-size: 22px"
                        />
                      </div>
                      <span class="file-name">{{ record.name }}</span>
                    </div>
                  </template>
                </a-table-column>

                <a-table-column title="大小" :width="120" align="right">
                  <template #cell="{ record }">
                    <span class="size-text">{{
                      record.type === 'folder' ? '-' : record.size
                    }}</span>
                  </template>
                </a-table-column>

                <a-table-column title="时间" :width="160" align="right">
                  <template #cell="{ record }">
                    <span class="time-text">{{
                      record.updateTime.split(' ')[0]
                    }}</span>
                  </template>
                </a-table-column>
              </template>
            </a-table>
          </div>

          <div class="app-footer">
            <span>已加载全部内容</span>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import {
    IconUser,
    IconLock,
    IconFolder,
    IconFile,
    IconFilePdf,
    IconFileImage,
    IconHome,
    IconDownload,
  } from '@arco-design/web-vue/es/icon';
  import { useRoute } from 'vue-router';

  const route = useRoute();

  interface FileItem {
    id: string;
    name: string;
    type: 'folder' | 'file';
    ext?: string;
    size?: string;
    updateTime: string;
  }
  /** 是否验证 */
  const isVerified = ref(false);
  /** 验证码 */
  const accessCode = ref('');
  /** 验证状态 */
  const verifying = ref(false);
  /** 面包屑 */
  const breadcrumbs = reactive<{ name: string; id: string }[]>([]);

  // Mock 数据
  const rootData: FileItem[] = [
    {
      id: '1',
      name: '后端接口文档',
      type: 'folder',
      updateTime: '2025-10-24 10:00',
    },
    {
      id: '2',
      name: '项目演示.mp4',
      type: 'file',
      ext: 'mp4',
      size: '120 MB',
      updateTime: '2025-10-23 14:20',
    },
    {
      id: '3',
      name: 'README.md',
      type: 'file',
      ext: 'md',
      size: '2 KB',
      updateTime: '2025-10-23 09:00',
    },
    {
      id: '4',
      name: '架构图.png',
      type: 'file',
      ext: 'png',
      size: '2.4 MB',
      updateTime: '2025-10-22 11:00',
    },
  ];
  const currentList = ref(rootData);

  const shareData = {
    id: '01ka8y7js92cq8rf6tvmcyw4sf',
    shareName: 'WebStorm-2025.2.3.exe',
    expireTime: '2025-11-24 20:56:56',
    hasCheckCode: false,
  };

  /** 获取分享情况 */
  const fetchShare = async () => {
    const shareToken = route.params.shareToken as string;
    setTimeout(() => {
      isVerified.value = !shareData.hasCheckCode;
    }, 500);
  };

  /** 获取分享文件内容 */
  const fetchShareFile = async () => {};

  /** 验证提取码 */
  const handleVerify = () => {
    if (!accessCode.value) return Message.warning('请输入提取码');
    verifying.value = true;
    setTimeout(() => {
      verifying.value = false;
      if (accessCode.value === '1234') isVerified.value = true;
      else Message.error('提取码错误');
    }, 600);
    return true;
  };

  const handleRowClick = (record: FileItem) => {
    if (record.type === 'folder') {
      breadcrumbs.push({ name: record.name, id: record.id });
      currentList.value = []; // 模拟空文件夹或加载中
    } else {
      Message.success(`下载: ${record.name}`);
    }
  };

  const handleBreadcrumb = (index: number) => {
    if (index === -1) breadcrumbs.splice(0);
    else breadcrumbs.splice(index + 1);
    currentList.value = rootData;
  };

  onMounted(() => {
    fetchShare();
  });
</script>

<style scoped lang="less">
  .share-page-bg {
    min-height: 100vh;
    background-color: #f2f3f5;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bg-decoration {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 240px;
    background: linear-gradient(
      180deg,
      #e8f3ff 0%,
      rgba(242, 243, 245, 0) 100%
    );
    z-index: 0;
  }

  .main-container {
    position: relative;
    z-index: 1;
    width: 100%;
    padding: 20px;
    display: flex;
    justify-content: center;
  }

  .card-wrapper {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08); /* 柔和的阴影 */
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .verify-mode {
    width: 400px;
    padding: 40px 32px;
    text-align: center;

    .user-avatar {
      background-color: var(--color-primary-light-2);
      color: var(--color-primary-6);
      margin-bottom: 16px;
    }
    .verify-text h2 {
      font-size: 18px;
      margin: 0 0 8px;
      color: var(--color-text-1);
    }
    .verify-text p {
      color: var(--color-text-3);
      margin: 0 0 32px;
    }
  }

  .explorer-mode {
    width: 900px;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    min-height: 500px;
    max-height: 85vh;
  }

  /* A. 头部 */
  .app-header {
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border-1);
    background: #fafafa;

    .header-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      .title {
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-1);
        margin-bottom: 4px;
      }
      .subtitle {
        font-size: 12px;
        color: var(--color-text-3);
      }
    }
  }

  /* B. 导航 */
  .app-nav {
    padding: 12px 32px;
    background: #fff;
    border-bottom: 1px dashed var(--color-border-2);
    :deep(.arco-breadcrumb-item) {
      cursor: pointer;
      user-select: none;
    }
  }

  .app-body {
    flex: 1;
    padding: 8px 16px;
    overflow: hidden;
  }

  .compact-table {
    :deep(.arco-table-th) {
      background: transparent;
      border-bottom: 1px solid var(--color-border-1);
    }
    :deep(.arco-table-td) {
      border-bottom: 1px solid var(--color-border-1);
    }
    :deep(.arco-table-row:last-child .arco-table-td) {
      border-bottom: none;
    }
  }

  .file-row {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 4px 0;
    .icon-box {
      width: 32px;
      display: flex;
      justify-content: center;
      margin-right: 12px;
    }
    .file-name {
      font-weight: 500;
      color: var(--color-text-1);
      font-size: 14px;
    }
    &:hover .file-name {
      color: var(--color-primary-6);
    }
  }

  .size-text,
  .time-text {
    color: var(--color-text-3);
    font-size: 13px;
  }

  .app-footer {
    padding: 12px;
    text-align: center;
    color: var(--color-text-4);
    font-size: 12px;
    background: #fff;
  }

  /* 动画效果 */
  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .fade-slide-enter-from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  .fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }

  /* 移动端适配 */
  @media (max-width: 768px) {
    .explorer-mode {
      width: 100%;
      height: 100vh;
      border-radius: 0;
      max-height: none;
    }
    .app-header {
      padding: 16px;
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    .header-actions {
      width: 100%;
      display: flex;
      gap: 10px;
      button {
        flex: 1;
      }
    }
  }
</style>
