import { z } from 'zod'

import { requireAuth } from '@/server/auth'
import { getSlugRegex } from '@/server/env'
import { ok, fail, parseJsonBody } from '@/server/response'
import {
  assertSlugAllowed,
  buildShortLink,
  deleteLink,
  getLink,
  linkExists,
  normalizeSlug,
  putLink,
  renameSlug,
  toAdminApiLink,
  type Link,
} from '@/server/link'

const LinkUpdateSchema = z.object({
  url: z.string().trim().url().max(2048),
  slug: z.string().trim().max(2048).optional(),
  comment: z.string().trim().max(2048).optional(),
  expiration: z.number().int().safe().refine(expiration => expiration > Math.floor(Date.now() / 1000), {
    message: 'expiration must be greater than current time',
    path: ['expiration'],
  }).optional(),
  redirectWithQuery: z.boolean().optional(),
  cloaking: z.boolean().optional(),
  password: z.string().trim().min(1).max(128).optional(),
  unsafe: z.boolean().optional(),
})

const optionalFields = [
  'comment',
  'redirectWithQuery',
  'cloaking',
  'password',
  'expiration',
  'unsafe',
] as const

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny

  const { slug } = await context.params
  const link = await getLink(normalizeSlug(slug))
  if (link)
    return ok(toAdminApiLink(link))

  return fail(404, '未找到短链', 404)
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny

  const { slug } = await context.params
  const originalSlug = normalizeSlug(slug)
  const parsed = await parseJsonBody(request, LinkUpdateSchema)
  if (parsed instanceof Response)
    return parsed

  if (parsed.slug && !getSlugRegex().test(parsed.slug))
    return fail(400, '短链标识格式无效', 400)

  const existingLink = await getLink(originalSlug)
  if (!existingLink)
    return fail(404, '短链不存在', 404)

  const newSlug = normalizeSlug(parsed.slug ?? originalSlug)
  if (newSlug !== originalSlug) {
    const reserved = assertSlugAllowed(newSlug)
    if (reserved)
      return reserved

    if (await linkExists(newSlug))
      return fail(409, '新短链标识已存在', 409)
  }

  const updatedLink: Link = {
    ...existingLink,
    ...parsed,
    slug: newSlug,
    updatedAt: Math.floor(Date.now() / 1000),
  }

  for (const field of optionalFields) {
    if (parsed[field] === undefined)
      delete (updatedLink as Record<string, unknown>)[field]
  }

  if (newSlug !== originalSlug) {
    const renameResult = await renameSlug({ ...updatedLink, slug: originalSlug }, newSlug)
    if (!renameResult.ok)
      return fail(409, '新短链标识已存在', 409)
  }
  else {
    await putLink(updatedLink)
  }

  const shortLink = buildShortLink(request, newSlug)
  return ok({ link: toAdminApiLink(updatedLink), shortLink }, '更新成功')
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny

  const { slug } = await context.params
  const normalizedSlug = normalizeSlug(slug)
  await deleteLink(normalizedSlug)
  return ok({ slug: normalizedSlug }, '已删除')
}
