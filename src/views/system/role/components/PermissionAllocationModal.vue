<template>
  <a-modal
    :mask-closable="false"
    :visible="visible"
    ok-text="提交"
    title="分配权限"
    @cancel="handleCancel"
    @close="handleClose"
    @ok="handleOk"
  >
    <a-tree
      v-model:checked-keys="checkedKeys"
      :checkable="true"
      :data="treeData"
      :field-names="{
        key: 'id',
      }"
      @check="onCheck"
    />
  </a-modal>
</template>

<script lang="ts" setup>
  import { defineEmits, defineProps, onMounted, ref, watch } from 'vue';
  import { getMenuTree } from '@/api/menu';
  import { getRoleMenuIds } from '@/api/role';

  const props = defineProps({
    visible: {
      type: Boolean,
      required: true,
    },
    roleId: {
      type: Number,
      default: 0,
    },
  });

  const emit = defineEmits(['update:visible']);

  /**
   * 选中的节点ID
   */
  const checkedKeys = ref<number[]>([]);

  const treeData = ref<any[]>([]);

  const fetchMenuTree = async () => {
    const { data } = await getMenuTree();
    treeData.value = data;
  };

  const fetchRolePermissions = async () => {
    const { data } = await getRoleMenuIds(props.roleId);
    checkedKeys.value = data;
  };

  const onCheck = (newCheckedKeys: any, event: any) => {
    console.log('check: ', newCheckedKeys, event);
    console.log(checkedKeys.value);
  };

  const resetTree = () => {};

  const handleClose = () => {
    emit('update:visible', false);
    resetTree();
  };

  const handleCancel = () => {
    handleClose();
  };

  const handleOk = () => {};

  onMounted(async () => {
    await fetchMenuTree();
    await fetchRolePermissions();
  });

  watch(() => props.roleId, fetchRolePermissions);
</script>
