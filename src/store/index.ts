import { createPinia } from 'pinia';
import useAppStore from './modules/app';
import useUserStore from './modules/user';
import useStorageStore from './modules/storage';
import { useUploadTaskStore } from './modules/upload';

const pinia = createPinia();

export { useAppStore, useUserStore, useStorageStore, useUploadTaskStore };
export default pinia;
