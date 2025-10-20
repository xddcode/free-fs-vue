import MockService from '@/utils/mock';

// 文件类型定义
export interface FileItem {
  id: string;
  name: string;
  type:
    | 'folder'
    | 'image'
    | 'video'
    | 'audio'
    | 'document'
    | 'archive'
    | 'other';
  size: number;
  modifiedTime: string;
  path: string;
  parentId?: string;
  isShared?: boolean;
  shareUrl?: string;
  thumbnail?: string;
}

// 文件夹结构
export interface FolderStructure {
  id: string;
  name: string;
  children: (FileItem | FolderStructure)[];
}

// 生成模拟文件数据
export const generateMockFiles = (): FileItem[] => {
  const files: FileItem[] = [];

  // 生成文件夹
  const folderNames = [
    '工作文档',
    '个人资料',
    '学习资料',
    '项目文件',
    '图片收藏',
    '视频素材',
    '音乐库',
    '软件工具',
    '备份文件',
    '临时文件',
    '共享文件夹',
    '云一朵知识问答',
    '我的资源',
    'PTGui Pro 12(x64)',
    '游戏',
    '车端云相册',
    '来自:IPhone',
    '08-29-MIAO',
    '我的应用数据',
  ];

  folderNames.forEach((name, index) => {
    files.push({
      id: `folder_${index + 1}`,
      name,
      type: 'folder',
      size: 0,
      modifiedTime: MockService.generateDate(60),
      path: `/${name}`,
    });
  });

  // 生成各种类型的文件
  const fileTypes: Array<{ type: FileItem['type']; fileCount: number }> = [
    { type: 'image', fileCount: 15 },
    { type: 'video', fileCount: 10 },
    { type: 'audio', fileCount: 8 },
    { type: 'document', fileCount: 12 },
    { type: 'archive', fileCount: 5 },
  ];

  let fileIndex = 1;
  fileTypes.forEach(({ type, fileCount }) => {
    for (let i = 0; i < fileCount; i += 1) {
      files.push({
        id: `file_${fileIndex}`,
        name: MockService.generateFileName(),
        type,
        size: MockService.generateFileSize(),
        modifiedTime: MockService.generateDate(30),
        path: `/${MockService.generateFileName()}`,
        isShared: Math.random() > 0.8, // 20% 概率是共享文件
        shareUrl:
          Math.random() > 0.8
            ? `https://share.example.com/${MockService.generateId()}`
            : undefined,
      });
      fileIndex += 1;
    }
  });

  return files.sort(
    (a, b) =>
      new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
  );
};

// 根据文件名判断文件类型
function getFileTypeFromName(filename: string): FileItem['type'] {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (!ext) return 'other';

  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
  const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
  const docExts = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'txt',
    'md',
  ];
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  if (docExts.includes(ext)) return 'document';
  if (archiveExts.includes(ext)) return 'archive';

  return 'other';
}

// 文件 API Mock
export const fileApi = {
  // 获取文件列表
  async getFileList(
    params: {
      type?: string;
      keyword?: string;
      page?: number;
      pageSize?: number;
      parentId?: string;
    } = {}
  ) {
    const { type, keyword, page = 1, pageSize = 20 } = params;
    let files = generateMockFiles();

    // 按类型过滤
    if (type && type !== 'all') {
      files = files.filter((file) => {
        if (type === 'images') return file.type === 'image';
        if (type === 'documents') return file.type === 'document';
        if (type === 'videos') return file.type === 'video';
        if (type === 'audio') return file.type === 'audio';
        if (type === 'other')
          return !['image', 'video', 'audio', 'document', 'folder'].includes(
            file.type
          );
        return file.type === type;
      });
    }

    // 按关键词搜索
    if (keyword) {
      files = files.filter((file) =>
        file.name.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    // 分页
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedFiles = files.slice(start, end);

    return MockService.mockResponse({
      list: paginatedFiles,
      total: files.length,
      page,
      pageSize,
      hasMore: end < files.length,
    });
  },

  // 上传文件
  async uploadFile(file: File) {
    const newFile: FileItem = {
      id: MockService.generateId(),
      name: file.name,
      type: getFileTypeFromName(file.name),
      size: file.size,
      modifiedTime: new Date().toISOString(),
      path: `/${file.name}`,
    };

    return MockService.mockResponse(newFile, true, '文件上传成功');
  },

  // 创建文件夹
  async createFolder(name: string) {
    const newFolder: FileItem = {
      id: MockService.generateId(),
      name,
      type: 'folder',
      size: 0,
      modifiedTime: new Date().toISOString(),
      path: `/${name}`,
    };

    return MockService.mockResponse(newFolder, true, '文件夹创建成功');
  },

  // 删除文件/文件夹
  async deleteFile() {
    return MockService.mockResponse(null, true, '删除成功');
  },

  // 重命名文件/文件夹
  async renameFile(fileId: string, newName: string) {
    return MockService.mockResponse(
      { id: fileId, newName },
      true,
      '重命名成功'
    );
  },

  // 移动文件/文件夹
  async moveFile(id: string, targetParentId: string) {
    return MockService.mockResponse({ id, targetParentId }, true, '移动成功');
  },

  // 分享文件
  async shareFile(
    fileId: string,
    options: { password?: string; expireDays?: number } = {}
  ) {
    const shareUrl = `https://share.example.com/${MockService.generateId()}`;
    return MockService.mockResponse(
      {
        id: fileId,
        shareUrl,
        password: options.password,
        expireTime: options.expireDays
          ? new Date(
              Date.now() + options.expireDays * 24 * 60 * 60 * 1000
            ).toISOString()
          : null,
      },
      true,
      '分享链接已生成'
    );
  },

  // 取消分享
  async unshareFile() {
    return MockService.mockResponse(null, true, '已取消分享');
  },

  // 下载文件
  async downloadFile(fileId: string) {
    return MockService.mockResponse(
      {
        downloadUrl: `https://download.example.com/${fileId}`,
        filename: 'download_file.zip',
      },
      true,
      '下载链接已生成'
    );
  },
};
