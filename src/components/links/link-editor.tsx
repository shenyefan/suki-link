'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronDown, ChevronDownIcon, Eye, EyeOff, Settings2, Shuffle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { apiJson } from '@/manage/api'

interface LinkEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slug?: string
  onSuccess: () => void
}

export function LinkEditor({ open, onOpenChange, slug, onSuccess }: LinkEditorProps) {
  const isEdit = !!slug
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const toast = useToast()

  const [url, setUrl] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [comment, setComment] = useState('')
  const [expirationDate, setExpirationDate] = useState<Date | undefined>()
  const [expirationTime, setExpirationTime] = useState('')
  const [redirectWithQuery, setRedirectWithQuery] = useState(false)
  const [cloaking, setCloaking] = useState(false)
  const [password, setPassword] = useState('')

  // Check if any advanced option is set
  const hasAdvancedOptions = expirationDate || redirectWithQuery || cloaking || password
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (!open) return
    window.queueMicrotask(() => {
      setShowPassword(false)
      setDatePickerOpen(false)
    })
    
    if (isEdit && slug) {
      window.queueMicrotask(() => setLoading(true))
      apiJson<Record<string, unknown>>(`/api/links/${encodeURIComponent(slug)}`)
        .then((data) => {
          setUrl(String(data.url ?? ''))
          setCustomSlug(String(data.slug ?? ''))
          setComment(typeof data.comment === 'string' ? data.comment : '')
          setRedirectWithQuery(data.redirectWithQuery === true)
          setCloaking(data.cloaking === true)
          setPassword(typeof data.password === 'string' ? data.password : '')
          
          if (typeof data.expiration === 'number' && data.expiration > 0) {
            const d = new Date(data.expiration * 1000)
            setExpirationDate(d)
            const pad = (n: number) => String(n).padStart(2, '0')
            setExpirationTime(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`)
          } else {
            setExpirationDate(undefined)
            setExpirationTime('')
          }
          
          // Auto-show advanced if any option is set
          const hasAdvanced = data.redirectWithQuery || data.cloaking || data.password || data.expiration
          setShowAdvanced(!!hasAdvanced)
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : '加载失败'
          toast.error('加载短链失败', message)
        })
        .finally(() => setLoading(false))
    } else {
      window.queueMicrotask(() => {
        setUrl('')
        setCustomSlug('')
        setComment('')
        setExpirationDate(undefined)
        setExpirationTime('')
        setRedirectWithQuery(false)
        setCloaking(false)
        setPassword('')
        setShowAdvanced(false)
      })
    }
  }, [open, isEdit, slug, toast])

  const generateSlug = () => {
    const chars = '23456789abcdefghjkmnpqrstuvwxyz'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCustomSlug(result)
  }

  const getExpirationTimestamp = (): number | undefined => {
    if (!expirationDate) return undefined
    const d = new Date(expirationDate)
    if (expirationTime) {
      const parts = expirationTime.split(':')
      d.setHours(
        parseInt(parts[0]) || 0,
        parseInt(parts[1]) || 0,
        parseInt(parts[2]) || 0,
        0
      )
    } else {
      d.setHours(23, 59, 59, 0)
    }
    return Math.floor(d.getTime() / 1000)
  }

  const handleSubmit = async () => {
    if (!url) return

    setLoading(true)

    try {
      const body: Record<string, unknown> = { url: url.trim() }
      
      if (isEdit) {
        body.slug = customSlug.trim() || slug
      } else if (customSlug.trim()) {
        body.slug = customSlug.trim()
      }
      
      if (comment.trim()) body.comment = comment.trim()
      const expTimestamp = getExpirationTimestamp()
      if (expTimestamp) body.expiration = expTimestamp
      if (redirectWithQuery) body.redirectWithQuery = true
      if (cloaking) body.cloaking = true
      if (password) body.password = password

      const endpoint = isEdit ? `/api/links/${encodeURIComponent(slug)}` : '/api/links'
      const method = isEdit ? 'PUT' : 'POST'
      await apiJson(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      toast.success(isEdit ? '短链已更新' : '短链已创建', customSlug.trim() || slug || url)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败'
      toast.error(isEdit ? '更新失败' : '创建失败', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? '编辑短链' : '创建短链'}
      description={isEdit ? '修改短链配置' : '填写信息创建新的短链接'}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={() => void handleSubmit()} disabled={loading || !url}>
            {loading ? '保存中...' : isEdit ? '保存' : '创建'}
          </Button>
        </div>
      }
    >
      <ScrollArea className="max-h-[70vh]">
        <div className="space-y-4 pr-4">
          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">
              目标 URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">自定义短链</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                placeholder="留空自动生成"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="flex-1"
              />
              {!isEdit && (
                <Button type="button" variant="outline" size="icon" onClick={generateSlug} title="随机生成">
                  <Shuffle className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isEdit && (
              <p className="text-xs text-muted-foreground">修改短链标识会导致链接地址变化</p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">备注</Label>
            <Textarea
              id="comment"
              placeholder="可选备注信息"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
          </div>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="space-y-4">
            <div className="space-y-2">
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-full justify-between px-0 hover:bg-transparent"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Settings2 className="h-4 w-4" />
                    高级选项
                    {hasAdvancedOptions && (
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                        已设置
                      </span>
                    )}
                  </span>
                  <ChevronDown className={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')} />
                </Button>
              </CollapsibleTrigger>
              <p className="text-xs text-muted-foreground">过期时间、查询参数、遮蔽和密码保护</p>
            </div>

            <CollapsibleContent className="space-y-4">
              <Separator />

              <div className="space-y-2">
                <Label>过期时间</Label>
                <div className="grid gap-2 sm:grid-cols-[1fr_112px]">
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'flex-1 justify-start font-normal',
                          !expirationDate && 'text-muted-foreground',
                        )}
                      >
                        <ChevronDownIcon className="mr-2 h-4 w-4" />
                        {expirationDate ? format(expirationDate, 'PPP', { locale: zhCN }) : '选择日期'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expirationDate}
                        captionLayout="dropdown"
                        defaultMonth={expirationDate}
                        disabled={(date) => date < new Date()}
                        onSelect={(date) => {
                          setExpirationDate(date)
                          setDatePickerOpen(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    id="time-picker"
                    step="1"
                    value={expirationTime}
                    onChange={(e) => setExpirationTime(e.target.value)}
                    className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">留空则永不过期</p>
                  {expirationDate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground"
                      onClick={() => {
                        setExpirationDate(undefined)
                        setExpirationTime('')
                      }}
                    >
                      清除
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="redirectWithQuery">转发查询参数</Label>
                  <p className="text-xs text-muted-foreground">将查询参数转发到目标 URL</p>
                </div>
                <Switch id="redirectWithQuery" checked={redirectWithQuery} onCheckedChange={setRedirectWithQuery} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="cloaking">链接遮蔽</Label>
                  <p className="text-xs text-muted-foreground">在地址栏显示短链地址</p>
                </div>
                <Switch id="cloaking" checked={cloaking} onCheckedChange={setCloaking} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码保护</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="留空不设密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? '隐藏密码' : '显示密码'}</span>
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

        </div>
      </ScrollArea>
    </ResponsiveModal>
  )
}
