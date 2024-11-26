<template>
  <div class="card-wrap">
    <a-card v-if="loading" :bordered="false" hoverable>
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
            @click="handleOpenStorage(item.identifier)"
            >开通</a-button
          >
        </a-space>
      </template>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
  import { Icon } from '@arco-design/web-vue';
  import { PropType, reactive } from 'vue';
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

  /**
   * 开通存储平台
   * @param identifier
   */
  const handleOpenStorage = async (identifier: string) => {};
  // const isExpires = ref(props.expires);
  // const renew = () => {
  //   isExpires.value = false;
  // };
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
