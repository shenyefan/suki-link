import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatCount } from '@/lib/format'
import type { TimeMetric } from '@/components/monitoring/types'

export function ViewsChart({ data }: { data?: TimeMetric }) {
  const chartConfig: ChartConfig = {
    visits: { label: '访问', color: 'var(--chart-1)' },
  }
  const rows = data?.timeData.map((time, index) => ({ time, visits: data.valueData[index] ?? 0 })) ?? []

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>趋势</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        {rows.length ? (
          <ChartContainer config={chartConfig} className="h-[260px] min-h-[260px] w-full min-w-0 aspect-auto">
            <AreaChart data={rows} accessibilityLayer margin={{ left: 0, right: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={42} tickFormatter={formatCount} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area dataKey="visits" type="monotone" fill="var(--color-visits)" fillOpacity={0.4} stroke="var(--color-visits)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">暂无访问趋势</div>
        )}
      </CardContent>
    </Card>
  )
}
