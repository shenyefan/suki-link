import { z } from 'zod'

import { requireAuth } from '@/server/auth'
import { ok, fail, parseJsonBody } from '@/server/response'
import {
  assertSlugAllowed,
  buildShortLink,
  createLinkSchema,
  deleteLink,
  getLink,
  getLinkWithMetadata,
  linkExists,
  normalizeSlug,
  putLink,
  toAdminApiLink,
  type Link,
} from '@/server/link'

const LinkSchema = createLinkSchema()
const LinkUpdateSchema = LinkSchema.extend({
  slug: z.string().trim().max(2048).optional(),
})

const optionalFields = [
  'comment',
  'title',
  'description',
  'image',
  'apple',
  'google',
  'cloaking',
  'redirectWithQuery',
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
  const { link, metadata } = await getLinkWithMetadata(slug)
  if (link) {
    return ok({
      ...metadata,
      ...toAdminApiLink(link),
    })
  }

  return fail(404, '未找到短链', 404)
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny

  const { slug: originalSlug } = await context.params
  const parsed = await parseJsonBody(request, LinkUpdateSchema)
  if (parsed instanceof Response)
    return parsed

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

  if (newSlug !== originalSlug)
    await deleteLink(originalSlug)

  await putLink(updatedLink)
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
  await deleteLink(slug)
  return ok({ slug }, '已删除')
}
