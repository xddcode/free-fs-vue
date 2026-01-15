import { defineStore } from 'pinia';
import {
  getUserInfo,
  login as userLogin,
  logout as userLogout,
  getTransferSetting,
} from '@/api/user';
import { clearToken, setToken } from '@/utils/auth';
import { removeRouteListener } from '@/utils/route-listener';
import { LoginParams } from '@/types/modules/user';
import { UserState } from './types';

const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: undefined,
    username: undefined,
    nickname: undefined,
    avatar: undefined,
    email: undefined,
    status: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    lastLoginAt: undefined,
    transferSetting: undefined,
  }),

  getters: {
    userInfo(state: UserState): UserState {
      return { ...state };
    },
  },

  actions: {
    // Set user's information
    setInfo(partial: Partial<UserState>) {
      this.$patch(partial);
    },

    // Reset user's information
    resetInfo() {
      this.$reset();
    },

    // Get user's information
    async info() {
      const res = await getUserInfo();
      this.setInfo(res.data);
      // 加载用户信息后，同时加载传输配置
      await this.loadTransferSetting();
    },

    // 保持兼容性，添加 getUserInfo 别名
    async getUserInfo() {
      return this.info();
    },

    // Load transfer settings
    async loadTransferSetting() {
      const res = await getTransferSetting();
      this.setInfo({ transferSetting: res.data });
    },

    // Login
    async login(loginForm: LoginParams) {
      try {
        const res = await userLogin(loginForm);
        setToken(res.data.accessToken);
        // 登录成功后立即设置用户信息
        this.setInfo(res.data.userInfo);
        // 登录成功后加载传输配置
        await this.loadTransferSetting();
      } catch (err) {
        clearToken();
        throw err;
      }
    },

    logoutCallBack() {
      this.resetInfo();
      clearToken();
      removeRouteListener();
    },

    // Logout
    async logout() {
      try {
        await userLogout();
      } finally {
        this.logoutCallBack();
      }
    },
  },
});

export default useUserStore;
