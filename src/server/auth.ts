import bcrypt from 'bcryptjs'

import { getSitePassword } from '@/server/env'
import { fail } from '@/server/response'

const BCRYPT_ROUNDS = 10

export async function login(password: string): Promise<string | null> {
  const storedPassword = getSitePassword()

  if (storedPassword) {
    if (password !== storedPassword)
      return null
    return bcrypt.hash(password, BCRYPT_ROUNDS)
  }

  return null
}

export async function requireAuth(request: Request): Promise<Response | null> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const storedPassword = getSitePassword()

  if (!storedPassword)
    return fail(401, '未配置访问凭证', 401)

  if (!token)
    return fail(401, '未授权', 401)

  if (token.length < 8)
    return fail(401, '令牌长度过短', 401)

  if (storedPassword) {
    const matched = await bcrypt.compare(storedPassword, token)
    if (!matched)
      return fail(401, '未授权', 401)
    return null
  }

  return fail(401, '未授权', 401)
}
