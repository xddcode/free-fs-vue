import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFileList, getFolderPath } from '@/api/file';
import type { FileItem, FileType, SortOrder } from '@/types/modules/file';

/**
 * 面包屑路径项
 */
export interface BreadcrumbItem {
  id: string;
  name: string;
}

/**
 * 文件列表管理 Hook
 * 负责文件列表的数据获取、排序等功能
 */
export default function useFileList() {
  const route = useRoute();
  const router = useRouter();

  // 状态管理
  const loading = ref(false);
  const fileList = ref<FileItem[]>([]);
  const total = ref(0);
  const currentParentId = ref<string | undefined>(undefined);
  const orderBy = ref('updateTime');
  const orderDirection = ref<SortOrder>('DESC');
  const searchKeyword = ref('');
  const breadcrumbPath = ref<BreadcrumbItem[]>([]);

  /**
   * 更新面包屑路径
   */
  const updateBreadcrumbPath = async () => {
    if (!currentParentId.value) {
      breadcrumbPath.value = [];
      return;
    }

    try {
      const response = await getFolderPath(currentParentId.value);
      if (response.data) {
        // 将路径转换为面包屑格式
        breadcrumbPath.value = response.data.map((item) => ({
          id: item.id,
          name: item.displayName,
        }));
      }
    } catch {
      // 如果获取路径失败，只显示当前文件夹
      breadcrumbPath.value = [];
    }
  };

  /**
   * 获取文件列表
   */
  const fetchFileList = async () => {
    if (loading.value) return;

    loading.value = true;
    try {
      // 判断是否是收藏视图
      const isFavoritesView = route.query.view === 'favorites';

      const response = await getFileList({
        orderBy: orderBy.value,
        orderDirection: orderDirection.value,
        parentId: currentParentId.value,
        keyword: searchKeyword.value || undefined,
        fileType: route.query.type as FileType | undefined,
        isFavorite: isFavoritesView ? true : undefined,
      });

      const result = response.data;

      if (result) {
        fileList.value = result || [];
        total.value = result.length || 0;
      }

      // 收藏视图不需要面包屑，普通视图需要更新面包屑路径
      if (isFavoritesView) {
        breadcrumbPath.value = [];
      } else {
        await updateBreadcrumbPath();
      }
    } catch {
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
  const enterFolder = (folderId: string, viewMode: string) => {
    // 更新 URL query 参数
    router.push({
      query: {
        ...route.query,
        parentId: folderId,
        viewMode,
      },
    });
  };

  /**
   * 返回上级目录
   */
  const goBack = () => {
    // 移除 parentId 参数
    const query = { ...route.query };
    delete query.parentId;
    router.push({ query });
  };

  /**
   * 导航到指定文件夹
   * @param folderId 文件夹ID，如果为空则返回根目录
   */
  const navigateToFolder = (folderId?: string) => {
    if (!folderId) {
      // 返回根目录
      const query = { ...route.query };
      delete query.parentId;
      router.push({ query });
    } else {
      // 进入指定文件夹
      router.push({
        query: {
          ...route.query,
          parentId: folderId,
        },
      });
    }
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
   * 从 URL 同步 parentId 到状态
   */
  const syncParentIdFromRoute = () => {
    const parentIdFromRoute = route.query.parentId as string | undefined;
    currentParentId.value = parentIdFromRoute;
  };

  /**
   * 监听路由变化，同步状态并重新加载数据
   */
  watch(
    () => [route.query.type, route.query.parentId],
    () => {
      syncParentIdFromRoute();
      fetchFileList();
    }
  );

  /**
   * 初始化时从 URL 同步状态
   */
  onMounted(() => {
    syncParentIdFromRoute();
  });

  return {
    // 状态
    loading,
    fileList,
    total,
    currentParentId,
    orderBy,
    orderDirection,
    searchKeyword,
    breadcrumbPath,

    // 方法
    fetchFileList,
    enterFolder,
    goBack,
    navigateToFolder,
    refresh,
    search,
    handleSortChange,
  };
}
