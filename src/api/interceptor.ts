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

// 扩展请求配置，支持控制错误提示
export interface CustomRequestConfig extends AxiosRequestConfig {
  // 是否显示错误提示（默认 true）
  showErrorMessage?: boolean;
  // 是否显示成功提示
  showSuccessMessage?: boolean;
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

    // 添加存储平台配置ID
    const storageInfo = localStorage.getItem('current-storage-platform');
    if (storageInfo) {
      try {
        const platform = JSON.parse(storageInfo);
        if (platform?.settingId) {
          config.headers = config.headers || {};
          config.headers['X-Storage-Platform-Config-Id'] = platform.settingId;
        }
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

// 响应拦截器 - 统一错误处理
service.interceptors.response.use(
  (response: AxiosResponse<HttpResponse>) => {
    const { data: res, config } = response;

    // 成功响应
    if (res.code === 200) {
      return response;
    }

    // 业务错误处理
    const showError = (config as any).showErrorMessage !== false; // 默认显示错误

    // 401/403 认证错误 - 特殊处理，显示模态框
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
      // 其他业务错误 - 显示错误提示（可通过配置禁用）
      Message.error({
        content: res.msg || '操作失败',
        duration: 3000,
      });
    }

    // reject 错误，但不再在错误拦截器中重复提示
    const error: any = new Error(res.msg || 'Error');
    error.code = res.code;
    error.response = response;
    error.isErrorShown = showError; // 标记已显示错误
    return Promise.reject(error);
  },
  (error) => {
    // 网络错误或服务器错误（非业务错误）
    const config = error.config || {};
    const showError = (config as any).showErrorMessage !== false;

    // 只有未标记已显示的错误才显示（避免重复）
    if (showError && !error.isErrorShown) {
      let errorMessage = '网络请求失败';

      if (error.response) {
        // 服务器响应了错误状态码
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
        // 请求已发出但没有收到响应
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
