'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowUpDown, Link2Off, Loader2, Plus, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { LinkCard } from '@/components/links/link-card'
import { LinkEditor } from '@/components/links/link-editor'
import { useToast } from '@/components/ui/toast'
import { apiJson } from '@/manage/api'

type LinkData = {
  slug: string
  url: string
  comment?: string
  createdAt?: number
  expiration?: number
  unsafe?: boolean
  createTime?: string
  updateTime?: string
}

type ListPayload = {
  links: LinkData[]
  list_complete: boolean
  cursor?: string
}

type SortOption = 'newest' | 'oldest' | 'az' | 'za'

export default function LinksManagePage() {
  const [rows, setRows] = useState<LinkData[]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [complete, setComplete] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const toast = useToast()

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false)
  const [editSlug, setEditSlug] = useState<string | undefined>(undefined)

  const load = useCallback(async (next?: string) => {
    if (next) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '24', sort })
      if (next) params.set('cursor', next)
      if (search.trim()) params.set('search', search.trim())
      const data = await apiJson<ListPayload>(`/api/links?${params}`)
      const nextRows = data.links
      setRows(prev => (next ? [...prev, ...nextRows] : nextRows))
      setComplete(data.list_complete)
      setCursor(data.cursor)
    } catch (e) {
      const message = e instanceof Error ? e.message : '加载失败'
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
    }, 250)
    return () => window.clearTimeout(timer)
  }, [load])

  const handleDelete = (slug: string) => {
    setRows(prev => prev.filter(r => r.slug !== slug))
  }

  const handleEdit = (slug: string) => {
    setEditSlug(slug)
    setEditorOpen(true)
  }

  const handleCreate = () => {
    setEditSlug(undefined)
    setEditorOpen(true)
  }

  const handleEditorSuccess = () => {
    void load()
  }

  return (
    <div className="flex min-h-[calc(100vh-6.5rem)] flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">短链</h1>
          <p className="text-sm text-muted-foreground">管理你的短链接</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          创建
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索短链..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearch('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">最新创建</SelectItem>
            <SelectItem value="oldest">最早创建</SelectItem>
            <SelectItem value="az">A → Z</SelectItem>
            <SelectItem value="za">Z → A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => void load()}>
            重试
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-lg" />
          ))}
        </div>
      )}

      {/* Links Grid */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((link) => (
            <LinkCard
              key={link.slug}
              link={link}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && rows.length === 0 && !error && (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <Link2Off className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">
            {search ? '没有找到匹配的短链' : '还没有短链'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search ? '换个关键词试试，搜索会覆盖全部分页数据。' : '创建后会显示在这里。'}
          </p>
          {!search && (
            <Button variant="outline" className="mt-4" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              创建第一个短链
            </Button>
          )}
        </div>
      )}

      {/* Load More */}
      {!complete && cursor && (
        <div className="flex justify-center">
          <Button variant="outline" disabled={loadingMore} onClick={() => void load(cursor)}>
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                加载中...
              </>
            ) : (
              '加载更多'
            )}
          </Button>
        </div>
      )}

      {/* Complete */}
      {complete && rows.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          已加载全部 {rows.length} 条短链
        </p>
      )}

      {/* Link Editor Modal */}
      <LinkEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        slug={editSlug}
        onSuccess={handleEditorSuccess}
      />
    </div>
  )
}
