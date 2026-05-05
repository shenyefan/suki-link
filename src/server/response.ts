import type { z } from 'zod'

export type ApiEnvelope<T> = {
  code: number
  data: T
  message: string
  timestamp: string
}

export function responseTimestamp(): string {
  const d = new Date()
  const p = (n: number, l: number) => String(n).padStart(l, '0')
  const yyyy = d.getUTCFullYear()
  const MM = p(d.getUTCMonth() + 1, 2)
  const dd = p(d.getUTCDate(), 2)
  const HH = p(d.getUTCHours(), 2)
  const mm = p(d.getUTCMinutes(), 2)
  const ss = p(d.getUTCSeconds(), 2)
  const ms = p(d.getMilliseconds(), 3)
  const tail = p(Math.floor(Math.random() * 1e6), 6)
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}.${ms}${tail}`
}

export function ok<T>(data: T, message = '请求成功', status = 200): Response {
  const body: ApiEnvelope<T> = {
    code: 200,
    data,
    message,
    timestamp: responseTimestamp(),
  }
  return Response.json(body, { status })
}

export function fail(
  code: number,
  message: string,
  status: number = code >= 400 && code < 600 ? code : 400,
  data: Record<string, unknown> | null = null,
): Response {
  return Response.json(
    {
      code,
      data,
      message,
      timestamp: responseTimestamp(),
    },
    { status },
  )
}

export function getSearchRecord(request: Request): Record<string, string> {
  const u = new URL(request.url)
  const out: Record<string, string> = {}
  u.searchParams.forEach((v, k) => {
    out[k] = v
  })
  return out
}

export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T | Response> {
  try {
    const raw = await request.json()
    const r = schema.safeParse(raw)
    if (!r.success)
      return fail(400, r.error.issues.map(e => e.message).join('; ') || '参数无效', 400)
    return r.data
  }
  catch {
    return fail(400, '请求体不是合法 JSON', 400)
  }
}

export function parseQuery<T>(request: Request, schema: z.ZodType<T>): T | Response {
  const r = schema.safeParse(getSearchRecord(request))
  if (!r.success)
    return fail(400, r.error.issues.map(e => e.message).join('; ') || '查询参数无效', 400)
  return r.data
}
