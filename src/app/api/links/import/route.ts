import { requireAuth } from '@/server/auth'
import { getKvBatchLimit } from '@/server/env'
import { ok, parseJsonBody } from '@/server/response'
import {
  assertSlugAllowed,
  createImportDataSchema,
  genId,
  getLink,
  type ImportResult,
  type Link,
  normalizeSlug,
  putLink,
} from '@/server/link'

const ImportDataSchema = createImportDataSchema()

export async function POST(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny

  const parsed = await parseJsonBody(request, ImportDataSchema)
  if (parsed instanceof Response)
    return parsed

  const importData = parsed
  const batchSize = Math.max(1, Math.floor(getKvBatchLimit() / 2))

  const result: ImportResult = {
    success: 0,
    skipped: 0,
    failed: 0,
    successItems: [],
    skippedItems: [],
    failedItems: [],
  }

  for (let start = 0; start < importData.links.length; start += batchSize) {
    const batch = importData.links.slice(start, start + batchSize)

    for (const [offset, linkData] of batch.entries()) {
      const i = start + offset

      try {
        const slug = normalizeSlug(linkData.slug ?? '')
        const reserved = assertSlugAllowed(slug)
        if (reserved) {
          result.failed++
          result.failedItems.push({
            index: i,
            slug,
            url: linkData.url,
            reason: '短链标识为系统保留',
          })
          continue
        }

        const existingLink = await getLink(slug)
        if (existingLink) {
          result.skippedItems.push({ index: i, slug, url: linkData.url })
          result.skipped++
          continue
        }

        const now = Math.floor(Date.now() / 1000)
        const link: Link = {
          id: linkData.id ?? genId(),
          url: linkData.url,
          slug,
          comment: linkData.comment,
          createdAt: linkData.createdAt || now,
          updatedAt: linkData.updatedAt || now,
          expiration: linkData.expiration,
          redirectWithQuery: linkData.redirectWithQuery,
          cloaking: linkData.cloaking,
          password: linkData.password,
          unsafe: linkData.unsafe,
        }

        await putLink(link)
        result.successItems.push({ index: i, slug, url: linkData.url })
        result.success++
      }
      catch (error) {
        result.failed++
        result.failedItems.push({
          index: i,
          slug: linkData.slug ?? '',
          url: linkData.url,
          reason: error instanceof Error ? error.message : '未知错误',
        })
      }
    }
  }

  const res = ok(result, '导入完成')
  res.headers.set('Cache-Control', 'no-store')
  return res
}
