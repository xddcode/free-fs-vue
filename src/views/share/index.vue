<template>
  <div class="share-page-bg">
    <div class="bg-decoration"></div>

    <div class="main-container">
      <transition name="fade-slide" mode="out-in">
        <div v-if="isLoading" key="loading" class="loading-mode">
          <LoadingSpinner :loading="true" :size="150" inline />
          <p class="loading-text">正在获取分享信息...</p>
        </div>

        <div v-else-if="hasError" key="error" class="card-wrapper error-mode">
          <div class="error-content">
            <div class="error-icon">
              <icon-close-circle :size="80" />
            </div>
            <h2 class="error-title">{{ errorMessage }}</h2>
            <p class="error-desc">无法获取分享信息，请稍后重试</p>
            <a-button type="primary" @click="fetchShare">
              <icon-refresh />
              重新加载
            </a-button>
          </div>
        </div>

        <div
          v-else-if="shareData.isExpire"
          key="expired"
          class="card-wrapper expired-mode"
        >
          <div class="expired-content">
            <div class="expired-icon">
              <icon-clock-circle :size="80" />
            </div>
            <h2 class="expired-title">分享已过期</h2>
            <p class="expired-desc">该分享链接已过期，无法访问</p>
            <div class="expired-info">
              <div class="info-item">
                <icon-folder />
                <span>{{ shareData.shareName }}</span>
              </div>
              <div v-if="shareData.expireTime" class="info-item">
                <icon-clock-circle />
                <span>过期时间：{{ shareData.expireTime }}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="!isVerified"
          key="verify"
          class="card-wrapper verify-mode"
        >
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
                <div class="subtitle">
                  <span>{{ shareData.fileCount ?? 1 }} 个文件</span>
                  <span v-if="shareData.expireTime" class="expire-time">
                    <icon-clock-circle :size="14" />
                    {{ formatExpireTime(shareData.expireTime) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="header-actions">
              <!--              <a-button class="btn-download" type="primary">-->
              <!--                <template #icon><icon-download /></template>-->
              <!--                下载-->
              <!--              </a-button>-->
            </div>
          </div>

          <div class="app-nav">
            <a-breadcrumb>
              <a-breadcrumb-item @click="handleBreadcrumb(-1)">
                <icon-folder /> 根目录
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
            <LoadingSpinner :loading="bodyLoading" :size="150" full-height>
              <file-list-view
                v-if="viewMode === 'list'"
                v-model:view-mode="viewMode"
                :file-list="fileViewList || []"
                :scope="shareData.scope"
                @row-click="handleFileClick"
                @refresh="fetchShareFile"
                @preview="handlePreview"
                @download="handleDownload"
              />

              <file-grid-view
                v-else
                v-model:view-mode="viewMode"
                :file-list="fileViewList || []"
                :scope="shareData.scope"
                @file-click="handleFileClick"
                @refresh="fetchShareFile"
                @preview="handlePreview"
                @download="handleDownload"
              />
            </LoadingSpinner>
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
  import { ref, onMounted, watch, defineAsyncComponent } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import {
    IconUser,
    IconLock,
    IconFolder,
    IconClockCircle,
    IconCloseCircle,
    IconRefresh,
  } from '@arco-design/web-vue/es/icon';
  import {
    getShareDetail,
    getShareItemList,
    validateShareCode,
  } from '@/api/share';
  import { useRoute, useRouter } from 'vue-router';
  import { ShareThin } from '@/types/modules/share';
  import { FileItem } from '@/types/modules/file';
  import { LoadingSpinner } from '@/components';

  const FileListView = defineAsyncComponent(
    () => import('./components/share-file-list-view.vue')
  );
  const FileGridView = defineAsyncComponent(
    () => import('./components/share-file-grid-view.vue')
  );

  const route = useRoute();
  const router = useRouter();

  /** 页面加载状态 */
  const isLoading = ref(true);
  /** 是否验证 */
  const isVerified = ref(false);
  /** 验证码 */
  const accessCode = ref('');
  /** 验证状态 */
  const verifying = ref(false);
  /** 面包屑 */
  const breadcrumbs = ref<{ name: string; id: string }[]>([]);
  const viewMode = ref<'list' | 'grid'>('list');
  const bodyLoading = ref(false);
  /** 错误状态 */
  const hasError = ref(false);
  const errorMessage = ref('');

  const shareData = ref<ShareThin>({
    id: '',
    shareName: '',
    expireTime: '',
    hasCheckCode: false,
    isExpire: false,
  });

  /** 验证提取码 */
  const handleVerify = async () => {
    if (!accessCode.value) return Message.warning('请输入提取码');
    verifying.value = true;
    try {
      const res = await validateShareCode({
        shareId: route.params.shareToken as string,
        shareCode: accessCode.value,
      });
      if (res.data) {
        isVerified.value = true;
        // 如果验证成功，将code放如route参数中
        await router.replace({
          query: {
            ...route.query,
            shareCode: accessCode.value,
          },
        });
      } else {
        Message.error('提取码错误');
      }
    } finally {
      verifying.value = false;
    }
    return true;
  };

  /** 获取分享情况 */
  const fetchShare = async () => {
    isLoading.value = true;
    hasError.value = false;
    errorMessage.value = '';

    try {
      const shareToken = route.params.shareToken as string;
      const res = await getShareDetail(shareToken);
      shareData.value = res.data;

      // 优先检查是否过期，如果过期则不进行后续验证逻辑
      if (res.data.isExpire) {
        isLoading.value = false;
        return;
      }

      if (!res.data.hasCheckCode) {
        isVerified.value = true;
      } else {
        const urlCode = route.query.shareCode as string;
        if (urlCode) {
          // 如果 URL 里有码，自动填充并尝试验证
          accessCode.value = urlCode;
          // 这里不加 await，让它静默执行，或者你可以加 loading 效果
          handleVerify();
          // 或者不走验证接口直接修改变量即可 【还是得验证，如果不怀好意的人直接拼一个code直接G了】
          // isVerified.value = true;
        }
      }
    } catch (error: any) {
      hasError.value = true;
      // 判断错误类型
      if (
        error.message?.includes('Network Error') ||
        error.code === 'ERR_NETWORK'
      ) {
        errorMessage.value = '网络连接失败，请检查网络';
      } else if (error.response?.status === 404) {
        errorMessage.value = '分享不存在或已被删除';
      } else if (error.response?.status >= 500) {
        errorMessage.value = '服务器错误，请稍后重试';
      } else {
        errorMessage.value = error.message || '获取分享信息失败';
      }
    } finally {
      isLoading.value = false;
    }
  };

  const fileViewList = ref<FileItem[]>();
  /** 获取分享文件内容 */
  const fetchShareFile = async () => {
    if (!isVerified.value) return;
    bodyLoading.value = true;
    fileViewList.value = [];
    try {
      const shareToken = route.params.shareToken as string;
      const parentId = (route.query.parentId as string) || undefined;
      const res = await getShareItemList(shareToken, parentId);
      fileViewList.value = res.data;
    } finally {
      bodyLoading.value = false;
    }
  };

  watch(
    () => isVerified.value,
    () => {
      if (isVerified.value) {
        // 验证码验证正确, 获取分享文件列表
        fetchShareFile();
      }
    }
  );

  watch(
    () => route.query.parentId,
    (newId) => {
      if (isVerified.value) {
        fetchShareFile();
        if (!newId) {
          breadcrumbs.value = [];
        }
      }
    }
  );

  /**
   * 处理文件点击（进入文件夹）
   */
  const handleFileClick = (file: FileItem) => {
    if (file.isDir) {
      breadcrumbs.value.push({ name: file.originalName, id: file.id });
      router.push({
        query: {
          ...route.query,
          parentId: file.id,
          viewMode: viewMode.value,
        },
      });
    }
  };

  const handleBreadcrumb = (index: number) => {
    if (index === -1) {
      // 回到根目录
      breadcrumbs.value = [];
      router.push({ query: { ...route.query, parentId: undefined } });
    } else {
      // 回到指定层级
      const target = breadcrumbs.value[index];
      // 截断后面的面包屑
      breadcrumbs.value = breadcrumbs.value.slice(0, index + 1);
      router.push({ query: { ...route.query, parentId: target.id } });
    }
  };

  /**
   * 格式化到期时间
   */
  const formatExpireTime = (expireTime: string | null) => {
    if (!expireTime) return '永久有效';

    const expireDate = new Date(expireTime);
    const now = new Date();
    const diffTime = expireDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return '已过期';
    }
    if (diffDays === 0) {
      return '今天到期';
    }
    if (diffDays === 1) {
      return '明天到期';
    }
    if (diffDays <= 7) {
      return `${diffDays}天后到期`;
    }
    // 格式化为 YYYY-MM-DD
    const year = expireDate.getFullYear();
    const month = String(expireDate.getMonth() + 1).padStart(2, '0');
    const day = String(expireDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} 到期`;
  };

  /**
   * 处理预览
   */
  const handlePreview = (file: FileItem) => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const previewUrl = `${apiBaseUrl}/preview/${file.id}`;
    window.open(previewUrl, '_blank');
  };

  /**
   * 处理下载 - 直接使用链接下载（支持大文件流式下载）
   */
  const handleDownload = (file: FileItem) => {
    try {
      const shareToken = route.params.shareToken as string;
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      
      // 构建下载链接
      const downloadUrl = `${apiBaseUrl}/apis/share/${shareToken}/download/${file.id}`;
      
      // 创建隐藏的 a 标签触发下载（浏览器直接流式下载，不占用内存）
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      Message.success('开始下载文件');
    } catch (err: any) {
      Message.error(err.message || '下载失败，请稍后重试');
    }
  };

  onMounted(() => {
    if (route.query.viewMode) {
      viewMode.value = route.query.viewMode as 'grid' | 'list';
    }
    // 第一次进入分享页触发
    fetchShare();
    // 如果后续通过router再次进去分享页，应该是dir的场景，需要通过parentId查询目录下的文件
    // 如果返回到页面最初的内容应该通过分享id获取文件列表
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

  .loading-mode {
    width: 400px; /* 宽度与 verify-mode 保持一致 */
    height: 300px; /* 高度大概一致，防止跳动 */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .loading-text {
      margin-top: 16px;
      color: var(--color-text-3);
      font-size: 14px;
    }
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

  .error-mode {
    width: 500px;
    padding: 60px 40px;
    text-align: center;

    .error-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .error-icon {
      color: rgb(var(--danger-6));
      opacity: 0.8;
    }

    .error-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-1);
      margin: 0;
    }

    .error-desc {
      font-size: 14px;
      color: var(--color-text-3);
      margin: 0;
    }
  }

  .expired-mode {
    width: 500px;
    padding: 60px 40px;
    text-align: center;

    .expired-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .expired-icon {
      color: var(--color-text-4);
      opacity: 0.6;
    }

    .expired-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--color-text-1);
      margin: 0;
    }

    .expired-desc {
      font-size: 14px;
      color: var(--color-text-3);
      margin: 0;
    }

    .expired-info {
      margin-top: 20px;
      width: 100%;
      padding: 20px;
      background: var(--color-fill-1);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--color-text-2);
        justify-content: center;

        .arco-icon {
          font-size: 16px;
          color: var(--color-text-3);
        }
      }
    }
  }

  .explorer-mode {
    width: 1200px;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    min-height: 500px;
    max-height: 85vh;
  }

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
        margin-bottom: 12px;
      }
      .subtitle {
        font-size: 12px;
        color: var(--color-text-3);
        display: flex;
        align-items: center;
        gap: 16px;

        .expire-time {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--color-text-2);
          padding: 2px 8px;
          background: var(--color-fill-2);
          border-radius: 4px;
        }
      }
    }
  }

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
    position: relative;
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
    .verify-mode,
    .error-mode,
    .expired-mode {
      width: 100%;
      max-width: 400px;
      padding: 32px 24px;
    }

    .error-mode,
    .expired-mode {
      padding: 40px 24px;
    }

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
