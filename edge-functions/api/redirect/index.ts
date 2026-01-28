import { formatResponse, normalizeSlug, EdgeOneContext, getDateString, getDateDaysAgo, getTimezoneFromRequest } from '../utils/common.js';

/**
 * 记录访问统计信息
 * @param slug - 短链接的 slug
 * @param request - 请求对象
 * @param waitUntil - EdgeOne 的 waitUntil 函数
 */
async function recordAccess(slug: string, request: Request, waitUntil?: (promise: Promise<unknown>) => void): Promise<void> {
  try {
    // 从请求中获取时区字符串
    const timezone = getTimezoneFromRequest(request);
    
    const dateStr = getDateString(undefined, timezone);

    // 更新 daily_all - 存储最近 30 天的总点击量
    const dailyAllKey = 'daily_all';
    let dailyAll = ((await (Link as KVNamespace).get(dailyAllKey, 'json')) || {}) as Record<string, number>;

    // 增加今天的计数
    dailyAll[dateStr] = (dailyAll[dateStr] || 0) + 1;

    // 清理超过 30 天的数据
    const cutoffDate = getDateDaysAgo(30, undefined, timezone);
    const cutoffDateStr = getDateString(cutoffDate, timezone);

    Object.keys(dailyAll).forEach((key) => {
      if (key < cutoffDateStr) {
        delete dailyAll[key];
      }
    });

    await (Link as KVNamespace).put(dailyAllKey, JSON.stringify(dailyAll));

    // 更新 daily_links - 存储所有日期和链接的点击量
    const dailyLinksKey = 'daily_links';
    let dailyLinks = ((await (Link as KVNamespace).get(dailyLinksKey, 'json')) || {}) as Record<
      string,
      Record<string, number>
    >;

    // 如果日期不存在则初始化
    if (!dailyLinks[dateStr]) {
      dailyLinks[dateStr] = {};
    }

    // 增加该日期下该 slug 的计数
    dailyLinks[dateStr][slug] = (dailyLinks[dateStr][slug] || 0) + 1;

    // 清理超过 30 天的数据
    Object.keys(dailyLinks).forEach((key) => {
      if (key < cutoffDateStr) {
        delete dailyLinks[key];
      }
    });

    await (Link as KVNamespace).put(dailyLinksKey, JSON.stringify(dailyLinks));
  } catch (err) {
    // 静默失败 - 不阻塞重定向
    console.error('Error recording access:', err);
  }
}

/**
 * 重定向 API 处理函数
 * 根据 slug 查询短链接并返回重定向信息
 */
export async function onRequest(context: EdgeOneContext): Promise<Response> {
  const { request, env, waitUntil } = context;
  console.log('Redirect API called:', request.url, request.method);

  // CORS 预检请求
  if (request.method === 'OPTIONS') {
    return formatResponse({}, 204);
  }

  if (request.method !== 'GET') {
    return formatResponse('Method not allowed', 405);
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  console.log('Slug from query:', slug);

  if (!slug) {
    return formatResponse('Slug is required', 400);
  }

  // 定义保留路径（参考 Sink-master 的 reserveSlug 配置）
  const reserveSlug = ['dashboard', 'login', 'analytics', 'expired', 'api', '_next'];

  // 定义 slug 正则（参考 Sink-master 的 slugRegex，这里简化为仅字母数字）
  const slugRegex = /^[a-zA-Z0-9]+$/;

  // 模仿 Sink-master 的检查逻辑
  if (reserveSlug.includes(slug) || !slugRegex.test(slug)) {
    return formatResponse('Invalid slug', 400);
  }

  // 查询 KV 存储
  const normalizedSlug = normalizeSlug(slug);
  const linkKey = `link_${normalizedSlug}`;
  console.log('Querying KV for key:', linkKey);

  // 检查 Link 对象是否存在
  if (typeof Link === 'undefined') {
    console.error('Link object is not available');
    return formatResponse('KV storage not available', 500);
  }

  let data: { url?: string; expiration?: number } | null;
  try {
    data = (await (Link as KVNamespace).get(linkKey, 'json')) as { url?: string; expiration?: number } | null;
    console.log('KV query result:', data ? 'found' : 'not found');
  } catch (e) {
    console.error('KV error:', e);
    return formatResponse('Failed to query link', 500);
  }

  if (!data || typeof data.url !== 'string') {
    console.log('Link not found or invalid data:', { data, hasUrl: data?.url });
    return formatResponse('Link not found', 404);
  }

  // 校验跳转 URL（必须是绝对 URL）
  let targetUrl: string;
  try {
    targetUrl = new URL(data.url).toString();
  } catch {
    console.error('Invalid redirect url:', data.url);
    return formatResponse('Invalid redirect URL', 400);
  }

  // 过期判断
  if (data.expiration) {
    const now = Math.floor(Date.now() / 1000);
    if (now > data.expiration) {
      return formatResponse(
        {
          expired: true,
          redirectTo: `${url.origin}/expired`,
        },
        200,
        'Link expired'
      );
    }
  }

  // 异步记录访问统计（不阻塞响应）
  try {
    if (waitUntil && typeof waitUntil === 'function') {
      waitUntil(recordAccess(normalizedSlug, request, waitUntil));
    } else {
      recordAccess(normalizedSlug, request, waitUntil).catch((err) => {
        console.error('Failed to record access:', err);
      });
    }
  } catch (err) {
    console.error('Error setting up access recording:', err);
  }

  // 返回重定向信息
  return formatResponse(
    {
      url: targetUrl,
    },
    200,
    'Redirect found'
  );
}
