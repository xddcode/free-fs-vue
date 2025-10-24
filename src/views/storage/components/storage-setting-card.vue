<template>
  <div class="card-wrap">
    <a-card
      :bordered="false"
      :class="{ 'enabled-card': setting.enabled === 1 }"
      hoverable
    >
      <div class="card-content-wrapper">
        <div class="card-header">
          <a-avatar
            v-if="setting.storagePlatform.icon"
            :size="42"
            :style="{
              backgroundColor: setting.enabled === 1 ? '#00b42a' : '#626aea',
              flexShrink: 0,
            }"
          >
            <icon-font :size="24" :type="setting.storagePlatform.icon" />
          </a-avatar>
          <div class="card-title-wrap">
            <div class="card-title">
              {{ setting.storagePlatform.name }}
              <a-link
                v-if="setting.storagePlatform.link"
                :href="setting.storagePlatform.link"
                icon
                rel="noopener noreferrer"
                target="_blank"
                style="margin-left: 4px"
              >
                <icon-link style="font-size: 12px" />
              </a-link>
              <!-- 启用状态标签 -->
              <a-tag v-if="setting.enabled === 1" color="green" size="small" class="status-tag">
                <template #icon>
                  <icon-check-circle-fill />
                </template>
                已启用
              </a-tag>
              <a-tag v-else color="red" size="small" class="status-tag">
                <template #icon>
                  <icon-close-circle />
                </template>
                已禁用
              </a-tag>
            </div>
            <div class="card-subtitle">
              <span class="config-id">配置ID: {{ setting.id }}</span>
              <span v-if="setting.remark && setting.remark.trim()" class="config-remark">{{ setting.remark }}</span>
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
            {{ setting.storagePlatform.desc || '暂无描述信息' }}
          </a-typography-paragraph>
        </div>
      </div>

      <template #actions>
        <div class="card-actions">
          <!-- 启用/禁用按钮 -->
          <a-button
            v-if="setting.enabled === 1"
            :loading="btnLoading"
            size="small"
            status="danger"
            type="outline"
            @click="handleToggleEnabled"
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
            @click="handleToggleEnabled"
          >
            <template #icon>
              <icon-check />
            </template>
            启用
          </a-button>

          <!-- 编辑配置按钮 -->
          <a-button size="small" type="outline" @click="handleEditConfig">
            <template #icon>
              <icon-settings />
            </template>
            编辑
          </a-button>

          <!-- 删除按钮 -->
          <a-button
            size="small"
            status="danger"
            type="outline"
            @click="handleDelete"
          >
            <template #icon>
              <icon-delete />
            </template>
            删除
          </a-button>
        </div>
      </template>
    </a-card>

    <!-- 编辑配置弹窗 -->
    <a-modal
      v-model:visible="editModalVisible"
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
          <span>{{ setting.storagePlatform.name }} - 编辑配置</span>
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

        <!-- 备注字段 -->
        <a-form-item
          field="remark"
          label="配置备注"
        >
          <a-input
            v-model="formData.remark"
            placeholder="请输入配置备注，用于区分同一平台下的不同配置（可选）"
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
    IconDelete,
  } from '@arco-design/web-vue/es/icon';
  import {
    updateStorageSetting,
    deleteStorageSetting,
    toggleStorageSetting,
    type StorageSetting,
  } from '@/api/storage';

  const IconFont = Icon.addFromIconFontCn({
    src: 'https://at.alicdn.com/t/c/font_4759634_ieftb3g6nn.js',
  });

  const editModalVisible = ref(false);
  const btnLoading = ref(false);

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
  const formData = reactive<Record<string, string>>({});

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

    // 初始化备注字段
    formData.remark = '';

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

  const props = defineProps({
    setting: {
      type: Object as PropType<StorageSetting>,
      required: true,
    },
  });

  const handleEditConfig = async () => {
    const { storagePlatform, configData, remark } = props.setting;

    try {
      schemes.value = JSON.parse(storagePlatform.configScheme);

      // 先重置表单
      await resetFormData();

      // 设置备注字段
      if (remark) {
        formData.remark = remark;
      }

      // 遍历 schemes 将 configData 中对应的值设置到 formData
      if (configData) {
        const parsedConfigData = JSON.parse(configData);
        schemes.value.forEach((field) => {
          if (parsedConfigData[field.identifier]) {
            formData[field.identifier] = parsedConfigData[field.identifier];
          }
        });
      }

      editModalVisible.value = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('获取配置信息失败:', error);
      Message.error('获取配置信息失败');
    }
  };

  const handleToggleEnabled = async () => {
    const { id, enabled, storagePlatform } = props.setting;
    const action = enabled === 1 ? 0 : 1; // 0禁用，1启用

    Modal.confirm({
      title: action === 1 ? '确认启用' : '确认禁用',
      content: `确定要${action === 1 ? '启用' : '禁用'} "${
        storagePlatform.name
      }" 存储平台配置吗？`,
      okText: `确认${action === 1 ? '启用' : '禁用'}`,
      cancelText: '取消',
      onOk: async () => {
        btnLoading.value = true;
        try {
          await toggleStorageSetting(id.toString(), action);
          Message.success(
            `${storagePlatform.name} 已${action === 1 ? '启用' : '禁用'}`
          );
          emit('refresh');
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('操作失败:', error);
        } finally {
          btnLoading.value = false;
        }
      },
    });
  };

  const handleDelete = () => {
    const { id, storagePlatform } = props.setting;

    Modal.confirm({
      title: '确认删除',
      content: `删除后，"${storagePlatform.name}" 的配置信息将无法恢复。确定要继续吗？`,
      okText: '确认删除',
      cancelText: '取消',
      onOk: async () => {
        btnLoading.value = true;
        try {
          await deleteStorageSetting(id);
          Message.success(`${storagePlatform.name} 配置已删除`);
          emit('refresh');
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('删除失败:', error);
        } finally {
          btnLoading.value = false;
        }
      },
      onCancel: () => {
        // 取消删除操作，不需要额外处理
      },
    });
  };

  const handleBeforeOk = async (done: (closed: boolean) => void) => {
    if (formRef.value) {
      try {
        const errors = await formRef.value.validate();
        if (!errors) {
          const { id, storagePlatform } = props.setting;
          const submitData = {
            settingId: id.toString(),
            platformIdentifier: storagePlatform.identifier,
            configData: JSON.stringify(
              Object.fromEntries(
                Object.entries(formData).filter(([key]) => key !== 'remark')
              )
            ),
            remark: formData.remark,
          };
          await updateStorageSetting(submitData);
          Message.success('配置保存成功');
          emit('refresh');
          done(true);
        } else {
          done(false);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('保存配置失败:', error);
        done(false);
      }
    }
  };

  const handleCancel = () => {
    editModalVisible.value = false;
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
          margin-bottom: 4px;
          line-height: 1.4;
          height: 20px;

          .status-tag {
            margin-left: auto;
          }
        }

        .card-subtitle {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 4px;
          font-size: 11px;
          color: var(--color-text-3);
          line-height: 1.3;

          .config-id {
            font-weight: 500;
          }

          .config-remark {
            font-style: italic;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
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
