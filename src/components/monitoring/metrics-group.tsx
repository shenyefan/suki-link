'use client'

import { useState } from 'react'
import { Maximize } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricsList } from '@/components/monitoring/metrics-list'
import type { MetricItem, MetricLabels } from '@/components/monitoring/types'

type MetricsLoading = boolean | Record<string, boolean>

function isMetricLoading(loading: MetricsLoading | undefined, type: string) {
  if (typeof loading === 'boolean') return loading
  return Boolean(loading?.[type])
}

function MetricPanel({ type, data, labels, loading }: { type: string; data: MetricItem[]; labels: MetricLabels; loading?: boolean }) {
  const [open, setOpen] = useState(false)
  const top10 = data.slice(0, 10)

  return (
    <Card className="flex h-[410px] min-w-0 flex-col gap-0 p-0">
      {top10.length ? (
        <>
          <CardContent className="min-w-0 p-0">
            <MetricsList items={top10} />
          </CardContent>
          {data.length > 10 && (
            <CardFooter className="h-10 shrink-0 p-0">
              <Button variant="link" className="h-10 w-full" onClick={() => setOpen(true)}>
                <Maximize className="mr-2 h-4 w-4" />
                详情
              </Button>
              <ResponsiveModal open={open} onOpenChange={setOpen} title={labels[type] ?? type}>
                <MetricsList items={data} />
              </ResponsiveModal>
            </CardFooter>
          )}
        </>
      ) : loading ? (
        <MetricsList.Skeleton />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          暂无数据
        </div>
      )}
    </Card>
  )
}

export function MetricsGroup({ tabs, data, labels, loading }: { tabs: string[]; data: Record<string, MetricItem[]>; labels: MetricLabels; loading?: MetricsLoading }) {
  return (
    <Tabs defaultValue={tabs[0]} className="flex h-[446px] min-w-0 flex-col">
      <TabsList className="w-fit">
        {tabs.map(tab => <TabsTrigger key={tab} value={tab}>{labels[tab]}</TabsTrigger>)}
      </TabsList>
      {tabs.map(tab => (
        <TabsContent key={tab} value={tab} className="min-w-0 flex-1">
          <MetricPanel type={tab} data={data[tab] ?? []} labels={labels} loading={isMetricLoading(loading, tab)} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
