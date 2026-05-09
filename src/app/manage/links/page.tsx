'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownAZ, ArrowDownZA, ArrowUpDown, Check, Link2Off, Loader2, Plus, Search, X, type LucideIcon } from 'lucide-react'

import { LinkCard } from '@/components/links/link-card'
import { LinkEditor } from '@/components/links/link-editor'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { apiJson } from '@/manage/api'
import { useManageHeaderActions } from '@/manage/ManageShell'

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

function LinksSearch({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)

  const submit = () => {
    onChange(draft.trim())
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setDraft(value)
        setOpen(nextOpen)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="size-8">
          <Search className="size-4" />
          <span className="sr-only">搜索</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-4 py-3 text-left">
          <DialogTitle className="text-base">搜索短链</DialogTitle>
          <DialogDescription>输入短链、备注或目标地址</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit()
            }}
            placeholder="搜索..."
            className="border-0 px-0 shadow-none focus-visible:ring-0"
          />
          {draft && (
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setDraft('')}>
              <X className="size-4" />
              <span className="sr-only">清空</span>
            </Button>
          )}
        </div>
        <div className="flex justify-end gap-2 p-4">
          <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={submit}>搜索</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LinksSort({
  value,
  onChange,
}: {
  value: SortOption
  onChange: (value: SortOption) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="size-8">
          <ArrowUpDown className="size-4" />
          <span className="sr-only">排序</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sortOptions.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onChange(option.value)}>
            <option.icon className="size-4" />
            {option.label}
            {value === option.value && <Check className="ml-auto size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function LinksManagePage() {
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

  const openCreate = () => {
    setEditSlug(undefined)
    setEditorOpen(true)
  }

  const headerActions = useMemo(() => (
    <>
      <LinkEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        slug={editSlug}
        onSuccess={() => void load()}
        trigger={(
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">创建</span>
          </Button>
        )}
      />
      <LinksSort value={sort} onChange={setSort} />
      <LinksSearch value={search} onChange={setSearch} />
    </>
  ), [editSlug, editorOpen, load, search, sort])

  useManageHeaderActions(headerActions)

  return (
    <div className="grid gap-4">
      {search && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>搜索：{search}</span>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setSearch('')}>
            <X className="size-4" />
            <span className="sr-only">清除搜索</span>
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>
            重试
          </Button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[178px] rounded-lg" />
          ))}
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((link) => (
            <LinkCard
              key={link.slug}
              link={link}
              onDelete={(slug) => setRows((prev) => prev.filter((row) => row.slug !== slug))}
              onEdit={(slug) => {
                setEditSlug(slug)
                setEditorOpen(true)
              }}
            />
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && !error && (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-muted">
            <Link2Off className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{search ? '没有找到短链' : '暂无短链'}</p>
          <p className="mt-1 text-sm text-muted-foreground">{search ? '换个关键词再试试。' : '创建后会显示在这里。'}</p>
          {!search && (
            <Button variant="outline" className="mt-4" onClick={openCreate}>
              <Plus className="size-4" />
              创建短链
            </Button>
          )}
        </div>
      )}

      {!complete && cursor && (
        <div className="flex justify-center py-2">
          <Button variant="outline" disabled={loadingMore} onClick={() => void load(cursor)}>
            {loadingMore ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                加载中
              </>
            ) : (
              '加载更多'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
