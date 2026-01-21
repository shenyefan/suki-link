import { customAlphabet } from 'nanoid';

const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

/**
 * Generate a random slug using official nanoid customAlphabet
 */
export function generateSlug(length = 6) {
    const nanoid = customAlphabet(ALPHABET, length);
    return nanoid();
}

/**
 * Normalize slug
 */
export function normalizeSlug(slug) {
    return slug.toLowerCase();
}

/**
 * Standardize response format: { code, data, msg, stack? }
 * code 200 is success, others are errors.
 * msg shows user-friendly error info.
 * stack trace is separated into 'stack' field for debugging.
 */
export function formatResponse(data, code = 200, msg = 'success') {
    let finalMsg = msg;
    let finalData = data;

    if (code !== 200) {
        if (data instanceof Error) {
            finalMsg = data.message;
            finalData = null;
        } else if (typeof data === 'object' && data !== null && (data.error || data.message)) {
            finalMsg = data.error || data.message;
            finalData = null;
        } else if (typeof data === 'string') {
            finalMsg = data;
            finalData = null;
        } else {
            finalData = null;
        }
    }

    return new Response(JSON.stringify({
        code,
        data: finalData,
        msg: finalMsg,
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

/**
 * Simple authentication helper
 */
export async function authenticate(request, env) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/, '');
    const siteToken = env.SITE_TOKEN;

    // Check if token and siteToken exist
    if (!siteToken || !token) {
        return false;
    }

    // Check token length first (security: minimum length requirement)
    if (token.length < 8) {
        return false;
    }

    // Check if token matches siteToken
    if (token !== siteToken) {
        return false;
    }

    return true;
}

/**
 * Build short link URL
 */
export function buildShortLink(request, slug) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}/${slug}`;
}
