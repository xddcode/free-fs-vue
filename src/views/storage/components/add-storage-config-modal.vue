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
      ref="formRef"
      :auto-label-width="true"
      :model="formData"
      :rules="rules"
      layout="vertical"
    >
      <!-- 选择存储平台 -->
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

      <!-- 动态配置表单 -->
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

      <!-- 未选择平台时的提示 -->
      <div v-else-if="!selectedPlatform" class="empty-tip">
        <a-empty description="请先选择存储平台" :image="false" />
      </div>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
  import { Icon, Message } from '@arco-design/web-vue';
  import { reactive, ref, watch } from 'vue';
  import { IconPlus } from '@arco-design/web-vue/es/icon';
  import {
    getStoragePlatforms,
    addStorageSetting,
    type StoragePlatformVO,
  } from '@/api/storage';

  const IconFont = Icon.addFromIconFontCn({
    src: 'https://at.alicdn.com/t/c/font_4759634_ieftb3g6nn.js',
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
  const platforms = ref<StoragePlatformVO[]>([]);
  const selectedPlatform = ref<StoragePlatformVO | null>(null);

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

  const resetForm = () => {
    // 清空表单数据
    Object.keys(formData).forEach((key) => {
      if (key !== 'platformId') {
        delete formData[key];
      }
    });

    // 清空验证规则
    Object.keys(rules).forEach((key) => {
      if (key !== 'platformId') {
        delete rules[key];
      }
    });

    // 重新设置表单数据和验证规则
    schemes.value.forEach((field) => {
      formData[field.identifier] = '';
      rules[field.identifier] = {
        required: field.validation.required,
        message: `请输入${field.label}`,
      };
    });

    // 如果表单实例存在,重置表单验证状态
    if (formRef.value) {
      formRef.value.clearValidate();
    }
  };

  const handlePlatformChange = (platformId: number) => {
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

  // 监听 visible 变化
  watch(
    () => props.visible,
    (newVal) => {
      modalVisible.value = newVal;
      if (newVal) {
        fetchPlatforms();
        resetForm();
      }
    }
  );

  // 监听 modalVisible 变化
  watch(modalVisible, (newVal) => {
    emit('update:visible', newVal);
  });

  const handleBeforeOk = async (done: (closed: boolean) => void) => {
    if (formRef.value) {
      try {
        const errors = await formRef.value.validate();
        if (!errors) {
          const submitData = {
            platformId: formData.platformId,
            configData: JSON.stringify(
              Object.fromEntries(
                Object.entries(formData).filter(([key]) => key !== 'platformId')
              )
            ),
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
  }
</style>
