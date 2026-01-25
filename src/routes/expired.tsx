import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from "@/components/ui/button"
import { Hourglass } from "lucide-react"

export const Route = createFileRoute('/expired')({
  component: ExpiredPage,
})

function ExpiredPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="relative mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-muted/50">
        <Hourglass className="h-16 w-16 text-muted-foreground animate-pulse" />
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-muted-foreground/20 animate-[spin_10s_linear_infinite]" />
      </div>

      <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl">
        链接已过期
      </h1>

      <p className="mb-8 max-w-[450px] text-lg text-muted-foreground">
        很抱歉，您访问的短链接已经失效或已过有效期。
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button asChild size="lg" className="rounded-full px-8">
          <Link to="/">
            返回首页
          </Link>
        </Button>
      </div>
    </div>
  )
}
