import { z } from 'zod'

import { requireAuth } from '@/server/auth'
import { ok, fail, parseJsonBody, parseQuery } from '@/server/response'
import {
  assertSlugAllowed,
  buildShortLink,
  createLinkSchema,
  listLinks,
  normalizeSlug,
  linkExists,
  putLink,
  toAdminApiLink,
  toApiLink,
  type Link,
} from '@/server/link'

const ListSchema = z.object({
  limit: z.number().max(1024).default(20),
  cursor: z.string().trim().max(1024).optional(),
  search: z.string().trim().max(2048).optional(),
  sort: z.enum(['newest', 'oldest', 'az', 'za']).default('newest').optional(),
})

const LinkSchema = createLinkSchema()

export async function GET(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny

  const parsed = parseQuery(request, ListSchema)
  if (parsed instanceof Response)
    return parsed

  const list = await listLinks({
    limit: parsed.limit ?? 20,
    cursor: parsed.cursor,
    search: parsed.search,
    sort: parsed.sort,
  })

  return ok({
    ...list,
    links: list.links.map(link => (link ? toAdminApiLink(link) : null)),
  })
}

export async function POST(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny

  const parsed = await parseJsonBody(request, LinkSchema)
  if (parsed instanceof Response)
    return parsed

  const link = parsed
  const slug = normalizeSlug(link.slug ?? '')
  link.slug = slug

  const reserved = assertSlugAllowed(slug)
  if (reserved)
    return reserved

  if (await linkExists(slug))
    return fail(409, '短链已存在', 409, { slug })

  await putLink(link as Link)
  const shortLink = buildShortLink(request, slug)
  return ok({ link: toApiLink(link as Link), shortLink }, '创建成功', 201)
}
