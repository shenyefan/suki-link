export type TimeMetric = {
  type: 'time'
  timeData: string[]
  valueData: number[]
  sum: number
}

export type MetricItem = {
  name: string
  count: number
  percent: number
  code?: string
  numericCode?: string
}

export type MetricLabels = Record<string, string>
