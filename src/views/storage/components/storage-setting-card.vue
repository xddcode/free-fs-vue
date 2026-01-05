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
              <span class="title-text">{{ setting.storagePlatform.name }}</span>
              <a-link
                v-if="setting.storagePlatform.link"
                :href="setting.storagePlatform.link"
                rel="noopener noreferrer"
                target="_blank"
                style="margin-left: 4px; padding: 0"
              >
                <icon-link style="font-size: 14px" />
              </a-link>
            </div>
            <!-- 启用状态标签 -->
            <div class="status-tag-wrap">
              <a-tag
                v-if="setting.enabled === 1"
                color="green"
                size="small"
                class="status-tag"
              >
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
              <span class="config-id">ID: {{ setting.id }}</span>
              <a-typography-text
                copyable
                :copy-text="String(setting.id)"
                style="margin-left: 4px"
              >
                <template #copy-icon>
                  <icon-copy style="font-size: 10px; cursor: pointer" />
                </template>
                <template #copy-success-icon>
                  <icon-check
                    style="font-size: 10px; color: var(--color-success-light-4)"
                  />
                </template>
              </a-typography-text>
            </div>
          </div>
        </div>

        <div class="card-info-box">
          <div
            v-if="setting.remark && setting.remark.trim()"
            :class="[
              'config-remark',
              setting.remark === '测试' ? 'test-remark' : '',
            ]"
          >
            <component
              :is="setting.remark === '测试' ? IconSafe : IconTags"
              style="font-size: 12px; margin-right: 4px"
            />
            <span>{{ setting.remark }}</span>
          </div>
          <div v-else class="config-remark-empty">
            <icon-exclamation-circle
              style="font-size: 11px; margin-right: 4px"
            />
            <span>未设置备注</span>
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
          <!-- 启用/禁用切换（电源样式） -->
          <div class="action-light-wrap">
            <a-tooltip
              :content="setting.enabled === 1 ? '点击禁用' : '点击启用'"
            >
              <div
                class="light-toggle-btn"
                :class="{
                  'is-active': setting.enabled === 1,
                  'is-loading': btnLoading,
                }"
                @click="!btnLoading && handleToggleEnabled()"
              >
                <div class="light-glow"></div>
                <icon-poweroff v-if="!btnLoading" />
                <icon-loading v-else />
              </div>
            </a-tooltip>
          </div>

          <a-button-group class="action-btn-group">
            <a-tooltip content="查看配置">
              <a-button size="small" @click="handleViewConfig">
                <template #icon>
                  <icon-eye />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="编辑配置">
              <a-button size="small" @click="handleEditConfig">
                <template #icon>
                  <icon-settings />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="删除配置">
              <a-button size="small" status="danger" @click="handleDelete">
                <template #icon>
                  <icon-delete />
                </template>
              </a-button>
            </a-tooltip>
          </a-button-group>
        </div>
      </template>
    </a-card>

    <!-- 查看配置弹窗 -->
    <a-modal
      v-model:visible="viewModalVisible"
      :mask-closable="true"
      :width="600"
      ok-text="复制配置"
      title-align="start"
      @cancel="handleViewCancel"
      @ok="handleCopyConfig"
    >
      <template #title>
        <div class="modal-title">
          <icon-eye style="margin-right: 8px" />
          <span>{{ setting.storagePlatform.name }} - 查看配置</span>
        </div>
      </template>
      <a-descriptions
        :column="1"
        layout="vertical"
        :data="viewConfigDescriptions"
        size="large"
      />
    </a-modal>

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
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
  import { Icon, Message, Modal } from '@arco-design/web-vue';
  import { PropType, reactive, ref, computed } from 'vue';
  import {
    IconCheck,
    IconSettings,
    IconDelete,
    IconTags,
    IconExclamationCircle,
    IconInfoCircle,
    IconEye,
    IconSafe,
    IconCopy,
    IconLink,
    IconPoweroff,
    IconLoading,
  } from '@arco-design/web-vue/es/icon';
  import {
    updateStorageSetting,
    deleteStorageSetting,
    toggleStorageSetting,
  } from '@/api/storage';
  import type { StorageSetting } from '@/types/modules/storage';
  import { useStorageStore } from '@/store';

  const IconFont = Icon.addFromIconFontCn({
    src: 'https://at.alicdn.com/t/c/font_4759634_2elqr2s9who.js',
  });

  interface ConfigScheme {
    identifier: string;
    label: string;
    dataType: string;
    validation: {
      required: boolean;
    };
  }

  const editModalVisible = ref(false);
  const viewModalVisible = ref(false);
  const btnLoading = ref(false);
  const viewConfigSchemes = ref<ConfigScheme[]>([]);

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

  // 获取查看配置的值（带脱敏处理）
  const getViewConfigValue = (identifier: string): string => {
    const { configData } = props.setting;
    if (!configData) return '未配置';

    try {
      const parsedConfigData = JSON.parse(configData);
      const value = parsedConfigData[identifier] || '';

      // 对 Secret-key 相关字段进行脱敏处理（Access-Key 不脱敏）
      const lowerIdentifier = identifier.toLowerCase();
      const isAccessKey =
        lowerIdentifier.includes('access') && lowerIdentifier.includes('key');
      const isSecretKey =
        (lowerIdentifier.includes('secret') &&
          lowerIdentifier.includes('key')) ||
        lowerIdentifier.includes('password') ||
        lowerIdentifier.includes('token');

      if (isSecretKey && !isAccessKey) {
        if (value && value.length > 0) {
          // 显示前4位和后4位，中间用*代替
          if (value.length > 8) {
            return `${value.substring(0, 4)}${'*'.repeat(
              Math.min(value.length - 8, 20)
            )}${value.substring(value.length - 4)}`;
          }
          return '****';
        }
        return '未配置';
      }

      return value || '未配置';
    } catch (error) {
      return '未配置';
    }
  };

  // 获取原始配置值（用于复制）
  const getOriginalConfigValue = (identifier: string): string => {
    const { configData } = props.setting;
    if (!configData) return '';

    try {
      const parsedConfigData = JSON.parse(configData);
      return parsedConfigData[identifier] || '';
    } catch (error) {
      return '';
    }
  };

  // 生成 Descriptions 组件的数据
  const viewConfigDescriptions = computed(() => {
    const { remark } = props.setting;
    const descriptions: Array<{ label: string; value: string }> = [];

    // 添加配置项
    viewConfigSchemes.value.forEach((field) => {
      descriptions.push({
        label: field.label,
        value: getViewConfigValue(field.identifier),
      });
    });

    // 添加备注
    descriptions.push({
      label: '配置备注',
      value: remark && remark.trim() ? remark : '未设置备注',
    });

    return descriptions;
  });

  const handleViewConfig = async () => {
    const { storagePlatform } = props.setting;
    try {
      viewConfigSchemes.value = JSON.parse(storagePlatform.configScheme);
      viewModalVisible.value = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('获取配置信息失败:', error);
      Message.error('获取配置信息失败');
    }
  };

  const handleViewCancel = () => {
    viewModalVisible.value = false;
  };

  const handleCopyConfig = async () => {
    const { storagePlatform, remark } = props.setting;
    const configText: string[] = [];

    // 添加标题
    configText.push(`${storagePlatform.name} 配置信息`);
    configText.push('='.repeat(30));

    // 添加配置项
    viewConfigSchemes.value.forEach((field) => {
      const value = getOriginalConfigValue(field.identifier);
      configText.push(`${field.label}: ${value || '未配置'}`);
    });

    // 添加备注
    configText.push(`配置备注: ${remark || '未设置备注'}`);

    // 复制到剪贴板
    const textToCopy = configText.join('\n');
    try {
      await navigator.clipboard.writeText(textToCopy);
      Message.success('配置信息已复制到剪贴板');
      viewModalVisible.value = false;
    } catch (error) {
      // 降级方案：使用传统方法
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        Message.success('配置信息已复制到剪贴板');
        viewModalVisible.value = false;
      } catch (err) {
        Message.error('复制失败，请手动复制');
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

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
      content:
        action === 1
          ? `启用后将自动切换到 "${storagePlatform.name}" 存储平台，其他已启用的配置将被禁用。确定要继续吗？`
          : `禁用后将自动切换到默认存储平台。确定要继续吗？`,
      okText: `确认${action === 1 ? '启用' : '禁用'}`,
      cancelText: '取消',
      onOk: async () => {
        btnLoading.value = true;
        try {
          // 调用启用/禁用接口
          await toggleStorageSetting(id.toString(), action);

          // 更新 store 中的数据
          const storageStore = useStorageStore();
          await storageStore.fetchActivePlatforms();

          if (action === 1) {
            Message.success(`${storagePlatform.name} 已启用，页面即将刷新...`);
          } else {
            Message.success(
              `${storagePlatform.name} 已禁用，正在切换到默认平台...`
            );
          }

          // 延迟刷新页面，确保 store 更新完成
          setTimeout(() => {
            window.location.reload();
          }, 800);
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
      okButtonProps: {
        status: 'danger',
      },
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
          // 更新 store 中的数据
          const storageStore = useStorageStore();
          await storageStore.fetchActivePlatforms();
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
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      flex-shrink: 0;
      position: relative;

      .card-title-wrap {
        flex: 1;
        min-width: 0;

        .card-title {
          display: flex;
          align-items: center;
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text-1);
          margin-bottom: 4px;
          line-height: 1.4;

          .title-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        .status-tag-wrap {
          position: absolute;
          top: 0;
          right: 0;
        }

        .card-subtitle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--color-text-3);
          line-height: 1;

          .config-id {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            opacity: 0.8;
          }
        }
      }
    }

    .card-info-box {
      margin-bottom: 8px;

      .config-remark {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        background: rgba(var(--primary-6), 0.08);
        border-radius: 6px;
        color: rgb(var(--primary-6));
        font-weight: 500;
        font-size: 12px;
        max-width: 100%;
        border: 1px solid rgba(var(--primary-6), 0.1);
        transition: all 0.2s;

        &.test-remark {
          background: rgba(var(--success-6), 0.08);
          color: rgb(var(--success-6));
          border-color: rgba(var(--success-6), 0.1);
        }

        span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .config-remark-empty {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        background: var(--color-fill-2);
        border-radius: 4px;
        color: var(--color-text-4);
        font-size: 11px;
        border: 1px dashed var(--color-border-3);
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
      align-items: center;
      justify-content: space-between;
      width: 100%;

      .action-light-wrap {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;

        .light-toggle-btn {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-fill-2);
          color: var(--color-text-3);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 20px;
          border: 1px solid var(--color-border-2);

          &:hover {
            background: var(--color-fill-3);
            transform: scale(1.05);
          }

          .light-glow {
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 50%;
            opacity: 0;
            transition: all 0.3s ease;
            border: 2px solid rgba(0, 180, 42, 0.3);
          }

          &.is-active {
            background: #00b42a;
            color: #fff;
            border-color: #00b42a;

            .light-glow {
              opacity: 1;
              animation: light-pulse 2s infinite;
            }
          }

          &.is-loading {
            cursor: not-allowed;
            opacity: 0.7;
          }
        }
      }

      .action-btn-group {
        flex-shrink: 0;
        margin-left: 8px;

        .arco-btn {
          padding: 0 8px;
        }
      }
    }

    .view-modal-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;

      .title-left {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;

        .title-info {
          .title-name {
            font-size: 16px;
            font-weight: 600;
            color: var(--color-text-1);
            line-height: 1.5;
          }

          .title-desc {
            font-size: 12px;
            color: var(--color-text-3);
            line-height: 1.5;
          }
        }
      }
    }

    .view-config-content {
      padding: 4px 0;
      max-height: 70vh;
      overflow-y: auto;

      .info-card {
        margin-bottom: 16px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

        &:last-child {
          margin-bottom: 0;
        }

        .card-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-1);

          .arco-icon {
            font-size: 16px;
            color: rgb(var(--primary-6));
          }
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px 24px;

          .info-item {
            .info-label {
              font-size: 12px;
              color: var(--color-text-3);
              margin-bottom: 8px;
              font-weight: 500;
            }

            .info-value {
              font-size: 14px;
              color: var(--color-text-1);
              word-break: break-all;

              &.code-text {
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                background: var(--color-fill-2);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
              }
            }

            .empty-text {
              color: var(--color-text-4);
              font-style: italic;
            }
          }
        }

        .config-list {
          display: flex;
          flex-direction: column;
          gap: 16px;

          .config-item {
            padding: 12px;
            background: var(--color-fill-1);
            border-radius: 6px;
            border: 1px solid var(--color-border-2);
            transition: all 0.2s;

            &:hover {
              background: var(--color-fill-2);
              border-color: rgb(var(--primary-6));
            }

            .config-label {
              display: flex;
              align-items: center;
              font-size: 12px;
              color: var(--color-text-3);
              margin-bottom: 8px;
              font-weight: 500;
            }

            .config-value {
              .config-text {
                margin: 0;
                font-size: 13px;
                color: var(--color-text-1);
                word-break: break-all;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;

                :deep(.arco-typography) {
                  margin: 0;
                }
              }
            }
          }

          .empty-config {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 40px 20px;
            color: var(--color-text-3);
            font-size: 14px;

            .arco-icon {
              font-size: 16px;
            }
          }
        }

        .platform-desc {
          font-size: 13px;
          color: var(--color-text-2);
          line-height: 1.8;
          padding: 8px 0;
        }
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

      .form-item-tip {
        display: flex;
        align-items: center;
        color: rgb(var(--primary-6));
        font-size: 12px;
        line-height: 1.5;
        margin-top: 4px;
      }
    }
  }

  @keyframes light-pulse {
    0% {
      transform: scale(1);
      opacity: 0.6;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 0.6;
    }
  }
</style>
