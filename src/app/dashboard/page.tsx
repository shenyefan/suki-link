"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { LinkCard } from "@/components/dashboard/link-card"
import { LinkSearch } from "@/components/dashboard/link-search"
import { LinkEditor } from "@/components/dashboard/link-editor"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { AlertCircle, Plus, Search } from "lucide-react"
import { api } from "@/lib/api-client"
import { getAuthToken } from "@/lib/auth"

export interface Link {
  slug: string
  url: string
  comment?: string
  createdAt: number
  updatedAt?: number
  expiration?: number
}


export default function Page() {
  const [links, setLinks] = useState<Link[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "slug_asc" | "slug_desc">("latest")

  const router = useRouter()
  const observerTarget = React.useRef(null)

  // 检查登录状态
  React.useEffect(() => {
    if (!getAuthToken()) {
      router.push("/login")
    }
  }, [router])

  const fetchLinks = React.useCallback(async (nextCursor: string | null = null, reset: boolean = false) => {
    setIsLoading(true)
    setHasError(false)
    try {
      const url = new URL('/api/links', window.location.origin)
      url.searchParams.set('limit', '30')
      if (nextCursor) {
        url.searchParams.set('cursor', nextCursor)
      }

      const body = await api.get<{ links: Link[], cursor: string, list_complete: boolean }>(url.toString())

      if (body.code === 200) {
        const newLinks = body.data?.links || []
        if (reset) {
          setLinks(newLinks)
        } else {
          setLinks(prev => {
            // Avoid duplicates
            const existingSlugs = new Set(prev.map(l => l.slug))
            const uniqueNewLinks = newLinks.filter(l => !existingSlugs.has(l.slug))
            return [...prev, ...uniqueNewLinks]
          })
        }
        setCursor(body.data?.cursor || null)
        setHasMore(!body.data?.list_complete)
      } else {
        console.error("API error:", body.msg)
        setHasError(true)
        setHasMore(false)
        toast.error("加载失败", {
          description: body.msg || "获取短链列表时出错"
        })
      }
    } catch (err) {
      console.error("Failed to fetch links:", err)
      setHasError(true)
      setHasMore(false)
      toast.error("加载失败", {
        description: "请检查网络连接或稍后重试"
      })
    } finally {
      setIsLoading(false)
      setIsInitialLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchLinks(null, true)
  }, [fetchLinks])

  // Infinite Scroll Observer
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isInitialLoading) {
          fetchLinks(cursor)
        }
      },
      { threshold: 1.0 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoading, isInitialLoading, cursor, fetchLinks])

  const filteredAndSortedLinks = React.useMemo(() => {
    let result = [...links]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(link =>
        link.slug.toLowerCase().includes(term) ||
        (link.url || "").toLowerCase().includes(term) ||
        (link.comment || "").toLowerCase().includes(term)
      )
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (a.createdAt || 0) - (b.createdAt || 0)
        case "slug_asc":
          return a.slug.localeCompare(b.slug)
        case "slug_desc":
          return b.slug.localeCompare(a.slug)
        case "latest":
        default:
          return (b.createdAt || 0) - (a.createdAt || 0)
      }
    })

    return result
  }, [links, searchTerm, sortBy])

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
                  <BreadcrumbLink href="/dashboard">
                    仪表盘
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-2">
            <h1 className="text-2xl font-bold tracking-tight">所有短链</h1>
            <div className="flex items-center gap-2">
              <LinkSearch onSearch={setSearchTerm} />
              <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                <SelectTrigger className="w-[140px] h-9 text-white bg-background border-input">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">最新</SelectItem>
                  <SelectItem value="oldest">最旧</SelectItem>
                  <SelectItem value="slug_asc">短链 (A-Z)</SelectItem>
                  <SelectItem value="slug_desc">短链 (Z-A)</SelectItem>
                </SelectContent>
              </Select>
              <LinkEditor onSuccess={() => fetchLinks(null, true)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isInitialLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[120px] rounded-xl bg-muted/50 animate-pulse" />
              ))
            ) : (
              filteredAndSortedLinks.map((link) => (
                <LinkCard key={link.slug} link={link} onDelete={() => fetchLinks(null, true)} />
              ))
            )}
          </div>

          {!isLoading && !isInitialLoading && hasMore && (
            <div ref={observerTarget} className="flex justify-center p-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {!isInitialLoading && filteredAndSortedLinks.length === 0 && !hasError && (
            <Empty className="bg-muted/30 border-none min-h-[400px]">
              <EmptyHeader>
                <EmptyMedia>
                  <Search className="size-10 text-muted-foreground/50" />
                </EmptyMedia>
                <EmptyTitle>{searchTerm ? "未找到结果" : "暂无短链"}</EmptyTitle>
                <EmptyDescription>
                  {searchTerm
                    ? `没有找到匹配 "${searchTerm}" 的短链，请更改关键词再试。`
                    : "您还没有创建任何短链。点击按钮开始您的第一个短链吧！"}
                </EmptyDescription>
              </EmptyHeader>
              {!searchTerm && (
                <EmptyContent>
                  <LinkEditor
                    onSuccess={() => fetchLinks(null, true)}
                    trigger={
                      <Button>
                        <Plus className="mr-2 size-4" />
                        创建短链
                      </Button>
                    }
                  />
                </EmptyContent>
              )}
            </Empty>
          )}

          {hasError && (
            <Empty className="bg-destructive/5 border-destructive/20 min-h-[400px]">
              <EmptyHeader>
                <EmptyMedia>
                  <AlertCircle className="size-10 text-destructive" />
                </EmptyMedia>
                <EmptyTitle>加载失败</EmptyTitle>
                <EmptyDescription>
                  获取短链列表时出现问题，可能是网络连接不稳定或KV绑定异常。
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={() => fetchLinks(cursor)}>
                  重试加载
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
