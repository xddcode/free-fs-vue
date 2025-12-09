import type { Router } from 'vue-router';
import { setRouteEmitter } from '@/utils/route-listener';
import setupUserLoginInfoGuard from './userLoginInfo';
import setupPermissionGuard from './permission';

function setupPageGuard(router: Router) {
  router.beforeEach(async (to) => {
    // 路由切换时不显示全局loading，只在F5刷新时显示HTML loading

    // emit route change
    setRouteEmitter(to);
    // 修改网页标题
    const { title } = to.meta;
    if (title) {
      document.title = `${to.meta.title} - Free-Fs`;
    }
  });
}

export default function createRouteGuard(router: Router) {
  setupPageGuard(router);
  setupUserLoginInfoGuard(router);
  setupPermissionGuard(router);
}
