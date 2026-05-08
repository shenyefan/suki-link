import { requireAuth } from '@/server/auth'
import { getKvBatchLimit } from '@/server/env'
import { fail, ok, parseJsonBody } from '@/server/response'
import {
  assertSlugAllowed,
  getLink,
  ImportDataSchema,
  type ImportResult,
  normalizeSlug,
  putLink,
} from '@/server/link'

export async function POST(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny

  const maxLinks = Math.floor(getKvBatchLimit() / 2)

  const parsed = await parseJsonBody(request, ImportDataSchema)
  if (parsed instanceof Response)
    return parsed

  const importData = parsed
  if (importData.links.length > maxLinks) {
    return fail(
      400,
      `单次导入过多，最多 ${maxLinks} 条`,
      400,
    )
  }

  const result: ImportResult = {
    success: 0,
    skipped: 0,
    failed: 0,
    successItems: [],
    skippedItems: [],
    failedItems: [],
  }

  for (const [i, linkData] of importData.links.entries()) {
    try {
      const slug = normalizeSlug(linkData.slug ?? '')
      const reserved = assertSlugAllowed(slug)
      if (reserved) {
        result.failed++
        result.failedItems.push({
          index: i,
          slug,
          url: linkData.url,
          reason: '保留 slug',
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
      const link = {
        url: linkData.url,
        slug,
        comment: linkData.comment,
        createdAt: linkData.createdAt || now,
        updatedAt: linkData.updatedAt || now,
        expiration: linkData.expiration,
        title: linkData.title,
        description: linkData.description,
        image: linkData.image,
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

  const res = ok(result, '导入完成')
  res.headers.set('Cache-Control', 'no-store')
  return res
}
