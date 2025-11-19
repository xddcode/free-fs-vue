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
          // 在路由守卫中处理认证错误，不依赖拦截器
          userStore.logoutCallBack(); // 直接调用logoutCallBack，不调用logout API

          // 检查目标页面是否需要登录
          if (to.meta.requiresAuth === false) {
            // 不需要登录的页面（如分享页面），直接放行
            next();
          } else {
            // 需要登录的页面，跳转到登录页
            // 保存完整的路由信息（包括 params）到 sessionStorage
            if (
              to.name &&
              (Object.keys(to.params).length > 0 ||
                Object.keys(to.query).length > 0)
            ) {
              const routeInfo = {
                name: to.name,
                params: to.params,
                query: to.query,
              };
              sessionStorage.setItem(
                'redirect_route',
                JSON.stringify(routeInfo)
              );
            }

            next({
              name: 'login',
              query: {
                redirect: to.name,
                ...to.query,
              } as LocationQueryRaw,
            });
          }
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

      // 保存完整的路由信息（包括 params）到 sessionStorage
      if (
        to.name &&
        (Object.keys(to.params).length > 0 || Object.keys(to.query).length > 0)
      ) {
        const routeInfo = {
          name: to.name,
          params: to.params,
          query: to.query,
        };
        sessionStorage.setItem('redirect_route', JSON.stringify(routeInfo));
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
