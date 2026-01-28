import { formatResponse, authenticate, normalizeSlug, EdgeOneContext } from '../utils/common.js';

/**
 * 删除链接请求体接口
 */
interface DeleteLinkRequest {
  slug: string;
}

/**
 * 删除链接响应数据接口
 */
interface DeleteLinkResponse {
  slug: string;
}

/**
 * 删除短链接 API 处理函数
 */
export async function onRequest(context: EdgeOneContext): Promise<Response> {
  const { request, env } = context;

  // CORS 预检请求
  if (request.method === 'OPTIONS') {
    return formatResponse({}, 204);
  }

  if (request.method !== 'POST' && request.method !== 'DELETE') {
    return formatResponse('Method not allowed', 405);
  }

  // 身份验证
  if (!(await authenticate(request, env))) {
    return formatResponse('Unauthorized', 401);
  }

  try {
    let body: DeleteLinkRequest;
    try {
      body = await request.json();
    } catch (err) {
      return formatResponse(err, 400, 'Invalid JSON');
    }

    let { slug } = body;

    if (!slug) {
      return formatResponse('Slug is required', 400);
    }

    slug = normalizeSlug(slug);

    const existing = await (Link as KVNamespace).get(`link_${slug}`);
    if (!existing) {
      return formatResponse('Link not found', 404);
    }

    await (Link as KVNamespace).delete(`link_${slug}`);

    return formatResponse<DeleteLinkResponse>({ slug }, 200, 'Deleted successfully');
  } catch (err) {
    return formatResponse(err, 500);
  }
}
