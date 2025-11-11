<script setup lang="ts">
  import { computed } from 'vue';
  import { IconQuestion } from '@arco-design/web-vue/es/icon';
  import VideoPlayer from '@/components/video-player/index.vue';

  /** 文件预览组件 */
  interface FileInfo {
    fileName: string;
    fileUrl: string;
    fileSuffix: string;
  }

  interface Props {
    visible: boolean;
    file: FileInfo;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'close'): void;
  }>();

  /** 文件扩展名 */
  const anonymizeFilename = (fileName: string): string => {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  /** 文件扩展名 */
  const fileExtension = computed(() => {
    const suffix = props.file.fileSuffix;
    if (suffix) {
      return suffix;
    }
    return anonymizeFilename(props.file.fileName);
  });

  /** 文件类型 */
  const fileType = computed(() => {
    const ext = fileExtension.value;
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext))
      return 'image';
    if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'aac'].includes(ext)) return 'audio';
    if (['pdf'].includes(ext)) return 'pdf';
    if (
      [
        'txt',
        'md',
        'json',
        'js',
        'ts',
        'css',
        'html',
        'py',
        'java',
        'go',
        'c',
        'cpp',
      ].includes(ext)
    )
      return 'code-text';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext))
      return 'office';
    if (['zip', 'rar', '7z'].includes(ext)) return 'archive';
    return 'unsupported';
  });

  const previewTitle = computed(() => {
    return `${props.file.fileName} - 预览`;
  });

  const isImagePreviewVisible = computed(() => {
    return props.visible && fileType.value === 'image';
  });

  const isOtherPreviewVisible = computed(() => {
    return props.visible && fileType.value !== 'image';
  });

  const handleClose = () => {
    emit('update:visible', false);
    emit('close');
  };
</script>

<template>
  <div>
    <div v-if="fileType === 'image'" class="image-preview">
      <a-image-preview
        :src="file.fileUrl"
        :visible="isImagePreviewVisible"
        :z-index="3000"
        @close="handleClose"
      ></a-image-preview>
    </div>

    <!-- 需要弹框的组件 -->
    <a-modal
      :visible="isOtherPreviewVisible"
      :title="previewTitle"
      width="90vw"
      unmount-on-close
      :footer="false"
      modal-class="file-preview-modal"
      @cancel="handleClose"
    >
      <div class="preview-container">
        <div v-if="fileType === 'video'" class="video-viewer">
          <video-player :url="file.fileUrl" />
        </div>

        <div v-if="fileType === 'unsupported'" class="unsupported-viewer">
          <a-empty>
            <template #image>
              <div class="custom-unsupported-icon">
                <icon-question />
              </div>
            </template>
            <div>
              <p
                >暂不支持预览<strong>.{{ fileExtension }}</strong> 类型的文件</p
              >
              <a-button type="outline" :href="file.fileUrl" download>
                点击下载
              </a-button>
            </div>
          </a-empty>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
  //:deep(.file-preview-modal) {
  //  .arco-modal-body {
  //    /* 让 modal 内容区占满 80vh */
  //    height: 90vh;
  //    overflow: hidden;
  //  }
  //}

  .preview-container {
    width: 100%;
    height: 85vh;
    display: block;
  }

  .image-preview,
  .video-viewer,
  .unsupported-viewer {
    width: 100%;
    height: 100%;
  }

  .unsupported-viewer {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .custom-unsupported-icon {
    font-size: 76px;
    padding: 20px;
    background-color: #e9e3ff;
    color: #7b61ff;
    border-radius: 12px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
  }
</style>
