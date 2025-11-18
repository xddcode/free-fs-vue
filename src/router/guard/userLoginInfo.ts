import type { LocationQueryRaw, Router } from 'vue-router';
import NProgress from 'nprogress'; // progress bar
import { useUserStore } from '@/store';
import { isLogin } from '@/utils/auth';

export default function setupUserLoginInfoGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    NProgress.start();
    const userStore = useUserStore();

    if (isLogin()) {
      if (to.name === 'login') {
        next({ name: 'root' });
        return;
      }
      // 已登录
      if (userStore.userInfo && userStore.userInfo.id) {
        // 用户信息已存在，直接通过
        next();
      } else {
        // 有 token 但没有用户信息，尝试获取
        try {
          await userStore.info();
          next();
        } catch (error) {
          console.error('获取用户信息失败:', error);
          // 在路由守卫中处理认证错误，不依赖拦截器
          userStore.logoutCallBack(); // 直接调用logoutCallBack，不调用logout API
          next({
            name: 'login',
            query: {
              redirect: to.name,
              ...to.query,
            } as LocationQueryRaw,
          });
        }
      }
    } else {
      if (to.meta.requiresAuth === false) {
        next();
        return;
      }
      // 未登录
      if (to.name === 'login') {
        next();
        return;
      }
      next({
        name: 'login',
        query: {
          redirect: to.name,
          ...to.query,
        } as LocationQueryRaw,
      });
    }
  });

  router.afterEach(() => {
    NProgress.done();
  });
}
