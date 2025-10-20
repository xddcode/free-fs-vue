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
              <a-tag v-if="itemData.isEnabled === 1" color="green" size="small">
                <template #icon>
                  <icon-check-circle-fill />
                </template>
                已开通
              </a-tag>
              <a-tag v-else color="gray" size="small">
                <template #icon>
                  <icon-close-circle />
                </template>
                未开通
              </a-tag>
              <a-tag
                v-if="itemData.isSetting === 0 && itemData.isEnabled === 1"
                color="orangered"
                size="small"
              >
                <template #icon>
                  <icon-exclamation-circle-fill />
                </template>
                待配置
              </a-tag>
              <a-tag
                v-else-if="itemData.isSetting === 1 && itemData.isEnabled === 1"
                color="blue"
                size="small"
              >
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
        <!-- 管理员视图 -->
        <div v-if="isAdmin" class="card-actions admin-actions">
          <a-dropdown trigger="hover">
            <a-button size="small" type="outline">
              <template #icon>
                <icon-more />
              </template>
              管理
            </a-button>
            <template #content>
              <a-doption @click="handleEditPlatform">
                <template #icon>
                  <icon-edit />
                </template>
                编辑平台
              </a-doption>
              <a-doption @click="handleToggleEnable(itemData)">
                <template #icon>
                  <icon-poweroff />
                </template>
                {{ itemData.isEnabled === 1 ? '禁用' : '启用' }}
              </a-doption>
              <a-doption
                class="danger-option"
                @click="handleDeletePlatform(itemData)"
              >
                <template #icon>
                  <icon-delete />
                </template>
                删除平台
              </a-doption>
            </template>
          </a-dropdown>
          <a-button
            size="small"
            type="primary"
            @click="handleSettingStorage(itemData)"
          >
            <template #icon>
              <icon-settings />
            </template>
            配置
          </a-button>
        </div>

        <!-- 普通用户视图 -->
        <div v-else class="card-actions">
          <a-button
            v-if="itemData.isEnabled === 1"
            :loading="btnLoading"
            size="small"
            status="danger"
            type="outline"
            @click="handleCloseOpenStorage(itemData)"
          >
            <template #icon>
              <icon-close />
            </template>
            取消开通
          </a-button>
          <a-button
            v-else
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
          <a-button
            size="small"
            type="outline"
            @click="handleSettingStorage(itemData)"
          >
            <template #icon>
              <icon-settings />
            </template>
            配置
          </a-button>
        </div>
      </template>
    </a-card>

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
    deleteStoragePlatform,
    enableStoragePlatform,
    getStoragePlatformsSettings,
    openOrCancelStoragePlatform,
    saveOrUpdateStoragePlatformSettings,
  } from '@/api/storage';
  import { StoragePlatformRecord } from '@/types/modules/storage';

  const IconFont = Icon.addFromIconFontCn({
    src: 'https://at.alicdn.com/t/c/font_4759634_ieftb3g6nn.js',
  });

  defineProps({
    itemData: {
      type: Object as PropType<StoragePlatformRecord>,
      default: () => ({}),
    },
    isAdmin: {
      type: Boolean,
      default: false,
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
   * 开通存储平台
   * @param itemData
   */
  const handleOpenStorage = async (itemData: StoragePlatformRecord) => {
    Modal.confirm({
      title: '确认开通',
      content: `确定要开通 "${itemData.name}" 存储平台吗？`,
      okText: '确认开通',
      cancelText: '取消',
      onOk: async () => {
        btnLoading.value = true;
        try {
          const { identifier, name } = itemData;
          await openOrCancelStoragePlatform(identifier, 1);
          Message.success(`${name} 开通成功`);
        } catch (error) {
          // 拦截器已经显示了错误信息，这里不再重复提示
          // eslint-disable-next-line no-console
          console.error('开通失败:', error);
        } finally {
          btnLoading.value = false;
          emit('refresh');
        }
      },
    });
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
   * 取消开通存储平台
   * @param itemData
   */
  const handleCloseOpenStorage = async (itemData: StoragePlatformRecord) => {
    Modal.warning({
      title: '确认取消开通',
      content: `取消开通后，"${itemData.name}" 将无法使用，确定要继续吗？`,
      okText: '确认取消',
      cancelText: '返回',
      onOk: async () => {
        btnLoading.value = true;
        try {
          const { identifier, name } = itemData;
          await openOrCancelStoragePlatform(identifier, 0);
          Message.success(`${name} 已取消开通`);
        } catch (error) {
          // 拦截器已经显示了错误信息，这里不再重复提示
          // eslint-disable-next-line no-console
          console.error('操作失败:', error);
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

  // 管理员功能：编辑平台
  const handleEditPlatform = () => {
    Message.info('编辑平台功能开发中...');
    // TODO: 实现编辑平台功能
  };

  // 管理员功能：启用/禁用平台
  const handleToggleEnable = async (itemData: StoragePlatformRecord) => {
    const action = itemData.isEnabled === 1 ? '禁用' : '启用';
    Modal.confirm({
      title: `确认${action}`,
      content: `确定要${action} "${itemData.name}" 存储平台吗？${
        itemData.isEnabled === 1 ? '禁用后，所有用户将无法使用该平台。' : ''
      }`,
      okText: `确认${action}`,
      cancelText: '取消',
      onOk: async () => {
        try {
          await enableStoragePlatform(
            String(itemData.id),
            itemData.isEnabled !== 1
          );
          Message.success(`${itemData.name} 已${action}`);
          emit('refresh');
        } catch (error) {
          // 拦截器已经显示了错误信息，这里不再重复提示
          // eslint-disable-next-line no-console
          console.error(`${action}失败:`, error);
        }
      },
    });
  };

  // 管理员功能：删除平台
  const handleDeletePlatform = (itemData: StoragePlatformRecord) => {
    Modal.error({
      title: '确认删除',
      content: `删除 "${itemData.name}" 存储平台后，所有相关配置和数据将被清除，此操作不可恢复！确定要继续吗？`,
      okText: '确认删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteStoragePlatform(String(itemData.id));
          Message.success(`${itemData.name} 已删除`);
          emit('refresh');
        } catch (error) {
          console.error('删除失败:', error);
        }
      },
    });
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

      &.admin-actions {
        .arco-btn {
          flex: 1;
        }
      }
    }

    :deep(.danger-option) {
      color: rgb(var(--danger-6));

      &:hover {
        background-color: rgb(var(--danger-1));
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
