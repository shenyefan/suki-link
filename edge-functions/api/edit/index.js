import { formatResponse, authenticate, normalizeSlug } from '../utils.js';

export async function onRequest({ request, env }) {
    // CORS Preflight
    if (request.method === 'OPTIONS') {
        return formatResponse({}, 204);
    }

    if (request.method !== 'PUT' && request.method !== 'POST') {
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

        let { slug, url, comment, expiration } = body;

        if (!slug || !url) {
            return formatResponse('Slug and URL are required', 400);
        }

        slug = normalizeSlug(slug);

        const linkData = await Link.get(`link_${slug}`, 'json');
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
            const expTime = parseInt(expiration);
            if (!isNaN(expTime) && expTime > 0) {
                linkData.expiration = expTime;
            } else {
                delete linkData.expiration;
            }
        }

        await Link.put(`link_${slug}`, JSON.stringify(linkData));

        return formatResponse({ link: linkData }, 200, 'Updated successfully');
    } catch (err) {
        return formatResponse(err, 500);
    }
}
