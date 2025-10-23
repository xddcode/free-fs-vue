<template>
  <div class="security-logs">
    <a-table
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :bordered="false"
      @page-change="handlePageChange"
    >
      <!-- 操作类型 -->
      <template #action="{ record }">
        <a-tag :color="getActionColor(record.action)">
          {{ record.action }}
        </a-tag>
      </template>

      <!-- IP地址 -->
      <template #ip="{ record }">
        <span class="ip-text">{{ record.ip }}</span>
      </template>

      <!-- 地理位置 -->
      <template #location="{ record }">
        <div class="location-text">
          <icon-location />
          <span>{{ record.location || '未知' }}</span>
        </div>
      </template>

      <!-- 操作系统 -->
      <template #os="{ record }">
        <div class="system-info">
          <icon-computer />
          <span>{{ record.os }}</span>
        </div>
      </template>

      <!-- 浏览器 -->
      <template #browser="{ record }">
        <div class="browser-info">
          <icon-apps />
          <span>{{ record.browser }}</span>
        </div>
      </template>

      <!-- 时间 -->
      <template #createdAt="{ record }">
        <span class="time-text">{{ formatTime(record.createdAt) }}</span>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, reactive } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import {
    IconLocation,
    IconComputer,
    IconApps,
  } from '@arco-design/web-vue/es/icon';
  import { getSecurityLogs } from '@/api/user';
  import type { SecurityLog } from '@/types/modules/user';
  import type { TableColumnData } from '@arco-design/web-vue';

  // 表格列定义
  const columns: TableColumnData[] = [
    {
      title: '操作类型',
      dataIndex: 'action',
      slotName: 'action',
      width: 120,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      slotName: 'ip',
      width: 150,
    },
    {
      title: '地理位置',
      dataIndex: 'location',
      slotName: 'location',
      width: 180,
    },
    {
      title: '操作系统',
      dataIndex: 'os',
      slotName: 'os',
      width: 150,
    },
    {
      title: '浏览器',
      dataIndex: 'browser',
      slotName: 'browser',
      width: 180,
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      slotName: 'createdAt',
      width: 180,
    },
  ];

  // 表格数据
  const tableData = ref<SecurityLog[]>([]);

  // 加载状态
  const loading = ref(false);

  // 分页配置
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: true,
    showPageSize: true,
    pageSizeOptions: [10, 20, 50, 100],
  });

  // 获取操作类型颜色
  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      登录: 'green',
      登出: 'gray',
      修改密码: 'orange',
      修改邮箱: 'blue',
      修改资料: 'blue',
      上传文件: 'cyan',
      下载文件: 'purple',
      删除文件: 'red',
    };
    return colorMap[action] || 'blue';
  };

  // 格式化时间
  const formatTime = (time: string) => {
    if (!time) return '-';
    const date = new Date(time);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 生成模拟数据
  const generateMockData = (): SecurityLog[] => {
    const actions = [
      '登录',
      '登出',
      '修改密码',
      '修改邮箱',
      '修改资料',
      '上传文件',
      '下载文件',
    ];
    const ips = [
      '192.168.1.100',
      '10.0.0.50',
      '172.16.0.1',
      '203.0.113.45',
      '198.51.100.23',
    ];
    const locations = [
      '中国 北京',
      '中国 上海',
      '中国 广东',
      '中国 浙江',
      '美国 加利福尼亚',
    ];
    const oses = [
      'Windows 10',
      'Windows 11',
      'macOS 13.0',
      'Ubuntu 22.04',
      'iOS 16.0',
    ];
    const browsers = [
      'Chrome 120.0',
      'Firefox 121.0',
      'Safari 17.0',
      'Edge 120.0',
      'Opera 106.0',
    ];

    const mockData: SecurityLog[] = [];
    const now = Date.now();

    for (let i = 0; i < 20; i += 1) {
      mockData.push({
        id: `log-${i + 1}`,
        userId: 'user-1',
        action: actions[Math.floor(Math.random() * actions.length)],
        ip: ips[Math.floor(Math.random() * ips.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        os: oses[Math.floor(Math.random() * oses.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        createdAt: new Date(
          now - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    }

    // 按时间倒序排列
    return mockData.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  // 加载数据
  const loadData = async () => {
    try {
      loading.value = true;

      const res = await getSecurityLogs({
        page: pagination.current,
        pageSize: pagination.pageSize,
      });

      tableData.value = res.data.list || [];
      pagination.total = res.data.total || 0;
    } catch (error: any) {
      Message.error(error.message || '加载日志失败');
      // 使用模拟数据
      tableData.value = generateMockData();
      pagination.total = tableData.value.length;
    } finally {
      loading.value = false;
    }
  };

  // 页码变化
  const handlePageChange = (page: number) => {
    pagination.current = page;
    loadData();
  };

  // 组件挂载时加载数据
  onMounted(() => {
    loadData();
  });
</script>

<style scoped lang="less">
  .security-logs {
    padding: 24px;

    .ip-text {
      font-family: 'Courier New', monospace;
      color: #4e5969;
      font-size: 13px;
    }

    .location-text,
    .system-info,
    .browser-info {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #4e5969;

      :deep(.arco-icon) {
        font-size: 14px;
        color: #86909c;
      }

      span {
        font-size: 13px;
      }
    }

    .time-text {
      color: #86909c;
      font-size: 13px;
    }

    :deep(.arco-table) {
      border-radius: 8px;
    }

    :deep(.arco-table-th) {
      background-color: #f7f8fa;
      font-weight: 600;
      color: #1d2129;
    }

    :deep(.arco-table-td) {
      color: #4e5969;
    }

    :deep(.arco-tag) {
      border-radius: 4px;
      font-weight: 500;
    }

    :deep(.arco-pagination) {
      margin-top: 16px;
    }
  }
</style>
