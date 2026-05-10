import { formatCount } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import type { MetricItem } from '@/components/monitoring/types'

export function MetricsList({ items }: { items: MetricItem[] }) {
  return (
    <div className="w-full text-sm">
      <div className="flex justify-between border-b leading-[48px] transition-colors hover:bg-muted/50">
        <div className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">名称</div>
        <div className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">数量</div>
      </div>
      <div className="h-[342px] overflow-y-auto pb-0">
        {items.map(item => (
          <div key={`${item.name}-${item.count}`} className="border-b px-4 py-2 transition-colors hover:bg-muted/50">
            <div className="flex justify-between gap-4">
              <div className="flex-1 truncate leading-5">{item.name}</div>
              <div className="text-right tabular-nums">
                {formatCount(item.count)}
                <span className="text-xs text-muted-foreground"> ({item.percent}%)</span>
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

MetricsList.Skeleton = function MetricsListSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-4 w-full rounded-full" />)}
    </div>
  )
}
