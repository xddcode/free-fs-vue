<script setup lang="ts">
  import { ref, reactive, watch } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import type { TransferSettingForm } from '@/types/modules/transfer-setting';
  import { getTransferSetting, updateTransferSetting } from '@/api/user';
  import useUserStore from '@/store/modules/user';

  const props = defineProps<{
    visible: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'success'): void;
  }>();

  const loading = ref(false);
  const formRef = ref();
  const userStore = useUserStore();

  // 表单数据
  const formData = reactive<TransferSettingForm>({
    downloadLocation: '',
    isDefaultDownloadLocation: false,
    downloadSpeedLimit: 5,
    enableDownloadSpeedLimit: false,
    concurrentUploadQuantity: 3,
    concurrentDownloadQuantity: 3,
    chunkSize: 5 * 1024 * 1024, // 默认 5MB
  });

  // 路径格式校验
  const validatePath = (value: string, callback: (error?: string) => void) => {
    if (!value || !value.trim()) {
      callback('请输入文件下载位置');
      return;
    }

    const path = value.trim();

    // Windows 路径格式
    // 绝对路径: C:\ 或 C:\folder 或 D:\folder\subfolder
    // 网络路径: \\server\share
    const windowsAbsolutePathRegex =
      /^[a-zA-Z]:\\([\w\s\u4e00-\u9fa5\-().]+\\)*[\w\s\u4e00-\u9fa5\-().]*$/;
    const windowsNetworkPathRegex =
      /^\\\\[\w\-.]+(\\[\w\s\u4e00-\u9fa5\-().]+)+(\\[\w\s\u4e00-\u9fa5\-().]+)*$/;

    // Linux/Mac 路径格式: /xxx 或 /xxx/xxx
    const unixPathRegex = /^\/[\w\s\u4e00-\u9fa5\-./]*$/;

    // 检测是否为合法路径格式
    const isWindowsPath =
      windowsAbsolutePathRegex.test(path) || windowsNetworkPathRegex.test(path);
    const isUnixPath = unixPathRegex.test(path);

    if (!isWindowsPath && !isUnixPath) {
      callback('路径格式不正确');
      return;
    }

    // Windows 路径检查非法字符
    if (isWindowsPath) {
      const illegalChars = /[<>"|?*]/;
      const pathWithoutDrive = path.substring(path.indexOf(':') + 1);
      if (illegalChars.test(pathWithoutDrive)) {
        callback('路径包含非法字符');
        return;
      }
    }

    callback();
  };

  // 表单验证规则
  const rules = {
    downloadLocation: [
      { required: true, message: '请输入文件下载位置' },
      { validator: validatePath },
    ],
    concurrentUploadQuantity: [
      { required: true, message: '请选择并发上传数量' },
      {
        type: 'number',
        min: 1,
        max: 3,
        message: '并发数量范围为 1-3',
      },
    ],
    concurrentDownloadQuantity: [
      { required: true, message: '请选择并发下载数量' },
      {
        type: 'number',
        min: 1,
        max: 3,
        message: '并发数量范围为 1-3',
      },
    ],
    downloadSpeedLimit: [
      { required: true, message: '请输入下载速率限制' },
      {
        validator: (value: number, callback: (error?: string) => void) => {
          if (formData.enableDownloadSpeedLimit) {
            if (!value || value < 1 || value > 200) {
              callback('速率限制范围为 1-200 MB/s');
              return;
            }
          }
          callback();
        },
      },
    ],
  };

  // 加载设置
  const loadSettings = async () => {
    loading.value = true;
    try {
      const response = await getTransferSetting();
      const settings = response.data;

      formData.downloadLocation = settings.downloadLocation || '';
      formData.isDefaultDownloadLocation =
        settings.isDefaultDownloadLocation === 1;

      // -1 表示不限制，> 0 表示有限制
      if (settings.downloadSpeedLimit && settings.downloadSpeedLimit > 0) {
        formData.downloadSpeedLimit = settings.downloadSpeedLimit;
        formData.enableDownloadSpeedLimit = true;
      } else {
        formData.downloadSpeedLimit = 5;
        formData.enableDownloadSpeedLimit = false;
      }

      formData.concurrentUploadQuantity =
        settings.concurrentUploadQuantity || 3;
      formData.concurrentDownloadQuantity =
        settings.concurrentDownloadQuantity || 3;
      formData.chunkSize = settings.chunkSize || 5 * 1024 * 1024; // 默认 5MB
    } catch (error) {
      Message.error('加载设置失败');
    } finally {
      loading.value = false;
    }
  };

  // 保存设置
  const handleSave = async () => {
    const valid = await formRef.value?.validate();
    if (!valid) {
      loading.value = true;
      try {
        // 确保所有必填字段都有值
        if (!formData.downloadLocation) {
          Message.error('请输入文件下载位置');
          loading.value = false;
          return;
        }

        const settingsToSave = {
          downloadLocation: formData.downloadLocation,
          isDefaultDownloadLocation: formData.isDefaultDownloadLocation ? 1 : 0,
          downloadSpeedLimit: formData.enableDownloadSpeedLimit
            ? formData.downloadSpeedLimit
            : -1,
          concurrentUploadQuantity: formData.concurrentUploadQuantity,
          concurrentDownloadQuantity: formData.concurrentDownloadQuantity,
          chunkSize: formData.chunkSize,
        };

        await updateTransferSetting(settingsToSave);

        Message.success('保存成功');

        // 更新 User Store 中的配置
        await userStore.loadTransferSetting();

        emit('success');
        handleClose();
      } catch (error) {
        Message.error('保存失败');
      } finally {
        loading.value = false;
      }
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    emit('update:visible', false);
  };

  // 监听弹窗显示状态
  watch(
    () => props.visible,
    (newVal) => {
      if (newVal) {
        loadSettings();
      }
    }
  );
</script>

<template>
  <a-modal
    :visible="visible"
    title="传输设置"
    :width="600"
    :mask-closable="false"
    @cancel="handleClose"
    @before-ok="handleSave"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
      :loading="loading"
    >
      <!-- 文件下载位置 -->
      <a-form-item label="文件下载位置" field="downloadLocation" required>
        <a-input
          v-model="formData.downloadLocation"
          placeholder="Windows: C:\Users\用户名\Desktop  |  Linux/Mac: /home/username/Desktop"
          allow-clear
        >
          <template #suffix>
            <a-tooltip
              content="请输入完整的文件夹路径&#10;Windows 示例: C:\Users\用户名\Desktop&#10;Linux/Mac 示例: /home/username/Desktop"
              position="left"
            >
              <icon-question-circle
                style="color: var(--color-text-3); cursor: help"
              />
            </a-tooltip>
          </template>
        </a-input>
      </a-form-item>

      <!-- 默认下载路径 -->
      <a-form-item
        field="isDefaultDownloadLocation"
        :style="{ marginBottom: '20px' }"
      >
        <div style="display: flex; align-items: center; gap: 8px">
          <a-checkbox v-model="formData.isDefaultDownloadLocation">
            默认此路径为下载路径
          </a-checkbox>
          <span class="form-item-tip" style="line-height: 1">
            如果不勾选，每次下载时会询问保存地址
          </span>
        </div>
      </a-form-item>

      <!-- 下载速率限制 -->
      <a-form-item label="下载速率限制" field="downloadSpeedLimit">
        <a-space :size="12" align="center">
          <a-radio-group v-model="formData.enableDownloadSpeedLimit">
            <a-radio :value="false">不限制</a-radio>
            <a-radio :value="true">上限</a-radio>
          </a-radio-group>
          <a-input-number
            v-if="formData.enableDownloadSpeedLimit"
            v-model="formData.downloadSpeedLimit"
            :min="1"
            :max="200"
            :style="{ width: '120px' }"
          >
            <template #suffix>MB/s</template>
          </a-input-number>
          <span
            v-if="formData.enableDownloadSpeedLimit"
            class="form-item-tip"
            style="margin-left: 0"
          >
            (可输入 1-200 之间的整数)
          </span>
        </a-space>
      </a-form-item>

      <!-- 并发限制 -->
      <a-form-item label="并发限制">
        <a-space :size="16" align="center">
          <span style="color: var(--color-text-2)">同时上传数量</span>
          <a-select
            v-model="formData.concurrentUploadQuantity"
            :style="{ width: '100px' }"
          >
            <a-option v-for="num in [1, 2, 3]" :key="num" :value="num">
              {{ num }}个
            </a-option>
          </a-select>

          <span style="color: var(--color-text-2)">同时下载数量</span>
          <a-select
            v-model="formData.concurrentDownloadQuantity"
            :style="{ width: '100px' }"
          >
            <a-option v-for="num in [1, 2, 3]" :key="num" :value="num">
              {{ num }}个
            </a-option>
          </a-select>
        </a-space>
      </a-form-item>

      <!-- 分片大小 -->
      <a-form-item label="分片大小" field="chunkSize">
        <a-space :size="16" align="center">
          <a-select v-model="formData.chunkSize" :style="{ width: '120px' }">
            <a-option :value="2 * 1024 * 1024">2 MB</a-option>
            <a-option :value="5 * 1024 * 1024">5 MB</a-option>
            <a-option :value="10 * 1024 * 1024">10 MB</a-option>
          </a-select>
          <span class="form-item-tip" style="margin-left: 0">
            上传文件时的分片大小，推荐设置 5 MB
          </span>
        </a-space>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped lang="less">
  .section-title {
    margin-bottom: 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-1);
  }

  .form-item-tip {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-3);
  }
</style>
