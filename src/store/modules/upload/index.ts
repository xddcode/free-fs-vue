import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import { uploadFile } from '@/api/file';

export interface UploadTask {
  id: string | number;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  parentId: string | null;
  errorMessage?: string;
}

let taskIdCounter = 0;

export const useUploadTaskStore = defineStore('uploadTask', () => {
  // 正在进行和已完成的上传任务列表
  const taskList = ref<UploadTask[]>([]);
  // 面板是否展开
  const isExpanded = ref(false);
  // 是否显示面板
  const showPanel = ref(false);

  /**
   * 内部私有方法：执行单个文件上传
   */
  const doUpload = async (task: UploadTask) => {
    try {
      task.status = 'uploading';

      const formData = new FormData();
      formData.append('file', task.file);
      if (task.parentId) {
        formData.append('parentId', task.parentId);
      }

      await uploadFile(task.file, task.parentId ?? '', (progressEvent) => {
        task.progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
        );
      });

      task.status = 'success';
      task.progress = 100;
    } catch (error) {
      task.status = 'error';
      task.errorMessage = (error as Error).message || '上传失败';
      Message.error(`${task.file.name} 上传失败`);
    }
  };

  /**
   * 添加新文件到上传队列
   * @param files File[] 文件列表
   * @param parentId 目标目录ID
   */
  const addUploadTasks = (files: File[], parentId: string) => {
    if (!showPanel.value) {
      showPanel.value = true;
      isExpanded.value = true;
    }

    const existingFingerprints = new Set(
      taskList.value.map((task) => {
        const { file } = task;
        return `${file.name}-${file.size}-${file.lastModified}`;
      })
    );

    const newFilesToUpload = files.filter((file) => {
      const fingerprint = `${file.name}-${file.size}-${file.lastModified}`;

      if (existingFingerprints.has(fingerprint)) {
        return false;
      }
      existingFingerprints.add(fingerprint);
      return true;
    });

    if (newFilesToUpload.length === 0) {
      Message.info('所选文件均已在上传列表中');
      return;
    }
    if (newFilesToUpload.length < files.length) {
      Message.warning('已自动跳过列表中已存在的文件');
    }

    const newTasks: UploadTask[] = newFilesToUpload.map((file) => {
      taskIdCounter += 1;
      return {
        id: `upload-task-${taskIdCounter}`,
        file,
        status: 'pending',
        progress: 0,
        parentId,
      }
    });
    taskList.value.push(...newTasks);

    taskList.value.forEach((task) => {
      doUpload(task);
    });
  };

  // 展开/收起
  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
  };

  // 关闭/清空
  const closePanel = () => {
    showPanel.value = false;
    taskList.value = [];
  };

  return {
    taskList,
    isExpanded,
    showPanel,
    addUploadTasks,
    toggleExpand,
    closePanel,
  };
});

export default useUploadTaskStore;
