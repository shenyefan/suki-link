import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useParams, useLocation, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/$')({
  component: RedirectHandler,
})

function RedirectHandler() {
  const params = useParams({ from: '/$' })
  const location = useLocation()
  const navigate = useNavigate()
  const pathSlug = (params as any)._splat || (params as any)[''] || location.pathname.slice(1) || ''

  useEffect(() => {
    // 提取第一个路径段作为 slug
    const pathSegments = pathSlug.split('/').filter(Boolean)
    const firstSegment = pathSegments[0] || ''

    // 如果没有 slug，直接跳转到 404
    if (!firstSegment) {
      navigate({ to: '/404' })
      return
    }

    // 直接调用 API 检查是否是短链
    const normalizedSlug = firstSegment.toLowerCase()
    const apiUrl = new URL('/api/redirect', window.location.origin)
    apiUrl.searchParams.set('slug', normalizedSlug)

    // 保存原始查询参数，用于前端拼接
    const originalQuery = window.location.search

    // 调用 API 检查短链
    fetch(apiUrl.toString())
      .then(res => res.json())
      .then((result: unknown) => {
        const data = result as {
          code: number
          data?: {
            url?: string
            expired?: boolean
            redirectTo?: string
          }
          msg?: string
        }
        if (data.code === 200 && data.data) {
          if (data.data.expired && data.data.redirectTo) {
            // 对于过期链接，使用 React Router 导航（内部路由）
            const redirectPath = new URL(data.data.redirectTo, window.location.origin).pathname
            navigate({ to: redirectPath })
            return
          }
          if (data.data.url) {
            // 根据环境变量判断是否拼接查询参数，默认关闭
            const redirectWithQuery = import.meta.env.VITE_REDIRECT_WITH_QUERY === 'true';
            
            let targetUrl = data.data.url
            
            if (redirectWithQuery && originalQuery && originalQuery.length > 1) {
              const targetUrlObj = new URL(targetUrl)
                const originalParams = new URLSearchParams(originalQuery.slice(1)) // 移除开头的 ?

                // 将原始查询参数附加到目标 URL
                for (const [key, value] of originalParams) {
                  targetUrlObj.searchParams.set(key, value)
                }
                
                targetUrl = targetUrlObj.toString()
            }
            
            // 对于外部链接，使用 window.location.replace
            window.location.replace(targetUrl)
            return
          }
        }
        // 没有找到短链，跳转到 404
        navigate({ to: '/404' })
      })
      .catch(() => {
        // 错误时跳转到 404
        navigate({ to: '/404' })
      })
  }, [pathSlug, location.pathname, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="relative mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-muted/50">
        <Loader2 className="h-16 w-16 text-muted-foreground animate-spin" />
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-muted-foreground/20 animate-[spin_10s_linear_infinite]" />
      </div>

      <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl">
        正在跳转...
      </h1>

      <p className="mb-8 max-w-[450px] text-lg text-muted-foreground">
        即将跳转的链接与本网站无关，请注意安全。
      </p>
    </div>
  )
}
