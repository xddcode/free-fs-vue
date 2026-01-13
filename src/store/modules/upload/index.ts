import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useTransferStore } from '@/store/modules/transfer';

/**
 * 上传任务（仅用于UI展示）
 */
export interface UploadTask {
  id: string | number;
  file: File;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  parentId: string | null;
  errorMessage?: string;
  taskId?: string; // 服务端任务ID
}

/**
 * 上传任务Store
 * 简化版：只负责UI状态管理，实际上传由 Transfer Store 处理
 */
export const useUploadTaskStore = defineStore('uploadTask', () => {
  // 任务列表（仅用于上传面板UI展示）
  const taskList = ref<UploadTask[]>([]);
  // 面板是否展开
  const isExpanded = ref(false);
  // 是否显示面板
  const showPanel = ref(false);

  /**
   * 添加上传任务
   * 调用 Transfer Store 处理实际上传
   */
  const addUploadTasks = async (files: File[], parentId: string) => {
    const transferStore = useTransferStore();

    // 显示上传面板
    if (!showPanel.value) {
      showPanel.value = true;
      isExpanded.value = true;
    }

    // 过滤重复文件
    const existingFingerprints = new Set(
      taskList.value.map((task) => {
        const { file } = task;
        return `${file.name}-${file.size}-${file.lastModified}`;
      })
    );

    const newFiles = files.filter((file) => {
      const fingerprint = `${file.name}-${file.size}-${file.lastModified}`;
      if (existingFingerprints.has(fingerprint)) {
        return false;
      }
      existingFingerprints.add(fingerprint);
      return true;
    });

    if (newFiles.length === 0) {
      return;
    }

    // 并发调用 Transfer Store 创建任务
    await Promise.all(
      newFiles.map(async (file) => {
        try {
          const taskId = await transferStore.createTask(file, parentId);

          // 添加到UI列表
          const uiTask: UploadTask = {
            id: taskId,
            file,
            fileName: file.name,
            fileSize: file.size,
            status: 'uploading',
            progress: 0,
            parentId,
            taskId,
          };
          taskList.value.push(uiTask);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[上传任务] 创建任务失败:', error);
        }
      })
    );
  };

  /**
   * 更新任务状态（由 Transfer Store 的状态变化触发）
   */
  const updateTaskStatus = (
    taskId: string,
    status: 'uploading' | 'success' | 'error',
    progress?: number,
    errorMessage?: string
  ) => {
    const task = taskList.value.find((t) => t.taskId === taskId);
    if (task) {
      task.status = status;
      if (progress !== undefined) {
        task.progress = progress;
      }
      if (errorMessage) {
        task.errorMessage = errorMessage;
      }
    }
  };

  // 展开/收起
  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
  };

  // 关闭/清空
  const closePanel = () => {
    showPanel.value = false;
    taskList.value = [];
  };

  // 计算属性：是否有正在上传的任务
  const hasUploadingTasks = computed(() =>
    taskList.value.some((t) => t.status === 'uploading')
  );

  return {
    taskList,
    isExpanded,
    showPanel,
    hasUploadingTasks,
    addUploadTasks,
    updateTaskStatus,
    toggleExpand,
    closePanel,
  };
});
