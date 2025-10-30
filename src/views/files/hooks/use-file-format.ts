/**
 * 文件格式化工具 Hook
 * 提供文件大小、时间等格式化方法
 */

import { formatFileSize, formatTime } from '@/utils/format';

/**
 * 格式化文件时间（兼容旧版本）
 * @deprecated 请直接使用 @/utils/format 中的 formatTime
 */
export const formatFileTime = formatTime;

/**
 * 文件格式化 Hook
 */
export function useFileFormat() {
  return {
    formatFileSize,
    formatFileTime,
  };
}

// 导出格式化函数供直接使用
export { formatFileSize };
