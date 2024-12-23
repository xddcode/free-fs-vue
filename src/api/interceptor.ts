import axios from 'axios';
import type {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { Message, Modal } from '@arco-design/web-vue';
import { useUserStore } from '@/store';
import { getToken } from '@/utils/auth';

export interface HttpResponse<T = unknown> {
  status: number;
  msg: string;
  code: number;
  data: T;
}

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

    Message.error({
      content: res.msg || 'Error',
      duration: 5 * 1000,
    });

    if (
      [401, 403].includes(res.code) &&
      response.config.url !== '/api/user/info'
    ) {
      Modal.error({
        title: '确认注销',
        content: '您的登录已过期，您可以停留在此页面或重新登录',
        okText: '重新登录',
        async onOk() {
          const userStore = useUserStore();
          await userStore.logout();
          window.location.reload();
        },
      });
    }

    return Promise.reject(new Error(res.msg || 'Error'));
  },
  (error) => {
    Message.error({
      content: error.response?.data?.msg || error.message || 'Request Error',
      duration: 5 * 1000,
    });
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
