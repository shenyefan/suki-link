import { z } from 'zod'

import { requireAuth } from '@/server/auth'
import { ok, parseJsonBody } from '@/server/response'
import { createLinkSchema, deleteLink } from '@/server/link'

const DeleteSchema = z.object({
  slug: createLinkSchema().shape.slug.removeDefault().min(1),
})

export async function POST(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny

  const parsed = await parseJsonBody(request, DeleteSchema)
  if (parsed instanceof Response)
    return parsed

  await deleteLink(parsed.slug)
  return ok({ slug: parsed.slug }, '已删除')
}
