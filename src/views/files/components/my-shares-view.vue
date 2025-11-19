<template>
  <div class="my-shares-view">
    <!-- 工具栏 -->
    <div class="shares-toolbar">
      <div class="toolbar-left">
        <a-button
          v-if="selectedKeys.length > 0"
          size="large"
          status="danger"
          @click="handleBatchCancel"
        >
          <template #icon>
            <icon-delete />
          </template>
          取消分享
        </a-button>
      </div>
      <div class="toolbar-right">
        <a-input-search
          v-model="searchKeyword"
          allow-clear
          placeholder="搜索分享名称"
          size="large"
          style="width: 320px"
          @clear="handleSearch"
          @search="handleSearch"
        />
        <a-button size="large" @click="handleRefresh">
          <icon-refresh />
        </a-button>
      </div>
    </div>

    <!-- 标题栏 -->
    <div class="shares-header">
      <a-breadcrumb>
        <a-breadcrumb-item>
          <span class="breadcrumb-link is-current">
            <icon-share-alt />
            我的分享
          </span>
        </a-breadcrumb-item>
      </a-breadcrumb>
      <div class="header-info">共 {{ shareList.length }} 个分享</div>
    </div>

    <!-- 表格 -->
    <div class="shares-content">
      <a-spin :loading="loading" style="width: 100%; min-height: 400px">
        <a-empty
          v-if="!loading && shareList.length === 0"
          description="暂无分享"
        />

        <a-table
          v-else
          v-model:selected-keys="selectedKeys"
          row-key="id"
          :bordered="false"
          :data="shareList"
          :pagination="false"
          :row-selection="{
            type: 'checkbox',
            showCheckedAll: true,
          }"
          :row-class="() => 'share-row'"
          :default-sorter="{ field: 'createdAt', direction: 'descend' }"
          @change="handleTableChange"
        >
          <template #columns>
            <!-- 名称列 -->
            <a-table-column title="名称" data-index="shareName" :width="300">
              <template #cell="{ record }">
                <div class="share-name-cell">
                  <icon-link :size="18" class="share-icon" />
                  <span class="share-name">{{ record.shareName }}</span>
                </div>
              </template>
            </a-table-column>

            <!-- 有效期列 -->
            <a-table-column title="有效期" data-index="expireTime" :width="180">
              <template #cell="{ record }">
                <span
                  v-if="record.isPermanent === true"
                  class="expire-tag permanent"
                >
                  <icon-clock-circle :size="14" />
                  永久有效
                </span>
                <span v-else-if="!record.expireTime" class="expire-text">
                  -
                </span>
                <span
                  v-else
                  :class="[
                    'expire-text',
                    { expired: isExpired(record.expireTime) },
                  ]"
                >
                  {{ formatExpireTime(record.expireTime) }}
                </span>
              </template>
            </a-table-column>

            <!-- 查看次数列 -->
            <a-table-column
              title="查看次数"
              data-index="viewCount"
              :width="120"
              align="center"
            >
              <template #cell="{ record }">
                <span class="count-text">
                  {{ record.viewCount }}
                  <span v-if="record.maxViewCount > 0" class="count-max">
                    / {{ record.maxViewCount }}
                  </span>
                </span>
              </template>
            </a-table-column>

            <!-- 下载次数列 -->
            <a-table-column
              title="下载次数"
              data-index="downloadCount"
              :width="120"
              align="center"
            >
              <template #cell="{ record }">
                <span class="count-text">
                  {{ record.downloadCount }}
                  <span v-if="record.maxDownloadCount > 0" class="count-max">
                    / {{ record.maxDownloadCount }}
                  </span>
                </span>
              </template>
            </a-table-column>

            <!-- 创建时间列 -->
            <a-table-column
              title="创建时间"
              data-index="createdAt"
              :width="180"
              :sortable="{
                sortDirections: ['ascend', 'descend'],
              }"
            >
              <template #cell="{ record }">
                <span class="time-text">
                  {{ formatTime(record.createdAt) }}
                </span>
              </template>
            </a-table-column>

            <!-- 操作列 -->
            <a-table-column title="操作" :width="250" align="center">
              <template #cell="{ record }">
                <div class="share-actions">
                  <a-tooltip content="快捷复制">
                    <a-button
                      size="small"
                      type="text"
                      @click.stop="handleQuickCopy(record)"
                    >
                      <icon-copy />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip content="查看详情">
                    <a-button
                      size="small"
                      type="text"
                      @click.stop="handleViewShare(record)"
                    >
                      <icon-eye />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip content="查看访问记录">
                    <a-button
                      size="small"
                      type="text"
                      @click.stop="handleViewAccessRecords(record)"
                    >
                      <icon-file />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip content="取消分享">
                    <a-button
                      :disabled="!record.id && !record.shareCode"
                      size="small"
                      type="text"
                      status="danger"
                      @click.stop="handleCancelShare(record)"
                    >
                      <template #icon>
                        <icon-delete />
                      </template>
                    </a-button>
                  </a-tooltip>
                </div>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </a-spin>
    </div>

    <!-- 查看分享弹窗 -->
    <a-modal
      v-model:visible="shareDetailVisible"
      title="分享详情"
      :footer="false"
      width="600px"
    >
      <a-spin :loading="shareDetailLoading" style="width: 100%; min-height: 200px">
        <div v-if="currentShare" class="share-detail">
          <a-descriptions :column="1" bordered>
          <a-descriptions-item label="分享名称">
            {{ currentShare.shareName }}
          </a-descriptions-item>
          <a-descriptions-item v-if="getShareUrl(currentShare)" label="分享链接">
            <div class="detail-item">
              <span class="detail-text">{{ getShareUrl(currentShare) }}</span>
              <a-button
                type="text"
                size="small"
                @click="handleCopyLink(getShareUrl(currentShare)!)"
              >
                <template #icon>
                  <icon-copy />
                </template>
                复制
              </a-button>
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="提取码">
            <div class="detail-item">
              <span class="detail-code">{{
                currentShare.shareCode || '-'
              }}</span>
              <a-button
                v-if="currentShare.shareCode"
                type="text"
                size="small"
                @click="handleCopyCode(currentShare.shareCode)"
              >
                <template #icon>
                  <icon-copy />
                </template>
                复制
              </a-button>
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="有效期">
            <span v-if="currentShare.isPermanent === true">永久有效</span>
            <span v-else-if="!currentShare.expireTime">-</span>
            <span v-else>{{ formatExpireTime(currentShare.expireTime) }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="查看次数">
            {{ currentShare.viewCount }}
            <span v-if="currentShare.maxViewCount > 0">
              / {{ currentShare.maxViewCount }}
            </span>
          </a-descriptions-item>
          <a-descriptions-item label="下载次数">
            {{ currentShare.downloadCount }}
            <span v-if="currentShare.maxDownloadCount > 0">
              / {{ currentShare.maxDownloadCount }}
            </span>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ formatDateTime(currentShare.createdAt) }}
          </a-descriptions-item>
        </a-descriptions>
        </div>
      </a-spin>
    </a-modal>

    <!-- 访问记录抽屉 -->
    <a-drawer
      v-model:visible="accessRecordsVisible"
      :title="`访问记录 - ${currentShareForRecords?.shareName || ''}`"
      :width="700"
      :footer="false"
    >
      <a-spin :loading="accessRecordsLoading" style="width: 100%">
        <div v-if="accessRecords.length === 0 && !accessRecordsLoading" class="empty-records">
          <a-empty description="暂无访问记录" />
        </div>
        <a-table
          v-else
          :data="accessRecords"
          :pagination="false"
          :bordered="false"
          size="small"
        >
          <template #columns>
            <a-table-column title="访问IP" data-index="accessIp" :width="120" />
            <a-table-column title="访问地址" data-index="accessAddress" :width="180">
              <template #cell="{ record }">
                <span class="access-address">{{ record.accessAddress || '-' }}</span>
              </template>
            </a-table-column>
            <a-table-column title="浏览器" data-index="browser" :width="120">
              <template #cell="{ record }">
                <span>{{ record.browser || '-' }}</span>
              </template>
            </a-table-column>
            <a-table-column title="操作系统" data-index="os" :width="120">
              <template #cell="{ record }">
                <span>{{ record.os || '-' }}</span>
              </template>
            </a-table-column>
            <a-table-column title="访问时间" data-index="accessTime" :width="150">
              <template #cell="{ record }">
                <span>{{ formatDateTime(record.accessTime) }}</span>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </a-spin>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { Message, Modal } from '@arco-design/web-vue';
  import {
    IconRefresh,
    IconLink,
    IconClockCircle,
    IconEye,
    IconDelete,
    IconCopy,
    IconShareAlt,
    IconFile,
  } from '@arco-design/web-vue/es/icon';
  import {
    getMyShareList,
    cancelShares,
    getShareDetailById,
    getShareAccessRecords,
  } from '@/api/share';
  import type { ShareItem, ShareAccessRecord } from '@/types/modules/share';
  import { formatTime, formatDateTime } from '@/utils/format';
  import dayjs from 'dayjs';

  // 搜索关键词
  const searchKeyword = ref('');

  // 加载状态
  const loading = ref(false);

  // 分享列表
  const shareList = ref<ShareItem[]>([]);

  // 选中的分享ID列表
  const selectedKeys = ref<string[]>([]);

  // 排序配置
  const sortConfig = ref({
    orderBy: 'createdAt',
    orderDirection: 'DESC' as 'ASC' | 'DESC',
  });

  // 当前查看的分享
  const currentShare = ref<ShareItem | null>(null);
  const shareDetailVisible = ref(false);
  const shareDetailLoading = ref(false);

  // 访问记录相关
  const accessRecordsVisible = ref(false);
  const accessRecordsLoading = ref(false);
  const accessRecords = ref<ShareAccessRecord[]>([]);
  const currentShareForRecords = ref<ShareItem | null>(null);

  /**
   * 对列表进行排序
   */
  const sortList = (list: ShareItem[]) => {
    const { orderBy, orderDirection } = sortConfig.value;
    return [...list].sort((a, b) => {
      let aValue: any = a[orderBy as keyof ShareItem];
      let bValue: any = b[orderBy as keyof ShareItem];

      // 处理日期类型
      if (orderBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (orderDirection === 'ASC') {
        if (aValue > bValue) return 1;
        if (aValue < bValue) return -1;
        return 0;
      }
      if (aValue < bValue) return 1;
      if (aValue > bValue) return -1;
      return 0;
    });
  };

  /**
   * 获取分享列表
   */
  const fetchShareList = async () => {
    loading.value = true;
    try {
      const res = await getMyShareList({
        keyword: searchKeyword.value || undefined,
        orderBy: sortConfig.value.orderBy,
        orderDirection: sortConfig.value.orderDirection,
      });
      shareList.value = res.data;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 处理搜索
   */
  const handleSearch = () => {
    fetchShareList();
  };

  /**
   * 处理刷新
   */
  const handleRefresh = () => {
    fetchShareList();
  };

  /**
   * 处理表格变化（排序）
   */
  const handleTableChange = (_data: any, extra: any) => {
    if (extra.type === 'sorter' && extra.sorter) {
      const { field, direction } = extra.sorter;
      if (direction) {
        sortConfig.value.orderBy = field;
        sortConfig.value.orderDirection =
          direction === 'ascend' ? 'ASC' : 'DESC';
      } else {
        // 取消排序，恢复默认排序
        sortConfig.value.orderBy = 'createdAt';
        sortConfig.value.orderDirection = 'DESC';
      }
      // 重新调用接口获取排序后的数据
      fetchShareList();
    }
  };

  /**
   * 判断是否已过期
   */
  const isExpired = (expireTime: string | null) => {
    if (!expireTime) return false;
    return dayjs(expireTime).isBefore(dayjs());
  };

  /**
   * 格式化过期时间
   * 显示规则：
   * - 已过期：显示"已过期"
   * - 不足1小时：显示"即将到期"
   * - 不足1天：显示"X小时后到期"
   * - 1天及以上：显示"X天后到期"
   */
  const formatExpireTime = (expireTime: string | null) => {
    if (!expireTime) return '-';

    const now = dayjs();
    const expireDate = dayjs(expireTime);

    // 已过期
    if (expireDate.isBefore(now)) {
      return '已过期';
    }

    // 计算剩余时间（小时）
    const hoursLeft = expireDate.diff(now, 'hour');

    // 不足1小时
    if (hoursLeft < 1) {
      return '即将到期';
    }

    // 不足1天
    if (hoursLeft < 24) {
      return `${hoursLeft}小时后到期`;
    }

    // 1天及以上
    const daysLeft = expireDate.diff(now, 'day');
    return `${daysLeft}天后到期`;
  };

  /**
   * 处理查看分享
   */
  const handleViewShare = async (share: ShareItem) => {
    shareDetailVisible.value = true;
    shareDetailLoading.value = true;
    try {
      const res = await getShareDetailById(share.id);
      currentShare.value = res.data;
    } catch (error) {
      Message.error('获取分享详情失败');
      shareDetailVisible.value = false;
    } finally {
      shareDetailLoading.value = false;
    }
  };

  /**
   * 处理查看访问记录
   */
  const handleViewAccessRecords = async (share: ShareItem) => {
    currentShareForRecords.value = share;
    accessRecordsVisible.value = true;
    accessRecordsLoading.value = true;
    accessRecords.value = [];
    try {
      const res = await getShareAccessRecords(share.id);
      accessRecords.value = res.data;
    } catch (error) {
      Message.error('获取访问记录失败');
      accessRecordsVisible.value = false;
    } finally {
      accessRecordsLoading.value = false;
    }
  };

  /**
   * 处理复制链接
   */
  const handleCopyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    Message.success('链接已复制到剪贴板');
  };

  /**
   * 处理复制提取码
   */
  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    Message.success('提取码已复制到剪贴板');
  };

  /**
   * 获取分享链接（如果后端返回了完整链接则使用，否则前端拼接）
   */
  const getShareUrl = (share: ShareItem) => {
    if (share.shareUrl) {
      return share.shareUrl;
    }
    if (share.id) {
      const baseUrl = window.location.origin;
      return `${baseUrl}/s/${share.id}`;
    }
    return null;
  };

  /**
   * 处理快捷复制
   * 格式：
   * 文件名
   * 链接
   * 提取码: xxx (如果有)
   */
  const handleQuickCopy = async (share: ShareItem) => {
    let content = share.shareName;

    const shareUrl = getShareUrl(share);
    if (shareUrl) {
      content += `\n${shareUrl}`;
    }

    if (share.shareCode) {
      content += `\n提取码: ${share.shareCode}`;
    }

    await navigator.clipboard.writeText(content);
    Message.success('已复制到剪贴板');
  };

  /**
   * 处理取消分享（单个）
   */
  const handleCancelShare = async (share: ShareItem) => {
    const shareId = share.id || share.shareCode;
    if (!shareId) {
      Message.warning('无法取消该分享');
      return;
    }

    Modal.confirm({
      title: '确认取消分享',
      content: `确定要取消分享 "${share.shareName}" 吗？取消后将无法恢复！`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: {
        status: 'danger',
      },
      onOk: async () => {
        try {
          await cancelShares([shareId]).then(() => {
            Message.success('取消成功');
            fetchShareList();
          });
        } catch (error) {
          Message.error('取消分享失败');
        }
      },
    });
  };

  /**
   * 处理批量取消分享
   */
  const handleBatchCancel = async () => {
    if (selectedKeys.value.length === 0) {
      Message.warning('请选择要取消的分享');
      return;
    }

    Modal.confirm({
      title: '确认批量取消',
      content: `确定要取消选中的 ${selectedKeys.value.length} 个分享吗？取消后将无法恢复！`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: {
        status: 'danger',
      },
      onOk: async () => {
        try {
          await cancelShares(selectedKeys.value).then(() => {
            Message.success(`成功取消 ${selectedKeys.value.length} 个分享`);
            selectedKeys.value = [];
            fetchShareList();
          });
        } catch (error) {
          Message.error('批量取消分享失败');
        }
      },
    });
  };

  // 初始化
  onMounted(() => {
    fetchShareList();
  });
</script>

<style lang="less" scoped>
  .my-shares-view {
    display: flex;
    flex-direction: column;
    height: 100%;

    .shares-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--color-border-2);
      background-color: var(--color-bg-2);

      .toolbar-left,
      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }

    .shares-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      border-bottom: 1px solid var(--color-border-2);
      background-color: var(--color-bg-2);

      :deep(.arco-breadcrumb-item) {
        cursor: default;
      }

      .breadcrumb-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--color-text-1);
        font-weight: 500;
        font-size: 14px;
      }

      .header-info {
        font-size: 14px;
        color: var(--color-text-3);
        white-space: nowrap;
      }
    }

    .shares-content {
      flex: 1;
      padding: 16px 24px;
      overflow: auto;

      :deep(.arco-table) {
        .arco-table-th {
          background-color: var(--color-fill-2);
          color: var(--color-text-2);
          font-weight: 500;
        }

        .share-row {
          transition: all 0.2s;

          &:hover {
            background-color: var(--color-fill-2);
          }
        }
      }

      .share-name-cell {
        display: flex;
        align-items: center;
        gap: 12px;

        .share-icon {
          color: rgb(var(--primary-6));
        }

        .share-name {
          flex: 1;
          font-size: 14px;
          font-weight: 400;
          color: var(--color-text-2);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .expire-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        font-weight: 500;

        &.permanent {
          color: rgb(var(--green-6));
        }
      }

      .expire-text {
        font-size: 14px;
        color: var(--color-text-3);

        &.expired {
          color: rgb(var(--red-6));
        }
      }

      .count-text {
        font-size: 14px;
        color: var(--color-text-2);

        .count-max {
          color: var(--color-text-3);
          font-size: 12px;
        }
      }

      .time-text {
        font-size: 14px;
        color: var(--color-text-3);
      }

      .share-actions {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }
    }

    .empty-records {
      padding: 40px 0;
    }

    .access-address {
      word-break: break-all;
    }

    .share-detail {
      .detail-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .detail-text {
          flex: 1;
          word-break: break-all;
          font-size: 14px;
          color: var(--color-text-2);
        }

        .detail-code {
          flex: 1;
          font-weight: 600;
          color: rgb(var(--primary-6));
          font-size: 16px;
          letter-spacing: 2px;
        }
      }
    }
  }
</style>
