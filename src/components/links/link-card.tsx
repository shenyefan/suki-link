'use client'

import { useMemo, useState } from 'react'
import {
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Hourglass,
  LockKeyhole,
  MoreVertical,
  Pencil,
  ShieldAlert,
  SquareMousePointer,
  Trash2,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/toast'
import { apiJson } from '@/manage/api'

interface LinkCardProps {
  link: {
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
  onDelete: (slug: string) => void
  onEdit: (slug: string) => void
}

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

export function LinkCard({ link, onDelete, onEdit }: LinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [now] = useState(() => Date.now() / 1000)
  const toast = useToast()

  const targetHost = useMemo(() => {
    try {
      return new URL(link.url).hostname
    } catch {
      return link.url
    }
  }, [link.url])

  const shortHost = typeof window !== 'undefined'
    ? window.location.host
    : 'suki.icu'
  const shortUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${link.slug}`
    : `/${link.slug}`
  const isExpired = Boolean(link.expiration && link.expiration < now)

  const copyShortUrl = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl)
    } catch {
      const input = document.createElement('input')
      input.value = shortUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
    toast.success('已复制短链', shortUrl)
  }

  const deleteLink = async () => {
    setDeleting(true)
    try {
      await apiJson(`/api/links/${encodeURIComponent(link.slug)}`, {
        method: 'DELETE',
      })
      onDelete(link.slug)
      setDeleteOpen(false)
      toast.success('短链已删除', link.slug)
    } catch (err) {
      toast.error('删除失败', err instanceof Error ? err.message : '操作失败')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="flex h-full min-h-[178px] flex-col p-4">
          <div className="flex items-start gap-3">
            <Avatar className="size-9 shrink-0 rounded-md">
              <AvatarImage
                src={`https://unavatar.webp.se/${targetHost}?fallback=https://sink.cool/icon.png`}
                alt={targetHost}
              />
              <AvatarFallback className="rounded-md">{targetHost.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="truncate text-sm font-medium">
                      {shortHost}/{link.slug}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>{shortUrl}</TooltipContent>
                </Tooltip>
                {link.unsafe && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ShieldAlert className="size-4 shrink-0 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>确认跳转</TooltipContent>
                  </Tooltip>
                )}
              </div>
              {link.comment && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{link.comment}</p>
                  </TooltipTrigger>
                  <TooltipContent>{link.comment}</TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => void copyShortUrl()}>
                    {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                    <span className="sr-only">复制短链</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? '已复制' : '复制短链'}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8" asChild>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" />
                      <span className="sr-only">打开原链接</span>
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>打开原链接</TooltipContent>
              </Tooltip>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">更多</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-40 p-1">
                  <Button variant="ghost" className="h-8 w-full justify-start gap-2 px-2" onClick={() => onEdit(link.slug)}>
                    <Pencil className="size-4" />
                    编辑
                  </Button>
                  <Separator className="my-1" />
                  <Button
                    variant="ghost"
                    className="h-8 w-full justify-start gap-2 px-2 text-destructive hover:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-4" />
                    删除
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="mt-auto grid gap-2 pt-4 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {formatIsoDate(link.createTime) && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {formatIsoDate(link.createTime)}
                </span>
              )}
              {link.expiration && (
                <span className={isExpired ? 'inline-flex items-center gap-1 text-destructive' : 'inline-flex items-center gap-1'}>
                  <Hourglass className="size-3.5" />
                  {formatDate(link.expiration)}
                </span>
              )}
              {link.redirectWithQuery && (
                <Badge variant="secondary" className="h-5 rounded-sm px-1.5 text-xs">
                  Query
                </Badge>
              )}
              {link.cloaking && (
                <Badge variant="secondary" className="h-5 rounded-sm px-1.5 text-xs">
                  <SquareMousePointer className="size-3" />
                  遮蔽
                </Badge>
              )}
              {link.password && (
                <Badge variant="secondary" className="h-5 rounded-sm px-1.5 text-xs">
                  <LockKeyhole className="size-3" />
                  密码
                </Badge>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="truncate">{link.url}</p>
              </TooltipTrigger>
              <TooltipContent>{link.url}</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              删除短链 {link.slug} 后无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setDeleteOpen(false)}>
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
