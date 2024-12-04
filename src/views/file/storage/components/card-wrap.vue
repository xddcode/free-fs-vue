<template>
  <div class="card-wrap">
    <a-card v-if="props.loading" :bordered="false" hoverable>
      <slot name="skeleton"></slot>
    </a-card>

    <a-card v-else :bordered="false" hoverable>
      <a-space align="start" fill>
        <a-avatar
          v-if="itemData.icon"
          :size="32"
          style="margin-right: 8px; background-color: #626aea"
        >
          <icon-font :type="itemData.icon" :size="32" />
        </a-avatar>
        <a-watermark content="系统默认" v-bind="watermarkForm">
          <a-card-meta>
            <template #title>
              {{ itemData.name }}
              <a-link
                v-if="itemData.link"
                :href="itemData.link"
                icon
                target="_blank"
                rel="noopener noreferrer"
                >{{ itemData.identifier }}</a-link
              >
              <a-tag
                v-if="itemData.isEnabled === 1"
                size="small"
                color="green"
                style="margin-left: 10px"
              >
                <template #icon>
                  <icon-check-circle-fill />
                </template>
                <span>已开通</span>
              </a-tag>
              <a-tag
                v-if="itemData.isEnabled === 1 && itemData.isSetting === 0"
                size="small"
                color="gold"
                style="margin-left: 10px"
              >
                <template #icon>
                  <icon-exclamation-circle-fill />
                </template>
                <span>待配置</span>
              </a-tag>
            </template>
            <template #description>
              <a-typography-paragraph
                :ellipsis="{
                  rows: 2,
                  showTooltip: true,
                }"
              >
                {{ itemData.desc }}
              </a-typography-paragraph>
              <slot></slot>
            </template>
          </a-card-meta>
        </a-watermark>
      </a-space>
      <template #actions>
        <a-space>
          <a-button
            v-if="itemData.isEnabled === 1"
            size="small"
            @click="toggle(false)"
            >取消开通</a-button
          >
          <a-button
            v-else
            type="primary"
            size="small"
            @click="handleOpenStorage(itemData)"
            >开通</a-button
          >
          <a-button v-if="itemData.isSetting === 1" type="primary" size="small">
            <template #icon>
              <icon-settings />
            </template>
          </a-button>
        </a-space>
      </template>
    </a-card>

    <a-modal
      :visible="modalVisible"
      title="存储平台配置"
      :mask-closable="false"
      ok-text="确认开通"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        :auto-label-width="true"
      >
        <div v-for="field in schemes" :key="field.identifier">
          <a-form-item :field="field.identifier" :label="field.label">
            <a-input
              v-model="formData[field.identifier]"
              :placeholder="'请输入' + field.label"
              allow-clear
            />
          </a-form-item>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
  import { Icon } from '@arco-design/web-vue';
  import { PropType, reactive, ref } from 'vue';
  import { openOrCancelStoragePlatform } from '@/api/storage';
  import { StoragePlatformRecord } from '@/types/modules/storage';

  const IconFont = Icon.addFromIconFontCn({
    src: 'https://at.alicdn.com/t/c/font_4759634_ieftb3g6nn.js',
  });

  const watermarkForm = reactive({
    rotate: -25,
    gap: [50, 50],
    offset: [],
    font: { fontSize: 16 },
    zIndex: 6,
    alpha: 0.7,
    repeat: true,
    staggered: true,
  });

  const props = defineProps({
    loading: {
      type: Boolean,
      default: false,
    },
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
  const formData = reactive<Record<string, string>>({});

  // 初始化表单数据
  const resetFormData = async () => {
    schemes.value.forEach((field) => {
      formData[field.identifier] = '';
      rules[field.identifier] = {
        required: field.validation.required,
        message: `请输入${field.label}`,
      };
    });
  };

  /**
   * 开通存储平台
   * @param itemData
   */
  const handleOpenStorage = async (itemData: StoragePlatformRecord) => {
    const { isSetting, configScheme } = itemData;
    if (isSetting === 0) {
      modalVisible.value = true;
      schemes.value = JSON.parse(configScheme);
      await resetFormData();
    } else {
      await openOrCancelStoragePlatform(itemData.identifier, 1);
    }
    // 如果已经配置过了，则直接修改
  };

  const handleOk = () => {
    if (formRef.value) {
      formRef.value.validate().then(async (errors: any) => {
        if (!errors) {
          alert(1);
        }
      });
    }
  };

  const handleCancel = () => {
    modalVisible.value = false;
  };
</script>

<style scoped lang="less">
  .card-wrap {
    height: 100%;
    transition: all 0.3s;
    border: 1px solid var(--color-neutral-3);
    border-radius: 4px;

    &:hover {
      transform: translateY(-4px);
      // box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.1);
    }

    :deep(.arco-card) {
      height: 100%;
      border-radius: 4px;

      .arco-card-body {
        height: 100%;

        .arco-space {
          width: 100%;
          height: 100%;

          .arco-space-item {
            height: 100%;

            &:last-child {
              flex: 1;
            }

            .arco-card-meta {
              height: 100%;
              display: flex;
              flex-flow: column;

              .arco-card-meta-content {
                flex: 1;
                .arco-card-meta-description {
                  .arco-typography {
                    margin-top: 8px;
                    color: rgb(var(--gray-6));
                    line-height: 20px;
                    font-size: 12px;
                  }
                }
              }

              .arco-card-meta-footer {
                margin-top: 0;
              }
            }
          }
        }
      }
    }

    :deep(.arco-card-meta-title) {
      display: flex;
      align-items: center;
      // To prevent the shaking
      line-height: 28px;
    }

    :deep(.arco-skeleton-line) {
      &:last-child {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
      }
    }
  }
</style>
