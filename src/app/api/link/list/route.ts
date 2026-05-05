import { z } from 'zod'

import { requireAuth } from '@/server/auth'
import { ok, parseJsonBody } from '@/server/response'
import { listLinks, toAdminApiLink } from '@/server/link'

const ListSchema = z.object({
  limit: z.number().max(1024).default(20),
  cursor: z.string().trim().max(1024).optional(),
  search: z.string().trim().max(2048).optional(),
  sort: z.enum(['newest', 'oldest', 'az', 'za']).default('newest').optional(),
})

export async function POST(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny
  const parsed = await parseJsonBody(request, ListSchema)
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
