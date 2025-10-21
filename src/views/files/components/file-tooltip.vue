<template>
  <div
    class="custom-tooltip"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <slot />
    <Transition name="tooltip-fade">
      <div v-if="visible" class="tooltip-content" :class="positionClass">
        <div class="tooltip-arrow" />
        <div class="tooltip-inner">
          <slot name="content" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';

  interface Props {
    position?: 'top' | 'bottom';
    delay?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    position: 'bottom',
    delay: 200,
  });

  const visible = ref(false);
  let timer: any = null;

  const handleMouseEnter = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      visible.value = true;
    }, props.delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timer);
    visible.value = false;
  };

  const positionClass = `tooltip-${props.position}`;
</script>

<style lang="less" scoped>
  .custom-tooltip {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  .tooltip-content {
    position: absolute;
    z-index: 1000;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;

    &.tooltip-top {
      bottom: calc(100% + 10px);

      .tooltip-arrow {
        bottom: -6px;
        border-top-color: #fff;
      }
    }

    &.tooltip-bottom {
      top: calc(100% + 10px);

      .tooltip-arrow {
        top: -6px;
        border-bottom-color: #fff;
      }
    }
  }

  .tooltip-inner {
    min-width: 200px;
    max-width: 350px;
    padding: 12px 14px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .tooltip-arrow {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border: 6px solid transparent;
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.08));
  }

  // 淡入淡出动画
  .tooltip-fade-enter-active,
  .tooltip-fade-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
  }

  .tooltip-fade-enter-from,
  .tooltip-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-4px);
  }

  .tooltip-fade-enter-to,
  .tooltip-fade-leave-from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
</style>
