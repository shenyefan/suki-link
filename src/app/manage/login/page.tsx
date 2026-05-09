'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { login, setAdminToken } from '@/manage/api'

export default function ManageLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return

    setLoading(true)

    try {
      const token = await login(password)
      setAdminToken(token)
      toast.success('登录成功', '正在进入管理台')
      router.replace('/manage/links')
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败'
      toast.error('登录失败', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Suki-Link</CardTitle>
          <CardDescription>登录 Dashboard 管理短链</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              autoComplete="username"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">密码</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              </Field>

              <Button type="submit" className="w-full" disabled={loading || !password}>
                {loading ? '登录中' : '登录'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
