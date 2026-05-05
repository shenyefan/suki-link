import { z } from 'zod'

import { requireAuth } from '@/server/auth'
import { getKvBatchLimit } from '@/server/env'
import { ok, parseJsonBody } from '@/server/response'
import type { ExportData, Link } from '@/server/link'
import { listLinks, toApiLink } from '@/server/link'

const ExportSchema = z.object({
  cursor: z.string().trim().max(1024).optional(),
})

export async function POST(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny

  const parsed = await parseJsonBody(request, ExportSchema)
  if (parsed instanceof Response)
    return parsed

  const limit = getKvBatchLimit()
  const list = await listLinks({ limit, cursor: parsed.cursor })
  const links = list.links.filter((link): link is Link => link !== null)

  const exportData: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    count: links.length,
    links: links.map(toApiLink),
    cursor: list.cursor,
    list_complete: list.list_complete,
  }

  const res = ok(exportData)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
