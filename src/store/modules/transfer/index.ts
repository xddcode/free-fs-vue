import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Message } from '@arco-design/web-vue';
import type {
  TransferTask,
  TaskStatus,
  ProgressUpdate,
  FileTransferTaskVO,
  SSEMessage,
} from '@/types/modules/transfer';
import { stateMachine } from '@/utils/transfer-state-machine';
import { progressCalculator } from '@/utils/progress-calculator';
import {
  getTransferFiles,
  pauseUpload,
  resumeUpload,
  cancelUpload,
  initUpload,
} from '@/api/transfer';
import { sseService } from '@/services/sse.service';
import { uploadExecutor } from '@/services/upload-executor';
import useUserStore from '@/store/modules/user';

/**
 * Transfer Store
 * 作为传输任务的单一数据源，管理所有任务状态
 */
export const useTransferStore = defineStore('transfer', () => {
  // ==================== State ====================

  /** 任务列表，使用 Map 存储以便快速查找 */
  const tasks = ref<Map<string, TransferTask>>(new Map());

  /** SSE 连接状态 */
  const sseConnected = ref(false);

  /** 当前上传批次 ID */
  const currentSessionId = ref<string | null>(null);

  /** 批次任务映射：sessionId -> taskId[] */
  const sessionTasks = ref<Map<string, string[]>>(new Map());

  /** SSE 消息处理器取消函数 */
  let sseMessageUnsubscribe: (() => void) | null = null;

  /** SSE 连接状态处理器取消函数 */
  let sseConnectionUnsubscribe: (() => void) | null = null;

  /** 文件缓存，用于重试时获取文件对象 */
  const fileCache = new Map<string, File>();

  /** 是否已初始化回调 */
  let callbacksInitialized = false;

  // ==================== 初始化上传执行器回调 ====================

  function initExecutorCallbacks(): void {
    if (callbacksInitialized) return;
    callbacksInitialized = true;

    uploadExecutor.setCallbacks({
      onTransition: (taskId: string, status: string) => {
        transitionTo(taskId, status as TaskStatus);
      },
      onProgress: (taskId: string, data) => {
        updateProgress(taskId, data);
      },
      onError: (taskId: string, errorMessage: string) => {
        setTaskError(taskId, errorMessage);
      },
    });
  }

  // ==================== Getters ====================

  /** 获取所有任务列表 */
  const taskList = computed(() => Array.from(tasks.value.values()));

  /** 获取正在上传的任务 */
  const uploadingTasks = computed(() =>
    taskList.value.filter(
      (task) =>
        task.status === 'uploading' ||
        task.status === 'checking' ||
        task.status === 'merging' ||
        task.status === 'initialized'
    )
  );

  /** 获取已完成的任务 */
  const completedTasks = computed(() =>
    taskList.value.filter((task) => task.status === 'completed')
  );

  /** 获取失败的任务 */
  const failedTasks = computed(() =>
    taskList.value.filter((task) => task.status === 'failed')
  );

  /** 获取已暂停的任务 */
  const pausedTasks = computed(() =>
    taskList.value.filter((task) => task.status === 'paused')
  );

  /** 获取已取消的任务 */
  const cancelledTasks = computed(() =>
    taskList.value.filter((task) => task.status === 'cancelled')
  );

  /** 获取当前批次的任务列表 */
  const currentSessionTasks = computed(() => {
    if (!currentSessionId.value) {
      return [];
    }
    const taskIds = sessionTasks.value.get(currentSessionId.value) || [];
    return taskIds
      .map((id) => tasks.value.get(id))
      .filter((task): task is TransferTask => task !== undefined);
  });

  /**
   * 获取并发上传数量配置
   * 从 User Store 读取用户配置，如果配置有效（1-3）则使用，否则使用默认值 3
   */
  const getConcurrency = computed(() => {
    const userStore = useUserStore();
    const settings = userStore.transferSetting;
    
    // 如果用户配置存在且有效（1-3），使用用户配置
    if (settings && 
        typeof settings.concurrentUploadQuantity === 'number' &&
        settings.concurrentUploadQuantity >= 1 && 
        settings.concurrentUploadQuantity <= 3) {
      return settings.concurrentUploadQuantity;
    }
    
    // 否则使用默认值
    return 3;
  });

  // ==================== Internal Helpers ====================

  /**
   * 将后端 VO 转换为前端 TransferTask
   */
  function convertVOToTask(vo: FileTransferTaskVO): TransferTask {
    const now = Date.now();
    
    // 确保进度值为整数，避免浮点精度问题
    const progress = vo.progress ?? 0;
    const formattedProgress = Math.round(progress);
    
    return {
      taskId: vo.taskId,
      fileName: vo.fileName,
      fileSize: vo.fileSize,
      status: vo.status as TaskStatus,
      progress: formattedProgress,
      uploadedBytes: vo.uploadedSize ?? 0,
      speed: vo.speed ?? 0,
      remainingTime: vo.remainTime ?? 0,
      errorMessage: vo.errorMsg,
      createdAt: vo.startTime ? new Date(vo.startTime).getTime() : now,
      updatedAt: now,
      parentId: vo.parentId,
      totalChunks: vo.totalChunks,
      uploadedChunks: vo.uploadedChunks,
      chunkSize: vo.chunkSize,
    };
  }

  // ==================== Core Actions (定义在前，被其他函数调用) ====================

  /**
   * 设置 SSE 连接状态
   * @param connected 是否已连接
   */
  function setSseConnected(connected: boolean): void {
    sseConnected.value = connected;
  }

  /**
   * 状态转换（调用状态机）
   * @param taskId 任务 ID
   * @param newStatus 目标状态
   * @returns 是否转换成功
   */
  function transitionTo(taskId: string, newStatus: TaskStatus): boolean {
    const task = tasks.value.get(taskId);
    if (!task) {
      // eslint-disable-next-line no-console
      console.warn(`[TransferStore] Task not found: ${taskId}`);
      return false;
    }

    // 如果已经是目标状态，跳过转换（优化）
    if (task.status === newStatus) {
      return true;
    }

    const updatedTask = stateMachine.transition(task, newStatus);
    if (updatedTask) {
      tasks.value.set(taskId, updatedTask);
      
      // 如果转换到 completed 状态，触发文件列表刷新事件
      if (newStatus === 'completed') {
        // 显示完成通知
        Message.success({
          content: `文件 "${task.fileName}" 上传完成`,
          duration: 3000,
        });
        
        // 触发文件上传完成事件，通知文件列表刷新
        window.dispatchEvent(
          new CustomEvent('file-upload-complete', {
            detail: { parentId: task.parentId },
          })
        );
        
        // 清理资源
        progressCalculator.clear(taskId);
        fileCache.delete(taskId);
      }
      
      return true;
    }

    return false;
  }

  /**
   * 设置任务错误信息
   * @param taskId 任务 ID
   * @param errorMessage 错误信息
   */
  function setTaskError(taskId: string, errorMessage: string): void {
    const task = tasks.value.get(taskId);
    if (task) {
      // 先转换到 failed 状态
      transitionTo(taskId, 'failed');
      // 更新错误信息
      const updatedTask = tasks.value.get(taskId);
      if (updatedTask) {
        tasks.value.set(taskId, {
          ...updatedTask,
          errorMessage,
        });
      }
    }
  }

  /**
   * 更新任务进度（调用进度计算器）
   * @param taskId 任务 ID
   * @param data 进度更新数据
   */
  function updateProgress(taskId: string, data: ProgressUpdate): void {
    const task = tasks.value.get(taskId);
    if (!task) {
      return;
    }

    // 更新进度计算器
    const shouldUpdate = progressCalculator.update(
      taskId,
      data.uploadedBytes,
      data.totalBytes
    );

    if (shouldUpdate) {
      // 获取平滑后的显示数据
      const displayData = progressCalculator.getDisplayData(taskId);

      // 更新任务数据
      const updatedTask: TransferTask = {
        ...task,
        uploadedBytes: data.uploadedBytes,
        progress: displayData.progress,
        speed: displayData.speed,
        remainingTime: displayData.remainingTime,
        updatedAt: Date.now(),
      };

      // 更新分片信息（如果有）
      if (data.uploadedChunks !== undefined) {
        updatedTask.uploadedChunks = data.uploadedChunks;
      }
      if (data.totalChunks !== undefined) {
        updatedTask.totalChunks = data.totalChunks;
      }

      tasks.value.set(taskId, updatedTask);
    }
  }

  /**
   * 处理 SSE 消息
   * @param message SSE 消息
   */
  function handleSSEMessage(message: SSEMessage): void {
    const { type, taskId, data } = message;

    switch (type) {
      case 'progress': {
        const progressData = data as {
          uploadedBytes: number;
          totalBytes: number;
          uploadedChunks: number;
          totalChunks: number;
        };
        updateProgress(taskId, {
          uploadedBytes: progressData.uploadedBytes,
          totalBytes: progressData.totalBytes,
          uploadedChunks: progressData.uploadedChunks,
          totalChunks: progressData.totalChunks,
        });
        break;
      }

      case 'status': {
        const statusData = data as {
          status: TaskStatus;
          message?: string;
        };
        if (statusData.status) {
          transitionTo(taskId, statusData.status);
        }
        break;
      }

      case 'complete': {
        // 状态转换会自动触发刷新事件和清理
        transitionTo(taskId, 'completed');
        break;
      }

      case 'error': {
        const errorData = data as {
          code: string;
          message: string;
        };
        const task = tasks.value.get(taskId);
        setTaskError(taskId, errorData.message || '上传失败');
        
        // 显示错误通知
        if (task) {
          Message.error({
            content: `文件 "${task.fileName}" 上传失败: ${errorData.message || '未知错误'}`,
            duration: 5000,
          });
        }
        break;
      }

      default:
        // eslint-disable-next-line no-console
        console.warn('[TransferStore] Unknown SSE message type:', type);
    }
  }

  // ==================== Public Actions ====================

  /**
   * 从后端获取任务列表
   */
  async function fetchTasks(): Promise<void> {
    const response = await getTransferFiles();
    const taskVOs = response.data;

    // 清空现有任务
    tasks.value.clear();
    progressCalculator.clearAll();

    // 转换并添加任务
    taskVOs.forEach((vo) => {
      const task = convertVOToTask(vo);
      tasks.value.set(task.taskId, task);
    });
  }

  /**
   * 同步任务状态（用于 SSE 重连后的状态同步）
   * 与 fetchTasks 不同，这个方法会智能合并状态，避免状态回退
   */
  async function syncTasks(): Promise<void> {
    const response = await getTransferFiles();
    const taskVOs = response.data;

    // 智能合并任务状态
    taskVOs.forEach((vo) => {
      const existingTask = tasks.value.get(vo.taskId);
      const newTask = convertVOToTask(vo);

      if (!existingTask) {
        // 新任务，直接添加
        tasks.value.set(vo.taskId, newTask);
      } else {
        // 已存在的任务，只在后端状态更"新"时才更新
        // 状态优先级：completed > failed > cancelled > merging > uploading > paused > checking > initialized > idle
        const statePriority: Record<TaskStatus, number> = {
          idle: 0,
          initialized: 1,
          checking: 2,
          paused: 3,
          uploading: 4,
          merging: 5,
          cancelled: 6,
          failed: 7,
          completed: 8,
        };

        const existingPriority = statePriority[existingTask.status] || 0;
        const newPriority = statePriority[newTask.status] || 0;

        // 只有当后端状态优先级更高，或者是终态时才更新
        if (newPriority > existingPriority || 
            newTask.status === 'completed' || 
            newTask.status === 'failed' || 
            newTask.status === 'cancelled') {
          tasks.value.set(vo.taskId, newTask);
        } else {
          // 保持前端状态，但更新其他信息（如进度）
          tasks.value.set(vo.taskId, {
            ...existingTask,
            uploadedBytes: newTask.uploadedBytes,
            uploadedChunks: newTask.uploadedChunks,
            totalChunks: newTask.totalChunks,
          });
        }
      }
    });

    // 清理前端有但后端没有的任务（可能已被删除）
    const backendTaskIds = new Set(taskVOs.map(vo => vo.taskId));
    tasks.value.forEach((task, taskId) => {
      if (!backendTaskIds.has(taskId)) {
        tasks.value.delete(taskId);
        progressCalculator.clear(taskId);
      }
    });
  }

  /**
   * 开始新的上传批次
   * @returns 批次 ID
   */
  function startUploadSession(): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentSessionId.value = sessionId;
    sessionTasks.value.set(sessionId, []);
    return sessionId;
  }

  /**
   * 创建新的上传任务
   * @param file 要上传的文件
   * @param parentId 父目录 ID
   * @param sessionId 可选的批次 ID，如果不提供则使用当前批次
   * @returns 任务 ID
   */
  async function createTask(file: File, parentId?: string, sessionId?: string): Promise<string> {
    // 确保回调已初始化
    initExecutorCallbacks();

    const chunkSize = 5 * 1024 * 1024; // 5MB
    const totalChunks = Math.ceil(file.size / chunkSize);

    // 调用后端初始化上传
    const response = await initUpload({
      fileName: file.name,
      fileSize: file.size,
      parentId,
      totalChunks,
      chunkSize,
      mimeType: file.type || 'application/octet-stream',
    });

    const taskId = response.data;
    const now = Date.now();

    // 创建任务对象
    const task: TransferTask = {
      taskId,
      fileName: file.name,
      fileSize: file.size,
      status: 'idle',
      progress: 0,
      uploadedBytes: 0,
      speed: 0,
      remainingTime: 0,
      createdAt: now,
      updatedAt: now,
      parentId,
      mimeType: file.type || 'application/octet-stream',
      totalChunks,
      uploadedChunks: 0,
      chunkSize,
    };

    // 添加到 store
    tasks.value.set(taskId, task);

    // 缓存文件对象，用于重试
    fileCache.set(taskId, file);

    // 添加到批次
    const targetSessionId = sessionId || currentSessionId.value;
    if (targetSessionId) {
      const sessionTaskList = sessionTasks.value.get(targetSessionId) || [];
      sessionTaskList.push(taskId);
      sessionTasks.value.set(targetSessionId, sessionTaskList);
    }

    // 立即转换到 initialized 状态
    transitionTo(taskId, 'initialized');

    // 获取当前并发配置并启动上传执行器
    // 传递并发配置确保任务使用创建时的配置，不受后续配置变更影响
    const currentConcurrency = getConcurrency.value;
    uploadExecutor.start(taskId, file, currentConcurrency).catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[TransferStore] Upload executor error:', error);
    });

    return taskId;
  }

  /**
   * 暂停任务
   * @param taskId 任务 ID
   */
  async function pauseTask(taskId: string): Promise<void> {
    const task = tasks.value.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // 先暂停上传执行器
    uploadExecutor.pause(taskId);

    // 乐观更新状态
    if (!transitionTo(taskId, 'paused')) {
      throw new Error(`Cannot pause task in status: ${task.status}`);
    }

    try {
      await pauseUpload(taskId);
    } catch (error) {
      transitionTo(taskId, task.status);
      throw error;
    }
  }

  /**
   * 恢复任务
   * @param taskId 任务 ID
   */
  async function resumeTask(taskId: string): Promise<void> {
    const task = tasks.value.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (!transitionTo(taskId, 'uploading')) {
      throw new Error(`Cannot resume task in status: ${task.status}`);
    }

    try {
      await resumeUpload(taskId);

      uploadExecutor.resume(taskId).catch((error) => {
        // eslint-disable-next-line no-console
        console.error('[TransferStore] Resume executor error:', error);
      });
    } catch (error) {
      transitionTo(taskId, task.status);
      throw error;
    }
  }

  /**
   * 取消任务
   * @param taskId 任务 ID
   */
  async function cancelTask(taskId: string): Promise<void> {
    const task = tasks.value.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    uploadExecutor.cancel(taskId);

    if (!transitionTo(taskId, 'cancelled')) {
      throw new Error(`Cannot cancel task in status: ${task.status}`);
    }

    try {
      await cancelUpload(taskId);
      progressCalculator.clear(taskId);
      fileCache.delete(taskId);
    } catch (error) {
      transitionTo(taskId, task.status);
      throw error;
    }
  }

  /**
   * 重试失败的任务
   * @param taskId 任务 ID
   */
  async function retryTask(taskId: string): Promise<void> {
    const task = tasks.value.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status !== 'failed') {
      throw new Error(`Cannot retry task in status: ${task.status}`);
    }

    const file = fileCache.get(taskId);
    if (!file) {
      throw new Error('File not found in cache, cannot retry');
    }

    progressCalculator.reset(taskId);

    if (!transitionTo(taskId, 'initialized')) {
      throw new Error('Failed to transition task to initialized state');
    }

    const updatedTask = tasks.value.get(taskId);
    if (updatedTask) {
      tasks.value.set(taskId, {
        ...updatedTask,
        progress: 0,
        uploadedBytes: 0,
        uploadedChunks: 0,
        speed: 0,
        remainingTime: 0,
        errorMessage: undefined,
      });
    }

    // 获取当前并发配置并重新启动上传
    // 传递并发配置确保任务使用重试时的配置
    const currentConcurrency = getConcurrency.value;
    uploadExecutor.start(taskId, file, currentConcurrency).catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[TransferStore] Retry upload executor error:', error);
    });
  }

  /**
   * 初始化 SSE 连接
   * @param userId 用户 ID
   * @param token 可选的认证 token
   */
  async function initSSE(userId: string, token?: string): Promise<void> {
    await fetchTasks();

    sseService.setReconnectSyncCallback(async () => {
      await syncTasks();
    });

    if (sseMessageUnsubscribe) {
      sseMessageUnsubscribe();
    }
    sseMessageUnsubscribe = sseService.onMessage(handleSSEMessage);

    if (sseConnectionUnsubscribe) {
      sseConnectionUnsubscribe();
    }
    sseConnectionUnsubscribe = sseService.onConnectionChange((connected) => {
      setSseConnected(connected);
    });

    sseService.connect(userId, token);
  }

  /**
   * 断开 SSE 连接
   */
  function disconnectSSE(): void {
    if (sseMessageUnsubscribe) {
      sseMessageUnsubscribe();
      sseMessageUnsubscribe = null;
    }

    if (sseConnectionUnsubscribe) {
      sseConnectionUnsubscribe();
      sseConnectionUnsubscribe = null;
    }

    sseService.disconnect();
    setSseConnected(false);
  }

  /**
   * 移除任务
   * @param taskId 任务 ID
   */
  function removeTask(taskId: string): void {
    tasks.value.delete(taskId);
    progressCalculator.clear(taskId);
  }

  /**
   * 获取单个任务
   * @param taskId 任务 ID
   */
  function getTask(taskId: string): TransferTask | undefined {
    return tasks.value.get(taskId);
  }

  /**
   * 获取任务的显示数据（平滑后的进度、速度、剩余时间）
   * @param taskId 任务 ID
   */
  function getDisplayData(taskId: string) {
    return progressCalculator.getDisplayData(taskId);
  }

  return {
    // State
    tasks,
    sseConnected,
    currentSessionId,

    // Getters
    taskList,
    uploadingTasks,
    completedTasks,
    failedTasks,
    pausedTasks,
    cancelledTasks,
    currentSessionTasks,
    getConcurrency,

    // Actions
    startUploadSession,
    createTask,
    removeTask,
    transitionTo,
    updateProgress,
    pauseTask,
    resumeTask,
    cancelTask,
    retryTask,
    fetchTasks,
    syncTasks,
    getTask,
    getDisplayData,
    setSseConnected,
    setTaskError,

    // SSE Integration
    initSSE,
    disconnectSSE,
  };
});

export default useTransferStore;
