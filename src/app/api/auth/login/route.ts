import { z } from 'zod'

import { login } from '@/server/auth'
import { fail, ok, parseJsonBody } from '@/server/response'

const LoginSchema = z.object({
  password: z.string().trim().min(1),
})

export async function POST(request: Request): Promise<Response> {
  const parsed = await parseJsonBody(request, LoginSchema)
  if (parsed instanceof Response)
    return parsed

  const token = await login(parsed.password)
  if (!token)
    return fail(401, '密码错误', 401)

  return ok({ token }, '登录成功')
}
