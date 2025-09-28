<template>
  <div class="container">
    <Breadcrumb :items="['系统管理', '菜单管理']" />
    <a-card class="general-card">
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
            <a-button type="primary" @click="toggleExpanded">
              <template #icon>
                <component :is="buttonConfig.icon" />
              </template>
              {{ buttonConfig.text }}
            </a-button>
          </a-space>
        </a-col>
        <a-col
          :span="12"
          style="display: flex; align-items: center; justify-content: end"
        >
          <a-tooltip content="刷新">
            <div class="action-icon" @click="fetchData">
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
        v-model:expanded-keys="expandedKeys"
        :bordered="false"
        :columns="(cloneColumns as TableColumnData[])"
        :data="renderData"
        :hide-expand-button-on-empty="true"
        :loading="loading"
        :size="size"
        row-key="id"
      >
        <template #icon="{ record }">
          <FunctionalIcons v-if="record.icon" :icon="record.icon" />
        </template>
        <template #type="{ record }">
          <a-tag v-if="record.type == 0">目录</a-tag>
          <a-tag v-else-if="record.type == 1" color="arcoblue">菜单</a-tag>
          <a-tag v-else-if="record.type == 2" color="lime">按钮</a-tag>
        </template>
        <template #operations></template>
      </a-table>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { IconToBottom, IconToTop } from '@arco-design/web-vue/es/icon';
  import useLoading from '@/hooks/loading';
  import type { TableColumnData } from '@arco-design/web-vue/es/table/interface';
  import cloneDeep from 'lodash/cloneDeep';
  import FunctionalIcons from '@/components/icon/FunctionalIcons.vue';
  import { getAllMenuIds, getMenuTree } from '@/api/menu';

  type SizeProps = 'mini' | 'small' | 'medium' | 'large';
  type Column = TableColumnData & { checked?: true };

  const expanded = ref(false);
  const expandedKeys = ref<number[]>([]);

  const { loading, setLoading } = useLoading(true);
  const renderData = ref<any[]>([]);
  const cloneColumns = ref<Column[]>([]);
  const showColumns = ref<Column[]>([]);

  const size = ref<SizeProps>('medium');

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

  const columns = computed<TableColumnData[]>(() => [
    {
      title: '名称',
      dataIndex: 'title',
    },
    {
      title: '图标',
      dataIndex: 'icon',
      slotName: 'icon',
    },
    {
      title: '路由',
      dataIndex: 'path',
    },
    {
      title: '组件',
      dataIndex: 'component',
    },
    {
      title: '类型',
      dataIndex: 'type',
      slotName: 'type',
    },
    {
      title: '排序',
      dataIndex: 'order',
    },
    {
      title: '权限标识',
      dataIndex: 'permission',
    },
    {
      title: '操作',
      dataIndex: 'operations',
      slotName: 'operations',
      fixed: 'right',
      width: 300,
    },
  ]);

  const buttonConfig = computed(() => ({
    text: expanded.value ? '收起' : '展开',
    icon: expanded.value ? IconToTop : IconToBottom,
  }));

  const fetchMenuIds = async () => {
    const { data } = await getAllMenuIds();
    return data;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await getMenuTree();
      renderData.value = data;
    } finally {
      setLoading(false);
    }
  };

  fetchData();

  const toggleExpanded = async () => {
    expanded.value = !expanded.value;
    if (expanded.value) {
      expandedKeys.value = await fetchMenuIds();
    } else {
      expandedKeys.value = [];
    }
  };

  const handleAdd = () => {};

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
    name: 'Menus',
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
