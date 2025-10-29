import { createPinia } from 'pinia';
import useAppStore from './modules/app';
import useUserStore from './modules/user';
import useStorageStore from './modules/storage';

const pinia = createPinia();

export { useAppStore, useUserStore, useStorageStore };
export default pinia;
