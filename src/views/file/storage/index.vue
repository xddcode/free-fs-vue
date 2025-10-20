<template>
  <div class="container">
    <Breadcrumb :items="['文件中心', '存储平台']" />
    <a-row :gutter="20" align="stretch">
      <a-col :span="24">
        <a-card class="general-card storage-header-card">
          <template #title>
            <div class="header-title">
              <icon-storage style="margin-right: 8px" />
              <span>存储平台管理</span>
            </div>
          </template>
          <template #extra>
            <a-space>
              <a-input-search
                v-model="searchKeyword"
                allow-clear
                placeholder="搜索存储平台..."
                style="width: 260px"
                @search="handleSearch"
                @clear="handleClear"
              />
              <a-button type="outline" @click="handleRefresh">
                <template #icon>
                  <icon-refresh />
                </template>
                刷新
              </a-button>
            </a-space>
          </template>

          <div v-if="loading && renderData.length === 0" class="loading-wrap">
            <a-spin :size="40" tip="加载中..." />
          </div>

          <div v-else-if="renderData.length > 0" class="list-wrap">
            <a-row :gutter="[16, 16]" class="list-row">
              <!-- 管理员新增卡片 -->
              <a-col v-if="isAdmin" :span="4" class="list-col">
                <div class="add-card" @click="handleAddPlatform">
                  <div class="add-card-content">
                    <div class="add-icon">
                      <icon-plus :size="48" />
                    </div>
                    <div class="add-text">新增存储平台</div>
                  </div>
                </div>
              </a-col>

              <!-- 存储平台卡片 -->
              <a-col
                v-for="item in renderData"
                :key="item.id"
                :span="4"
                class="list-col"
              >
                <CardWrap
                  :is-admin="isAdmin"
                  :item-data="item"
                  @refresh="fetchData"
                />
              </a-col>
            </a-row>
          </div>

          <div v-else class="empty-wrap">
            <a-empty description="暂无存储平台数据">
              <template #image>
                <icon-cloud-download
                  :style="{ fontSize: '64px', color: 'var(--color-text-4)' }"
                />
              </template>
            </a-empty>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 新增存储平台弹窗 -->
    <a-modal
      v-model:visible="addModalVisible"
      :mask-closable="false"
      :width="800"
      ok-text="确认新增"
      title-align="start"
      @cancel="handleAddCancel"
      @before-ok="handleAddConfirm"
    >
      <template #title>
        <div class="modal-title">
          <icon-plus style="margin-right: 8px" />
          <span>新增存储平台</span>
        </div>
      </template>
      <a-form
        ref="addFormRef"
        :model="addFormData"
        :rules="addFormRules"
        layout="vertical"
      >
        <a-divider orientation="left">基本信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="name" label="平台名称">
              <a-input
                v-model="addFormData.name"
                placeholder="例如：阿里云OSS"
                allow-clear
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="identifier" label="平台标识">
              <a-input
                v-model="addFormData.identifier"
                placeholder="例如：aliyun_oss（唯一标识）"
                allow-clear
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item
              field="icon"
              label="图标名称"
              tooltip="从 IconFont 选择图标"
            >
              <a-input
                v-model="addFormData.icon"
                placeholder="例如：icon-aliyun"
                allow-clear
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="link" label="官网链接">
              <a-input
                v-model="addFormData.link"
                placeholder="例如：https://www.aliyun.com"
                allow-clear
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item field="desc" label="平台描述">
          <a-textarea
            v-model="addFormData.desc"
            placeholder="请输入平台描述信息"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            allow-clear
          />
        </a-form-item>

        <a-divider orientation="left">
          配置字段
          <a-button
            size="mini"
            type="text"
            style="margin-left: 8px"
            @click="handleAddConfigField"
          >
            <template #icon>
              <icon-plus />
            </template>
            添加字段
          </a-button>
        </a-divider>

        <div class="config-fields-wrap">
          <a-empty
            v-if="addFormData.configScheme.length === 0"
            description="暂无配置字段，请点击上方`添加字段`按钮添加"
            style="padding: 40px 0"
          >
            <template #image>
              <icon-file />
            </template>
          </a-empty>

          <a-card
            v-for="(field, index) in addFormData.configScheme"
            :key="index"
            class="config-field-card"
            :bordered="true"
          >
            <template #title>
              <span>字段 {{ index + 1 }}</span>
            </template>
            <template #extra>
              <a-button
                size="mini"
                status="danger"
                type="text"
                @click="handleRemoveConfigField(index)"
              >
                <template #icon>
                  <icon-delete />
                </template>
              </a-button>
            </template>

            <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item
                  :field="`configScheme[${index}].identifier`"
                  label="字段标识"
                  :rules="[
                    { required: true, message: '请输入字段标识' },
                    {
                      match: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                      message: '只能包含字母、数字、下划线',
                    },
                  ]"
                >
                  <a-input
                    v-model="field.identifier"
                    placeholder="例如：accessKey"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item
                  :field="`configScheme[${index}].label`"
                  label="字段标签"
                  :rules="[{ required: true, message: '请输入字段标签' }]"
                >
                  <a-input
                    v-model="field.label"
                    placeholder="例如：Access-Key"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item
                  :field="`configScheme[${index}].dataType`"
                  label="数据类型"
                >
                  <a-select v-model="field.dataType" placeholder="选择数据类型">
                    <a-option value="string">字符串</a-option>
                    <a-option value="number">数字</a-option>
                    <a-option value="boolean">布尔值</a-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item
                  :field="`configScheme[${index}].validation.required`"
                  label="是否必填"
                >
                  <a-switch v-model="field.validation.required" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-card>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { createStoragePlatform, getStoragePlatforms } from '@/api/storage';
  import { StoragePlatformRecord } from '@/types/modules/storage';
  import { useUserStore } from '@/store';
  import CardWrap from './components/card-wrap.vue';

  const userStore = useUserStore();
  const type = ref(1);
  const searchKeyword = ref('');
  const loading = ref(true);
  const renderData = ref<StoragePlatformRecord[]>([]);

  // 判断是否为管理员
  const isAdmin = computed(() => userStore.roleCode === 'admin');

  const fetchData = async (keywords?: string) => {
    loading.value = true;
    try {
      const { data } = await getStoragePlatforms(type.value, keywords);
      renderData.value = data;
    } catch (error) {
      Message.error('获取存储平台数据失败');
      renderData.value = [];
    } finally {
      loading.value = false;
    }
  };

  fetchData();

  const handleSearch = (value: string) => {
    fetchData(value);
  };

  const handleClear = () => {
    searchKeyword.value = '';
    fetchData();
  };

  const handleRefresh = () => {
    searchKeyword.value = '';
    fetchData();
  };

  // 管理员功能：新增存储平台
  const addModalVisible = ref(false);
  const addFormRef = ref();
  const addFormData = ref({
    name: '',
    identifier: '',
    icon: '',
    link: '',
    desc: '',
    configScheme: [] as Array<{
      identifier: string;
      label: string;
      dataType: string;
      validation: { required: boolean };
    }>,
  });

  const addFormRules = {
    name: [{ required: true, message: '请输入平台名称' }],
    identifier: [
      { required: true, message: '请输入平台标识' },
      {
        match: /^[a-zA-Z][a-zA-Z0-9_]*$/,
        message: '标识只能包含字母、数字和下划线，且以字母开头',
      },
    ],
    icon: [{ required: true, message: '请输入图标名称' }],
    desc: [{ required: true, message: '请输入平台描述' }],
  };

  const handleAddPlatform = () => {
    addModalVisible.value = true;
  };

  const handleAddCancel = () => {
    addModalVisible.value = false;
    addFormRef.value?.resetFields();
    // 重置配置字段
    addFormData.value.configScheme = [];
  };

  const handleAddConfirm = async (done: (closed: boolean) => void) => {
    if (addFormRef.value) {
      try {
        const errors = await addFormRef.value.validate();
        if (!errors) {
          // 验证至少有一个配置字段
          if (addFormData.value.configScheme.length === 0) {
            Message.warning('请至少添加一个配置字段');
            done(false);
            return;
          }

          // 构造提交数据
          const submitData = {
            ...addFormData.value,
            configScheme: JSON.stringify(addFormData.value.configScheme),
            isDefault: 1,
          };
          await createStoragePlatform(submitData);
          Message.success('新增存储平台成功');
          addFormRef.value.resetFields();
          addFormData.value.configScheme = [];
          fetchData();
          done(true);
        } else {
          done(false);
        }
      } catch (error) {
        // 拦截器已经显示了错误信息，这里不再重复提示
        console.error('新增失败:', error);
        done(false);
      }
    }
  };

  // 添加配置字段
  const handleAddConfigField = () => {
    addFormData.value.configScheme.push({
      identifier: '',
      label: '',
      dataType: 'string',
      validation: { required: true },
    });
  };

  // 删除配置字段
  const handleRemoveConfigField = (index: number) => {
    addFormData.value.configScheme.splice(index, 1);
  };
</script>

<script lang="ts">
  export default {
    name: 'Storage',
  };
</script>

<style lang="less" scoped>
  .container {
    padding: 0 20px 20px 20px;
    min-height: calc(100vh - 120px);

    .storage-header-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .header-title {
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-1);
      }
    }

    .loading-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .list-wrap {
      min-height: 300px;

      .list-row {
        .list-col {
          display: flex;
          height: 280px;
          margin-bottom: 0;
        }
      }

      .add-card {
        width: 100%;
        height: 100%;
        border: 2px dashed var(--color-border-3);
        border-radius: 12px;
        background-color: var(--color-fill-1);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          border-color: rgb(var(--primary-6));
          background-color: var(--color-fill-2);
          transform: translateY(-8px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);

          .add-icon {
            color: rgb(var(--primary-6));
            transform: scale(1.1);
          }

          .add-text {
            color: rgb(var(--primary-6));
          }
        }

        .add-card-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;

          .add-icon {
            color: var(--color-text-3);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: var(--color-fill-2);
          }

          .add-text {
            font-size: 14px;
            font-weight: 500;
            color: var(--color-text-2);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
        }
      }
    }

    .empty-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;

      :deep(.arco-empty) {
        .arco-empty-description {
          font-size: 14px;
          color: var(--color-text-3);
          margin-top: 16px;
        }
      }
    }

    :deep(.arco-card-meta-title) {
      font-size: 14px;
    }

    :deep(.arco-space) {
      width: 100%;

      .arco-space-item {
        &:last-child {
          flex: 1;
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
      max-height: 70vh;
      overflow-y: auto;
    }

    .config-fields-wrap {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 400px;
      overflow-y: auto;
      padding: 4px;

      .config-field-card {
        background-color: var(--color-fill-1);
        border: 1px solid var(--color-border-2);

        :deep(.arco-card-header) {
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-border-2);
        }

        :deep(.arco-card-body) {
          padding: 16px;
        }

        :deep(.arco-form-item) {
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    :deep(.arco-divider-text) {
      display: flex;
      align-items: center;
      font-weight: 600;
      color: var(--color-text-1);
    }
  }
</style>
