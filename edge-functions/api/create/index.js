import { generateSlug, formatResponse, authenticate, buildShortLink, normalizeSlug } from '../utils.js';

export async function onRequest({ request, env }) {
  // CORS Preflight
  if (request.method === 'OPTIONS') {
    return formatResponse({}, 204);
  }

  if (request.method !== 'POST') {
    return formatResponse('Method not allowed', 405);
  }

  // Authentication
  if (!(await authenticate(request, env))) {
    return formatResponse('Unauthorized', 401);
  }

  let body;
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
    const existing = await Link.get(`link_${slug}`);
    if (existing) {
      return formatResponse('Slug already exists', 409);
    }
  } else {
    // Generate unique slug
    const slugLength = parseInt(env.SLUG_DEFAULT_LENGTH) || 6;
    let attempts = 0;
    do {
      slug = generateSlug(slugLength);
      const existing = await Link.get(`link_${slug}`);
      if (!existing && !reservedSlugs.includes(slug)) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return formatResponse('Failed to generate unique slug', 500);
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const linkData = {
    url,
    slug,
    comment: comment || '',
    createdAt: now,
    updatedAt: now,
  };

  if (expiration) {
    const expTime = parseInt(expiration);
    if (!isNaN(expTime)) {
      linkData.expiration = expTime;
    }
  }

  await Link.put(`link_${slug}`, JSON.stringify(linkData));


  return formatResponse({
    link: linkData,
    shortLink: buildShortLink(request, slug)
  }, 200, 'Created successfully');
}