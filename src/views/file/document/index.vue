<template>
  <div class="container">
    <Breadcrumb :items="['文件中心', '我的文件']" />
    <a-card class="general-card" title="当前位置：/">
      <a-divider style="margin-top: -10px" />
      <a-row style="margin-bottom: 20px">
        <a-col :flex="1">
          <a-space>
            <a-button>
              <template #icon>
                <icon-arrow-left />
              </template>
              返回上级
            </a-button>
            <a-button type="dashed">
              <template #icon>
                <icon-refresh />
              </template>
              刷新
            </a-button>
            <a-button type="primary">
              <template #icon>
                <icon-upload />
              </template>
              上传文件
            </a-button>
          </a-space>
        </a-col>
        <a-col
          :span="3"
          style="display: flex; align-items: center; justify-content: end"
        >
          <a-input-search allow-clear placeholder="搜索" @search="search" />
        </a-col>
      </a-row>

      <a-list
        :grid-props="{ gutter: 0, span: 1 }"
        :bordered="true"
        :hoverable="true"
      >
        <a-list-item> sdfs </a-list-item>
        <a-list-item> React </a-list-item>
        <a-list-item> React </a-list-item>
        <a-list-item> React </a-list-item>
      </a-list>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
  const data = [
    {
      id: 1,
      objectName: 'test.txt',
      fileName: 'test.txt',
      suffix: 'test.txt',
      type: '',
      size: '1024',
    },
  ];
</script>

<script lang="ts">
  export default {
    name: 'Document',
  };
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;
  }

  .active {
    color: #0960bd;
    background-color: #e3f4fc;
  }
</style>
