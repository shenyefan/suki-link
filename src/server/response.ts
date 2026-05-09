import type { z } from 'zod'
import type { ZodIssue } from 'zod'

export type ApiEnvelope<T> = {
  code: number
  data: T
  message: string
}

export function ok<T>(data: T, message = '请求成功', status = 200): Response {
  const body: ApiEnvelope<T> = {
    code: 200,
    data,
    message,
  }

  return Response.json(body, { status })
}

export function fail(
    code: number,
    message: string,
    status: number = code >= 400 && code < 600 ? code : 400,
    data: Record<string, unknown> | null = null,
): Response {
  const body: ApiEnvelope<Record<string, unknown> | null> = {
    code,
    data,
    message,
  }

  return Response.json(body, { status })
}

export function getSearchRecord(request: Request): Record<string, string> {
  const u = new URL(request.url)
  const out: Record<string, string> = {}

  u.searchParams.forEach((v, k) => {
    out[k] = v
  })

  return out
}

function formatZodIssue(issue: ZodIssue): string {
  const field = issue.path.join('.') || '参数'

  switch (issue.code) {
    case 'invalid_type':
      return `${field}类型无效`
    case 'invalid_string':
      if (issue.validation === 'url')
        return `${field}不是合法网址`
      return `${field}格式无效`
    case 'too_small':
      return `${field}长度或数值过小`
    case 'too_big':
      return `${field}长度或数值过大`
    case 'invalid_enum_value':
      return `${field}选项无效`
    default:
      return issue.message || `${field}无效`
  }
}

function formatZodError(error: z.ZodError): string {
  return error.issues.map(formatZodIssue).join('；')
}

export async function parseJsonBody<T>(
    request: Request,
    schema: z.ZodType<T>,
): Promise<T | Response> {
  try {
    const raw = await request.json()
    const r = schema.safeParse(raw)

    if (!r.success)
      return fail(400, formatZodError(r.error) || '参数无效', 400)

    return r.data
  }
  catch {
    return fail(400, '请求体不是合法 JSON', 400)
  }
}

export function parseQuery<T>(request: Request, schema: z.ZodType<T>): T | Response {
  const record = getSearchRecord(request)
  const r = schema.safeParse(record)

  if (!r.success)
    return fail(400, formatZodError(r.error) || '查询参数无效', 400)

  return r.data
}
