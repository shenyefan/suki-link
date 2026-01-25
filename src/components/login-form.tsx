import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { GalleryVerticalEnd } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setAuthToken, clearAuthToken } from "@/lib/auth"
import { api } from "@/lib/api-client"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [token, setToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token.trim()) return

    setIsLoading(true)
    try {
      // 先保存 token 到 localStorage
      setAuthToken(token)

      // 然后调用 GET 请求验证
      const response = await api.get<{ name: string; url: string }>('/api/verify')

      if (response.code === 200) {
        navigate({ to: '/dashboard' })
      } else {
        // 验证失败，清除 token
        clearAuthToken()
        setError(response.msg || "Token 验证失败，请重试。")
      }
    } catch {
      // 验证失败，清除 token
      clearAuthToken()
      setError("连接服务器失败，请检查网络。")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center gap-2 font-medium">
              <div className="flex h-8 w-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Suki Link</span>
            </div>
            <h1 className="text-xl font-bold">欢迎使用 Suki Link</h1>
            <div className="text-center text-sm text-muted-foreground">
              请输入您的管理 Token 以继续
            </div>
          </div>
          <div className="flex flex-col gap-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="在此输入您的 Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "验证中..." : "验证"}
            </Button>
          </div>
        </div>
      </form>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        Suki Link 是一个快速、简洁的短链管理工具。
      </div>
    </div>
  )
}
