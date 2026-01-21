import { formatResponse, authenticate, normalizeSlug } from '../utils.js';

export async function onRequest({ request, env }) {
  // CORS Preflight
  if (request.method === 'OPTIONS') {
    return formatResponse({}, 204);
  }

  if (request.method !== 'POST' && request.method !== 'DELETE') {
    return formatResponse('Method not allowed', 405);
  }

  // Authentication
  if (!(await authenticate(request, env))) {
    return formatResponse('Unauthorized', 401);
  }

  try {
    let body;
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

    const existing = await Link.get(`link_${slug}`);
    if (!existing) {
      return formatResponse('Link not found', 404);
    }

    await Link.delete(`link_${slug}`);

    return formatResponse({ slug }, 200, 'Deleted successfully');
  } catch (err) {
    return formatResponse(err, 500);
  }
}