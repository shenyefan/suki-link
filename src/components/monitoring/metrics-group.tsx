'use client'

import { useState } from 'react'
import { Maximize } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricsList } from '@/components/monitoring/metrics-list'
import type { MetricItem, MetricLabels } from '@/components/monitoring/types'

function MetricPanel({ type, data, labels }: { type: string; data: MetricItem[]; labels: MetricLabels }) {
  const [open, setOpen] = useState(false)
  const top10 = data.slice(0, 10)

  return (
    <Card className="flex h-[410px] flex-col gap-0 p-0">
      {top10.length ? (
        <>
          <CardContent className="p-0">
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
      ) : (
        <div className="space-y-4 p-4">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-4 w-full rounded-full" />)}
        </div>
      )}
    </Card>
  )
}

export function MetricsGroup({ tabs, data, labels }: { tabs: string[]; data: Record<string, MetricItem[]>; labels: MetricLabels }) {
  return (
    <Tabs defaultValue={tabs[0]} className="flex h-[446px] flex-col">
      <TabsList className="w-fit">
        {tabs.map(tab => <TabsTrigger key={tab} value={tab}>{labels[tab]}</TabsTrigger>)}
      </TabsList>
      {tabs.map(tab => (
        <TabsContent key={tab} value={tab} className="flex-1">
          <MetricPanel type={tab} data={data[tab] ?? []} labels={labels} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
