import { formatResponse, authenticate, normalizeSlug, EdgeOneContext, LinkData } from '../utils.js';

/**
 * 编辑链接请求体接口
 */
interface EditLinkRequest {
  slug: string;
  url: string;
  comment?: string;
  expiration?: number | string | null;
}

/**
 * 编辑链接响应数据接口
 */
interface EditLinkResponse {
  link: LinkData;
}

/**
 * 编辑短链接 API 处理函数
 */
export async function onRequest(context: EdgeOneContext): Promise<Response> {
  const { request, env } = context;

  // CORS 预检请求
  if (request.method === 'OPTIONS') {
    return formatResponse({}, 204);
  }

  if (request.method !== 'PUT' && request.method !== 'POST') {
    return formatResponse('Method not allowed', 405);
  }

  // 身份验证
  if (!(await authenticate(request, env))) {
    return formatResponse('Unauthorized', 401);
  }

  try {
    let body: EditLinkRequest;
    try {
      body = await request.json();
    } catch (err) {
      return formatResponse(err, 400, 'Invalid JSON');
    }

    let { slug, url, comment, expiration } = body;

    if (!slug || !url) {
      return formatResponse('Slug and URL are required', 400);
    }

    slug = normalizeSlug(slug);

    const linkData = (await (Link as KVNamespace).get(`link_${slug}`, 'json')) as LinkData | null;
    if (!linkData) {
      return formatResponse('Link not found', 404);
    }

    const now = Math.floor(Date.now() / 1000);
    linkData.url = url;
    if (comment !== undefined) linkData.comment = comment;
    linkData.updatedAt = now;

    // 处理过期日期：如果为 null 或 undefined，则删除；如果有值，则设置
    if (expiration === null || expiration === undefined) {
      delete linkData.expiration;
    } else {
      const expTime = typeof expiration === 'string' ? parseInt(expiration) : expiration;
      if (!isNaN(expTime) && expTime > 0) {
        linkData.expiration = expTime;
      } else {
        delete linkData.expiration;
      }
    }

    await (Link as KVNamespace).put(`link_${slug}`, JSON.stringify(linkData));

    return formatResponse<EditLinkResponse>({ link: linkData }, 200, 'Updated successfully');
  } catch (err) {
    return formatResponse(err, 500);
  }
}
