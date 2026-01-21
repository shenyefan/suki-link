/**
 * 统一的 API 客户端
 * 自动处理认证 token 和错误响应
 */

import { getAuthToken, clearAuthToken } from './auth';

export interface ApiResponse<T = unknown> {
  code: number;
  data?: T;
  msg: string;
}

/**
 * 统一的 fetch 封装，自动添加认证 header
 */
async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // 自动添加认证 header（如果存在 token）
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const body = await response.json() as ApiResponse<T>;

  // 统一处理 401 未授权错误
  if (body.code === 401) {
    clearAuthToken();
    // 只在客户端环境跳转
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return body;
}

/**
 * API 客户端方法
 */
export const api = {
  /**
   * GET 请求
   */
  get: <T = unknown>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  },

  /**
   * POST 请求
   */
  post: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT 请求
   */
  put: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE 请求
   */
  delete: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
};
