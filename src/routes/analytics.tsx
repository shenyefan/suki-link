import * as React from "react"
import { useState, useEffect } from "react"
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DatePicker } from "@/components/dashboard/date-picker"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { toast } from "sonner"
import { AlertCircle, TrendingUp, Trophy, RefreshCw, Calendar } from "lucide-react"
import { api } from "@/lib/api-client"
import { getAuthToken } from "@/lib/auth"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface DailyStat {
  date: string
  clicks: number
}

interface LinkRanking {
  slug: string
  clicks: number
  url: string
  comment?: string
}

interface AnalyticsData {
  dailyStats: DailyStat[]
  linkRankings: LinkRanking[]
  date: string
}

export const Route = createFileRoute('/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    return new Date()
  })

  useEffect(() => {
    if (!getAuthToken()) {
      navigate({ to: '/login' })
    }
  }, [navigate])

  const fetchAnalytics = React.useCallback(async (date?: string) => {
    setIsLoading(true)
    setHasError(false)
    try {
      const url = new URL('/api/analytics', window.location.origin)
      if (date) {
        url.searchParams.set('date', date)
      }

      const body = await api.get<AnalyticsData>(url.toString())

      if (body.code === 200 && body.data) {
        setData(body.data)
        if (date) {
          const [year, month, day] = date.split('-').map(Number)
          setSelectedDate(new Date(year, month - 1, day))
        } else {
          const [year, month, day] = body.data.date.split('-').map(Number)
          setSelectedDate(new Date(year, month - 1, day))
        }
      } else {
        console.error("API error:", body.msg)
        setHasError(true)
        toast.error("加载失败", {
          description: body.msg || "获取分析数据时出错"
        })
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err)
      setHasError(true)
      toast.error("加载失败", {
        description: "请检查网络连接或稍后重试"
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const totalClicks = data?.dailyStats ? data.dailyStats.reduce((sum, d) => sum + d.clicks, 0) : 0

  const chartData = data?.dailyStats.map((stat) => ({
    date: formatDate(stat.date),
    visits: stat.clicks,
  })) || []

  const chartConfig = {
    visits: {
      label: "访问次数",
      color: "hsl(142, 76%, 36%)", // 醒目的绿色
    },
  } satisfies ChartConfig

  // 获取链接的图标，仿照 dashboard 的方式
  const getHost = (url: string) => {
    try {
      return new URL(url).host
    } catch {
      return ""
    }
  }

  const getLinkIcon = (url: string) => {
    const host = getHost(url)
    return `https://unavatar.io/${host}?fallback=https://suki.icu/logo.svg`
  }

  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="bg-muted/30 border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">30日总访问</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                最近30天的总访问次数
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今日访问</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {data?.dailyStats[data.dailyStats.length - 1]?.clicks.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data ? formatDate(data.date) : '-'}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均每日</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {Math.round(totalClicks / 30).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                30天平均每日访问次数
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/analytics">
                      分析
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 text-white min-h-0">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-2">
            <h1 className="text-2xl font-bold tracking-tight">访问分析</h1>
            <div className="flex flex-wrap items-center gap-2">
              <DatePicker
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date)
                    const dateStr = getLocalDateString(date)
                    fetchAnalytics(dateStr)
                  }
                }}
                placeholder="选择日期"
                className="w-full sm:w-[180px] h-9"
                disabled={{ after: new Date() }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  setSelectedDate(today)
                  fetchAnalytics()
                }}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
          </div>

          {/* 错误状态 */}
          {hasError && !isLoading ? (
            <Empty className="bg-destructive/5 border-destructive/20 min-h-[400px]">
              <EmptyHeader>
                <EmptyMedia>
                  <AlertCircle className="size-10 text-destructive" />
                </EmptyMedia>
                <EmptyTitle>加载失败</EmptyTitle>
                <EmptyDescription>
                  获取分析数据时出现问题，可能是网络连接不稳定或KV绑定异常。
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={() => fetchAnalytics(selectedDate ? getLocalDateString(selectedDate) : undefined)}>
                  重试加载
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="flex flex-col gap-4 h-full">
              
              <div className="w-full flex-shrink-0">
                {renderSummaryCards()}
              </div>

              <Card className="bg-muted/30 border-none w-full flex-shrink-0">
                <CardHeader>
                  <CardTitle>最近30日访问趋势</CardTitle>
                  <CardDescription>显示所有链接的每日总访问次数</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[200px] sm:h-[250px] lg:h-[300px] w-full" />
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] lg:h-[300px] w-full">
                      <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                          left: 12,
                          right: 12,
                          top: 12,
                          bottom: 12,
                        }}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => value}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="line" />}
                        />
                        <Area
                          dataKey="visits"
                          type="natural"
                          fill="var(--color-visits)"
                          fillOpacity={0.3}
                          stroke="var(--color-visits)"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-none w-full">
                <CardHeader className="flex-shrink-0">
                  {isLoading ? (
                     <Skeleton className="h-6 w-48" />
                  ) : (
                    <>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        {data ? formatDate(selectedDate ? getLocalDateString(selectedDate) : data.date) : ''} 链接访问排行
                      </CardTitle>
                      <CardDescription>当日访问次数最多的链接</CardDescription>
                    </>
                  )}
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : data?.linkRankings.length === 0 ? (
                    <Empty className="bg-transparent border-none min-h-[200px]">
                      <EmptyHeader>
                        <EmptyTitle>暂无数据</EmptyTitle>
                        <EmptyDescription>
                          还没有访问记录
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <div className="space-y-2">
                      {data?.linkRankings.map((link) => (
                        <div
                          key={link.slug}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={getLinkIcon(link.url)} alt={link.slug} />
                              <AvatarFallback>{link.slug[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                <span className="font-semibold text-sm truncate">
                                  {typeof window !== "undefined" ? window.location.host : ""}/{link.slug}
                                </span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {link.clicks} 次访问
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {link.url}
                              </p>
                            </div>
                          </div>
                          <div className="w-full sm:w-32 shrink-0">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all rounded-full"
                                style={{
                                  width: `${(link.clicks / (data.linkRankings[0]?.clicks || 1)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
