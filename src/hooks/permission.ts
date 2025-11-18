import { RouteLocationNormalized, RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/store';
import { isLogin } from '@/utils/auth';

export default function usePermission() {
  const userStore = useUserStore();
  return {
    accessRouter(route: RouteLocationNormalized | RouteRecordRaw) {
      // 简化权限逻辑：只需要检查是否已登录
      if (route.meta?.requiresAuth === false) {
        return true;
      }
      return isLogin() && !!userStore.id;
    },
    findFirstPermissionRoute(_routers: any) {
      // 简化：返回第一个路由
      const cloneRouters = [..._routers];
      while (cloneRouters.length) {
        const firstElement = cloneRouters.shift();
        if (firstElement?.meta?.requiresAuth !== false) {
          return { name: firstElement.name };
        }
        if (firstElement?.children) {
          cloneRouters.push(...firstElement.children);
        }
      }
      return null;
    },
  };
}
