<template>
  <div class="share-page-bg">
    <div class="bg-decoration"></div>

    <div class="main-container">
      <transition name="fade-slide" mode="out-in">
        <div v-if="isLoading" key="loading" class="loading-mode">
          <a-spin dot :size="24" />
          <p class="loading-text">正在获取分享信息...</p>
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
                <div class="subtitle"
                  >{{ shareData.expireTime }} 分享 -
                  {{ shareData.fileCount ?? 1 }} 个文件</div
                >
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
            <a-spin
              :loading="bodyLoading"
              style="width: 100%; min-height: 400px"
            >
              <file-list-view
                v-if="viewMode === 'list'"
                v-model:selected-keys="selectedKeys"
                v-model:view-mode="viewMode"
                :file-list="fileViewList"
                @row-click="handleFileClick"
                @refresh="fetchShareFile"
              />

              <file-grid-view
                v-else
                v-model:selected-keys="selectedKeys"
                v-model:view-mode="viewMode"
                :file-list="fileViewList"
                @file-click="handleFileClick"
                @refresh="fetchShareFile"
              />
            </a-spin>
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
  import { IconUser, IconLock, IconFolder } from '@arco-design/web-vue/es/icon';
  import {
    getShareDetail,
    getShareItemList,
    validateShareCode,
  } from '@/api/share';
  import { useRoute, useRouter } from 'vue-router';
  import { ShareThin } from '@/types/modules/share';
  import { FileItem } from '@/types/modules/file';

  const FileListView = defineAsyncComponent(
    () => import('@/views/files/components/file-list-view.vue')
  );
  const FileGridView = defineAsyncComponent(
    () => import('@/views/files/components/file-grid-view.vue')
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

  const shareData = ref<ShareThin>({
    id: '',
    shareName: '',
    expireTime: '',
    hasCheckCode: false,
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
        Message.success('验证通过');
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
    try {
      const shareToken = route.params.shareToken as string;
      const res = await getShareDetail(shareToken);
      shareData.value = res.data;
      if (!res.data.hasCheckCode) {
        isVerified.value = true;
      } else {
        const urlCode = route.query.shareCode as string;
        if (urlCode) {
          // 如果 URL 里有码，自动填充并尝试验证
          accessCode.value = urlCode;
          // 这里不加 await，让它静默执行，或者你可以加 loading 效果
          // handleVerify();
          // 或者不走验证接口直接修改变量即可
          isVerified.value = true;
        }
      }
    } finally {
      isLoading.value = false;
    }
  };

  const fileViewList = ref<FileItem[]>();
  const selectedKeys = ref<string[]>([]);
  /** 获取分享文件内容 */
  const fetchShareFile = async () => {
    if (!isVerified.value) return;
    bodyLoading.value = true;
    fileViewList.value = [];
    try {
      const shareToken = route.params.shareToken as string;
      const parentId = (route.query.parentId as string) || '';
      const res = await getShareItemList({
        shareId: shareToken,
        parentId,
      });
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
        margin-bottom: 4px;
      }
      .subtitle {
        font-size: 12px;
        color: var(--color-text-3);
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
