import { z } from 'zod'

import { requireAuth } from '@/server/auth'
import { fail, ok, parseQuery } from '@/server/response'
import { getLinkWithMetadata, toAdminApiLink } from '@/server/link'

const QueryParamsSchema = z.object({
  slug: z.string().trim().min(1).max(2048),
})

export async function GET(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny
  const q = parseQuery(request, QueryParamsSchema)
  if (q instanceof Response)
    return q
  const { link, metadata } = await getLinkWithMetadata(q.slug)
  if (link) {
    return ok({
      ...metadata,
      ...toAdminApiLink(link),
    })
  }
  return fail(404, '未找到短链', 404)
}
