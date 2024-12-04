<template>
  <div class="container">
    <Breadcrumb :items="['系统管理', '用户管理']" />
    <a-card class="general-card" title="查询表格">
      <a-row>
        <a-col :flex="1">
          <a-form
            :model="formModel"
            :label-col-props="{ span: 6 }"
            :wrapper-col-props="{ span: 18 }"
            label-align="left"
          >
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item field="username" label="账号">
                  <a-input
                    v-model="formModel.username"
                    placeholder="请输入账号"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item field="nickname" label="昵称">
                  <a-input
                    v-model="formModel.nickname"
                    placeholder="请输入昵称"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item field="email" label="邮箱">
                  <a-input
                    v-model="formModel.email"
                    placeholder="请输入邮箱"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item field="status" label="状态">
                  <a-select
                    v-model="formModel.status"
                    :options="statusOptions"
                    placeholder="请选择状态"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-col>
        <a-divider style="height: 84px" direction="vertical" />
        <a-col :flex="'86px'" style="text-align: right">
          <a-space direction="vertical" :size="18">
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
                :value="item.value"
                :class="{ active: item.value === size }"
              >
                <span>{{ item.name }}</span>
              </a-doption>
            </template>
          </a-dropdown>
        </a-col>
      </a-row>
      <a-table
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        :columns="(cloneColumns as TableColumnData[])"
        :data="renderData"
        :bordered="false"
        :size="size"
        @page-change="onPageChange"
      >
        <template #index="{ rowIndex }">
          {{ rowIndex + 1 + (pagination.page - 1) * pagination.pageSize }}
        </template>
        <template #status="{ record }">
          <a-switch
            checked-text="正常"
            unchecked-text="禁用"
            :default-checked="record.status === 0"
            :disabled="record.username === 'admin'"
            :before-change="
              (newValue: boolean) => handleChangeStatus(record.id, newValue)
            "
          />
        </template>
        <template #operations="{ record }">
          <a-button
            type="text"
            size="mini"
            :disabled="record.username === 'admin'"
            @click="handleEdit(record)"
          >
            <template #icon>
              <IconEdit />
            </template>
            编辑
          </a-button>
          <a-popconfirm
            content="您确定要重置该用户密码吗？"
            type="error"
            @ok="handleResetPassword(record.id)"
          >
            <a-button
              type="text"
              size="mini"
              :disabled="record.username === 'admin'"
            >
              <template #icon>
                <IconSync />
              </template>
              重置密码
            </a-button>
          </a-popconfirm>
          <a-popconfirm
            content="您确定要删除吗？"
            type="error"
            @ok="handleDelete(record.id)"
          >
            <a-button
              type="text"
              status="danger"
              size="mini"
              :disabled="record.username === 'admin'"
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

    <UserEditModel
      v-model:visible="modalVisible"
      :edit-data="modalData"
      @refresh="search"
    />
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, reactive, watch } from 'vue';
  import useLoading from '@/hooks/loading';
  import { Pagination } from '@/types/global';
  import type { SelectOptionData } from '@arco-design/web-vue/es/select/interface';
  import type { TableColumnData } from '@arco-design/web-vue/es/table/interface';
  import cloneDeep from 'lodash/cloneDeep';
  import { Message } from '@arco-design/web-vue';
  import {
    getUserPages,
    editUserStatus,
    deleteUser,
    resetUserPassword,
    UserPageParams,
    UserRecord,
  } from '@/api/user';
  import UserEditModel from '@/views/system/user/components/UserEditModel.vue';

  type SizeProps = 'mini' | 'small' | 'medium' | 'large';
  type Column = TableColumnData & { checked?: true };

  const searchFormModel = () => {
    return {
      username: '',
      nickname: '',
      email: '',
      status: '',
    };
  };
  const { loading, setLoading } = useLoading(true);
  const renderData = ref<UserRecord[]>([]);
  const formModel = ref(searchFormModel());
  const cloneColumns = ref<Column[]>([]);
  const showColumns = ref<Column[]>([]);

  const modalVisible = ref(false);
  const modalTitle = ref('');
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
      title: '账号',
      dataIndex: 'username',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
    },
    {
      title: '角色',
      dataIndex: 'roleCode',
    },
    {
      title: '状态',
      dataIndex: 'status',
      slotName: 'status',
    },
    {
      title: '最后登录时间',
      dataIndex: 'lastLoginTime',
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

  const statusOptions = computed<SelectOptionData[]>(() => [
    {
      label: '正常',
      value: 0,
    },
    {
      label: '禁用',
      value: 1,
    },
  ]);

  const fetchData = async (
    params: UserPageParams = { page: 1, pageSize: 20 }
  ) => {
    setLoading(true);
    try {
      const { data } = await getUserPages(params);
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
    } as unknown as UserPageParams);
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
   * 切换用户状态
   */
  const handleChangeStatus = async (userId: string, newValue: boolean) => {
    try {
      await editUserStatus(userId, newValue ? 0 : 1);
      Message.success('操作成功');
      return true;
    } catch (e) {
      return false;
    }
  };

  /**
   * 新增用户
   */
  const handleAdd = () => {
    modalVisible.value = true;
    modalData.value = {};
  };

  /**
   * 编辑用户
   */
  const handleEdit = (record: UserRecord) => {
    modalVisible.value = true;
    modalData.value = { ...record };
  };

  /**
   * 删除用户
   * @param id
   */
  const handleDelete = async (id: string) => {
    await deleteUser(id);
    // 刷新页面
    await search();
  };

  /**
   * 重置密码
   * @param id
   */
  const handleResetPassword = async (id: string) => {
    setLoading(true);
    try {
      await resetUserPassword(id);
      Message.success('重置成功，初始密码123456');
    } finally {
      setLoading(false);
    }
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
    name: 'User',
  };
</script>

<style scoped lang="less">
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
