import { createPinia } from 'pinia';
import useAppStore from './modules/app';
import useUserStore from './modules/user';
import useTabBarStore from './modules/tab-bar';
import useStorageStore from './modules/storage';

const pinia = createPinia();

export { useAppStore, useUserStore, useTabBarStore, useStorageStore };
export default pinia;
