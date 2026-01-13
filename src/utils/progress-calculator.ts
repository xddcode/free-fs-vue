/**
 * 进度计算器
 * 负责平滑计算和展示上传进度、速度、剩余时间
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

/**
 * 速度采样点
 */
interface SpeedSample {
  timestamp: number;
  bytes: number;
}

/**
 * 任务进度数据
 */
interface TaskProgressData {
  uploadedBytes: number;
  totalBytes: number;
  lastProgress: number; // 上次显示的进度，用于单调递增保护
  lastUpdateTime: number; // 上次更新时间，用于节流
  speedCalculator: SlidingWindowSpeed;
}

/**
 * 显示数据接口
 */
export interface DisplayData {
  progress: number; // 0-100, 平滑后
  speed: number; // bytes/s, 滑动窗口平均
  remainingTime: number; // seconds
}

/**
 * 滑动窗口速度计算器
 * 使用 5 秒窗口计算平均速度
 */
export class SlidingWindowSpeed { 
  private samples: SpeedSample[] = [];

  private readonly windowSize: number;

  /**
   * @param windowSize 窗口大小（毫秒），默认 5000ms
   */
  constructor(windowSize = 5000) {
    this.windowSize = windowSize;
  }

  /**
   * 添加采样点
   * @param bytes 当前已上传的总字节数
   */
  addSample(bytes: number): void {
    const now = Date.now();
    this.samples.push({ timestamp: now, bytes });
    // 移除窗口外的样本
    this.samples = this.samples.filter(
      (s) => now - s.timestamp < this.windowSize
    );
  }

  /**
   * 获取当前速度（字节/秒）
   * 基于滑动窗口内的样本计算平均速度
   */
  getSpeed(): number {
    if (this.samples.length < 2) return 0;

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const timeDiff = (last.timestamp - first.timestamp) / 1000; // 转换为秒
    const bytesDiff = last.bytes - first.bytes;

    return timeDiff > 0 ? bytesDiff / timeDiff : 0;
  }

  /**
   * 清空采样数据
   */
  clear(): void {
    this.samples = [];
  }

  /**
   * 获取当前采样点数量（用于测试）
   */
  getSampleCount(): number {
    return this.samples.length;
  }
}

/**
 * 进度计算器
 * 管理多个任务的进度计算，提供平滑的 UI 更新
 */
export class ProgressCalculator {
  private tasks: Map<string, TaskProgressData> = new Map();

  private readonly throttleInterval: number;

  private readonly windowSize: number;

  /**
   * @param throttleInterval 节流间隔（毫秒），默认 100ms
   * @param windowSize 速度计算窗口大小（毫秒），默认 5000ms
   */
  constructor(throttleInterval = 100, windowSize = 5000) {
    this.throttleInterval = throttleInterval;
    this.windowSize = windowSize;
  }

  /**
   * 更新任务进度
   * @param taskId 任务 ID
   * @param uploadedBytes 已上传字节数
   * @param totalBytes 总字节数
   * @returns 是否应该更新 UI（节流控制）
   */
  update(taskId: string, uploadedBytes: number, totalBytes: number): boolean {
    const now = Date.now();
    let taskData = this.tasks.get(taskId);

    if (!taskData) {
      // 首次更新，创建任务数据
      taskData = {
        uploadedBytes: 0,
        totalBytes,
        lastProgress: 0,
        lastUpdateTime: 0,
        speedCalculator: new SlidingWindowSpeed(this.windowSize),
      };
      this.tasks.set(taskId, taskData);
    }

    // 更新字节数据
    taskData.uploadedBytes = uploadedBytes;
    taskData.totalBytes = totalBytes;

    // 添加速度采样
    taskData.speedCalculator.addSample(uploadedBytes);

    // 节流检查：100ms 内不重复更新 UI
    if (now - taskData.lastUpdateTime < this.throttleInterval) {
      return false;
    }

    taskData.lastUpdateTime = now;
    return true;
  }

  /**
   * 获取平滑后的显示数据
   * @param taskId 任务 ID
   * @returns 显示数据，如果任务不存在返回默认值
   */
  getDisplayData(taskId: string): DisplayData {
    const taskData = this.tasks.get(taskId);

    if (!taskData) {
      return {
        progress: 0,
        speed: 0,
        remainingTime: 0,
      };
    }

    // 计算原始进度
    let progress = 0;
    if (taskData.totalBytes > 0) {
      progress = (taskData.uploadedBytes / taskData.totalBytes) * 100;
    }

    // 进度单调递增保护：进度不能减少
    if (progress < taskData.lastProgress) {
      progress = taskData.lastProgress;
    } else {
      taskData.lastProgress = progress;
    }

    // 确保进度在 0-100 范围内
    progress = Math.min(100, Math.max(0, progress));
    
    // 四舍五入到整数（不保留小数）
    progress = Math.round(progress);

    // 获取滑动窗口平均速度
    const speed = taskData.speedCalculator.getSpeed();

    // 计算剩余时间
    let remainingTime = 0;
    if (speed > 0) {
      const remainingBytes = taskData.totalBytes - taskData.uploadedBytes;
      remainingTime = remainingBytes / speed;
    }

    return {
      progress,
      speed: Math.max(0, speed), // 确保非负
      remainingTime: Math.max(0, remainingTime), // 确保非负
    };
  }

  /**
   * 清理任务数据
   * @param taskId 任务 ID
   */
  clear(taskId: string): void {
    const taskData = this.tasks.get(taskId);
    if (taskData) {
      taskData.speedCalculator.clear();
      this.tasks.delete(taskId);
    }
  }

  /**
   * 清理所有任务数据
   */
  clearAll(): void {
    this.tasks.forEach((taskData) => {
      taskData.speedCalculator.clear();
    });
    this.tasks.clear();
  }

  /**
   * 重置任务进度（用于重试场景）
   * @param taskId 任务 ID
   */
  reset(taskId: string): void {
    const taskData = this.tasks.get(taskId);
    if (taskData) {
      taskData.uploadedBytes = 0;
      taskData.lastProgress = 0;
      taskData.lastUpdateTime = 0;
      taskData.speedCalculator.clear();
    }
  }

  /**
   * 检查任务是否存在
   * @param taskId 任务 ID
   */
  hasTask(taskId: string): boolean {
    return this.tasks.has(taskId);
  }
}

// 导出单例实例，供全局使用
export const progressCalculator = new ProgressCalculator();
