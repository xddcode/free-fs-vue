import { defineStore } from 'pinia';
import { ref } from 'vue';
import { uploadService } from '@/services/upload.service';
import transferWebSocketService from '@/services/transfer-websocket.service';

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

let taskIdCounter = 0;

/**
 * 上传任务Store
 * 简化版：只负责UI状态管理，不处理实际上传逻辑
 * 实际上传由uploadService处理，状态由WebSocket推送
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
   * 只负责添加到UI列表并调用上传服务
   */
  const addUploadTasks = async (files: File[], parentId: string) => {
    // 确保WebSocket已连接
    if (!transferWebSocketService.isConnected()) {
      transferWebSocketService.connect();
    }

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

    // 添加到UI列表
    const newTasks: UploadTask[] = newFiles.map((file) => {
      taskIdCounter += 1;
      return {
        id: `upload-task-${taskIdCounter}`,
        file,
        fileName: file.name,
        fileSize: file.size,
        status: 'pending',
        progress: 0,
        parentId,
      };
    });
    taskList.value.push(...newTasks);

    // 并发调用上传服务，确保所有文件同时开始上传
    Promise.all(
      newTasks.map(async (task) => {
        task.status = 'uploading';
        const result = await uploadService.uploadFile({
          file: task.file,
          parentId: task.parentId || undefined,
        });

        if (result.success && result.taskId) {
          // 任务已提交，等待WebSocket推送状态和进度
          task.taskId = result.taskId;

          // 订阅进度更新（包括初始化和分片上传的所有状态）
          transferWebSocketService.subscribe(result.taskId, {
            onProgress: (data) => {
              task.progress = Math.round(data.progress);
            },
            onComplete: () => {
              task.status = 'success';
              task.progress = 100;
            },
            onError: (message) => {
              task.status = 'error';
              task.errorMessage = message;
            },
          });
        } else {
          task.status = 'error';
          task.errorMessage = result.message || '上传失败';
        }
      })
    ).catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[上传任务] 批量上传出错:', error);
    });
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

  return {
    taskList,
    isExpanded,
    showPanel,
    addUploadTasks,
    toggleExpand,
    closePanel,
  };
});
