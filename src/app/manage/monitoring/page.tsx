'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, Flame, Loader2, MousePointerClick, RefreshCw, Users } from 'lucide-react'

import { CounterCard } from '@/components/monitoring/counter-card'
import { LocationChart } from '@/components/monitoring/location-chart'
import { MetricsGroup } from '@/components/monitoring/metrics-group'
import type { MetricItem, TimeMetric } from '@/components/monitoring/types'
import { ViewsChart } from '@/components/monitoring/views-chart'
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
import { apiJson } from '@/manage/api'

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

export default function MonitoringPage() {
  const [range, setRange] = useState<TimeRange>('today')
  const [metrics, setMetrics] = useState<Record<string, ProcessedMetric>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const timeRange = useMemo(() => calculateTimeRange(range), [range])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const allMetrics = ['l7Flow_request', ...topMetrics]
    try {
      const results = await Promise.allSettled(allMetrics.map(async (metric) => {
          const url = `/api/monitoring/traffic?metric=${encodeURIComponent(metric)}&startTime=${encodeURIComponent(timeRange.startTime)}&endTime=${encodeURIComponent(timeRange.endTime)}`
          const raw = await apiJson<RawMetricResponse>(url)
          return [metric, processMetric(raw, metric, range)] as const
        }))

      const next: Record<string, ProcessedMetric> = {}
      results.forEach((result) => {
        if (result.status === 'fulfilled')
          next[result.value[0]] = result.value[1]
      })
      setMetrics(next)

      const rejected = results.filter(result => result.status === 'rejected').length
      if (rejected) {
        const message = `${rejected} 个统计项加载失败。`
        setError(message)
        toast.error('统计加载不完整', message)
      }
    }
    catch (err) {
      const message = err instanceof Error ? err.message : '统计加载失败'
      setError(message)
      toast.error('统计加载失败', message)
    }
    finally {
      setLoading(false)
    }
  }, [range, timeRange.endTime, timeRange.startTime, toast])

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

  return (
    <div className="flex min-h-[calc(100vh-6.5rem)] flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">分析</h1>
          <p className="text-sm text-muted-foreground">按当前域名统计访问数据。</p>
        </div>
        <div className="flex gap-2">
          <Select value={range} onValueChange={value => setRange(value as TimeRange)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            刷新
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-3 sm:gap-3 lg:gap-4">
        <CounterCard title="访问" value={formatCount(visitsMetric?.sum ?? 0)} icon={MousePointerClick} loading={loading} />
        <CounterCard title="访客" value={formatCount(metricItems.sip.length)} icon={Users} loading={loading} />
        <CounterCard title="来源" value={formatCount(metricItems.referer.length)} icon={Flame} loading={loading} />
      </div>

      <ViewsChart data={visitsMetric} />

      <main className="grid gap-8 lg:grid-cols-12">
        <div className="col-span-1 lg:col-span-8">
          <LocationChart data={metricItems.country} />
        </div>
        <div className="lg:col-span-4">
          <MetricsGroup tabs={['country', 'region']} data={metricItems} labels={metricLabels} />
        </div>
        <div className="lg:col-span-6">
          <MetricsGroup tabs={['referer', 'slug']} data={metricItems} labels={metricLabels} />
        </div>
        <div className="lg:col-span-6">
          <MetricsGroup tabs={['device']} data={metricItems} labels={metricLabels} />
        </div>
        <div className="lg:col-span-6">
          <MetricsGroup tabs={['os', 'browser']} data={metricItems} labels={metricLabels} />
        </div>
        <div className="lg:col-span-6">
          <MetricsGroup tabs={['ua']} data={metricItems} labels={metricLabels} />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground lg:col-span-6">
          <BarChart3 className="h-3.5 w-3.5" />
          数据来源于 EdgeOne。
        </div>
      </main>
    </div>
  )
}
