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

export interface CustomRequestConfig extends AxiosRequestConfig {
  showErrorMessage?: boolean;
  showSuccessMessage?: boolean;
}

let isShowingLogoutModal = false;

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// 获取当前存储平台配置ID的函数
const getCurrentStoragePlatformId = (): string | null => {
  const storageInfo = localStorage.getItem('current-storage-platform');
  if (storageInfo) {
    try {
      const platform = JSON.parse(storageInfo);
      return platform?.settingId || null;
    } catch (error) {
      return null;
    }
  }
  return null;
};

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 每次请求时动态获取最新的存储平台配置ID
    const platformId = getCurrentStoragePlatformId();
    if (platformId) {
      config.headers = config.headers || {};
      config.headers['X-Storage-Platform-Config-Id'] = platformId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
service.interceptors.response.use(
  (response: AxiosResponse<HttpResponse>) => {
    const { data: res, config } = response;

    if (res.code === 200) {
      return response;
    }

    const showError = (config as any).showErrorMessage !== false;

    if ([401, 403].includes(res.code)) {
      if (response.config.url !== '/apis/user/info' && !isShowingLogoutModal) {
        isShowingLogoutModal = true;
        Modal.error({
          title: '登录已过期',
          content: '您的登录已过期，请重新登录',
          okText: '重新登录',
          async onOk() {
            isShowingLogoutModal = false;
            window.location.reload();
          },
          onCancel() {
            isShowingLogoutModal = false;
          },
          onClose() {
            isShowingLogoutModal = false;
          },
        });
      }
    } else if (showError) {
      Message.error({
        content: res.msg || '操作失败',
        duration: 3000,
      });
    }

    const error: any = new Error(res.msg || 'Error');
    error.code = res.code;
    error.response = response;
    error.isErrorShown = showError;
    return Promise.reject(error);
  },
  (error) => {
    const config = error.config || {};
    const showError = (config as any).showErrorMessage !== false;

    if (showError && !error.isErrorShown) {
      let errorMessage = '网络请求失败';

      if (error.response) {
        const { status } = error.response;
        switch (status) {
          case 400:
            errorMessage = error.response.data?.msg || '请求参数错误';
            break;
          case 404:
            errorMessage = '请求的资源不存在';
            break;
          case 500:
            errorMessage = error.response.data?.msg || '服务器内部错误';
            break;
          case 502:
            errorMessage = '网关错误';
            break;
          case 503:
            errorMessage = '服务不可用';
            break;
          case 504:
            errorMessage = '网关超时';
            break;
          default:
            errorMessage = error.response.data?.msg || `请求失败(${status})`;
        }
      } else if (error.request) {
        if (error.message.includes('timeout')) {
          errorMessage = '请求超时，请检查网络连接';
        } else if (error.message.includes('Network Error')) {
          errorMessage = '网络连接失败，请检查网络';
        }
      }

      Message.error({
        content: errorMessage,
        duration: 3000,
      });

      error.isErrorShown = true;
    }

    return Promise.reject(error);
  }
);

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
