'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'

function PasswordForm() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug') || ''
  const query = searchParams.get('query') || ''
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !slug) return

    setLoading(true)

    try {
      const res = await fetch(`/api/links/${encodeURIComponent(slug)}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, query }),
      })
      const json = await res.json()

      if (!res.ok || json.code !== 200) {
        throw new Error(json.message || '密码错误')
      }

      toast.success('验证成功', '正在打开短链')
      window.location.assign(json.data.url)
    } catch (err) {
      const message = err instanceof Error ? err.message : '验证失败'
      toast.error('验证失败', message)
    } finally {
      setLoading(false)
    }
  }

  if (!slug) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-2 text-center">
          <div className="flex size-8 items-center justify-center rounded-md">
            <Lock className="size-6" />
          </div>
          <h1 className="text-xl font-bold">无效的链接</h1>
          <FieldDescription>请检查链接地址是否完整。</FieldDescription>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-svh place-items-center bg-background px-6 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-8 items-center justify-center rounded-md">
                <Lock className="size-6" />
              </div>
              <h1 className="text-xl font-bold">需要密码</h1>
              <FieldDescription>此链接需要输入密码才能访问。</FieldDescription>
            </div>
            <Field>
              <FieldLabel htmlFor="password">密码</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </Field>
            <Field>
              <Button type="submit" disabled={loading || !password}>
                {loading ? '验证中' : '访问'}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}

export default function PasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <Skeleton className="h-[300px] w-full max-w-sm" />
      </div>
    }>
      <PasswordForm />
    </Suspense>
  )
}
