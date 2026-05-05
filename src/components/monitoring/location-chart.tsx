'use client'

import { useState } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldAtlas from 'world-atlas/countries-110m.json'

import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCount, getCountryNameByNumericCode, mixHexColor } from '@/lib/format'
import type { MetricItem } from '@/components/monitoring/types'

type GeoFeature = {
  id?: string | number
  properties?: { name?: string }
  type: 'Feature'
  geometry: unknown
}

const WORLD_FEATURES = (feature(
  worldAtlas as unknown as Parameters<typeof feature>[0],
  (worldAtlas as { objects: { countries: unknown } }).objects.countries as Parameters<typeof feature>[1],
) as unknown as { features: GeoFeature[] }).features

const WORLD_PROJECTION = geoNaturalEarth1().fitSize(
  [900, 420],
  { type: 'FeatureCollection', features: WORLD_FEATURES } as never,
)
const WORLD_PATH = geoPath(WORLD_PROJECTION)

export function LocationChart({ data }: { data: MetricItem[] }) {
  const [hovered, setHovered] = useState<MetricItem | null>(null)
  const max = Math.max(...data.map(item => item.count), 0)
  const byNumericCode = new Map(data.map(item => [item.numericCode, item]))

  const getFill = (count?: number) => {
    if (!count || !max) return '#27272a'
    return mixHexColor('#27272a', '#2563eb', 0.22 + (count / max) * 0.78)
  }

  return (
    <Tabs defaultValue="country" className="flex h-[446px] flex-col">
      <TabsList className="w-fit">
        <TabsTrigger value="country">国家</TabsTrigger>
      </TabsList>
      <TabsContent value="country" className="flex-1">
        <Card className="flex h-[410px] flex-col gap-0 p-0">
          <CardContent className="relative flex-1 overflow-hidden px-2 py-2">
            {hovered && (
              <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
                <div className="font-medium">{hovered.name}</div>
                <div className="mt-1 font-mono tabular-nums text-muted-foreground">{formatCount(hovered.count)} 次</div>
              </div>
            )}
            {data.length ? (
              <svg viewBox="0 0 900 420" role="img" aria-label="国家/地区访问分布" className="h-full w-full">
                <g>
                  {WORLD_FEATURES.map((item, index) => {
                    const numericCode = String(item.id ?? '').padStart(3, '0')
                    const metric = byNumericCode.get(numericCode)
                    const name = metric?.name ?? getCountryNameByNumericCode(numericCode)
                    const d = WORLD_PATH(item as never)
                    if (!d) return null

                    return (
                      <path
                        key={`${numericCode}-${index}`}
                        d={d}
                        fill={getFill(metric?.count)}
                        stroke="hsl(var(--background))"
                        strokeWidth={0.6}
                        className="transition-colors hover:fill-[var(--chart-1)]"
                        onMouseEnter={() => setHovered(metric ?? { name, count: 0, percent: 0 })}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <title>{`${name}: ${formatCount(metric?.count ?? 0)}`}</title>
                      </path>
                    )
                  })}
                </g>
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">暂无地区数据</div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
