'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Link2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { login, setAdminToken } from '@/lib/dashboard-api'

export default function DashboardLoginPage() {
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
      router.replace('/dashboard/links')
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败'
      toast.error('登录失败', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh place-items-center bg-background px-6 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
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
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-8 items-center justify-center rounded-md">
                <Link2 className="size-6" />
              </div>
              <h1 className="text-xl font-bold">Suki-Link</h1>
              <FieldDescription>输入密码进入管理后台</FieldDescription>
            </div>
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
                autoFocus
              />
            </Field>
            <Field>
              <Button type="submit" disabled={loading || !password}>
                {loading ? '登录中' : '登录'}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
