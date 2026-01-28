import { formatResponse, authenticate, EdgeOneContext, LinkData } from '../utils/common.js';

/**
 * KV 命名空间列表选项接口
 */
interface KVListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

/**
 * KV 列表结果接口
 */
interface KVListResult {
  keys: Array<{ name: string; key?: string }>;
  complete: boolean;
  cursor?: string;
}

/**
 * 链接列表响应数据接口
 */
interface LinksResponse {
  links: (LinkData & { isExpired?: boolean })[];
  list_complete: boolean;
  cursor?: string;
}

/**
 * 获取链接列表 API 处理函数
 */
export async function onRequest(context: EdgeOneContext): Promise<Response> {
  const { request, env } = context;

  // CORS 预检请求
  if (request.method === 'OPTIONS') {
    return formatResponse({}, 204);
  }

  // 身份验证
  if (!(await authenticate(request, env))) {
    return formatResponse('Unauthorized', 401);
  }

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const cursor = url.searchParams.get('cursor') || undefined;

    const listOptions: KVListOptions = {
      prefix: 'link_',
      limit: Math.min(limit, 100),
    };

    if (cursor) {
      listOptions.cursor = cursor;
    }

    const result = (await (Link as KVNamespace).list(listOptions)) as KVListResult;

    const links = await Promise.all(
      (result.keys || []).map(async (key) => {
        const data = (await (Link as KVNamespace).get(key.name || key.key || '', 'json')) as (LinkData & {
          isExpired?: boolean;
        }) | null;
        if (data && data.expiration) {
          const now = Math.floor(Date.now() / 1000);
          data.isExpired = now > data.expiration;
        } else if (data) {
          data.isExpired = false;
        }
        return data;
      })
    );

    return formatResponse<LinksResponse>(
      {
        links: links.filter(Boolean) as (LinkData & { isExpired?: boolean })[],
        list_complete: result.complete,
        cursor: result.cursor,
      },
      200,
      'Retrieved successfully'
    );
  } catch (err) {
    console.error(err);
    return formatResponse(err, 500);
  }
}
