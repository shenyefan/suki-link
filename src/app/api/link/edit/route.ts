import { z } from 'zod'

import { requireAuth } from '@/server/auth'
import { fail, ok, parseJsonBody } from '@/server/response'
import {
  assertSlugAllowed,
  buildShortLink,
  createLinkSchema,
  deleteLink,
  getLink,
  linkExists,
  normalizeSlug,
  putLink,
  toAdminApiLink,
} from '@/server/link'

const EditSchema = createLinkSchema().extend({
  originalSlug: z.string().trim().min(1).max(2048),
})

export async function POST(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny

  const parsed = await parseJsonBody(request, EditSchema)
  if (parsed instanceof Response)
    return parsed

  const { originalSlug, ...linkData } = parsed
  const newSlug = normalizeSlug(linkData.slug ?? '')

  // Check if original link exists
  const existingLink = await getLink(originalSlug)
  if (!existingLink)
    return fail(404, '短链不存在', 404)

  // If slug changed, check if new slug is available
  if (newSlug !== originalSlug) {
    const reserved = assertSlugAllowed(newSlug)
    if (reserved)
      return reserved

    if (await linkExists(newSlug))
      return fail(409, '新短链标识已存在', 409)
  }

  const newLink = {
    ...existingLink,
    ...linkData,
    slug: newSlug,
    createdAt: existingLink.createdAt,
    updatedAt: Math.floor(Date.now() / 1000),
  }

  // Clear undefined optional fields
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
  for (const field of optionalFields) {
    if (linkData[field] === undefined)
      delete (newLink as Record<string, unknown>)[field]
  }

  // If slug changed, delete old link
  if (newSlug !== originalSlug) {
    await deleteLink(originalSlug)
  }

  await putLink(newLink)
  const shortLink = buildShortLink(request, newLink.slug)
  return ok({ link: toAdminApiLink(newLink), shortLink }, '更新成功', 201)
}
