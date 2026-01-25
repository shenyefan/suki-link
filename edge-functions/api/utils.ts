import { customAlphabet } from 'nanoid';

const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

/**
 * EdgeOne 上下文对象类型定义
 */
export interface EdgeOneContext {
  request: Request;
  env: {
    SITE_TOKEN?: string;
    SLUG_DEFAULT_LENGTH?: string;
    [key: string]: unknown;
  };
  params?: Record<string, string>;
  waitUntil?: (promise: Promise<unknown>) => void;
}

/**
 * 响应数据格式类型
 */
export interface ResponseData<T = unknown> {
  code: number;
  data: T | null;
  msg: string;
  stack?: string;
}

/**
 * 链接数据格式类型
 */
export interface LinkData {
  url: string;
  slug: string;
  comment?: string;
  createdAt: number;
  updatedAt: number;
  expiration?: number;
}

/**
 * 使用 nanoid 的 customAlphabet 生成随机 slug
 * @param length - slug 长度，默认为 6
 * @returns 生成的随机 slug
 */
export function generateSlug(length: number = 6): string {
  const nanoid = customAlphabet(ALPHABET, length);
  return nanoid();
}

/**
 * 规范化 slug（转换为小写）
 * @param slug - 原始 slug
 * @returns 规范化后的 slug
 */
export function normalizeSlug(slug: string): string {
  return slug.toLowerCase();
}

/**
 * 标准化响应格式：{ code, data, msg, stack? }
 * code 200 表示成功，其他值表示错误
 * msg 显示用户友好的错误信息
 * stack 堆栈跟踪单独放在 'stack' 字段中用于调试
 * @param data - 响应数据或错误对象
 * @param code - HTTP 状态码，默认为 200
 * @param msg - 响应消息，默认为 'success'
 * @returns 格式化的 Response 对象
 */
export function formatResponse<T = unknown>(
  data: T | Error | string | null,
  code: number = 200,
  msg: string = 'success'
): Response {
  let finalMsg: string = msg;
  let finalData: T | null = null;

  if (code !== 200) {
    if (data instanceof Error) {
      finalMsg = data.message;
      finalData = null;
    } else if (typeof data === 'object' && data !== null && ('error' in data || 'message' in data)) {
      finalMsg = (data as { error?: string; message?: string }).error || (data as { error?: string; message?: string }).message || msg;
      finalData = null;
    } else if (typeof data === 'string') {
      finalMsg = data;
      finalData = null;
    } else {
      finalData = null;
    }
  } else {
    // 成功时，如果 data 不是 Error，则使用原始数据
    if (!(data instanceof Error)) {
      finalData = data as T;
    }
  }

  return new Response(
    JSON.stringify({
      code,
      data: finalData,
      msg: finalMsg,
    } as ResponseData<T>),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

/**
 * 简单的身份验证辅助函数
 * 从请求头中提取 Bearer token 并与环境变量中的 SITE_TOKEN 进行比较
 * @param request - 请求对象
 * @param env - 环境变量对象
 * @returns 验证是否通过
 */
export async function authenticate(request: Request, env: EdgeOneContext['env']): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace(/^Bearer\s+/, '');
  const siteToken = env.SITE_TOKEN;

  // 检查 token 和 siteToken 是否存在
  if (!siteToken || !token) {
    return false;
  }

  // 检查 token 长度（安全：最小长度要求）
  if (token.length < 8) {
    return false;
  }

  // 检查 token 是否与 siteToken 匹配
  if (token !== siteToken) {
    return false;
  }

  return true;
}

/**
 * 构建短链接 URL
 * @param request - 请求对象，用于获取当前域名
 * @param slug - 短链接的 slug
 * @returns 完整的短链接 URL
 */
export function buildShortLink(request: Request, slug: string): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}/${slug}`;
}
