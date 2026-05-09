import { requireAuth } from '@/server/auth'
import { getTeoCredential } from '@/server/env'
import { fail, ok } from '@/server/response'

export async function GET(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny
  const cred = getTeoCredential()
  if (!cred)
    return fail(500, '缺少EdgeOne凭证', 500)
  try {
    const { describeTeoZones } = await import('@/server/monitoring')
    const data = await describeTeoZones(cred.secretId, cred.secretKey)
    return ok(data)
  }
  catch (err) {
    const message = err instanceof Error ? err.message : '查询站点列表失败'
    return fail(500, message, 500)
  }
}
