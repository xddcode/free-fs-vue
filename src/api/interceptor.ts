import type {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import axios from 'axios';
import { Message, Modal } from '@arco-design/web-vue';
import { getToken } from '@/utils/auth';

export interface HttpResponse<T = unknown> {
  status: number;
  msg: string;
  code: number;
  data: T;
}

// 添加全局标志防止重复显示Modal
let isShowingLogoutModal = false;

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加存储平台标识符
    const storagePlatform = localStorage.getItem('current-storage-platform');
    if (storagePlatform) {
      try {
        const platform = JSON.parse(storagePlatform);
        config.headers = config.headers || {};
        config.headers['X-Storage-Platform'] = platform.identifier;
      } catch (error) {
        // 忽略解析错误
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 修复类型定义
service.interceptors.response.use(
  (response: AxiosResponse<HttpResponse>) => {
    const res = response.data;

    if (res.code === 200) {
      return response; // 返回完整的 response 对象
    }

    // 对于401/403错误（认证过期），显示Modal
    if ([401, 403].includes(res.code)) {
      // 修正API路径匹配，排除用户信息接口避免重复处理
      if (response.config.url !== '/apis/user/info' && !isShowingLogoutModal) {
        isShowingLogoutModal = true;
        Modal.error({
          title: '登录已过期',
          content: '您的登录已过期，请重新登录',
          okText: '重新登录',
          async onOk() {
            isShowingLogoutModal = false;
            window.location.href = '/login';
          },
          onCancel() {
            isShowingLogoutModal = false;
          },
          onClose() {
            isShowingLogoutModal = false;
          },
        });
      }
      return Promise.reject(new Error(res.msg || '登录已过期'));
    }

    // 对于其他错误，不在拦截器中显示，而是由业务代码处理
    // 这样可以避免重复显示错误消息
    return Promise.reject(new Error(res.msg || 'Error'));
  },
  (error) => {
    // 对于网络错误，可以在拦截器中显示，因为这些错误业务代码通常不会处理
    if (!error.response) {
      Message.error({
        content: '网络错误，请检查网络连接',
        duration: 5 * 1000,
      });
    }
    return Promise.reject(error);
  }
);

// 请求方法封装
export const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return service
      .get<T, AxiosResponse<HttpResponse<T>>>(url, config)
      .then((response) => response.data);
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return service
      .post<T, AxiosResponse<HttpResponse<T>>>(url, data, config)
      .then((response) => response.data);
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return service
      .put<T, AxiosResponse<HttpResponse<T>>>(url, data, config)
      .then((response) => response.data);
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return service
      .delete<T, AxiosResponse<HttpResponse<T>>>(url, config)
      .then((response) => response.data);
  },
};

export default service;
