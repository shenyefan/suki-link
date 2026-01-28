import { generateSlug, formatResponse, authenticate, buildShortLink, normalizeSlug, EdgeOneContext, LinkData } from '../utils/common.js';

/**
 * 创建链接请求体接口
 */
interface CreateLinkRequest {
  url: string;
  slug?: string;
  comment?: string;
  expiration?: number | string;
}

/**
 * 创建链接响应数据接口
 */
interface CreateLinkResponse {
  link: LinkData;
  shortLink: string;
}

/**
 * 创建短链接 API 处理函数
 */
export async function onRequest(context: EdgeOneContext): Promise<Response> {
  const { request, env } = context;

  // CORS 预检请求
  if (request.method === 'OPTIONS') {
    return formatResponse({}, 204);
  }

  if (request.method !== 'POST') {
    return formatResponse('Method not allowed', 405);
  }

  // 身份验证
  if (!(await authenticate(request, env))) {
    return formatResponse('Unauthorized', 401);
  }

  let body: CreateLinkRequest;
  try {
    body = await request.json();
  } catch (err) {
    return formatResponse(err, 500);
  }

  const { url, slug: customSlug, comment, expiration } = body;

  if (!url) {
    return formatResponse('URL is required', 400);
  }

  let slug = customSlug?.trim();
  if (slug) {
    slug = normalizeSlug(slug);
  }

  const reservedSlugs = ['dashboard', 'api'];

  if (slug) {
    if (reservedSlugs.includes(slug)) {
      return formatResponse('Slug is reserved', 409);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(slug)) {
      return formatResponse('Invalid slug format', 400);
    }
    const existing = await (Link as KVNamespace).get(`link_${slug}`);
    if (existing) {
      return formatResponse('Slug already exists', 409);
    }
  } else {
    // 生成唯一 slug
    const slugLength = parseInt(env.SLUG_DEFAULT_LENGTH || '6') || 6;
    let attempts = 0;
    do {
      slug = generateSlug(slugLength);
      const existing = await (Link as KVNamespace).get(`link_${slug}`);
      if (!existing && !reservedSlugs.includes(slug)) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return formatResponse('Failed to generate unique slug', 500);
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const linkData: LinkData = {
    url,
    slug: slug!,
    comment: comment || '',
    createdAt: now,
    updatedAt: now,
  };

  if (expiration) {
    const expTime = typeof expiration === 'string' ? parseInt(expiration) : expiration;
    if (!isNaN(expTime)) {
      linkData.expiration = expTime;
    }
  }

  await (Link as KVNamespace).put(`link_${slug}`, JSON.stringify(linkData));

  return formatResponse<CreateLinkResponse>(
    {
      link: linkData,
      shortLink: buildShortLink(request, slug!),
    },
    200,
    'Created successfully'
  );
}
