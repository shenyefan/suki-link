'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronDownIcon, Eye, EyeOff, Shuffle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { apiJson } from '@/lib/dashboard-api'

interface LinkEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slug?: string
  onSuccess: () => void
  trigger?: ReactNode
}

function resetDate(date?: Date, time?: string) {
  if (!date) return undefined
  const next = new Date(date)
  if (time) {
    const [hour, minute, second] = time.split(':')
    next.setHours(Number(hour) || 0, Number(minute) || 0, Number(second) || 0, 0)
  } else {
    next.setHours(23, 59, 59, 0)
  }
  return Math.floor(next.getTime() / 1000)
}

export function LinkEditor({ open, onOpenChange, slug, onSuccess, trigger }: LinkEditorProps) {
  const isEdit = Boolean(slug)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [comment, setComment] = useState('')
  const [expirationDate, setExpirationDate] = useState<Date | undefined>()
  const [expirationTime, setExpirationTime] = useState('')
  const [redirectWithQuery, setRedirectWithQuery] = useState(false)
  const [cloaking, setCloaking] = useState(false)
  const [password, setPassword] = useState('')
  const [unsafe, setUnsafe] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!open) return

    window.queueMicrotask(() => {
      setShowPassword(false)
      setDateOpen(false)
    })

    if (!isEdit || !slug) {
      window.queueMicrotask(() => {
        setUrl('')
        setCustomSlug('')
        setComment('')
        setExpirationDate(undefined)
        setExpirationTime('')
        setRedirectWithQuery(false)
        setCloaking(false)
        setPassword('')
        setUnsafe(false)
      })
      return
    }

    window.queueMicrotask(() => setLoading(true))
    apiJson<Record<string, unknown>>(`/api/links/${encodeURIComponent(slug)}`)
      .then((data) => {
        setUrl(String(data.url ?? ''))
        setCustomSlug(String(data.slug ?? ''))
        setComment(typeof data.comment === 'string' ? data.comment : '')
        setRedirectWithQuery(data.redirectWithQuery === true)
        setCloaking(data.cloaking === true)
        setPassword(typeof data.password === 'string' ? data.password : '')
        setUnsafe(data.unsafe === true)

        if (typeof data.expiration === 'number' && data.expiration > 0) {
          const date = new Date(data.expiration * 1000)
          const pad = (value: number) => String(value).padStart(2, '0')
          setExpirationDate(date)
          setExpirationTime(`${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`)
        } else {
          setExpirationDate(undefined)
          setExpirationTime('')
        }
      })
      .catch((err) => {
        toast.error('加载短链失败', err instanceof Error ? err.message : '加载失败')
      })
      .finally(() => setLoading(false))
  }, [isEdit, open, slug, toast])

  const generateSlug = () => {
    const chars = '23456789abcdefghjkmnpqrstuvwxyz'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCustomSlug(result)
  }

  const submit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    try {
      const body: Record<string, unknown> = { url: url.trim() }
      if (isEdit) body.slug = customSlug.trim() || slug
      else if (customSlug.trim()) body.slug = customSlug.trim()
      if (comment.trim()) body.comment = comment.trim()
      const expiration = resetDate(expirationDate, expirationTime)
      if (expiration) body.expiration = expiration
      if (redirectWithQuery) body.redirectWithQuery = true
      if (cloaking) body.cloaking = true
      if (password) body.password = password
      if (unsafe) body.unsafe = true

      const endpoint = isEdit && slug ? `/api/links/${encodeURIComponent(slug)}` : '/api/links'
      await apiJson(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      })

      toast.success(isEdit ? '短链已更新' : '短链已创建')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(isEdit ? '更新失败' : '创建失败', err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {trigger}
      <Sheet
        open={open}
        onOpenChange={(value) => {
          onOpenChange(value)
        }}
      >
        <SheetContent className="flex flex-col sm:max-w-xl">
          <SheetHeader className="text-start">
            <SheetTitle>{isEdit ? '编辑短链' : '创建短链'}</SheetTitle>
            <SheetDescription>
              {isEdit ? '修改短链的目标地址和访问策略。' : '创建一个新的短链接并配置访问策略。'}
            </SheetDescription>
          </SheetHeader>

          <form
            id="link-editor-form"
            onSubmit={(event) => void submit(event)}
            className="flex-1 space-y-6 overflow-y-auto px-4"
          >
            <div className="space-y-2">
              <Label htmlFor="link-url">目标 URL</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-slug">短链标识</Label>
              <div className="flex gap-2">
                <Input
                  id="link-slug"
                  placeholder="留空自动生成"
                  value={customSlug}
                  onChange={(event) => setCustomSlug(event.target.value)}
                />
                {!isEdit && (
                  <Button type="button" variant="outline" size="icon" onClick={generateSlug}>
                    <Shuffle className="size-4" />
                    <span className="sr-only">随机生成</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-comment">备注</Label>
              <Textarea
                id="link-comment"
                placeholder="可选备注"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">访问策略</h3>
                <p className="text-sm text-muted-foreground">配置过期时间、转发方式和安全提示。</p>
              </div>

              <FieldGroup className="flex-row gap-3">
                <Field>
                  <FieldLabel htmlFor="expiration-date" className="sr-only">日期</FieldLabel>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="expiration-date"
                        className={cn('w-36 justify-between font-normal', !expirationDate && 'text-muted-foreground')}
                      >
                        {expirationDate ? format(expirationDate, 'PPP', { locale: zhCN }) : '选择日期'}
                        <ChevronDownIcon className="size-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expirationDate}
                        captionLayout="dropdown"
                        defaultMonth={expirationDate}
                        disabled={(date) => date < new Date()}
                        onSelect={(date) => {
                          setExpirationDate(date)
                          setDateOpen(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </Field>
                <Field className="w-32">
                  <FieldLabel htmlFor="expiration-time" className="sr-only">时间</FieldLabel>
                  <Input
                    id="expiration-time"
                    type="time"
                    step="1"
                    value={expirationTime}
                    onChange={(event) => setExpirationTime(event.target.value)}
                    className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </Field>
              </FieldGroup>
              {expirationDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground"
                  onClick={() => {
                    setExpirationDate(undefined)
                    setExpirationTime('')
                  }}
                >
                  清除过期时间
                </Button>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="redirect-query">转发查询参数</Label>
                    <p className="text-sm text-muted-foreground">把短链上的 query 透传给目标 URL。</p>
                  </div>
                  <Switch id="redirect-query" checked={redirectWithQuery} onCheckedChange={setRedirectWithQuery} />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="cloaking">链接遮蔽</Label>
                    <p className="text-sm text-muted-foreground">跳转后在地址栏保留短链地址。</p>
                  </div>
                  <Switch id="cloaking" checked={cloaking} onCheckedChange={setCloaking} />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="unsafe">确认跳转</Label>
                    <p className="text-sm text-muted-foreground">访问前展示确认页面。</p>
                  </div>
                  <Switch id="unsafe" checked={unsafe} onCheckedChange={setUnsafe} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-password">密码保护</Label>
              <div className="relative">
                <Input
                  id="link-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="留空不设密码"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pe-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  <span className="sr-only">{showPassword ? '隐藏密码' : '显示密码'}</span>
                </Button>
              </div>
            </div>
          </form>

          <SheetFooter className="gap-2">
            <SheetClose asChild>
              <Button variant="outline">关闭</Button>
            </SheetClose>
            <Button form="link-editor-form" type="submit" disabled={loading || !url.trim()}>
              {loading ? '保存中' : '保存'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
