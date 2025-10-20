// Mock 数据服务
class MockService {
  // 模拟网络延迟
  static delay(ms = 500) {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // 模拟 API 响应
  static async mockResponse<T>(data: T, success = true, message = '操作成功') {
    await this.delay(200 + Math.random() * 300); // 200-500ms 随机延迟

    return {
      code: success ? 200 : 400,
      message,
      data,
      timestamp: Date.now(),
    };
  }

  // 生成随机 ID
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 生成随机文件名
  static generateFileName() {
    const names = [
      '工作文档',
      '项目资料',
      '学习笔记',
      '会议记录',
      '设计稿',
      '照片合集',
      '视频素材',
      '音乐收藏',
      '电子书',
      '软件安装包',
      '数据备份',
      '配置文件',
      '临时文件',
      '草稿文档',
      '参考资料',
    ];
    const extensions = [
      'pdf',
      'docx',
      'xlsx',
      'pptx',
      'txt',
      'md',
      'jpg',
      'png',
      'mp4',
      'mp3',
      'zip',
      'rar',
    ];
    const name = names[Math.floor(Math.random() * names.length)];
    const ext = extensions[Math.floor(Math.random() * extensions.length)];
    return `${name}.${ext}`;
  }

  // 生成随机文件大小
  static generateFileSize() {
    const sizes = [
      1024, 2048, 5120, 10240, 20480, 51200, 102400, 204800, 512000, 1048576,
    ]; // KB
    return sizes[Math.floor(Math.random() * sizes.length)] * 1024; // 转换为字节
  }

  // 生成随机日期
  static generateDate(daysAgo = 30) {
    const now = new Date();
    const randomDays = Math.floor(Math.random() * daysAgo);
    const date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
    return date.toISOString();
  }
}

export default MockService;
