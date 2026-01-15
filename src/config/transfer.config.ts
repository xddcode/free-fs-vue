/**
 * 传输模块配置
 * 用户可以根据实际需求调整这些配置
 */

/**
 * 上传性能配置
 */
export const uploadConfig = {
  /**
   * 分片大小（字节）
   * 默认: 5MB
   * 建议范围: 1MB - 10MB
   *
   * 说明:
   * - 较小的分片: 更适合网络不稳定的环境，失败重传代价小
   * - 较大的分片: 减少请求次数，提高上传效率，但失败重传代价大
   */
  chunkSize: 5 * 1024 * 1024,

  /**
   * 并发上传数
   * 默认: 3
   * 建议范围: 1 - 6
   *
   * 说明:
   * - 较低并发: 占用带宽少，适合网络较慢或多任务场景
   * - 较高并发: 上传速度快，但占用更多带宽和内存
   */
  concurrency: 3,

  /**
   * 最大重试次数
   * 默认: 3
   * 建议范围: 1 - 5
   *
   * 说明:
   * - 网络不稳定时建议增加重试次数
   * - 重试采用指数退避策略 (1s, 2s, 4s...)
   */
  maxRetryCount: 3,

  /**
   * 重试基础延迟（毫秒）
   * 默认: 1000ms (1秒)
   * 建议范围: 500 - 3000
   *
   * 说明:
   * - 第 n 次重试延迟 = retryBaseDelay * 2^(n-1)
   * - 例如: 1000ms -> 1s, 2s, 4s
   */
  retryBaseDelay: 1000,
};

/**
 * 进度显示配置
 */
export const progressConfig = {
  /**
   * 进度更新节流间隔（毫秒）
   * 默认: 100ms
   * 建议范围: 50 - 500
   *
   * 说明:
   * - 较小值: 进度条更新更频繁，但性能开销更大
   * - 较大值: 减少 UI 更新频率，节省性能
   */
  throttleInterval: 100,

  /**
   * 速度计算窗口大小（毫秒）
   * 默认: 5000ms (5秒)
   * 建议范围: 3000 - 10000
   *
   * 说明:
   * - 较小窗口: 速度显示响应快，但波动大
   * - 较大窗口: 速度显示平滑，但响应慢
   */
  speedWindowSize: 5000,
};

/**
 * SSE 连接配置
 */
export const sseConfig = {
  /**
   * SSE 端点路径
   * 默认: '/apis/transfer/sse'
   */
  endpoint: '/apis/transfer/sse',

  /**
   * 重连后是否自动同步任务状态
   * 默认: true
   *
   * 说明:
   * - true: 断线重连后自动从服务器同步最新状态
   * - false: 不自动同步，保持本地状态
   */
  syncOnReconnect: true,
};

/**
 * UI 通知配置
 */
export const notificationConfig = {
  /**
   * 成功通知显示时长（毫秒）
   * 默认: 3000ms (3秒)
   */
  successDuration: 3000,

  /**
   * 错误通知显示时长（毫秒）
   * 默认: 5000ms (5秒)
   */
  errorDuration: 5000,
};

/**
 * 导出完整配置对象
 */
export const transferConfig = {
  upload: uploadConfig,
  progress: progressConfig,
  sse: sseConfig,
  notification: notificationConfig,
};

export default transferConfig;
