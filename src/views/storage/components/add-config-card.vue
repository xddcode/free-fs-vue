<template>
  <div class="add-config-card" @click="handleClick">
    <a-card :bordered="false" hoverable class="add-card">
      <div class="card-content">
        <div class="add-icon">
          <icon-plus :size="32" />
        </div>
        <div class="add-text">添加配置</div>
        <div class="add-desc">添加新的存储平台配置</div>
      </div>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
  import { IconPlus } from '@arco-design/web-vue/es/icon';

  const emit = defineEmits(['click']);

  const handleClick = () => {
    emit('click');
  };
</script>

<style lang="less" scoped>
  .add-config-card {
    width: 100%;
    height: 100%;
    cursor: pointer;
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
      border: 2px dashed var(--color-neutral-3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: linear-gradient(
        135deg,
        rgba(var(--primary-6), 0.02) 0%,
        rgba(255, 255, 255, 0) 100%
      );

      &:hover {
        border-color: rgb(var(--primary-6));
        background: linear-gradient(
          135deg,
          rgba(var(--primary-6), 0.05) 0%,
          rgba(255, 255, 255, 0) 100%
        );
      }

      .arco-card-body {
        flex: 1;
        padding: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 0;
      }
    }

    .card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      height: 100%;
    }

    .add-icon {
      color: var(--color-text-3);
      margin-bottom: 12px;
      transition: all 0.3s ease;

      .add-config-card:hover & {
        color: rgb(var(--primary-6));
        transform: scale(1.1);
      }
    }

    .add-text {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-1);
      margin-bottom: 4px;
      transition: all 0.3s ease;

      .add-config-card:hover & {
        color: rgb(var(--primary-6));
      }
    }

    .add-desc {
      font-size: 12px;
      color: var(--color-text-3);
      line-height: 1.4;
      transition: all 0.3s ease;

      .add-config-card:hover & {
        color: var(--color-text-2);
      }
    }
  }
</style>
