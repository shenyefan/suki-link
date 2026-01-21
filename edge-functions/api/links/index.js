import { formatResponse, authenticate } from '../utils.js';

export async function onRequest({ request, env }) {
  // CORS Preflight
  if (request.method === 'OPTIONS') {
    return formatResponse({}, 204);
  }

  // Authentication
  if (!(await authenticate(request, env))) {
    return formatResponse('Unauthorized', 401);
  }

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 30;
    const cursor = url.searchParams.get('cursor') || undefined;

    const listOptions = {
      prefix: 'link_',
      limit: Math.min(limit, 100),
    };

    if (cursor) {
      listOptions.cursor = cursor;
    }

    const result = await Link.list(listOptions);

    const links = await Promise.all(
      (result.keys || []).map(async (key) => {
        const data = await Link.get(key.name || key.key, 'json');
        if (data && data.expiration) {
          const now = Math.floor(Date.now() / 1000);
          data.isExpired = now > data.expiration;
        } else if (data) {
          data.isExpired = false;
        }
        return data;
      })
    );

    return formatResponse({
      links: links.filter(Boolean),
      list_complete: result.complete,
      cursor: result.cursor,
    }, 200, 'Retrieved successfully');
  } catch (err) {
    console.error(err);
    return formatResponse(err, 500);
  }
}