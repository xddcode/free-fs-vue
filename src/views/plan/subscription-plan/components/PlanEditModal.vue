<template>
  <a-modal
    :mask-closable="false"
    :title="title"
    :visible="visible"
    width="800px"
    ok-text="提交"
    @cancel="handleCancel"
    @close="handleClose"
    @ok="handleOk"
  >
    <a-form ref="planFormRef" :model="planFormData" :label-col-props="{ span: 8 }" :wrapper-col-props="{ span: 16 }">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item
            :rules="[{ required: true, message: '请输入套餐编码' }]"
            field="planCode"
            label="套餐编码"
          >
            <a-input
              v-model="planFormData.planCode"
              allow-clear
              placeholder="请输入套餐编码"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
            :rules="[{ required: true, message: '请输入套餐名称' }]"
            field="planName"
            label="套餐名称"
          >
            <a-input
              v-model="planFormData.planName"
              allow-clear
              placeholder="请输入套餐名称"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="24">
          <a-form-item
            :rules="[{ required: true, message: '请输入套餐描述' }]"
            field="description"
            label="套餐描述"
            :label-col-props="{ span: 4 }"
            :wrapper-col-props="{ span: 20 }"
          >
            <a-textarea
              v-model="planFormData.description"
              :rows="3"
              allow-clear
              placeholder="请输入套餐描述"
            />
          </a-form-item>
        </a-col>
    </a-row>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item
            :rules="[
              { required: true, message: '请输入存储配额' },
              { type: 'number', min: 1, message: '存储配额必须大于0' }
            ]"
            field="storageQuotaGb"
            label="存储配额"
          >
            <a-input-group>
              <a-input-number
                v-model="planFormData.storageQuotaGb"
                :min="1"
                :precision="0"
                placeholder="请输入存储配额"
                style="width: calc(100% - 40px)"
              />
              <span style="padding-left: 8px;">GB</span>
            </a-input-group>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
            :rules="[
              { required: true, message: '请输入最大文件数' },
              { type: 'number', min: 1, message: '最大文件数必须大于0' }
            ]"
            field="maxFiles"
            label="最大文件数"
          >
            <a-input-number
              v-model="planFormData.maxFiles"
              :min="1"
              :precision="0"
              placeholder="请输入最大文件数"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item
            :rules="[
              { required: true, message: '请输入最大文件大小' },
              { type: 'number', min: 1, message: '最大文件大小必须大于0' }
            ]"
            field="maxFileSize"
            label="最大文件大小"
          >
            <a-input-group>
              <a-input-number
                v-model="planFormData.maxFileSize"
                :min="1"
                :precision="0"
                placeholder="请输入最大文件大小"
                style="width: calc(100% - 40px)"
              />
              <span style="padding-left: 8px;">MB</span>
            </a-input-group>
            <template #extra>
              <span style="color: #86909c; font-size: 12px;">
                注意：这里输入的是MB，系统会自动转换为字节存储
              </span>
            </template>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
            :rules="[
              { required: true, message: '请输入带宽配额' },
              { type: 'number', min: 1, message: '带宽配额必须大于0' }
            ]"
            field="bandwidthQuota"
            label="带宽配额"
          >
            <a-input-group>
              <a-input-number
                v-model="planFormData.bandwidthQuota"
                :min="1"
                :precision="0"
                placeholder="请输入带宽配额"
                style="width: calc(100% - 50px)"
              />
              <span style="padding-left: 8px;">MB/s</span>
            </a-input-group>
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item
            :rules="[
              { required: true, message: '请输入价格' },
              { type: 'number', min: 0, message: '价格不能小于0' }
            ]"
            field="price"
            label="价格"
          >
            <a-input-group>
              <a-input-number
                v-model="planFormData.price"
                :min="0"
                :precision="2"
                placeholder="请输入价格"
                style="width: calc(100% - 30px)"
              />
              <span style="padding-left: 8px;">元</span>
            </a-input-group>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
            :rules="[{ required: true, message: '请输入排序' }]"
            field="sortOrder"
            label="排序"
          >
            <a-input-number
              v-model="planFormData.sortOrder"
              :min="0"
              :precision="0"
              placeholder="请输入排序"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item field="isActive" label="状态">
            <a-radio-group v-model="planFormData.isActive">
              <a-radio :value="1">启用</a-radio>
              <a-radio :value="0">禁用</a-radio>
            </a-radio-group>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item field="isDefault" label="默认套餐">
            <a-radio-group v-model="planFormData.isDefault">
              <a-radio :value="1">是</a-radio>
              <a-radio :value="0">否</a-radio>
            </a-radio-group>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
  import {
    computed,
    defineEmits,
    defineProps,
    PropType,
    reactive,
    ref,
    watch,
  } from 'vue';
  import { addPlan, editPlan } from '@/api/plan';
  import { PlanParams } from '@/types/modules/plan';
  import { Message } from '@arco-design/web-vue';

  const props = defineProps({
    visible: {
      type: Boolean,
      required: true,
    },
    editData: {
      type: Object as PropType<PlanParams>,
      default: () => ({}),
    },
  });

  const emit = defineEmits(['update:visible', 'refresh']);

  const planFormRef = ref<any>(null);

  const getInitialFormData = (): PlanParams => ({
    planCode: '',
    planName: '',
    description: '',
    storageQuotaGb: undefined,
    maxFiles: undefined,
    maxFileSize: undefined,
    bandwidthQuota: undefined,
    price: undefined,
    isActive: 1,
    isDefault: 0,
    sortOrder: undefined,
  });

  const planFormData = reactive<PlanParams>(getInitialFormData());

  const resetForm = () => {
    Object.assign(planFormData, getInitialFormData());
    if (planFormRef.value) {
      planFormRef.value.resetFields();
    }
  };

  const handleClose = () => {
    emit('update:visible', false);
    resetForm();
  };

  const handleCancel = () => {
    handleClose();
  };

  const isEdit = computed(() => Object.keys(props.editData).length > 0 && props.editData.id);

  const title = computed(() => (isEdit.value ? '编辑套餐计划' : '创建套餐计划'));

  const handleOk = () => {
    if (planFormRef.value) {
      planFormRef.value.validate().then(async (errors: any) => {
        if (!errors) {
          try {
            // 转换文件大小为字节（MB -> 字节）
            const submitData = {
              ...planFormData,
              maxFileSize: (planFormData.maxFileSize || 0) * 1024 * 1024, // MB转换为字节
            };

            if (isEdit.value) {
              await editPlan(submitData);
              Message.success('套餐计划编辑成功');
            } else {
              await addPlan(submitData);
              Message.success('套餐计划创建成功');
            }
            handleClose();
            emit('refresh');
          } catch (error) {
            // 错误信息已经在API拦截器中显示，这里不需要重复显示
            console.error('操作失败:', error);
          }
        }
      });
    }
  };

  const setEditData = (data: PlanParams) => {
    Object.assign(planFormData, {
      id: data.id,
      planCode: data.planCode,
      planName: data.planName,
      description: data.description,
      storageQuotaGb: data.storageQuotaGb,
      maxFiles: data.maxFiles,
      maxFileSize: data.maxFileSize ? Math.round(data.maxFileSize / (1024 * 1024)) : undefined, // 字节转换为MB
      bandwidthQuota: data.bandwidthQuota,
      price: data.price,
      isActive: data.isActive,
      isDefault: data.isDefault,
      sortOrder: data.sortOrder,
    });
  };

  watch(
    () => props.visible,
    (newVisible) => {
      if (newVisible) {
        if (isEdit.value) {
          setEditData(props.editData);
        } else {
          resetForm();
        }
      } else {
        resetForm();
      }
    }
  );

  watch(
    () => props.editData,
    (newEditData) => {
      if (Object.keys(newEditData).length > 0 && newEditData.id) {
        setEditData(newEditData);
      }
    }
  );
</script>
