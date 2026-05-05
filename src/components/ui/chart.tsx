'use client'

import * as React from 'react'
import type { TooltipContentProps, TooltipValueType } from 'recharts'
import * as RechartsPrimitive from 'recharts'

import { cn } from '@/lib/utils'

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    color?: string
  }
}

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context)
    throw new Error('useChart must be used within a <ChartContainer />')
  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          'flex aspect-video justify-center text-xs',
          '[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground',
          '[&_.recharts-cartesian-grid_line[stroke="#ccc"]]:stroke-border/50',
          '[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border',
          '[&_.recharts-dot[stroke="#fff"]]:stroke-transparent',
          '[&_.recharts-layer]:outline-hidden',
          '[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted',
          '[&_.recharts-sector]:outline-hidden',
          '[&_.recharts-sector[stroke="#fff"]]:stroke-transparent',
          '[&_.recharts-surface]:outline-hidden',
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.color)

  if (!colorConfig.length)
    return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
[data-chart=${id}] {
${colorConfig.map(([key, item]) => `  --color-${key}: ${item.color};`).join('\n')}
}
`,
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  className,
  label,
  labelFormatter,
  formatter,
  indicator = 'dot',
}: Partial<TooltipContentProps<TooltipValueType, string | number>> & {
  className?: string
  indicator?: 'line' | 'dot'
}) {
  const { config } = useChart()

  if (!active || !payload?.length)
    return null

  return (
    <div
      className={cn(
        'grid min-w-36 gap-1.5 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md',
        className,
      )}
    >
      {label && (
        <div className="font-medium">
          {labelFormatter ? labelFormatter(label, payload) : label}
        </div>
      )}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${item.dataKey || item.name || 'item'}-${index}`
          const itemConfig = config[key]
          const color = item.color || item.payload?.fill || itemConfig?.color
          const value = formatter
            ? formatter(item.value, item.name, item, index, payload)
            : item.value

          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className={cn(
                  'shrink-0 rounded-[2px]',
                  indicator === 'dot' ? 'h-2.5 w-2.5' : 'h-0.5 w-3',
                )}
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground">
                {itemConfig?.label || item.name}
              </span>
              <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                {value as React.ReactNode}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }
