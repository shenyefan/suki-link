import { requireAuth } from '@/server/auth'
import { getKvBatchLimit } from '@/server/env'
import { ok } from '@/server/response'
import { listLinks, toApiLink, type ExportData } from '@/server/link'

export async function GET(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny

  const limit = getKvBatchLimit()
  const links = []
  let cursor: string | undefined
  let listComplete = false

  while (!listComplete) {
    const list = await listLinks({ limit, cursor })
    links.push(...list.links)
    listComplete = list.list_complete
    cursor = list.cursor

    if (!cursor && !listComplete) {
      break
    }
  }

  const exportData: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    count: links.length,
    links: links.map(toApiLink),
    list_complete: true,
  }

  const res = ok(exportData)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
