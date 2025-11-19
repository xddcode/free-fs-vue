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
 * 格式化传输速度
 * @param bytesPerSecond 每秒字节数
 * @returns 格式化后的速度字符串（如 "8.5 MB/s"）
 */
export function formatSpeed(bytesPerSecond: number): string {
  if (!bytesPerSecond || bytesPerSecond === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  return `${parseFloat((bytesPerSecond / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * 格式化剩余时间
 * @param seconds 剩余秒数
 * @returns 格式化后的时间字符串（如 "2分30秒"、"1小时5分"）
 */
export function formatRemainingTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '计算中...';
  if (seconds === Infinity) return '未知';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}小时${minutes}分` : `${hours}小时`;
  }
  if (minutes > 0) {
    return secs > 0 ? `${minutes}分${secs}秒` : `${minutes}分钟`;
  }
  return `${secs}秒`;
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

/**
 * 邮箱脱敏显示
 * 规则：保留前3位和后2位，中间用****替代
 * 例如：459102951@qq.com -> 459****51@qq.com
 * @param email 邮箱地址
 * @returns 脱敏后的邮箱地址
 */
export function maskEmail(email: string | undefined | null): string {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;

  // 如果前缀长度小于5，只保留前1位，其余用****替代
  if (localPart.length < 5) {
    if (localPart.length <= 1) {
      return email; // 太短，不脱敏
    }
    const firstChar = localPart[0];
    return `${firstChar}****@${domain}`;
  }

  // 前缀长度 >= 5，保留前3位和后2位
  const prefix = localPart.substring(0, 3);
  const suffix = localPart.substring(localPart.length - 2);
  return `${prefix}****${suffix}@${domain}`;
}
