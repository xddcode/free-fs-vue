import { ref, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import { useRoute } from 'vue-router';
import { getFileList } from '@/api/file';
import type { FileItem, FileType, SortOrder } from '@/types/modules/file';

/**
 * 文件列表管理 Hook
 * 负责文件列表的数据获取、排序等功能
 */
export default function useFileList() {
  const route = useRoute();

  // 状态管理
  const loading = ref(false);
  const fileList = ref<FileItem[]>([]);
  const total = ref(0);
  const currentParentId = ref<string | undefined>(undefined);
  const orderBy = ref('updateTime');
  const orderDirection = ref<SortOrder>('DESC');
  const searchKeyword = ref('');

  /**
   * 获取文件列表
   */
  const fetchFileList = async () => {
    if (loading.value) return;

    loading.value = true;
    try {
      const response = await getFileList({
        orderBy: orderBy.value,
        orderDirection: orderDirection.value,
        parentId: currentParentId.value,
        keyword: searchKeyword.value || undefined,
        fileType: route.query.type as FileType | undefined,
      });

      const result = response.data;

      if (result) {
        fileList.value = result || [];
        total.value = result.length || 0;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('获取文件列表失败:', error);
      Message.error('获取文件列表失败');
      fileList.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 进入文件夹
   * @param folderId 文件夹ID
   */
  const enterFolder = (folderId: string) => {
    currentParentId.value = folderId;
    fetchFileList();
  };

  /**
   * 返回上级目录
   */
  const goBack = () => {
    // TODO: 实现面包屑导航后，这里需要根据路径栈来返回
    currentParentId.value = undefined;
    fetchFileList();
  };

  /**
   * 刷新列表
   */
  const refresh = () => {
    fetchFileList();
  };

  /**
   * 搜索文件
   */
  const search = () => {
    fetchFileList();
  };

  /**
   * 处理排序变化
   */
  const handleSortChange = (
    field: string,
    direction: 'ascend' | 'descend' | ''
  ) => {
    if (direction) {
      orderBy.value = field;
      orderDirection.value = direction === 'ascend' ? 'ASC' : 'DESC';
    } else {
      // 取消排序，恢复默认
      orderBy.value = 'updateTime';
      orderDirection.value = 'DESC';
    }
    fetchFileList();
  };

  /**
   * 监听路由变化，重新加载数据
   */
  watch(
    () => route.query.type,
    () => {
      fetchFileList();
    }
  );

  return {
    // 状态
    loading,
    fileList,
    total,
    currentParentId,
    orderBy,
    orderDirection,
    searchKeyword,

    // 方法
    fetchFileList,
    enterFolder,
    goBack,
    refresh,
    search,
    handleSortChange,
  };
}
