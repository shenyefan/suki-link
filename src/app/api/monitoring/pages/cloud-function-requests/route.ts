import { z } from 'zod'

import { requireAuth } from '@/server/auth'
import { getTeoCredential } from '@/server/env'
import { fail, ok, parseQuery } from '@/server/response'

const QuerySchema = z.object({
  zoneId: z.string().trim().min(1).optional(),
  startTime: z.string().trim().min(1).optional(),
  endTime: z.string().trim().min(1).optional(),
})

export async function GET(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny
  const cred = getTeoCredential()
  if (!cred)
    return fail(500, '缺少EdgeOne凭证', 500)
  const q = parseQuery(request, QuerySchema)
  if (q instanceof Response)
    return q
  try {
    const { describePagesCloudFunctionRequests, resolvePagesZoneId } = await import('@/server/monitoring')
    const zoneId = await resolvePagesZoneId(cred.secretId, cred.secretKey, q.zoneId)
    if (!zoneId)
      return fail(400, '缺少站点ID且无法自动解析', 400)
    const data = await describePagesCloudFunctionRequests(cred.secretId, cred.secretKey, zoneId, {
      startTime: q.startTime,
      endTime: q.endTime,
    })
    return ok(data)
  }
  catch (err) {
    const message = err instanceof Error ? err.message : '查询Pages资源失败'
    return fail(500, message, 500)
  }
}
