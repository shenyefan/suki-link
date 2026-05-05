import { requireAuth } from '@/server/auth'
import { ok, parseJsonBody } from '@/server/response'
import {
  assertSlugAllowed,
  buildShortLink,
  createLinkSchema,
  getLink,
  normalizeSlug,
  putLink,
  toApiLink,
  type Link,
} from '@/server/link'

const LinkSchema = createLinkSchema()

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

  const existingLink = await getLink(slug)
  if (existingLink) {
    const shortLink = buildShortLink(request, slug)
    return ok({
      link: toApiLink(existingLink),
      shortLink,
      status: 'existing',
    })
  }

  await putLink(link as Link)
  const shortLink = buildShortLink(request, (link as Link).slug)
  return ok({
    link: toApiLink(link as Link),
    shortLink,
    status: 'created',
  }, '已创建', 201)
}
