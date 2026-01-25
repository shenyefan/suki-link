import { formatResponse, authenticate, EdgeOneContext } from '../utils.js';

/**
 * 验证 API 响应数据接口
 */
interface VerifyResponse {
  name: string;
  url: string;
}

/**
 * 验证 API 处理函数
 * 验证 token 并返回项目元数据
 */
export async function onRequest(context: EdgeOneContext): Promise<Response> {
  const { request, env } = context;

  try {
    // CORS 预检请求
    if (request.method === 'OPTIONS') {
      return formatResponse({}, 204);
    }

    // 仅允许 GET 请求
    if (request.method !== 'GET') {
      return formatResponse('Method not allowed', 405);
    }

    // 从 Authorization 头中读取 token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/, '');

    if (!token) {
      return formatResponse('Token is required', 400);
    }

    // 身份验证检查
    if (!(await authenticate(request, env))) {
      return formatResponse('Unauthorized', 401);
    }

    // 验证成功后返回项目元数据
    return formatResponse<VerifyResponse>(
      {
        name: 'Suki Link',
        url: 'https://moenya.net',
      },
      200,
      'Authenticated successfully'
    );
  } catch (err) {
    return formatResponse(err, 500);
  }
}
