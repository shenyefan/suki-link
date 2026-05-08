import { CommonClient } from 'tencentcloud-sdk-nodejs-common'
import { teo } from 'tencentcloud-sdk-nodejs-teo'

import { getTeoRegion } from '@/server/env'

const ORIGIN_PULL_METRIC_NAMES = [
  'l7Flow_outFlux_hy',
  'l7Flow_outBandwidth_hy',
  'l7Flow_request_hy',
  'l7Flow_inFlux_hy',
  'l7Flow_inBandwidth_hy',
] as const

const TOP_ANALYSIS_METRIC_NAMES = [
  'l7Flow_outFlux_country',
  'l7Flow_outFlux_province',
  'l7Flow_outFlux_statusCode',
  'l7Flow_outFlux_domain',
  'l7Flow_outFlux_url',
  'l7Flow_outFlux_resourceType',
  'l7Flow_outFlux_sip',
  'l7Flow_outFlux_referers',
  'l7Flow_outFlux_ua_device',
  'l7Flow_outFlux_ua_browser',
  'l7Flow_outFlux_ua_os',
  'l7Flow_outFlux_ua',
  'l7Flow_request_country',
  'l7Flow_request_province',
  'l7Flow_request_statusCode',
  'l7Flow_request_domain',
  'l7Flow_request_url',
  'l7Flow_request_resourceType',
  'l7Flow_request_sip',
  'l7Flow_request_referers',
  'l7Flow_request_ua_device',
  'l7Flow_request_ua_browser',
  'l7Flow_request_ua_os',
  'l7Flow_request_ua',
] as const

const SECURITY_METRIC_NAMES = [
  'ccAcl_interceptNum',
  'ccManage_interceptNum',
  'ccRate_interceptNum',
] as const

const FUNCTION_METRIC_NAMES = [
  'function_requestCount',
  'function_cpuCostTime',
] as const

const TEO_ENDPOINT = 'teo.tencentcloudapi.com'
const TEO_API_VERSION = '2022-09-01'
const PAGES_DEFAULT_ZONE_NAME = 'default-pages-zone'

function createTeoClient(secretId: string, secretKey: string) {
  const TeoClient = teo.v20220901.Client
  return new TeoClient({
    credential: { secretId, secretKey },
    region: getTeoRegion(),
    profile: { httpProfile: { endpoint: TEO_ENDPOINT } },
  })
}

function createCommonClient(secretId: string, secretKey: string) {
  return new CommonClient(TEO_ENDPOINT, TEO_API_VERSION, {
    credential: { secretId, secretKey },
    region: getTeoRegion(),
    profile: { httpProfile: { endpoint: TEO_ENDPOINT } },
  })
}

function formatIsoUtcNoMs(date: Date): string {
  return `${date.toISOString().slice(0, 19)}Z`
}

function attachParsedResult(data: Record<string, unknown>) {
  const raw = data.Result
  if (typeof raw !== 'string')
    return
  try {
    data.parsedResult = JSON.parse(raw) as unknown
  }
  catch {
    /* ignore */
  }
}

export async function resolvePagesZoneId(
  secretId: string,
  secretKey: string,
  queryZoneId?: string,
): Promise<string | undefined> {
  if (queryZoneId)
    return queryZoneId
  const client = createTeoClient(secretId, secretKey)
  const zonesData = await client.DescribeZones({})
  const zones = zonesData.Zones
  if (!zones?.length)
    return undefined
  const pagesZone = zones.find(z => z.ZoneName === PAGES_DEFAULT_ZONE_NAME)
  return pagesZone?.ZoneId ?? zones[0]?.ZoneId
}

export async function describeTeoZones(secretId: string, secretKey: string) {
  const client = createTeoClient(secretId, secretKey)
  return client.DescribeZones({})
}

export async function describePagesBuildCount(secretId: string, secretKey: string, zoneId: string) {
  const client = createCommonClient(secretId, secretKey)
  const params = {
    Interface: 'pages:DescribePagesDeploymentUsage',
    Payload: '{}',
    ZoneId: zoneId,
  }
  const data = (await client.request('DescribePagesResources', params)) as Record<string, unknown>
  attachParsedResult(data)
  return data
}

export async function describePagesCloudFunctionRequests(
  secretId: string,
  secretKey: string,
  zoneId: string,
  options: { startTime?: string; endTime?: string },
) {
  const client = createCommonClient(secretId, secretKey)
  const payload: Record<string, string> = {
    ZoneId: zoneId,
    Interval: 'hour',
  }
  if (options.startTime)
    payload.StartTime = options.startTime
  if (options.endTime)
    payload.EndTime = options.endTime
  const params = {
    ZoneId: zoneId,
    Interface: 'pages:DescribePagesFunctionsRequestDataByZone',
    Payload: JSON.stringify(payload),
  }
  const data = (await client.request('DescribePagesResources', params)) as Record<string, unknown>
  attachParsedResult(data)
  return data
}

export async function describePagesCloudFunctionMonthlyStats(secretId: string, secretKey: string, zoneId: string) {
  const client = createCommonClient(secretId, secretKey)
  const payload = { ZoneId: zoneId }
  const params = {
    ZoneId: zoneId,
    Interface: 'pages:DescribeHistoryCloudFunctionStats',
    Payload: JSON.stringify(payload),
  }
  const data = (await client.request('DescribePagesResources', params)) as Record<string, unknown>
  attachParsedResult(data)
  return data
}

function isTopAnalysisMetric(metric: string): boolean {
  return (TOP_ANALYSIS_METRIC_NAMES as readonly string[]).includes(metric)
}

function isSecurityMetric(metric: string): boolean {
  return (SECURITY_METRIC_NAMES as readonly string[]).includes(metric)
}

function isFunctionMetric(metric: string): boolean {
  return (FUNCTION_METRIC_NAMES as readonly string[]).includes(metric)
}

function isOriginPullMetric(metric: string): boolean {
  return (ORIGIN_PULL_METRIC_NAMES as readonly string[]).includes(metric)
}

export async function describeTrafficByMetric(
  secretId: string,
  secretKey: string,
  input: {
    metric: string
    startTime: string
    endTime: string
    interval?: string
    zoneId?: string
    domain?: string
    functionName?: string
    functionNameFilterKey?: string
  },
) {
  const client = createTeoClient(secretId, secretKey)
  const zoneIds = input.zoneId ? [input.zoneId] : ['*']
  const filters = [
    ...(input.domain ? [{ Key: 'domain', Operator: 'equals', Value: [input.domain] }] : []),
    ...(input.functionName
      ? [{ Key: input.functionNameFilterKey || 'functionName', Operator: 'equals', Value: [input.functionName] }]
      : []),
  ]
  const queryFilters = filters.length ? filters : undefined

  if (isTopAnalysisMetric(input.metric)) {
    return client.DescribeTopL7AnalysisData({
      StartTime: input.startTime,
      EndTime: input.endTime,
      MetricName: input.metric,
      ZoneIds: zoneIds,
      Filters: queryFilters,
    })
  }

  if (isSecurityMetric(input.metric)) {
    const commonClient = createCommonClient(secretId, secretKey)
    const params: Record<string, unknown> = {
      StartTime: input.startTime,
      EndTime: input.endTime,
      MetricNames: [input.metric],
      ZoneIds: zoneIds,
    }
    if (queryFilters)
      params.Filters = queryFilters
    if (input.interval && input.interval !== 'auto')
      params.Interval = input.interval
    return commonClient.request('DescribeWebProtectionData', params)
  }

  if (isFunctionMetric(input.metric)) {
    const commonClient = createCommonClient(secretId, secretKey)
    const metricNames = input.metric === 'function_cpuCostTime'
      ? ['function_requestCount', 'function_cpuCostTime']
      : [input.metric]
    const params: Record<string, unknown> = {
      StartTime: input.startTime,
      EndTime: input.endTime,
      MetricNames: metricNames,
      ZoneIds: zoneIds,
    }
    if (queryFilters)
      params.Filters = queryFilters
    if (input.interval && input.interval !== 'auto')
      params.Interval = input.interval
    return commonClient.request('DescribeTimingFunctionAnalysisData', params)
  }

  const params: Record<string, unknown> = {
    StartTime: input.startTime,
    EndTime: input.endTime,
    MetricNames: [input.metric],
    ZoneIds: zoneIds,
  }
  if (queryFilters)
    params.Filters = queryFilters
  if (input.interval && input.interval !== 'auto')
    params.Interval = input.interval

  if (isOriginPullMetric(input.metric))
    return client.DescribeTimingL7OriginPullData(params as never)

  return client.DescribeTimingL7AnalysisData(params as never)
}

export function defaultTrafficTimeRange() {
  const end = new Date()
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
  return {
    startTime: formatIsoUtcNoMs(start),
    endTime: formatIsoUtcNoMs(end),
  }
}
