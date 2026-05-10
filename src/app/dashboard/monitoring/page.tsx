'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Flame, Loader2, MousePointerClick, RefreshCw, Users } from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { CounterCard } from '@/components/monitoring/counter-card'
import { LocationChart } from '@/components/monitoring/location-chart'
import { MetricsGroup } from '@/components/monitoring/metrics-group'
import type { MetricItem, TimeMetric } from '@/components/monitoring/types'
import { ViewsChart } from '@/components/monitoring/views-chart'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import {
  calculateTimeRange,
  formatCount,
  formatMetricName,
  formatTimeLabel,
  getCountryNumericCode,
  normalizeCountryCode,
  type TimeRange,
} from '@/lib/format'
import { apiJson } from '@/lib/dashboard-api'

type DetailPoint = {
  Timestamp: number
  Value: number
}

type MetricValue = {
  MetricName?: string
  Detail?: DetailPoint[]
  Sum?: number
}

type TopPoint = {
  Key: string
  Value: number
}

type RawRecord = {
  TypeValue?: MetricValue[]
  DetailData?: TopPoint[]
}

type RawMetricResponse = {
  Data?: RawRecord[]
}

type TopMetric = {
  type: 'top'
  data: TopPoint[]
}

type ProcessedMetric = TimeMetric | TopMetric

const timeRanges: Array<{ value: TimeRange; label: string }> = [
  { value: '30min', label: '近 30 分钟' },
  { value: '1h', label: '近 1 小时' },
  { value: '6h', label: '近 6 小时' },
  { value: 'today', label: '今日' },
  { value: 'yesterday', label: '昨日' },
  { value: '3d', label: '近 3 天' },
  { value: '7d', label: '近 7 天' },
  { value: '14d', label: '近 14 天' },
  { value: '31d', label: '近 31 天' },
]

const topMetricMap = {
  country: 'l7Flow_request_country',
  region: 'l7Flow_request_province',
  referer: 'l7Flow_request_referers',
  slug: 'l7Flow_request_url',
  device: 'l7Flow_request_ua_device',
  os: 'l7Flow_request_ua_os',
  browser: 'l7Flow_request_ua_browser',
  ua: 'l7Flow_request_ua',
  sip: 'l7Flow_request_sip',
} as const

const topMetrics = Object.values(topMetricMap)
const allMetricNames = ['l7Flow_request', ...topMetrics]

const metricLabels: Record<string, string> = {
  country: '国家',
  region: '地区',
  referer: '来源',
  slug: '短链',
  device: '设备',
  os: '系统',
  browser: '浏览器',
  ua: 'User-Agent',
}

function processMetric(result: RawMetricResponse, metric: string, range: TimeRange): ProcessedMetric {
  const detailData = result.Data?.[0]?.DetailData
  if (detailData)
    return { type: 'top', data: detailData }

  const metricValue = result.Data?.[0]?.TypeValue?.find(item => item.MetricName === metric) ?? result.Data?.[0]?.TypeValue?.[0]
  const details = metricValue?.Detail ?? []
  return {
    type: 'time',
    timeData: details.map(item => formatTimeLabel(item.Timestamp, range)),
    valueData: details.map(item => item.Value),
    sum: metricValue?.Sum ?? 0,
  }
}

function toMetricItems(metric: ProcessedMetric | undefined, type: string): MetricItem[] {
  if (!metric || metric.type !== 'top') return []
  const total = metric.data.reduce((sum, item) => sum + item.Value, 0)
  return [...metric.data]
    .sort((a, b) => b.Value - a.Value)
    .map(item => ({
      name: formatMetricName(type, item.Key),
      count: item.Value,
      percent: total ? Math.max(1, Math.floor(item.Value / total * 100)) : 0,
      code: type === 'country' ? normalizeCountryCode(item.Key) : item.Key,
      numericCode: type === 'country' ? getCountryNumericCode(item.Key) : undefined,
    }))
}

function MonitoringContent() {
  const searchParams = useSearchParams()
  const slugFilter = searchParams.get('slug')?.trim() || ''
  const requestRef = useRef(0)
  const [range, setRange] = useState<TimeRange>('today')
  const [metrics, setMetrics] = useState<Record<string, ProcessedMetric>>({})
  const [metricLoading, setMetricLoading] = useState<Record<string, boolean>>(
    () => Object.fromEntries(allMetricNames.map(metric => [metric, true])),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const timeRange = useMemo(() => calculateTimeRange(range), [range])

  const load = useCallback(async () => {
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setLoading(true)
    setError(null)
    setMetrics({})
    setMetricLoading(Object.fromEntries(allMetricNames.map(metric => [metric, true])))

    let rejected = 0
    await Promise.all(allMetricNames.map(async (metric) => {
      try {
        const params = new URLSearchParams({
          metric,
          startTime: timeRange.startTime,
          endTime: timeRange.endTime,
        })
        if (slugFilter)
          params.set('slug', slugFilter)
        const url = `/api/monitoring/traffic?${params.toString()}`
        const raw = await apiJson<RawMetricResponse>(url)
        const processed = processMetric(raw, metric, range)
        if (requestRef.current !== requestId)
          return
        setMetrics(prev => ({ ...prev, [metric]: processed }))
      }
      catch {
        rejected += 1
      }
      finally {
        if (requestRef.current === requestId)
          setMetricLoading(prev => ({ ...prev, [metric]: false }))
      }
    }))

    if (requestRef.current !== requestId)
      return

    setLoading(false)
    if (rejected) {
      const message = `${rejected} 个统计项加载失败。`
      setError(message)
      toast.error('统计加载不完整', message)
    }
  }, [range, slugFilter, timeRange.endTime, timeRange.startTime, toast])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const visitsMetric = metrics.l7Flow_request?.type === 'time' ? metrics.l7Flow_request : undefined
  const metricItems = useMemo(() => ({
    country: toMetricItems(metrics[topMetricMap.country], 'country'),
    region: toMetricItems(metrics[topMetricMap.region], 'region'),
    referer: toMetricItems(metrics[topMetricMap.referer], 'referer'),
    slug: toMetricItems(metrics[topMetricMap.slug], 'slug'),
    device: toMetricItems(metrics[topMetricMap.device], 'device'),
    os: toMetricItems(metrics[topMetricMap.os], 'os'),
    browser: toMetricItems(metrics[topMetricMap.browser], 'browser'),
    ua: toMetricItems(metrics[topMetricMap.ua], 'ua'),
    sip: toMetricItems(metrics[topMetricMap.sip], 'sip'),
  }), [metrics])

  const metricItemLoading = useMemo(() => ({
    country: Boolean(metricLoading[topMetricMap.country]),
    region: Boolean(metricLoading[topMetricMap.region]),
    referer: Boolean(metricLoading[topMetricMap.referer]),
    slug: Boolean(metricLoading[topMetricMap.slug]),
    device: Boolean(metricLoading[topMetricMap.device]),
    os: Boolean(metricLoading[topMetricMap.os]),
    browser: Boolean(metricLoading[topMetricMap.browser]),
    ua: Boolean(metricLoading[topMetricMap.ua]),
    sip: Boolean(metricLoading[topMetricMap.sip]),
  }), [metricLoading])

  return (
    <>
      <Header fixed>
        <Breadcrumb className="me-auto min-w-0">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard/links">Suki-Link</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {slugFilter ? (
                <BreadcrumbLink asChild>
                  <Link href="/dashboard/monitoring">监控</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>监控</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {slugFilter && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="max-w-40 truncate">/{slugFilter}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <Select value={range} onValueChange={value => setRange(value as TimeRange)}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" className="h-9" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          <span className="hidden sm:inline">刷新</span>
        </Button>
      </Header>

      <Main className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-6">
      {error && <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid min-w-0 gap-4 sm:grid-cols-3 sm:gap-3 lg:gap-4">
        <CounterCard title="访问" value={formatCount(visitsMetric?.sum ?? 0)} icon={MousePointerClick} loading={Boolean(metricLoading.l7Flow_request)} />
        <CounterCard title="访客" value={formatCount(metricItems.sip.length)} icon={Users} loading={metricItemLoading.sip} />
        <CounterCard title="来源" value={formatCount(metricItems.referer.length)} icon={Flame} loading={metricItemLoading.referer} />
      </div>

      <ViewsChart data={visitsMetric} />

      <div className="grid min-w-0 gap-8 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <LocationChart data={metricItems.country} />
        </div>
        <div className="min-w-0 lg:col-span-4">
          <MetricsGroup tabs={['country', 'region']} data={metricItems} labels={metricLabels} loading={metricItemLoading} />
        </div>
        <div className="min-w-0 lg:col-span-6">
          <MetricsGroup tabs={['referer', 'slug']} data={metricItems} labels={metricLabels} loading={metricItemLoading} />
        </div>
        <div className="min-w-0 lg:col-span-6">
          <MetricsGroup tabs={['device']} data={metricItems} labels={metricLabels} loading={metricItemLoading} />
        </div>
        <div className="min-w-0 lg:col-span-6">
          <MetricsGroup tabs={['os', 'browser']} data={metricItems} labels={metricLabels} loading={metricItemLoading} />
        </div>
        <div className="min-w-0 lg:col-span-6">
          <MetricsGroup tabs={['ua']} data={metricItems} labels={metricLabels} loading={metricItemLoading} />
        </div>
      </div>
      </Main>
    </>
  )
}

export default function MonitoringPage() {
  return (
    <Suspense fallback={null}>
      <MonitoringContent />
    </Suspense>
  )
}
