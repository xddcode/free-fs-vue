<template>
  <a-modal
    :mask-closable="false"
    :visible="visible"
    width="600px"
    ok-text="提交"
    :title="`分配权限 - ${roleName || '角色'}`"
    @cancel="handleCancel"
    @close="handleClose"
    @ok="handleOk"
  >
    <div class="permission-tree">
      <a-spin :loading="loading" style="width: 100%">
        <!-- 操作按钮 -->
        <div v-if="!loading && treeData.length > 0" class="tree-actions">
          <a-button-group style="margin-bottom: 16px;">
            <a-button
              type="primary"
              @click="toggleExpanded"
            >
              {{ expandedKeys?.length ? '收起全部' : '展开全部' }}
            </a-button>
          </a-button-group>
        </div>
        
        <!-- 调试信息 -->
        <div
          v-if="!loading"
          style="margin-bottom: 10px; font-size: 12px; color: #666"
        >
          数据长度: {{ treeData.length }}，选中数量: {{ checkedKeys.length }}
        </div>
        
        <a-tree
          v-if="treeData.length > 0"
          v-model:checked-keys="checkedKeys"
          v-model:expanded-keys="expandedKeys"
          :checkable="true"
          :data="treeData"
          :check-strictly="false"
          :default-expand-all="true"
        />

        <a-empty v-else-if="!loading" description="暂无菜单数据" />
      </a-spin>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { defineEmits, defineProps, ref, watch } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { getMenuTree } from '@/api/menu';
  import { getRoleMenuIds, assignRoleMenus } from '@/api/role';

  const props = defineProps({
    visible: {
      type: Boolean,
      required: true,
    },
    roleId: {
      type: Number,
      default: 0,
    },
    roleName: {
      type: String,
      default: '',
    },
  });

  const emit = defineEmits(['update:visible', 'refresh']);

  const checkedKeys = ref<(string | number)[]>([]);
  const expandedKeys = ref<(string | number)[]>([]);
  const treeData = ref<any[]>([]);
  const loading = ref(false);

  // 将服务器数据转换为Tree组件期望的格式
  const transformMenuData = (menuList: any[]): any[] => {
    return menuList.map((menu) => {
      const { title, permission } = menu;
      const displayTitle = permission ? `${title || menu.name || '未知'} (${permission})` : title || menu.name || '未知';

      return {
        title: displayTitle,
        key: menu.id,
        type: menu.type, // 保留type字段用于判断是否可展开
        children:
          menu.children && menu.children.length > 0
            ? transformMenuData(menu.children)
            : undefined,
      };
    });
  };

  const fetchMenuTree = async () => {
    try {
      const response = await getMenuTree();

      // 根据你提供的API格式，数据在 response.data 中
      const data = response?.data || [];

      // 转换为Tree组件期望的格式
      treeData.value = Array.isArray(data) ? transformMenuData(data) : [];
      
      // 默认展开所有可展开的菜单
      const expandableKeys: (string | number)[] = [];
      const extractExpandableKeys = (nodes: any[]) => {
        nodes.forEach((node) => {
          // 只有type=0且有子节点的才可展开
          if (node.type === 0 && node.children && node.children.length > 0) {
            expandableKeys.push(node.key);
            extractExpandableKeys(node.children);
          }
        });
      };
      extractExpandableKeys(treeData.value);
      expandedKeys.value = expandableKeys;
    } catch (error) {
      Message.error('获取菜单树失败');
      treeData.value = [];
    }
  };

  const fetchRolePermissions = async () => {
    if (!props.roleId) return;

    try {
      const response = await getRoleMenuIds(props.roleId);

      // 根据你提供的API格式，数据在 response.data 中
      const data = response?.data || [];

      checkedKeys.value = Array.isArray(data) ? data : [];
    } catch (error) {
      Message.error('获取角色权限失败');
      checkedKeys.value = [];
    }
  };

  const initData = async () => {
    if (!props.roleId) return;

    try {
      loading.value = true;

      // 先获取菜单树，再获取权限
      await fetchMenuTree();
      await fetchRolePermissions();
    } catch (error) {
      Message.error('初始化数据失败');
    } finally {
      loading.value = false;
    }
  };

  const onCheck = (
    selectedKeys: (string | number)[],
    data: {
      checked?: boolean;
      checkedNodes: any[];
      node?: any;
      e?: Event;
      halfCheckedKeys: (string | number)[];
      halfCheckedNodes: any[];
    }
  ) => {
    // 包含完全选中和半选的节点
    const allCheckedKeys = [...selectedKeys, ...data.halfCheckedKeys];
    checkedKeys.value = allCheckedKeys;
  };


  // 展开/收起全部
  const toggleExpanded = () => {
    if (expandedKeys.value.length > 0) {
      expandedKeys.value = [];
    } else {
      // 从转换后的数据中提取type=0的key
      const expandableKeys: (string | number)[] = [];
      const extractExpandableKeys = (nodes: any[]) => {
        nodes.forEach((node) => {
          // 只有type=0且有子节点的才可展开
          if (node.type === 0 && node.children && node.children.length > 0) {
            expandableKeys.push(node.key);
            extractExpandableKeys(node.children);
          }
        });
      };
      extractExpandableKeys(treeData.value);
      expandedKeys.value = expandableKeys;
    }
  };

  const resetTree = () => {
    checkedKeys.value = [];
    expandedKeys.value = [];
    treeData.value = [];
  };

  const handleClose = () => {
    emit('update:visible', false);
    resetTree();
  };

  const handleCancel = () => {
    handleClose();
  };

  const handleOk = async () => {
    if (!props.roleId) {
      Message.warning('请选择角色');
      return;
    }

    try {
      loading.value = true;
      await assignRoleMenus(props.roleId, checkedKeys.value.map(Number));
      Message.success('权限分配成功');
      handleClose();
      emit('refresh');
    } catch (error) {
      Message.error('权限分配失败');
    } finally {
      loading.value = false;
    }
  };

  watch(
    () => props.visible,
    (newVisible) => {
      if (newVisible && props.roleId) {
        initData();
      }
    }
  );

  watch(
    () => props.roleId,
    (newRoleId) => {
      if (newRoleId && props.visible) {
        initData();
      }
    }
  );
</script>

<style lang="less" scoped>
  .permission-tree {
    max-height: 400px;
    overflow-y: auto;
    
    .tree-actions {
      display: flex;
      justify-content: flex-start;
    }
  }
</style>
