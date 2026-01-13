import { createPinia } from 'pinia';
import useAppStore from './modules/app';
import useUserStore from './modules/user';
import useStorageStore from './modules/storage';
import { useUploadTaskStore } from './modules/upload';
import { useTransferStore } from './modules/transfer';

const pinia = createPinia();

export {
  useAppStore,
  useUserStore,
  useStorageStore,
  useUploadTaskStore,
  useTransferStore,
};
export default pinia;
