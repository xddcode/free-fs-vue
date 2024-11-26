<template>
  <div class="container">
    <Breadcrumb :items="['文件中心', '存储平台']" />
    <a-row :gutter="20" align="stretch">
      <a-col :span="24">
        <a-card class="general-card" title="存储平台">
          <a-row justify="space-between">
            <a-col :span="24">
              <a-tabs :default-active-tab="1" type="rounded">
                <a-tab-pane key="1" title="全部">
                  <StoragePlatforms />
                </a-tab-pane>
                <a-tab-pane key="2" title="系统默认">
                  <StoragePlatforms :type="1" />
                </a-tab-pane>
                <a-tab-pane key="3" title="自定义"></a-tab-pane>
                <StoragePlatforms :type="0" />
              </a-tabs>
            </a-col>
            <a-input-search
              placeholder="搜索"
              style="width: 240px; position: absolute; top: 60px; right: 20px"
            />
          </a-row>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
  import StoragePlatforms from './components/storage-platforms.vue';
</script>

<script lang="ts">
  export default {
    name: 'Storage',
  };
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;

    :deep(.arco-list-content) {
      overflow-x: hidden;
    }

    :deep(.arco-card-meta-title) {
      font-size: 14px;
    }
  }

  :deep(.arco-list-col) {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  :deep(.arco-list-item) {
    width: 33%;
  }

  :deep(.block-title) {
    margin: 0 0 12px 0;
    font-size: 14px;
  }

  :deep(.list-wrap) {
    // min-height: 140px;
    .list-row {
      align-items: stretch;

      .list-col {
        margin-bottom: 16px;
      }
    }

    :deep(.arco-space) {
      width: 100%;

      .arco-space-item {
        &:last-child {
          flex: 1;
        }
      }
    }
  }
</style>
