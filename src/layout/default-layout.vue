<template>
  <a-layout class="layout">
    <div class="layout-navbar">
      <NavBar />
    </div>
    <a-layout>
      <a-layout :style="{ paddingTop: '60px' }" class="layout-content">
        <a-layout-content>
          <PageLayout />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
  import NavBar from '@/components/navbar/index.vue';
  import PageLayout from './page-layout.vue';
</script>

<style lang="less" scoped>
  @nav-size-height: 60px;

  .layout {
    width: 100%;
    height: 100%;
  }

  .layout-navbar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
    width: 100%;
    height: @nav-size-height;
  }

  .layout-content {
    min-height: 100vh;
    background-color: var(--color-fill-2);
  }
</style>
