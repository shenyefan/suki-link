import { z } from 'zod'

import { fail, ok, parseJsonBody } from '@/server/response'
import { getLink } from '@/server/link'

const VerifyPasswordSchema = z.object({
  slug: z.string().trim().min(1).max(2048),
  password: z.string().trim().min(1),
  query: z.string().trim().max(4096).optional(),
})

function passwordCookieName(slug: string): string {
  const encoded = encodeURIComponent(slug).replace(/[^A-Za-z0-9]/g, '_').slice(0, 120)
  return `suki_link_pass_${encoded}`
}

async function passwordCookieValue(slug: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(slug)
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, data)
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function safeQueryString(query: string | undefined): string {
  if (!query)
    return ''
  if (!query.startsWith('?') || query.startsWith('??') || query.includes('#'))
    return ''
  return query
}

function buildVerifiedPath(slug: string, query: string | undefined): string {
  return `/${encodeURIComponent(slug)}${safeQueryString(query)}`
}

export async function POST(request: Request): Promise<Response> {
  const parsed = await parseJsonBody(request, VerifyPasswordSchema)
  if (parsed instanceof Response)
    return parsed

  const { slug, password, query } = parsed
  const link = await getLink(slug)

  if (!link)
    return fail(404, '短链不存在', 404)

  if (!link.password)
    return ok({ valid: true, url: buildVerifiedPath(slug, query) }, '无需密码')

  if (link.password !== password)
    return fail(401, '密码错误', 401)

  const response = ok({ valid: true, url: buildVerifiedPath(slug, query) }, '密码正确')
  const token = await passwordCookieValue(slug, password)
  response.headers.append(
    'Set-Cookie',
    `${passwordCookieName(slug)}=${token}; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax`,
  )
  return response
}
