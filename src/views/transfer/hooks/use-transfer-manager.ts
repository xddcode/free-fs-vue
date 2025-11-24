import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Message, Modal } from '@arco-design/web-vue';
import {
  getTransferFiles,
  pauseUpload,
  resumeUpload,
  cancelUpload,
} from '@/api/transfer';
import transferWebSocketService from '@/services/transfer-websocket.service';
import {
  UploadTaskStatus,
  type FileUploadTaskVO,
} from '@/types/modules/transfer';

export function useTransferManager() {
  const loading = ref(false);
  const transferList = ref<FileUploadTaskVO[]>([]);
  const subscribedTasks = new Set<string>();
  let refreshTimer: number | null = null;

  async function fetchTransferList() {
    try {
      loading.value = true;
      const response = await getTransferFiles();

      // 去重：如果后端返回了重复的任务，只保留已上传分片数最多的那个
      const taskMap = new Map<string, any>();
      response.data.forEach((item) => {
        const existing = taskMap.get(item.taskId);
        if (
          !existing ||
          item.uploadedChunks > existing.uploadedChunks ||
          // 如果已上传分片数相同，保留状态更靠前的（uploading > paused > completed）
          (item.uploadedChunks === existing.uploadedChunks &&
            item.status === UploadTaskStatus.UPLOADING)
        ) {
          taskMap.set(item.taskId, item);
        }
      });

      // 保存旧的任务列表，用于状态转换时保留进度
      const oldTransferList = transferList.value;

      transferList.value = Array.from(taskMap.values()).map((item) => {
        // 查找之前是否已存在该任务
        const existingTask = oldTransferList.find(
          (t) => t.taskId === item.taskId
        );

        // 计算进度百分比
        const progress =
          item.totalChunks > 0
            ? Math.round((item.uploadedChunks / item.totalChunks) * 100)
            : 0;

        // 如果任务状态是暂停，且之前存在该任务且也是暂停状态，保留之前的进度值
        // 这样可以避免后端返回不准确的 uploadedChunks 导致进度跳动
        let finalProgress = progress;
        if (
          item.status === UploadTaskStatus.PAUSED &&
          existingTask &&
          existingTask.progress !== undefined
        ) {
          // 暂停状态下，保留之前的进度值（无论之前是什么状态）
          finalProgress = existingTask.progress;
        }

        // 如果本地状态是取消中，但后端还没有更新，保留取消中状态
        // 如果后端已经返回 CANCELLING 或 CANCELED，则使用后端状态
        let finalStatus = item.status;
        if (
          existingTask &&
          existingTask.status === UploadTaskStatus.CANCELLING &&
          item.status !== UploadTaskStatus.CANCELLING &&
          item.status !== UploadTaskStatus.CANCELED
        ) {
          // 保留取消中状态，直到后端确认已取消
          finalStatus = UploadTaskStatus.CANCELLING;
          // 同时保留进度值，避免进度条继续显示
          if (existingTask.progress !== undefined) {
            finalProgress = existingTask.progress;
          }
        }

        return {
          ...item,
          status: finalStatus,
          progress: finalProgress,
        };
      });
    } catch (error) {
      Message.error('获取传输列表失败');
    } finally {
      loading.value = false;
    }
  }

  function subscribeActiveTasksUpdates() {
    // 确保WebSocket已连接
    if (!transferWebSocketService.isConnected()) {
      transferWebSocketService.connect();
    }

    // 为所有活动任务订阅WebSocket进度更新
    transferList.value.forEach((task) => {
      if (
        task.status === UploadTaskStatus.INITIALIZED ||
        task.status === UploadTaskStatus.CHECKING ||
        task.status === UploadTaskStatus.UPLOADING ||
        task.status === UploadTaskStatus.PAUSED ||
        task.status === UploadTaskStatus.MERGING ||
        task.status === UploadTaskStatus.CANCELLING
      ) {
        // 避免重复订阅
        if (subscribedTasks.has(task.taskId)) {
          return;
        }
        subscribedTasks.add(task.taskId);

        transferWebSocketService.subscribe(task.taskId, {
          onInitialized: () => {
            // 初始化状态
          },
          onChecking: () => {
            // 校验中状态
          },
          onQuickUpload: async () => {
            subscribedTasks.delete(task.taskId);
            await fetchTransferList();
            subscribeActiveTasksUpdates();
          },
          onReadyToUpload: () => {
            // 准备上传
          },
          onProgress: (data) => {
            // 实时更新任务进度
            const targetTask = transferList.value.find(
              (t) => t.taskId === task.taskId
            );
            if (targetTask) {
              targetTask.uploadedChunks = data.uploadedChunks;
              // 更新总分片数（如果后端修正了的话）
              if (data.totalChunks) {
                targetTask.totalChunks = data.totalChunks;
              }
              // 确保进度不超过100%
              targetTask.progress = Math.min(100, Math.round(data.progress));
              if (data.speed !== undefined) {
                targetTask.speed = data.speed;
              }
              if (data.remainTime !== undefined) {
                targetTask.remainTime = data.remainTime;
              }
              if (data.uploadedSize !== undefined) {
                targetTask.uploadedSize = data.uploadedSize;
              }
            }
          },
          onPaused: async () => {
            await fetchTransferList();
          },
          onResumed: async () => {
            await fetchTransferList();
          },
          onMerging: () => {
            // 合并中状态
          },
          onCancelling: async () => {
            // 更新任务状态为取消中
            const targetTask = transferList.value.find(
              (t) => t.taskId === task.taskId
            );
            if (targetTask) {
              targetTask.status = UploadTaskStatus.CANCELLING;
            }
            // 不立即刷新列表，避免后端状态还没更新时覆盖取消中状态
            // 等待后端推送 cancelled 消息时再刷新
          },
          onComplete: async () => {
            subscribedTasks.delete(task.taskId);
            await fetchTransferList();
            subscribeActiveTasksUpdates();
          },
          onError: async (errorMsg) => {
            subscribedTasks.delete(task.taskId);
            // 更新任务状态为失败，并显示错误信息
            const targetTask = transferList.value.find(
              (t) => t.taskId === task.taskId
            );
            if (targetTask) {
              targetTask.status = UploadTaskStatus.FAILED;
              targetTask.errorMsg = errorMsg;
            }
            await fetchTransferList();
            subscribeActiveTasksUpdates();
          },
          onCancelled: async () => {
            subscribedTasks.delete(task.taskId);
            await fetchTransferList();
            subscribeActiveTasksUpdates();
          },
        });
      }
    });
  }

  const uploadingTasks = computed(() =>
    transferList.value.filter((t) =>
      [
        UploadTaskStatus.INITIALIZED,
        UploadTaskStatus.CHECKING,
        UploadTaskStatus.UPLOADING,
        UploadTaskStatus.PAUSED,
        UploadTaskStatus.MERGING,
        UploadTaskStatus.CANCELLING,
      ].includes(t.status)
    )
  );

  /** 已完成的任务 */
  const completedTasks = computed(() =>
    transferList.value.filter((t) =>
      [UploadTaskStatus.COMPLETED, UploadTaskStatus.FAILED].includes(t.status)
    )
  );

  // 动作处理
  const actions = {
    pause: async (task: FileUploadTaskVO) => {
      await pauseUpload(task.taskId);
      Message.success('已暂停');
      await fetchTransferList();
    },
    resume: async (task: FileUploadTaskVO) => {
      await resumeUpload(task.taskId);
      Message.success('已恢复');
      await fetchTransferList();
    },
    cancel: (task: FileUploadTaskVO) => {
      Modal.confirm({
        title: '确认取消',
        content: '确定要取消此任务吗？',
        onOk: async () => {
          await cancelUpload(task.taskId);
          Message.success('已取消');
          await fetchTransferList();
        },
      });
    },
    refresh: async () => {
      await fetchTransferList();
      subscribeActiveTasksUpdates();
    },
  };

  // 生命周期管理
  function startAutoRefresh() {
    // 立即获取一次
    fetchTransferList().then(() => {
      subscribeActiveTasksUpdates();
    });

    // 定时检查新任务
    refreshTimer = window.setInterval(async () => {
      // 只有在有活动任务时才轮询
      const hasActiveTasks = uploadingTasks.value.length > 0;

      if (hasActiveTasks) {
        const currentTaskIds = new Set(transferList.value.map((t) => t.taskId));
        await fetchTransferList();

        // 检查是否有新任务，如果有则重新订阅
        const hasNewTasks = transferList.value.some(
          (t) => !currentTaskIds.has(t.taskId)
        );
        if (hasNewTasks) {
          subscribeActiveTasksUpdates();
        }
      }
    }, 3000); // 每3秒检查一次
  }
  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  onMounted(() => startAutoRefresh());
  onUnmounted(() => stopAutoRefresh());

  return {
    loading,
    transferList,
    uploadingTasks,
    completedTasks,
    actions,
  };
}

export default useTransferManager;
