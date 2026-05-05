import { requireAuth } from '@/server/auth'
import { fail, ok, parseJsonBody } from '@/server/response'
import {
  assertSlugAllowed,
  buildShortLink,
  createLinkSchema,
  linkExists,
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

  if (await linkExists(slug))
    return fail(409, '短链已存在', 409, { slug })

  await putLink(link as Link)
  const shortLink = buildShortLink(request, slug)
  return ok({ link: toApiLink(link as Link), shortLink }, '创建成功', 201)
}
