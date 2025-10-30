/**
 * 格式化工具函数
 */

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

/**
 * 格式化时间
 * 规则：
 * - 今天：显示"今天 HH:mm"
 * - 当前年但非今天：显示"MM-DD HH:mm"
 * - 非当前年：显示"YYYY-MM-DD HH:mm"
 *
 * @param dateStr 日期字符串或时间戳
 * @returns 格式化后的时间字符串
 */
export function formatTime(dateStr: string | number | Date): string {
  const date = new Date(dateStr);
  const now = new Date();

  // 获取小时和分钟
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  // 判断是否是今天
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return `今天 ${timeStr}`;
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  // 判断是否是当前年
  const isCurrentYear = year === now.getFullYear();

  if (isCurrentYear) {
    // 当前年但非今天，显示 MM-DD HH:mm
    return `${month}-${day} ${timeStr}`;
  }

  // 非当前年，显示 YYYY-MM-DD HH:mm
  return `${year}-${month}-${day} ${timeStr}`;
}

/**
 * 格式化日期时间为完整格式
 * @param dateStr 日期字符串
 * @returns YYYY-MM-DD HH:mm:ss 格式的字符串
 */
export function formatDateTime(dateStr: string | number | Date): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
