import { z } from 'zod'

import { requireAuth } from '@/server/auth'
import { getMonitoringDomain, getTeoCredential, getTeoFunctionName, getTeoFunctionNameFilterKey } from '@/server/env'
import { listLinks } from '@/server/link'
import { fail, ok, parseQuery } from '@/server/response'

const QuerySchema = z.object({
  metric: z.string().trim().min(1).default('l7Flow_flux'),
  startTime: z.string().trim().min(1).optional(),
  endTime: z.string().trim().min(1).optional(),
  interval: z.string().trim().min(1).optional(),
  zoneId: z.string().trim().min(1).optional(),
  domain: z.string().trim().min(1).optional(),
  functionName: z.string().trim().min(1).optional(),
})

function normalizeTopUrlKey(key: string) {
  return key.replace(/`/g, '').trim().split('?')[0]?.replace(/^\/+|\/+$/g, '') ?? ''
}

async function getAllLinkSlugs() {
  const slugs = new Set<string>()
  let cursor: string | undefined
  let complete = false

  while (!complete) {
    const data = await listLinks({ limit: 1024, cursor })
    data.links.forEach((link) => {
      if (link?.slug)
        slugs.add(link.slug)
    })
    complete = data.list_complete
    cursor = data.cursor
    if (!cursor && !complete)
      break
  }

  return slugs
}

async function filterUrlTopDataToLinks(metric: string, data: unknown) {
  if (!['l7Flow_request_url', 'l7Flow_outFlux_url'].includes(metric))
    return data

  const slugs = await getAllLinkSlugs()
  if (!slugs.size)
    return data

  const record = data as { Data?: Array<{ DetailData?: Array<{ Key: string; Value: number }> }> }
  const detailData = record.Data?.[0]?.DetailData
  if (!detailData)
    return data

  record.Data![0]!.DetailData = detailData.filter(item => slugs.has(normalizeTopUrlKey(item.Key)))
  return data
}

export async function GET(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny
  const cred = getTeoCredential()
  if (!cred)
    return fail(500, '缺少 TEo 凭证', 500)
  const q = parseQuery(request, QuerySchema)
  if (q instanceof Response)
    return q
  const { defaultTrafficTimeRange, describeTrafficByMetric } = await import('@/server/monitoring')
  const defaults = defaultTrafficTimeRange()
  const startTime = q.startTime ?? defaults.startTime
  const endTime = q.endTime ?? defaults.endTime
  try {
    const data = await describeTrafficByMetric(cred.secretId, cred.secretKey, {
      metric: q.metric ?? 'l7Flow_flux',
      startTime,
      endTime,
      interval: q.interval,
      zoneId: q.zoneId,
      domain: q.domain ?? getMonitoringDomain(request),
      functionName: q.functionName ?? getTeoFunctionName(),
      functionNameFilterKey: getTeoFunctionNameFilterKey(),
    })
    const filteredData = await filterUrlTopDataToLinks(q.metric ?? 'l7Flow_flux', data)
    return ok(filteredData)
  }
  catch (err) {
    const message = err instanceof Error ? err.message : '流量指标查询失败'
    return fail(500, message, 500)
  }
}
