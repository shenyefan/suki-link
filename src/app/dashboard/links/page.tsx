'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowDownAZ,
  ArrowDownZA,
  ArrowUpDown,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Hourglass,
  Link as LinkIcon,
  LockKeyhole,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  QrCode,
  Search,
  ShieldAlert,
  SquareMousePointer,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { LinkEditor } from '@/components/links/link-editor'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/toast'
import { apiJson } from '@/lib/dashboard-api'

type LinkData = {
  slug: string
  url: string
  comment?: string
  createdAt?: number
  expiration?: number
  unsafe?: boolean
  password?: string
  cloaking?: boolean
  redirectWithQuery?: boolean
  createTime?: string
  updateTime?: string
}

type ListPayload = {
  links: LinkData[]
  list_complete: boolean
  cursor?: string
}

type SortOption = 'newest' | 'oldest' | 'az' | 'za'

const sortOptions: Array<{ value: SortOption; label: string; icon: LucideIcon }> = [
  { value: 'newest', label: '最新创建', icon: ArrowUpDown },
  { value: 'oldest', label: '最早创建', icon: ArrowUpDown },
  { value: 'az', label: 'A 到 Z', icon: ArrowDownAZ },
  { value: 'za', label: 'Z 到 A', icon: ArrowDownZA },
]

function formatDate(timestamp?: number) {
  if (!timestamp) return null
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatIsoDate(value?: string) {
  if (!value) return null
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function linkOrigin() {
  return typeof window === 'undefined' ? '' : window.location.origin
}

function getTargetHost(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function getShortHost() {
  if (typeof window === 'undefined') return 'Suki-Link'
  return window.location.host
}

function LinkCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-[146px] rounded-lg" />
      ))}
    </div>
  )
}

export default function DashboardLinksPage() {
  const router = useRouter()
  const [rows, setRows] = useState<LinkData[]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [complete, setComplete] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editSlug, setEditSlug] = useState<string | undefined>(undefined)
  const [deleteSlug, setDeleteSlug] = useState<string | undefined>(undefined)
  const [deleting, setDeleting] = useState(false)
  const [copiedSlug, setCopiedSlug] = useState<string | undefined>(undefined)
  const [now] = useState(() => Date.now() / 1000)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const toast = useToast()

  const load = useCallback(async (next?: string) => {
    if (next) setLoadingMore(true)
    else setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ limit: '24', sort })
      if (next) params.set('cursor', next)
      if (search.trim()) params.set('search', search.trim())
      const data = await apiJson<ListPayload>(`/api/links?${params}`)

      setRows((prev) => (next ? [...prev, ...data.links] : data.links))
      setComplete(data.list_complete)
      setCursor(data.cursor)
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载失败'
      setError(message)
      toast.error('加载短链失败', message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [search, sort, toast])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 220)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || complete || !cursor || loading || loadingMore) return

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting))
        void load(cursor)
    }, {
      rootMargin: '240px',
    })

    observer.observe(target)
    return () => observer.disconnect()
  }, [complete, cursor, load, loading, loadingMore])

  const sortLabel = useMemo(
    () => sortOptions.find((item) => item.value === sort)?.label ?? '排序',
    [sort],
  )

  const openCreate = () => {
    setEditSlug(undefined)
    setEditorOpen(true)
  }

  const copyLink = async (slug: string) => {
    const shortUrl = `${linkOrigin()}/${slug}`
    await navigator.clipboard.writeText(shortUrl)
    setCopiedSlug(slug)
    window.setTimeout(() => setCopiedSlug(undefined), 1400)
    toast.success('已复制短链', shortUrl)
  }

  const openMonitoring = (slug: string) => {
    router.push(`/dashboard/monitoring?slug=${encodeURIComponent(slug)}`)
  }

  const deleteLink = async () => {
    if (!deleteSlug) return
    setDeleting(true)
    try {
      await apiJson(`/api/links/${encodeURIComponent(deleteSlug)}`, {
        method: 'DELETE',
      })
      setRows((prev) => prev.filter((row) => row.slug !== deleteSlug))
      toast.success('短链已删除', deleteSlug)
      setDeleteSlug(undefined)
    } catch (err) {
      toast.error('删除失败', err instanceof Error ? err.message : '操作失败')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Header fixed>
        <Breadcrumb className="me-auto min-w-0">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard/links">Suki-Link</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>短链</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="relative hidden w-56 md:block">
          <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="过滤短链..."
            className="h-9 ps-8"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-1 top-1/2 size-7 -translate-y-1/2"
              onClick={() => setSearch('')}
            >
              <X className="size-4" />
              <span className="sr-only">清空搜索</span>
            </Button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 justify-start gap-2">
              <ArrowUpDown className="size-4" />
              <span className="hidden sm:inline">{sortLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {sortOptions.map((item) => (
              <DropdownMenuItem key={item.value} onClick={() => setSort(item.value)}>
                <item.icon className="size-4" />
                {item.label}
                {sort === item.value && <Check className="ms-auto size-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button className="h-9 space-x-1" onClick={openCreate}>
          <span className="hidden sm:inline">创建</span>
          <Plus size={18} />
        </Button>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
      <div className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="relative w-full md:hidden">
            <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="过滤短链..."
              className="h-9 ps-8"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute end-1 top-1/2 size-7 -translate-y-1/2"
                onClick={() => setSearch('')}
              >
                <X className="size-4" />
                <span className="sr-only">清空搜索</span>
              </Button>
            )}
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <LinkCardsSkeleton />
        ) : rows.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((link) => {
                  const created = formatIsoDate(link.createTime)
                  const expiration = formatDate(link.expiration)
                  const expired = Boolean(link.expiration && link.expiration < now)
                  const targetHost = getTargetHost(link.url)
                  const shortUrl = `${linkOrigin()}/${link.slug}`
                  const shortHost = getShortHost()

                  return (
                    <Card
                      key={link.slug}
                      role="button"
                      tabIndex={0}
                      className="group h-full cursor-pointer gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md"
                      onClick={() => openMonitoring(link.slug)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openMonitoring(link.slug)
                        }
                      }}
                    >
                      <CardContent className="flex h-full min-h-32 flex-col p-6">
                        <div className="flex items-center justify-center gap-3">
                          <Avatar className="size-8 shrink-0 rounded-md">
                            <AvatarImage
                              src={`https://unavatar.webp.se/${targetHost}?fallback=https://sink.cool/icon.png`}
                              alt={targetHost}
                            />
                            <AvatarFallback className="rounded-md">{targetHost.slice(0, 1).toUpperCase()}</AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex min-w-0 items-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="truncate text-sm font-medium leading-5">
                                    {shortHost}/{link.slug}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent>{shortUrl}</TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="mt-1 flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                              {link.redirectWithQuery && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="px-1.5">
                                      <LinkIcon className="size-3" />
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>转发查询参数</TooltipContent>
                                </Tooltip>
                              )}
                              {link.cloaking && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="px-1.5">
                                      <SquareMousePointer className="size-3" />
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>链接遮蔽</TooltipContent>
                                </Tooltip>
                              )}
                              {link.password && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="px-1.5">
                                      <LockKeyhole className="size-3" />
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>密码保护</TooltipContent>
                                </Tooltip>
                              )}
                              {link.unsafe && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="px-1.5">
                                      <ShieldAlert className="size-3" />
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>确认跳转</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    void copyLink(link.slug)
                                  }}
                                >
                                  {copiedSlug === link.slug ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                                  <span className="sr-only">复制短链</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{copiedSlug === link.slug ? '已复制' : '复制短链'}</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7" asChild>
                                  <a href={link.url} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>
                                    <ExternalLink className="size-4" />
                                    <span className="sr-only">打开原链接</span>
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>打开原链接</TooltipContent>
                            </Tooltip>

                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7" onClick={(event) => event.stopPropagation()}>
                                  <QrCode className="size-4" />
                                  <span className="sr-only">二维码</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-auto p-4">
                                <QRCodeSVG value={shortUrl} size={156} marginSize={2} />
                              </PopoverContent>
                            </Popover>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7" onClick={(event) => event.stopPropagation()}>
                                  <MoreHorizontal className="size-4" />
                                  <span className="sr-only">打开菜单</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setEditSlug(link.slug)
                                    setEditorOpen(true)
                                  }}
                                >
                                  <Pencil className="size-4" />
                                  编辑
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setDeleteSlug(link.slug)
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {link.comment && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{link.comment}</p>
                            </TooltipTrigger>
                            <TooltipContent>{link.comment}</TooltipContent>
                          </Tooltip>
                        )}

                        <div className="mt-auto flex min-w-0 items-center gap-3 pt-3 text-xs text-muted-foreground">
                          <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
                            {created && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="size-3.5" />
                                {created}
                              </span>
                            )}
                            {expiration && (
                              <span className={expired ? 'inline-flex items-center gap-1 text-destructive' : 'inline-flex items-center gap-1'}>
                                <Hourglass className="size-3.5" />
                                {expiration}
                              </span>
                            )}
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex min-w-0 flex-1 items-center gap-1">
                                <ExternalLink className="size-3.5 shrink-0" />
                                <span className="truncate">{link.url}</span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{link.url}</TooltipContent>
                          </Tooltip>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
          </div>
        ) : (
          <div className="flex min-h-[280px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            {search ? '没有找到匹配的短链。' : '还没有短链。'}
          </div>
        )}

        {!complete && cursor && (
          <div ref={loadMoreRef} className="flex min-h-10 items-center justify-center text-sm text-muted-foreground">
            {loadingMore ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                加载中
              </span>
            ) : (
              '继续向下滚动加载更多'
            )}
          </div>
        )}
      </div>
      </Main>

      <LinkEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        slug={editSlug}
        onSuccess={() => void load()}
      />

      <Dialog open={!!deleteSlug} onOpenChange={(open) => !open && setDeleteSlug(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除短链</DialogTitle>
            <DialogDescription>
              删除 {deleteSlug} 后无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setDeleteSlug(undefined)}>
              取消
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void deleteLink()}>
              {deleting ? '删除中' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
