'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      const res = await fetch('/api/link/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, password, query }),
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
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">无效的链接</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>需要密码</CardTitle>
          <CardDescription>此链接需要输入密码才能访问</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !password}>
              {loading ? '验证中...' : '访问'}
            </Button>
          </form>
        </CardContent>
      </Card>
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
