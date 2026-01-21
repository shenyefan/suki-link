import { formatResponse, authenticate } from '../utils.js';

export async function onRequest({ request, env }) {
    try {
        // CORS Preflight
        if (request.method === 'OPTIONS') {
            return formatResponse({}, 204);
        }

        // Only allow GET requests
        if (request.method !== 'GET') {
            return formatResponse('Method not allowed', 405);
        }

        // Read token from Authorization header
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace(/^Bearer\s+/, '');

        if (!token) {
            return formatResponse('Token is required', 400);
        }

        // Authentication check
        if (!(await authenticate(request, env))) {
            return formatResponse('Unauthorized', 401);
        }

        // Return project metadata upon successful verification
        return formatResponse({
            name: 'Suki Link',
            url: 'https://moenya.net',
        }, 200, 'Authenticated successfully');
    } catch (err) {
        return formatResponse(err, 500);
    }
}
