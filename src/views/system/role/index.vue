<template>
  <div class="container">
    <Breadcrumb :items="['系统管理', '角色管理']" />
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
                <a-form-item field="roleCode" label="角色编码">
                  <a-input
                    v-model="formModel.roleCode"
                    allow-clear
                    placeholder="请输入角色编码"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item field="roleName" label="角色名称">
                  <a-input
                    v-model="formModel.roleName"
                    allow-clear
                    placeholder="请输入角色名称"
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

        <template #operations="{ record }">
          <a-button
            :disabled="record.roleCode === 'admin'"
            size="mini"
            type="text"
            @click="handlePermissionAllocation(record)"
          >
            <template #icon>
              <IconSelectAll />
            </template>
            分配权限
          </a-button>
          <a-button
            :disabled="record.roleCode === 'admin'"
            size="mini"
            type="text"
            @click="handleEdit(record)"
          >
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
            <a-button
              :disabled="record.roleCode === 'admin'"
              size="mini"
              status="danger"
              type="text"
            >
              <template #icon>
                <IconDelete />
              </template>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </a-table>
    </a-card>

    <RoleEditModel
      v-model:visible="modalVisible"
      :edit-data="editData"
      @refresh="search"
    />

    <PermissionAllocationModal
      v-model:visible="permissionAllocationVisible"
      :role-id="permissionAllocationRoleId"
      :role-name="permissionAllocationRoleName"
      @refresh="search"
    />
  </div>
</template>

<script lang="ts" setup>
  import { computed, reactive, ref, watch } from 'vue';
  import useLoading from '@/hooks/loading';
  import { Pagination } from '@/types/global';
  import type { TableColumnData } from '@arco-design/web-vue/es/table/interface';
  import cloneDeep from 'lodash/cloneDeep';
  import { deleteRole, getRolePages } from '@/api/role';
  import RoleEditModel from '@/views/system/role/components/RoleEditModel.vue';
  import PermissionAllocationModal from '@/views/system/role/components/PermissionAllocationModal.vue';
  import { RolePageParams, RoleRecord } from '@/types/modules/role';

  type SizeProps = 'mini' | 'small' | 'medium' | 'large';
  type Column = TableColumnData & { checked?: true };

  const searchFormModel = () => {
    return {
      roleCode: '',
      roleName: '',
    };
  };
  const { loading, setLoading } = useLoading(true);
  const renderData = ref<RoleRecord[]>([]);
  const formModel = ref(searchFormModel());
  const cloneColumns = ref<Column[]>([]);
  const showColumns = ref<Column[]>([]);

  const modalVisible = ref(false);
  const editData = ref({});

  const permissionAllocationVisible = ref(false);
  const permissionAllocationRoleId = ref();
  const permissionAllocationRoleName = ref('');

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
      title: '角色编码',
      dataIndex: 'roleCode',
    },
    {
      title: '角色名称',
      dataIndex: 'roleName',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
    },
    {
      title: '操作',
      dataIndex: 'operations',
      slotName: 'operations',
      fixed: 'right',
      width: 300,
    },
  ]);

  const fetchData = async (
    params: RolePageParams = { page: 1, pageSize: 20 }
  ) => {
    setLoading(true);
    try {
      const { data } = await getRolePages(params);
      renderData.value = data.data;
      pagination.page = params.page;
      pagination.total = data.total;
    } finally {
      setLoading(false);
    }
  };

  const search = () => {
    fetchData({
      ...basePagination,
      ...formModel.value,
    } as unknown as RolePageParams);
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
   * 分配权限
   */
  const handlePermissionAllocation = (record: RoleRecord) => {
    permissionAllocationVisible.value = true;
    permissionAllocationRoleId.value = record.id;
    permissionAllocationRoleName.value = record.roleName;
  };

  /**
   * 新增角色
   */
  const handleAdd = () => {
    modalVisible.value = true;
    editData.value = {};
  };

  /**
   * 编辑用户
   */
  const handleEdit = (record: RoleRecord) => {
    modalVisible.value = true;
    editData.value = { ...record };
  };

  /**
   * 删除角色
   * @param id
   */
  const handleDelete = async (id: number) => {
    await deleteRole(id);
    // 刷新页面
    await search();
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
    name: 'Role',
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
