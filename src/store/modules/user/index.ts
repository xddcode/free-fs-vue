import { defineStore } from 'pinia';
import {
  getUserInfo,
  login as userLogin,
  logout as userLogout,
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
    },

    // Login
    async login(loginForm: LoginParams) {
      try {
        const res = await userLogin(loginForm);
        setToken(res.data.accessToken);
        // 登录成功后立即设置用户信息
        this.setInfo(res.data.userInfo);
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
