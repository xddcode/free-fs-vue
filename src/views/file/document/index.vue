<template>
  <div class="container">
    <Breadcrumb :items="['文件中心', '我的文件']" />
    <a-card class="general-card" title="当前位置：/">
      <div class="card-content">
        <div class="main-content">
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
          <a-divider />

          <a-dropdown
            trigger="contextMenu"
            align-point
            :style="{ display: 'block' }"
          >
            <a-empty v-if="files.length === 0" />
            <div v-else class="file-list">
              <div
                v-for="(file, index) in files"
                :key="index"
                class="file-list-item"
              >
                <div class="file-list-img">
                  <img :src="getAssetsFile(file.type)" />
                </div>
                <div class="file-list-name">{{ file.name }}</div>
                <div class="file-list-ck">✓</div>
              </div>
            </div>
            <template #content>
              <a-doption>
                <template #icon>
                  <icon-folder-add />
                </template>
                <template #default>新建文件夹</template>
              </a-doption>
              <a-doption>
                <template #icon>
                  <icon-upload />
                </template>
                <template #default>上传文件</template>
              </a-doption>
              <a-doption>
                <template #icon>
                  <icon-share-external />
                </template>
                <template #default>上传文件夹</template>
              </a-doption>
              <a-doption>
                <template #icon>
                  <icon-refresh />
                </template>
                <template #default>刷新</template>
              </a-doption>
            </template>
          </a-dropdown>
        </div>
        <a-divider />
        <div class="pagination-container">
          <a-pagination v-if="files.length > 0" :total="50" show-total />
        </div>
      </div>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
  const files = [
    { type: 'dir', name: 'Directory' },
    { type: 'code', name: 'Code File' },
    { type: 'doc', name: 'Document File' },
  ];

  const getAssetsFile = (type: string) => {
    return new URL(`../../../assets/images/fti/${type}.png`, import.meta.url)
      .href;
  };
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

  .card-content {
    display: flex;
    flex-direction: column;
    min-height: 300px; // 设置一个最小高度，确保即使内容很少时分页也在底部
  }

  .main-content {
    flex-grow: 1;
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .file-list {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    padding: 15px;
  }

  .file-list-item {
    width: 100px;
    text-align: center;
    color: #333;
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 6px;
    overflow: hidden;
  }

  .file-list-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
    .file-list-img {
      background-color: #f8f8f8;
    }
  }

  .file-list-img {
    width: 100%;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .file-list-img img {
    width: 48px;
    height: 48px;
    object-fit: contain;
    transition: all 0.3s ease;
  }

  .file-list-item:hover .file-list-img img {
    transform: scale(1.1);
  }

  .file-list-name {
    padding: 8px 5px;
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background-color: #fff;
  }

  .file-list-item:hover .file-list-name {
    color: #1e9fff;
  }

  .file-list-item.active .file-list-img::after {
    content: '✓';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(30, 159, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
  }

  .file-list-ck {
    position: absolute;
    right: 3px;
    top: 3px;
    width: 16px;
    height: 16px;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    font-size: 10px;
  }

  .file-list-item:hover .file-list-ck {
    opacity: 1;
  }
</style>
