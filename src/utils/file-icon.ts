/**
 * 根据文件后缀获取图标名称
 * @param suffix 文件后缀（如 'pdf', 'dir', 'js' 等）
 * @returns 图标名称（不含扩展名）
 */
export function getFileIconName(suffix: string): string {
  // 文档类型映射 - 各自独立图标
  const documentTypes: Record<string, string> = {
    dir: 'dir',
    doc: 'doc',
    docx: 'docx',
    pdf: 'pdf',
    txt: 'txt',
    md: 'md',
    xls: 'xls',
    xlsx: 'xlsx',
    ppt: 'ppt',
    pptx: 'ppt',
    csv: 'csv',
  };

  // 代码类型 - 统一使用 code.png
  const codeTypes = [
    'java',
    'py',
    'js',
    'ts',
    'jsx',
    'tsx',
    'vue',
    'go',
    'cpp',
    'c',
    'h',
    'cs',
    'php',
    'rb',
    'swift',
    'kt',
    'rs',
    'scala',
    'sh',
    'bat',
    'ps1',
    'json',
    'yaml',
    'yml',
    'toml',
    'ini',
    'cfg',
    'conf',
    'sql',
  ];

  // HTML类型 - html.png
  const htmlTypes = ['html', 'htm'];

  // XML类型 - xml.png
  const xmlTypes = ['xml'];

  // 音频类型 - 统一使用 mp3.png
  const audioTypes: Record<string, string> = {
    mp3: 'mp3',
    wav: 'mp3',
    flac: 'mp3',
    aac: 'mp3',
    ogg: 'mp3',
    m4a: 'mp3',
    wma: 'mp3',
  };

  // 视频类型 - 统一使用 mp4.png
  const videoTypes: Record<string, string> = {
    mp4: 'mp4',
    avi: 'mp4',
    mkv: 'mp4',
    mov: 'mp4',
    wmv: 'mp4',
    flv: 'mp4',
    webm: 'mp4',
    m4v: 'mp4',
  };

  // 压缩包类型
  const archiveTypes: Record<string, string> = {
    'zip': 'zip',
    'rar': 'rar',
    '7z': 'zip',
    'tar': 'zip',
    'gz': 'zip',
    'bz2': 'zip',
  };

  // Flash类型 - flash.png
  const flashTypes = ['swf'];

  // 图片类型
  const imageTypes: string[] = [
    // 常见格式
    'png',
    'jpg',
    'jpeg',
    'gif',
    'bmp',
    'webp',
    // 矢量格式
    'svg',
    // 图标格式
    'ico',
    // 高质量/原始格式
    'tif',
    'tiff',
    // 现代图片格式
    'avif',
    'heic',
    'heif',
    // (可选) 设计软件格式
    'psd', // Photoshop
    'ai', // Illustrator
  ];

  // 按优先级匹配
  if (documentTypes[suffix]) {
    return documentTypes[suffix];
  }

  if (codeTypes.includes(suffix)) {
    return 'code';
  }

  if (htmlTypes.includes(suffix)) {
    return 'html';
  }

  if (xmlTypes.includes(suffix)) {
    return 'xml';
  }

  if (audioTypes[suffix]) {
    return audioTypes[suffix];
  }

  if (videoTypes[suffix]) {
    return videoTypes[suffix];
  }

  if (archiveTypes[suffix]) {
    return archiveTypes[suffix];
  }

  if (flashTypes.includes(suffix)) {
    return 'flash';
  }

  if (imageTypes.includes(suffix)) {
    return 'image';
  }

  // 默认文件图标
  return 'file';
}

/**
 * 根据文件后缀获取图标路径
 * @param suffix 文件后缀（如 'pdf', 'dir', 'js' 等）
 * @returns 图标完整路径
 */
export function getFileIconPath(suffix: string): string {
  const iconName = getFileIconName(suffix);
  return `/src/assets/images/fti/${iconName}.png`;
}
