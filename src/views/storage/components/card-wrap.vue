<template>
  <div class="card-wrap">
    <a-card
      :bordered="false"
      :class="{ 'enabled-card': itemData.isEnabled === 1 }"
      hoverable
    >
      <div class="card-content-wrapper">
        <div class="card-header">
          <a-avatar
            v-if="itemData.icon"
            :size="42"
            :style="{
              backgroundColor: itemData.isEnabled === 1 ? '#00b42a' : '#626aea',
              flexShrink: 0,
            }"
          >
            <icon-font :size="24" :type="itemData.icon" />
          </a-avatar>
          <div class="card-title-wrap">
            <div class="card-title">
              {{ itemData.name }}
              <a-link
                v-if="itemData.link"
                :href="itemData.link"
                icon
                rel="noopener noreferrer"
                target="_blank"
                style="margin-left: 4px"
              >
                <icon-link style="font-size: 12px" />
              </a-link>
            </div>
            <div class="card-tags">
              <!-- 开通状态标签 -->
              <a-tag
                v-if="itemData.isEnabled === 1 && itemData.isSetting === 1"
                color="green"
                size="small"
              >
                <template #icon>
                  <icon-check-circle-fill />
                </template>
                已开通
              </a-tag>
              <a-tag
                v-else-if="itemData.isEnabled === 0 && itemData.isSetting === 1"
                color="red"
                size="small"
              >
                <template #icon>
                  <icon-close-circle />
                </template>
                已禁用
              </a-tag>
              <a-tag v-else color="gray" size="small">
                <template #icon>
                  <icon-close-circle />
                </template>
                未开通
              </a-tag>

              <!-- 配置状态标签 -->
              <a-tag v-if="itemData.isSetting === 1" color="blue" size="small">
                <template #icon>
                  <icon-check />
                </template>
                已配置
              </a-tag>
            </div>
          </div>
        </div>

        <a-divider :margin="12" />

        <div class="card-description">
          <a-typography-paragraph
            :ellipsis="{
              rows: 2,
              showTooltip: true,
            }"
          >
            {{ itemData.desc || '暂无描述信息' }}
          </a-typography-paragraph>
        </div>
      </div>

      <template #actions>
        <div class="card-actions">
          <!-- 未开通状态：只显示"立即开通"按钮 -->
          <a-button
            v-if="itemData.isSetting === 0"
            :loading="btnLoading"
            size="small"
            type="primary"
            @click="handleOpenStorage(itemData)"
          >
            <template #icon>
              <icon-check />
            </template>
            立即开通
          </a-button>

          <!-- 已配置状态：显示"禁用/启用"和"修改配置"按钮 -->
          <template v-else>
            <!-- 本地存储（local）不显示禁用/启用按钮 -->
            <template v-if="itemData.identifier !== 'local'">
              <a-button
                v-if="itemData.isEnabled === 1"
                :loading="btnLoading"
                size="small"
                status="danger"
                type="outline"
                @click="handleDisableStorage(itemData)"
              >
                <template #icon>
                  <icon-poweroff />
                </template>
                禁用
              </a-button>
              <a-button
                v-else
                :loading="btnLoading"
                size="small"
                type="primary"
                @click="handleEnableStorage(itemData)"
              >
                <template #icon>
                  <icon-check />
                </template>
                启用
              </a-button>
            </template>

            <!-- 本地存储显示默认标识 -->
            <a-tag
              v-else
              color="arcoblue"
              size="medium"
              style="height: 30px; line-height: 28px"
            >
              <template #icon>
                <icon-check-circle-fill />
              </template>
              默认存储
            </a-tag>

            <!-- 本地存储不显示配置按钮，其他平台显示 -->
            <a-button
              v-if="itemData.identifier !== 'local'"
              size="small"
              type="outline"
              @click="handleSettingStorage(itemData)"
            >
              <template #icon>
                <icon-settings />
              </template>
              修改配置
            </a-button>
          </template>
        </div>
      </template>
    </a-card>

    <!-- 配置弹窗 -->
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
          <icon-settings style="margin-right: 8px" />
          <span>{{ itemData.name }} - 存储平台配置</span>
        </div>
      </template>
      <a-form
        ref="formRef"
        :auto-label-width="true"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item
          v-for="field in schemes"
          :key="field.identifier"
          :field="field.identifier"
          :label="field.label"
        >
          <a-input
            v-model="formData[field.identifier]"
            :placeholder="'请输入' + field.label"
            allow-clear
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
  import { Icon, Message, Modal } from '@arco-design/web-vue';
  import { PropType, reactive, ref } from 'vue';
  import {
    IconPoweroff,
    IconCheck,
    IconSettings,
  } from '@arco-design/web-vue/es/icon';
  import {
    getStoragePlatformsSettings,
    openOrCancelStoragePlatform,
    saveOrUpdateStoragePlatformSettings,
    type StoragePlatformRecord,
  } from '@/api/storage';
  import { useStorageStore } from '@/store';

  const storageStore = useStorageStore();

  const IconFont = Icon.addFromIconFontCn({
    src: 'https://at.alicdn.com/t/c/font_4759634_ieftb3g6nn.js',
  });

  defineProps({
    itemData: {
      type: Object as PropType<StoragePlatformRecord>,
      default: () => ({}),
    },
  });

  const modalVisible = ref(false);

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
  const formData = reactive<Record<string, string>>({
    identifier: '', // 添加 identifier 字段
  });
  const btnLoading = ref(false);

  const emit = defineEmits(['refresh']);

  // 初始化表单数据
  const resetFormData = async () => {
    // 清空表单数据
    Object.keys(formData).forEach((key) => {
      delete formData[key];
    });

    // 清空验证规则
    Object.keys(rules).forEach((key) => {
      delete rules[key];
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

  /**
   * 立即开通（未配置状态）- 直接打开配置弹窗
   * @param itemData
   */
  const handleOpenStorage = async (itemData: StoragePlatformRecord) => {
    // 直接打开配置弹窗，让用户填写配置信息
    const { identifier, configScheme } = itemData;

    try {
      schemes.value = JSON.parse(configScheme);

      // 重置表单
      await resetFormData();

      // 设置 identifier
      formData.identifier = identifier;

      modalVisible.value = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('打开配置失败:', error);
      Message.error('打开配置失败');
    }
  };

  const handleSettingStorage = async (itemData: StoragePlatformRecord) => {
    const { identifier, configScheme } = itemData;

    try {
      schemes.value = JSON.parse(configScheme);

      // 获取配置数据
      const { data } = await getStoragePlatformsSettings(identifier);
      const configData = data.configData ? JSON.parse(data.configData) : null;

      // 先重置表单
      await resetFormData();

      // 设置 identifier
      formData.identifier = identifier;

      // 遍历 schemes 将 configData 中对应的值设置到 formData
      if (configData) {
        schemes.value.forEach((field) => {
          if (configData[field.identifier]) {
            formData[field.identifier] = configData[field.identifier];
          }
        });
      }

      modalVisible.value = true;
    } catch (error) {
      // 拦截器已经显示了错误信息，这里不再重复提示
      // eslint-disable-next-line no-console
      console.error('获取配置信息失败:', error);
    }
  };

  /**
   * 禁用存储平台（已配置状态）
   * @param itemData
   */
  const handleDisableStorage = async (itemData: StoragePlatformRecord) => {
    // 检查是否是本地存储
    if (itemData.identifier === 'Local') {
      Modal.warning({
        title: '无法禁用',
        content: '本地存储是默认存储平台，无法禁用。',
        okText: '知道了',
        hideCancel: true,
      });
      return;
    }

    // 检查是否是当前正在使用的平台
    if (storageStore.currentIdentifier === itemData.identifier) {
      Modal.warning({
        title: '无法禁用',
        content: `"${itemData.name}" 是当前正在使用的存储平台，无法禁用。请先切换到其他平台后再进行禁用操作。`,
        okText: '知道了',
        hideCancel: true,
      });
      return;
    }

    Modal.warning({
      title: '确认禁用',
      content: `禁用后，"${itemData.name}" 将暂停使用，但配置信息会保留。确定要继续吗？`,
      okText: '确认禁用',
      cancelText: '取消',
      onOk: async () => {
        btnLoading.value = true;
        try {
          const { identifier, name } = itemData;
          await openOrCancelStoragePlatform(identifier, 0);
          Message.success(`${name} 已禁用`);
          // 同步更新全局存储平台列表
          await storageStore.fetchActivePlatforms();
        } catch (error) {
          // 拦截器已经显示了错误信息，这里不再重复提示
          // eslint-disable-next-line no-console
          console.error('禁用失败:', error);
        } finally {
          btnLoading.value = false;
          emit('refresh');
        }
      },
    });
  };

  /**
   * 启用存储平台（已配置但已禁用状态）
   * @param itemData
   */
  const handleEnableStorage = async (itemData: StoragePlatformRecord) => {
    Modal.confirm({
      title: '确认启用',
      content: `确定要启用 "${itemData.name}" 存储平台吗？`,
      okText: '确认启用',
      cancelText: '取消',
      onOk: async () => {
        btnLoading.value = true;
        try {
          const { identifier, name } = itemData;
          await openOrCancelStoragePlatform(identifier, 1);
          Message.success(`${name} 已启用`);
          // 同步更新全局存储平台列表
          await storageStore.fetchActivePlatforms();
        } catch (error) {
          // 拦截器已经显示了错误信息，这里不再重复提示
          // eslint-disable-next-line no-console
          console.error('启用失败:', error);
        } finally {
          btnLoading.value = false;
          emit('refresh');
        }
      },
    });
  };

  const handleBeforeOk = async (done: (closed: boolean) => void) => {
    if (formRef.value) {
      try {
        const errors = await formRef.value.validate();
        if (!errors) {
          // 构造提交数据
          const submitData = {
            identifier: formData.identifier,
            configData: JSON.stringify(formData),
          };
          await saveOrUpdateStoragePlatformSettings(submitData);
          Message.success('配置保存成功');
          // 同步更新全局存储平台列表
          await storageStore.fetchActivePlatforms();
          emit('refresh');
          done(true);
        } else {
          done(false);
        }
      } catch (error) {
        // 拦截器已经显示了错误信息，这里不再重复提示
        // eslint-disable-next-line no-console
        console.error('保存配置失败:', error);
        done(false);
      }
    }
  };

  const handleCancel = () => {
    modalVisible.value = false;
  };
</script>

<style lang="less" scoped>
  .card-wrap {
    width: 100%;
    height: 100%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-8px);

      :deep(.arco-card) {
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        border-color: rgb(var(--primary-6));
      }
    }

    :deep(.arco-card) {
      width: 100%;
      height: 100%;
      border-radius: 12px;
      border: 1px solid var(--color-neutral-3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      display: flex;
      flex-direction: column;

      &.enabled-card {
        background: linear-gradient(
          135deg,
          rgba(0, 180, 42, 0.02) 0%,
          rgba(255, 255, 255, 0) 100%
        );
        border-color: rgba(0, 180, 42, 0.2);
      }

      .arco-card-body {
        flex: 1;
        padding: 16px;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .arco-card-actions {
        padding: 12px 16px;
        background-color: var(--color-fill-1);
        border-top: 1px solid var(--color-neutral-3);
        flex-shrink: 0;
      }
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 10px;
      flex-shrink: 0;

      .card-title-wrap {
        flex: 1;
        min-width: 0;

        .card-title {
          display: flex;
          align-items: center;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-1);
          margin-bottom: 6px;
          line-height: 1.4;
          height: 20px;
        }

        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          height: 22px;
        }
      }
    }

    .card-content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .card-description {
      flex: 1;
      margin-top: 8px;
      display: flex;
      align-items: flex-start;

      :deep(.arco-typography) {
        color: var(--color-text-3);
        line-height: 1.5;
        font-size: 12px;
        margin: 0;
        height: 36px;
        overflow: hidden;
      }
    }

    .card-actions {
      display: flex;
      gap: 6px;
      width: 100%;

      .arco-btn {
        flex: 1;
        height: 30px;
        font-size: 12px;
      }
    }

    .modal-title {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
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
  }
</style>
