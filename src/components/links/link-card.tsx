'use client'

import { useState } from 'react'
import {
  Calendar,
  Copy,
  ExternalLink,
  Hourglass,
  MoreVertical,
  Pencil,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
    createTime?: string
    updateTime?: string
  }
  onDelete: (slug: string) => void
  onEdit: (slug: string) => void
}

export function LinkCard({ link, onDelete, onEdit }: LinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [now] = useState(() => Date.now() / 1000)
  const toast = useToast()

  const host = (() => {
    try {
      return new URL(link.url).hostname
    } catch {
      return link.url
    }
  })()

  const shortUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${link.slug}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = shortUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    toast.success('已复制短链', shortUrl)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await apiJson('/api/link/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: link.slug }),
      })
      onDelete(link.slug)
      setShowDeleteDialog(false)
      toast.success('短链已删除', link.slug)
    } catch (err) {
      toast.error('删除失败', err instanceof Error ? err.message : '操作失败')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const isExpired = link.expiration && link.expiration < now

  return (
    <>
      <Card className="group relative h-full transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col p-4">
          {/* Header: Avatar + Slug + Actions */}
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage
                src={`https://unavatar.webp.se/${host}?fallback=true`}
                alt={host}
              />
              <AvatarFallback>{host.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate text-sm font-semibold">
                      {host}/{link.slug}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{shortUrl}</TooltipContent>
                </Tooltip>
                {link.unsafe && (
                  <Badge variant="destructive" className="h-5 px-1.5">
                    <span className="sr-only">不安全</span>
                    !
                  </Badge>
                )}
              </div>
              {link.comment && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {link.comment}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>{link.comment}</TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => void handleCopy()}
                  >
                    {copied ? (
                      <Copy className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span className="sr-only">复制链接</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? '已复制' : '复制链接'}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="sr-only">打开原链接</span>
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>打开原链接</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-3.5 w-3.5" />
                    <span className="sr-only">更多操作</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(link.slug)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-auto space-y-2 pt-3">
            <Separator />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {link.createTime && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(link.createTime).toLocaleDateString('zh-CN')}</span>
                </div>
              )}
              {link.expiration && (
                <div className="flex items-center gap-1">
                  <Hourglass className="h-3 w-3" />
                  <span className={isExpired ? 'text-destructive' : ''}>
                    {formatDate(link.expiration)}
                    {isExpired && ' (已过期)'}
                  </span>
                </div>
              )}
              {link.password && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  密码
                </Badge>
              )}
              {link.cloaking && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  遮蔽
                </Badge>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="truncate text-xs text-muted-foreground">{link.url}</p>
              </TooltipTrigger>
              <TooltipContent>{link.url}</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除短链 <span className="font-mono font-medium">{link.slug}</span> 吗？
              此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
