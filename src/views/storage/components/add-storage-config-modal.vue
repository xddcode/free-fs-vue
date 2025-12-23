<template>
  <a-modal
    v-model:visible="modalVisible"
    :mask-closable="false"
    :width="600"
    ok-text="保存配置"
    title-align="start"
    @cancel="handleCancel"
    @before-ok="handleBeforeOk"
  >
    <template #title>
      <div class="modal-title">
        <icon-plus style="margin-right: 8px" />
        <span>添加存储平台配置</span>
      </div>
    </template>

    <a-form
      :key="formKey"
      ref="formRef"
      :auto-label-width="true"
      :model="formData"
      :rules="rules"
      layout="vertical"
    >
      <a-form-item
        field="platformId"
        label="选择存储平台"
        :rules="[{ required: true, message: '请选择存储平台' }]"
      >
        <a-select
          v-model="formData.platformId"
          :loading="platformsLoading"
          placeholder="请选择存储平台"
          allow-clear
          @change="handlePlatformChange"
        >
          <a-option
            v-for="platform in platforms"
            :key="platform.id"
            :value="platform.id"
          >
            <div class="platform-option">
              <a-avatar
                v-if="platform.icon"
                :size="24"
                style="margin-right: 8px"
              >
                <icon-font :size="16" :type="platform.icon" />
              </a-avatar>
              <span>{{ platform.name }}</span>
            </div>
          </a-option>
        </a-select>
      </a-form-item>

      <template v-if="selectedPlatform && schemes.length > 0">
        <a-form-item
          v-for="field in schemes"
          :key="field.identifier"
          :field="field.identifier"
          :label="field.label"
          :rules="[
            {
              required: field.validation.required,
              message: `请输入${field.label}`,
            },
          ]"
        >
          <a-input
            v-model="formData[field.identifier]"
            :placeholder="'请输入' + field.label"
            allow-clear
          />
        </a-form-item>
      </template>

      <!-- 备注输入框 -->
      <a-form-item field="remark" label="配置备注">
        <template #extra>
          <div class="form-item-tip">
            <icon-info-circle style="font-size: 14px; margin-right: 4px" />
            <span
              >强烈建议添加备注（如"生产环境"、"测试环境"），便于在切换时快速识别</span
            >
          </div>
        </template>
        <a-input
          v-model="formData.remark"
          placeholder="例如：生产环境、测试环境、备份存储等"
          allow-clear
        >
          <template #prefix>
            <icon-tags />
          </template>
        </a-input>
      </a-form-item>

      <!-- 提示信息 -->
      <a-alert
        v-if="selectedPlatform && hasSamePlatform"
        type="warning"
        closable
        style="margin-bottom: 20px"
      >
        <template #icon>
          <icon-exclamation-circle />
        </template>
        您已配置过 <strong>{{ selectedPlatform.name }}</strong
        >，强烈建议填写备注以便区分！
      </a-alert>

      <div v-if="!selectedPlatform" class="empty-tip">
        <a-empty description="请先选择存储平台" :image="false" />
      </div>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
  import { Icon, Message } from '@arco-design/web-vue';
  import { reactive, ref, watch, nextTick, computed } from 'vue';
  import {
    IconPlus,
    IconInfoCircle,
    IconExclamationCircle,
    IconTags,
  } from '@arco-design/web-vue/es/icon';
  import {
    getStoragePlatforms,
    addStorageSetting,
    getUserStorageSettings,
    type StoragePlatform,
  } from '@/api/storage';

  const IconFont = Icon.addFromIconFontCn({
    src: 'https://at.alicdn.com/t/c/font_4759634_2elqr2s9who.js',
  });

  interface Props {
    visible: boolean;
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void;
    (e: 'success'): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const modalVisible = ref(false);
  const platformsLoading = ref(false);
  const platforms = ref<StoragePlatform[]>([]);
  const selectedPlatform = ref<StoragePlatform | null>(null);
  const formKey = ref(0);
  const userPlatformIdentifiers = ref<string[]>([]); // 用户已配置的平台标识符列表

  // 检查是否已经配置过相同的平台
  const hasSamePlatform = computed(() => {
    if (!selectedPlatform.value) return false;
    return userPlatformIdentifiers.value.includes(
      selectedPlatform.value.identifier
    );
  });

  interface ConfigScheme {
    identifier: string;
    label: string;
    dataType: string;
    validation: {
      required: boolean;
    };
  }

  const formRef = ref();
  const rules = reactive<any>({});
  const schemes = ref<ConfigScheme[]>([]);
  const formData = reactive<Record<string, any>>({
    platformId: undefined,
    remark: '',
  });

  const fetchPlatforms = async () => {
    platformsLoading.value = true;
    try {
      const { data } = await getStoragePlatforms();
      platforms.value = data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('获取存储平台列表失败:', error);
      Message.error('获取存储平台列表失败');
    } finally {
      platformsLoading.value = false;
    }
  };

  // 获取用户已配置的平台列表
  const fetchUserPlatforms = async () => {
    try {
      const { data } = await getUserStorageSettings();
      userPlatformIdentifiers.value = data.map(
        (setting) => setting.storagePlatform.identifier
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('获取用户配置列表失败:', error);
    }
  };

  const resetAllState = () => {
    selectedPlatform.value = null;
    schemes.value = [];

    const keysToDelete = Object.keys(formData).filter(
      (key) => key !== 'platformId' && key !== 'remark'
    );
    keysToDelete.forEach((key) => {
      delete formData[key];
    });

    formData.platformId = undefined;
    formData.remark = '';

    Object.keys(rules).forEach((key) => {
      delete rules[key];
    });

    formKey.value += 1;

    nextTick(() => {
      if (formRef.value) {
        formRef.value.clearValidate();
        formRef.value.resetFields();
      }
    });
  };

  const resetForm = () => {
    const keysToDelete = Object.keys(formData).filter(
      (key) => key !== 'platformId' && key !== 'remark'
    );
    keysToDelete.forEach((key) => {
      delete formData[key];
    });

    Object.keys(rules).forEach((key) => {
      delete rules[key];
    });

    schemes.value.forEach((field) => {
      formData[field.identifier] = '';
      rules[field.identifier] = {
        required: field.validation.required,
        message: `请输入${field.label}`,
      };
    });

    nextTick(() => {
      if (formRef.value) {
        formRef.value.clearValidate();
      }
    });
  };

  const handlePlatformChange = (platformId: any) => {
    const platform = platforms.value.find((p) => p.id === platformId);
    if (platform) {
      selectedPlatform.value = platform;
      try {
        schemes.value = JSON.parse(platform.configScheme);
        resetForm();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('解析配置方案失败:', error);
        Message.error('配置方案格式错误');
        schemes.value = [];
      }
    } else {
      selectedPlatform.value = null;
      schemes.value = [];
      resetForm();
    }
  };

  watch(
    () => props.visible,
    async (newVal) => {
      modalVisible.value = newVal;
      if (newVal) {
        resetAllState();
        await nextTick();
        fetchPlatforms();
        fetchUserPlatforms();
      }
    }
  );

  watch(modalVisible, (newVal) => {
    emit('update:visible', newVal);
    if (!newVal) {
      setTimeout(() => {
        resetAllState();
      }, 300);
    }
  });

  const handleBeforeOk = async (done: (closed: boolean) => void) => {
    if (formRef.value) {
      try {
        const errors = await formRef.value.validate();
        if (!errors) {
          const selectedPlatformData = platforms.value.find(
            (p) => p.id === formData.platformId
          );
          if (!selectedPlatformData) {
            Message.error('请选择存储平台');
            done(false);
            return;
          }

          const submitData = {
            platformIdentifier: selectedPlatformData.identifier,
            configData: JSON.stringify(
              Object.fromEntries(
                Object.entries(formData).filter(
                  ([key]) => key !== 'platformId' && key !== 'remark'
                )
              )
            ),
            remark: formData.remark,
          };
          await addStorageSetting(submitData);
          Message.success('配置添加成功');
          emit('success');
          done(true);
        } else {
          done(false);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('添加配置失败:', error);
        done(false);
      }
    }
  };

  const handleCancel = () => {
    modalVisible.value = false;
  };
</script>

<style lang="less" scoped>
  .modal-title {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
  }

  .platform-option {
    display: flex;
    align-items: center;
  }

  .empty-tip {
    padding: 40px 0;
    text-align: center;
  }

  :deep(.arco-modal-body) {
    max-height: 60vh;
    overflow-y: auto;
  }

  :deep(.arco-form-item) {
    margin-bottom: 20px;

    .arco-form-item-label-col {
      font-weight: 500;
    }

    .form-item-tip {
      display: flex;
      align-items: center;
      color: rgb(var(--primary-6));
      font-size: 12px;
      line-height: 1.5;
      margin-top: 4px;
    }
  }
</style>
