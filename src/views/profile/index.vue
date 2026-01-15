<template>
  <div class="container">
    <Breadcrumb :items="['用户中心', '用户设置']" />
    <a-row style="margin-bottom: 20px">
      <a-col :span="24">
        <UserPanel />
      </a-col>
    </a-row>
    <a-row class="wrapper">
      <a-col :span="24">
        <a-tabs default-active-key="1" type="rounded">
          <a-tab-pane key="1" title="基本信息">
            <BasicInformation />
          </a-tab-pane>
          <a-tab-pane key="2" title="安全设置">
            <SecuritySettings />
          </a-tab-pane>
          <a-tab-pane key="3" title="传输设置">
            <TransferSettings />
          </a-tab-pane>
        </a-tabs>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
  import UserPanel from './components/user-panel.vue';
  import BasicInformation from './components/basic-information.vue';
  import SecuritySettings from './components/security-settings.vue';
  import TransferSettings from './components/transfer-settings.vue';
</script>

<script lang="ts">
  export default {
    name: 'Profile',
  };
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;
    background-color: transparent;
  }

  .wrapper {
    padding: 20px;
    min-height: 580px;
    background-color: var(--color-bg-2);
    border-radius: 4px;
    box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.08);
  }

  :deep(.section-title) {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 14px;
  }
</style>
