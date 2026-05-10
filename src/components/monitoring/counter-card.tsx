import type { ComponentType } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function CounterCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string
  value: string
  icon: ComponentType<{ className?: string }>
  loading: boolean
}) {
  return (
    <Card className="min-w-0 gap-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold tabular-nums">{value}</div>}
      </CardContent>
    </Card>
  )
}
