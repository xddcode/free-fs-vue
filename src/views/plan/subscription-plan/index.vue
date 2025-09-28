<template>
  <div class="container">
    <Breadcrumb :items="['套餐管理', '套餐计划']" />
    <a-card class="general-card" title="查询表格">
      <a-row>
        <a-col :flex="1">
          <a-form
            :label-col-props="{ span: 6 }"
            :model="formModel"
            :wrapper-col-props="{ span: 18 }"
            label-align="left"
          >
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item field="planName" label="套餐名称">
                  <a-input
                    v-model="formModel.planName"
                    allow-clear
                    placeholder="请输入套餐名称"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-col>
        <a-divider direction="vertical" style="height: 84px" />
        <a-col :flex="'86px'" style="text-align: right">
          <a-space :size="18" direction="vertical">
            <a-button type="primary" @click="search">
              <template #icon>
                <icon-search />
              </template>
              搜索
            </a-button>
            <a-button @click="reset">
              <template #icon>
                <icon-refresh />
              </template>
              重置
            </a-button>
          </a-space>
        </a-col>
      </a-row>
      <a-divider style="margin-top: 0" />
      <a-row style="margin-bottom: 16px">
        <a-col :span="12">
          <a-space>
            <a-button type="primary" @click="handleAdd">
              <template #icon>
                <icon-plus />
              </template>
              新建
            </a-button>
          </a-space>
        </a-col>
        <a-col
          :span="12"
          style="display: flex; align-items: center; justify-content: end"
        >
          <a-tooltip content="刷新">
            <div class="action-icon" @click="search">
              <icon-refresh size="18" />
            </div>
          </a-tooltip>
          <a-dropdown @select="handleSelectDensity">
            <a-tooltip content="密度">
              <div class="action-icon">
                <icon-line-height size="18" />
              </div>
            </a-tooltip>
            <template #content>
              <a-doption
                v-for="item in densityList"
                :key="item.value"
                :class="{ active: item.value === size }"
                :value="item.value"
              >
                <span>{{ item.name }}</span>
              </a-doption>
            </template>
          </a-dropdown>
        </a-col>
      </a-row>
      <a-table
        :bordered="false"
        :columns="(cloneColumns as TableColumnData[])"
        :data="renderData"
        :loading="loading"
        :pagination="pagination"
        :size="size"
        row-key="id"
        @page-change="onPageChange"
      >
        <template #index="{ rowIndex }">
          {{ rowIndex + 1 + (pagination.page - 1) * pagination.pageSize }}
        </template>
        <template #status="{ record }">
          <a-tag :color="record.isActive === 1 ? 'green' : 'red'">
            {{ record.isActive === 1 ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template #isDefault="{ record }">
          <a-tag :color="record.isDefault === 1 ? 'blue' : 'gray'">
            {{ record.isDefault === 1 ? '默认' : '普通' }}
          </a-tag>
        </template>
        <template #price="{ record }">
          ¥{{ record.price.toFixed(2) }}
        </template>
        <template #storageQuotaGb="{ record }">
          {{ record.storageQuotaGb }} GB
        </template>
        <template #maxFileSize="{ record }">
          {{ formatFileSize(record.maxFileSize) }}
        </template>
        <template #bandwidthQuota="{ record }">
          {{ record.bandwidthQuota }} MB/s
        </template>
        <template #operations="{ record }">
          <a-button size="mini" type="text" @click="handleEdit(record)">
            <template #icon>
              <IconEdit />
            </template>
            编辑
          </a-button>
          <a-popconfirm
            content="您确定要删除吗？"
            type="error"
            @ok="handleDelete(record.id)"
          >
            <a-button size="mini" status="danger" type="text">
              <template #icon>
                <IconDelete />
              </template>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
  import { computed, reactive, ref, watch } from 'vue';
  import type { TableColumnData } from '@arco-design/web-vue/es/table/interface';
  import {
    IconSearch,
    IconRefresh,
    IconPlus,
    IconEdit,
    IconDelete,
    IconLineHeight,
  } from '@arco-design/web-vue/es/icon';
  import useLoading from '@/hooks/loading';
  import { Pagination } from '@/types/global';
  import { PlanRecord, PlanPageParams } from '@/types/modules/plan';
  import getPlanPages, { deletePlan } from '@/api/plan';
  import Breadcrumb from '@/components/breadcrumb/index.vue';
  import cloneDeep from 'lodash/cloneDeep';

  type SizeProps = 'mini' | 'small' | 'medium' | 'large';
  type Column = TableColumnData & { checked?: true };

  const searchFormModel = () => {
    return {
      planName: '',
    };
  };
  const { loading, setLoading } = useLoading(true);
  const renderData = ref<PlanRecord[]>([]);
  const formModel = ref(searchFormModel());
  const cloneColumns = ref<Column[]>([]);
  const showColumns = ref<Column[]>([]);

  const modalVisible = ref(false);
  const modalData = ref({});

  const size = ref<SizeProps>('medium');

  const basePagination: Pagination = {
    page: 1,
    pageSize: 20,
  };
  const pagination = reactive({
    ...basePagination,
  });
  const densityList = computed(() => [
    {
      name: '迷你',
      value: 'mini',
    },
    {
      name: '偏小',
      value: 'small',
    },
    {
      name: '中等',
      value: 'medium',
    },
    {
      name: '偏大',
      value: 'large',
    },
  ]);

  const columns = computed<TableColumnData[]>(() => [
    {
      title: '#',
      dataIndex: 'index',
      slotName: 'index',
    },
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: '套餐编码',
      dataIndex: 'planCode',
    },
    {
      title: '套餐名称',
      dataIndex: 'planName',
    },
    {
      title: '描述',
      dataIndex: 'description',
    },
    {
      title: '存储配额',
      dataIndex: 'storageQuotaGb',
      slotName: 'storageQuotaGb',
    },
    {
      title: '最大文件数',
      dataIndex: 'maxFiles',
    },
    {
      title: '最大文件大小',
      dataIndex: 'maxFileSize',
      slotName: 'maxFileSize',
    },
    {
      title: '带宽配额',
      dataIndex: 'bandwidthQuota',
      slotName: 'bandwidthQuota',
    },
    {
      title: '价格',
      dataIndex: 'price',
      slotName: 'price',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      slotName: 'status',
    },
    {
      title: '默认套餐',
      dataIndex: 'isDefault',
      slotName: 'isDefault',
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
    },
    {
      title: '操作',
      dataIndex: 'operations',
      slotName: 'operations',
      fixed: 'right',
      width: 200,
    },
  ]);

  const fetchData = async (
    params: PlanPageParams = { page: 1, pageSize: 20 }
  ) => {
    setLoading(true);
    try {
      const { data } = await getPlanPages(params);
      renderData.value = data.data;
      pagination.page = params.page ?? 1;
      pagination.total = data.total;
    } finally {
      setLoading(false);
    }
  };

  const search = () => {
    fetchData({
      ...basePagination,
      ...formModel.value,
    } as unknown as PlanPageParams);
  };
  const onPageChange = (page: number) => {
    fetchData({ ...basePagination, page });
  };

  fetchData();

  const reset = () => {
    formModel.value = searchFormModel();
  };

  /**
   * 切换表格密度
   * @param val
   * @param e
   */
  const handleSelectDensity = (
    val: string | number | Record<string, any> | undefined,
    e: Event
  ) => {
    size.value = val as SizeProps;
  };

  /**
   * 新增套餐
   */
  const handleAdd = () => {
    modalVisible.value = true;
    modalData.value = {};
  };

  /**
   * 编辑套餐
   */
  const handleEdit = (record: PlanRecord) => {
    modalVisible.value = true;
    modalData.value = { ...record };
  };

  /**
   * 删除套餐
   * @param id
   */
  const handleDelete = async (id: number) => {
    await deletePlan(id);
    // 刷新页面
    await search();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  watch(
    () => columns.value,
    (val) => {
      cloneColumns.value = cloneDeep(val);
      cloneColumns.value.forEach((item, index) => {
        item.checked = true;
      });
      showColumns.value = cloneDeep(cloneColumns.value);
    },
    { deep: true, immediate: true }
  );
</script>

<script lang="ts">
  export default {
    name: 'Plan',
  };
</script>

<style lang="less" scoped>
  .container {
    padding: 0 20px 20px 20px;
  }

  :deep(.arco-table-th) {
    &:last-child {
      .arco-table-th-item-title {
        margin-left: 16px;
      }
    }
  }

  .action-icon {
    margin-left: 12px;
    cursor: pointer;
  }

  .active {
    color: #0960bd;
    background-color: #e3f4fc;
  }
</style>
